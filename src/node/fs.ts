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
    fs.rmdirSync(filepath);
  }
}

/** 【异步】删除指定的文件或目录 */
export async function rmrfAsync(filepath: string): Promise<void> {
  try {
    if (!filepath || !fs.existsSync(filepath)) return;

    return fs.promises.rm(filepath, { recursive: true, maxRetries: 3 });
  } catch {
    return rmrf(filepath);
  }
}

/**
 * 创建一个深度的目录
 */
export function mkdirp(dirpath: string) {
  if (fs.existsSync(dirpath)) return true;

  try {
    fs.mkdirSync(dirpath, { recursive: true });
  } catch {
    const list = dirpath.replace(sep, '/').split('/');
    for (let i = 0; i < list.length; i++) {
      const p = list.slice(0, i + 1).join(sep);
      if (p === '') continue;
      if (fs.existsSync(p)) {
        if (!fs.statSync(p).isDirectory()) return false;
        continue;
      }
      fs.mkdirSync(p);
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
      fs.promises.copyFile(filepath, outpath);
    } catch {
      fs.createReadStream(filepath).pipe(fs.createWriteStream(outpath));
    }
  }
}
