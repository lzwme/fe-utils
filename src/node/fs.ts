import type { Stats, WriteFileOptions } from 'node:fs';
import { resolve, sep, dirname } from 'node:path';
import { fs } from './fs-system';

/** 【同步】删除指定的文件或目录 */
export function rmrf(filepath: string) {
  if (!filepath || !fs.existsSync(filepath)) return;

  const stats = fs.statSync(filepath);

  if (!stats.isDirectory()) return fs.unlinkSync(filepath);

  try {
    fs.rmSync(filepath, { recursive: true });
  } catch {
    const fileList = fs.readdirSync(filepath);
    for (const filename of fileList) rmrf(resolve(filepath, filename));
  }

  if (fs.existsSync(filepath)) fs.rmdirSync(filepath, { recursive: true });
}

/** 【异步】删除指定的文件或目录 */
export async function rmrfAsync(filepath: string): Promise<void> {
  try {
    if (!filepath || !fs.existsSync(filepath)) return;

    await fs.promises.rm(filepath, { recursive: true, maxRetries: 3 });
    if (fs.existsSync(filepath) && fs.statSync(filepath).isDirectory()) fs.rmdirSync(filepath);
  } catch {
    rmrf(filepath);
  }
}

/**
 * 创建一个深度的目录
 */
export function mkdirp(dirpath: string) {
  if (fs.existsSync(dirpath)) return false;

  try {
    fs.mkdirSync(dirpath, { recursive: true });
  } catch {
    const list = dirpath.replace(sep, '/').split('/');
    for (let i = 0; i < list.length; i++) {
      const p = list.slice(0, i + 1).join(sep);
      if (p === '') continue;
      if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) {
        fs.mkdirSync(p);
      }
    }
  }
  return true;
}

/** 异步写文件。所在目录不存在则递归创建 */
export const outputFile: typeof fs.promises.writeFile = (filepath, data, options) => {
  if (typeof filepath === 'string') {
    const dir = dirname(filepath);
    if (!fs.existsSync(dir)) mkdirp(dir);
  }

  return fs.promises.writeFile(filepath, data, options);
};

/** 同步写文件。所在目录不存在则递归创建 */
export function outputFileSync(filepath: string, data: string | NodeJS.ArrayBufferView, options?: WriteFileOptions) {
  const dir = dirname(filepath);
  if (!fs.existsSync(dir)) mkdirp(dir);
  fs.writeFileSync(filepath, data, options);
}

export function readJsonFile<T = object>(filepath: string, encoding: BufferEncoding = 'utf8'): Promise<T> {
  return fs.promises.readFile(filepath, encoding).then(str => JSON.parse(str));
}

export function readJsonFileSync<T = object>(filepath: string, encoding: BufferEncoding = 'utf8'): T {
  return JSON.parse(fs.readFileSync(filepath, encoding));
}

/** 复制一个目录 */
export function copyDir(src: string, dest: string, filter: (filepath: string, stats: Stats) => boolean = () => true) {
  for (const filename of fs.readdirSync(src)) {
    const filepath = resolve(src, filename);
    const outpath = resolve(dest, filename);
    const stats = fs.statSync(filepath);

    if (filter(filepath, stats) === false) continue;
    if (stats.isDirectory()) {
      mkdirp(outpath);
      copyDir(filepath, outpath, filter);
      continue;
    }

    try {
      mkdirp(dest);
      fs.copyFileSync(filepath, outpath);
    } catch {
      fs.createReadStream(filepath).pipe(fs.createWriteStream(outpath));
    }
  }
}

/** 删除指定路径下所有的空目录 */
export function rmEmptyDir(dir: string) {
  if (fs.statSync(dir).isDirectory() === false) return;

  let files = fs.readdirSync(dir);

  if (files.length > 0) {
    for (const filename of files) {
      const filepath = resolve(dir, filename);
      if (fs.statSync(filepath).isDirectory()) rmEmptyDir(filepath);
    }

    files = fs.readdirSync(dir);
  }

  if (files.length === 0) return fs.rmdirSync(dir);
}

/**
 * 一个查找文件函数。递归地在源目录中查找符合条件的文件，并将找到的文件路径添加到数组中返回。
 *
 * @param {string} srcDir - 需要查找的源目录，如果未指定或指定的目录不存在，则直接返回空数组。
 * @param {function} validate - 验证函数，用于判断文件是否符合条件。如果未指定或验证失败，则直接返回空数组。
 * @param {number} limit - 限制返回的文件数量，默认值为99999。当找到的文件数量达到这个值时，停止查找并返回结果。
 * @return {string[]} 返回一个包含所有找到的文件路径的字符串数组。如果没有找到任何文件，或者因为达到了限制而停止查找，则返回空数组。
 */
export function findFiles(srcDir?: string, validate?: (filepath: string, stat: Stats) => boolean, limit = 99999) {
  const files: string[] = [];

  if (!srcDir || !fs.existsSync(srcDir)) return files;

  const stat = fs.statSync(srcDir);

  if (validate && !validate(srcDir, stat)) return files;

  if (stat.isFile()) return [resolve(srcDir)];

  if (stat.isDirectory()) {
    for (const filename of fs.readdirSync(srcDir)) {
      for (const f of findFiles(resolve(srcDir, filename), validate, limit - files.length)) {
        files.push(f);
        if (limit > 0 && files.length >= limit) return files;
      }
    }
  }

  return files;
}
