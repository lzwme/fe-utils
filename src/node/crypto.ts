import {
  type BinaryLike,
  type BinaryToTextEncoding,
  createCipheriv,
  createDecipheriv,
  createHash,
  scryptSync,
  getHashes,
} from 'node:crypto';
import { basename, resolve } from 'node:path';
import { fs } from './fs-system';

/** 生成指定长度的字符串 */
export function genRandomAesKey(len = 16) {
  // return crypto.randomBytes(len).toString('utf-8');
  const result: string[] = [];
  for (let i = 0; i < len; i++) {
    let code = Math.round(Math.random() * 126);
    if (code < 33) code += 32;
    result.push(String.fromCodePoint(code));
  }

  return result.join('');
}

interface HashFn {
  (algorithm: string, str: string | Buffer, isFile?: boolean, outputEncoding?: BinaryToTextEncoding): string;
  hashes?: Set<string>;
}

/**
 * 生成指定字符串或指定文件路径的 hash 编码
 * @param algorithm hash 编码算法
 * @param str 指定的字符串，或者指定的文件路径
 * @param isFile str 是否为一个文件路径
 * @param outputEncoding 输出内容编码。默认为 hex
 */
export const hash: HashFn = (algorithm: string, str: string | Buffer, isFile = false, outputEncoding: BinaryToTextEncoding = 'hex') => {
  if (!hash.hashes) hash.hashes = new Set(getHashes());
  if (!hash.hashes.has(algorithm)) {
    console.warn('[hash]不支持的算法类型：', algorithm);
    return '';
  }

  try {
    if (isFile) {
      if (!str || !fs.existsSync(str)) {
        console.error(`[hash][${algorithm}][error] File does not exist:`, str);
        return '';
      }
      str = fs.readFileSync(str);
    }
    return createHash(algorithm).update(str).digest(outputEncoding);
  } catch (error) {
    /* eslint-disable no-console */
    console.log(`[hash][${algorithm}][error]`, (error as Error).message);
    return '';
  }
};

/**
 * 生成指定字符串或指定文件路径的 sha256 编码摘要
 * {@link hash}
 */
export function sha256(str: string | Buffer, isFile = false, outputEncoding: BinaryToTextEncoding = 'hex') {
  return hash('sha256', str, isFile, outputEncoding);
}

/**
 * 生成指定字符串或指定文件路径的md5值
 * {@link hash}
 */
export function md5(str: string | Buffer, isFile = false, outputEncoding: BinaryToTextEncoding = 'hex') {
  return hash('md5', str, isFile, outputEncoding);
}

export function md5ByFileStream(filepath: string) {
  return new Promise<string>((resolve, reject) => {
    if (!filepath || !fs.existsSync(filepath)) {
      console.error('File does not exist:', filepath);
      return resolve('');
    }

    const stream = fs.createReadStream(filepath);
    const fsHash = stream.pipe(createHash('md5'));
    stream.on('end', () => resolve(fsHash.digest('hex')));
    stream.on('error', error => reject(error));
  });
}

/**
 * 根据 Object 类型的参数值生成 md5
 * @param params
 * @param filterKeyList 要过滤的通用字段
 */
export function getMd5ByPlainObject(params: Record<string | number, unknown>, filterKeyList: string[] = []) {
  if (!params) return '';
  // const filterKeyList = ['current_page', 'page_size', 'uid', 'pageSize', 'currentPage'];

  const keys = Object.keys(params)
    .sort()
    .filter(key => params[key] !== '' && !filterKeyList.includes(key));
  if (keys.length === 0) return '';

  const data = keys.map(key => ({ key, value: params[key] }));
  return md5(JSON.stringify(data));
}

/**
 * 基于 compressing 库的目录压缩
 * @param srcDir 要压缩的目录路径
 * @param dest 压缩文件输出路径。若省略则默认使用 srcDir 压缩目录名
 * @param type 压缩类型
 * @param includeDirName 是否包含 srcDir 目录名称。默认为 false
 */
export async function compressing(srcDir: string, dest?: string, type?: 'zip' | 'gz' | 'tar', includeDirName = false) {
  if (!dest) dest = srcDir.replace(/\/$/, '');
  const c = await import('compressing');
  const cType = type === 'tar' ? c.tar : type === 'gz' ? c.tgz : c.zip;
  const ext = type === 'tar' ? '.tar' : type === 'gz' ? '.tar.gz' : '.zip';
  if (!dest.endsWith(ext)) dest += ext;

  if (includeDirName) {
    return cType.compressDir(srcDir, dest!);
  } else {
    const zipStream = new cType.Stream();

    for (const fielname of fs.readdirSync(srcDir)) {
      zipStream.addEntry(resolve(srcDir, fielname));
    }

    await new Promise<void>((rs, rj) => {
      const handleError = (e: unknown) => rj(e);

      zipStream
        .on('error', handleError)
        .pipe(fs.createWriteStream(dest!))
        .on('error', handleError)
        .on('finish', () => rs());
    });
  }
}

/**
 * tar.gz 压缩。需添加依赖库 `compressing`
 * @param srcDir 要压缩的目录路径
 * @param dest 压缩文件输出路径。若省略则默认使用 srcDir 压缩目录名
 */
export function tgzip(srcDir: string, dest?: string, includeDirName = false) {
  return compressing(srcDir, dest, 'gz', includeDirName);
}

/**
 * tar.gz 文件解压。需添加依赖库 `compressing`
 * @param srcFilePath 要解压的 tar.gz 文件路径
 * @param dest 解压输出目录路径
 */
export async function untgzip(srcFilePath: string, dest?: string) {
  return import('compressing').then(({ tgz }) => tgz.uncompress(srcFilePath, dest || basename(srcFilePath)));
}

/**
 * zip 压缩。需添加依赖库 `compressing`
 * @param srcDir 要压缩的目录路径
 * @param dest zip 文件输出目录路径
 */
export function zip(srcDir: string, dest?: string, includeDirName = false) {
  return compressing(srcDir, dest, 'zip', includeDirName);
}

/**
 * zip 文件解压。需添加依赖库 `compressing`
 * @param srcFilePath 要解压的 tar.gz 文件路径
 * @param dest 解压输出目录路径
 */
export async function unzip(srcFilePath: string, dest?: string) {
  return import('compressing').then(({ zip }) => zip.uncompress(srcFilePath, dest || basename(srcFilePath)));
}

/** aes 加密 */
export function aesEncrypt(data: string, key: BinaryLike, algorithm = 'aes-128-ecb', iv: BinaryLike | null = null, salt = '') {
  if (typeof data !== 'string') data = JSON.stringify(data);
  if (salt) key = scryptSync(key, salt, 16);

  const cipher = createCipheriv(algorithm, key, iv);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
}
/** aes 解密 */
export function aesDecrypt(data: string, key: BinaryLike, algorithm = 'aes-128-ecb', iv: BinaryLike | null = null, salt = '') {
  if (typeof data !== 'string') data = JSON.stringify(data);
  if (salt) key = scryptSync(key, salt, 16);

  const decipher = createDecipheriv(algorithm, key, iv);
  decipher.setAutoPadding(true);
  return Buffer.concat([decipher.update(data, 'utf8'), decipher.final()]);
}
