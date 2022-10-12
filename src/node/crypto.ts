import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

/**
 * 生成指定字符串或指定文件路径的md5值
 * @param str 指定的字符串，或者指定的文件路径
 * @param isFile str 是否为一个文件路径
 */
export function md5(str: string | Buffer, isFile = false) {
  try {
    if (isFile) {
      if (!str || !existsSync(str)) {
        console.error('File does not exist:', str);
        return '';
      }
      str = readFileSync(str);
    }
    const md5 = createHash('md5').update(str).digest('hex');
    return md5;
  } catch (error) {
    /* eslint-disable no-console */
    console.log((error as Error).message);
    return '';
  }
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

    for (const fielname of readdirSync(srcDir)) {
      zipStream.addEntry(resolve(srcDir, fielname));
    }

    await new Promise<void>((rs, rj) => {
      const handleError = (e: unknown) => rj(e);

      zipStream
        .on('error', handleError)
        .pipe(createWriteStream(dest!))
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
