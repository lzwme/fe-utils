import {
  type Stats,
  type WriteFileOptions,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  promises,
  readdirSync,
  rmdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve, sep, dirname } from 'node:path';

/** 【同步】删除指定的文件或目录 */
export function rmrf(filepath: string) {
  if (!filepath || !existsSync(filepath)) return;

  const stats = statSync(filepath);

  if (!stats.isDirectory()) return unlinkSync(filepath);

  try {
    rmSync(filepath, { recursive: true });
  } catch {
    const fileList = readdirSync(filepath);
    for (const filename of fileList) rmrf(resolve(filepath, filename));
    rmdirSync(filepath);
  }
}

/** 【异步】删除指定的文件或目录 */
export async function rmrfAsync(filepath: string): Promise<void> {
  try {
    if (!filepath || !existsSync(filepath)) return;

    return promises.rm(filepath, { recursive: true, maxRetries: 3 });
  } catch {
    return rmrf(filepath);
  }
}

/**
 * 创建一个深度的目录
 */
export function mkdirp(dirpath: string) {
  if (existsSync(dirpath)) return true;

  try {
    mkdirSync(dirpath, { recursive: true });
  } catch {
    const list = dirpath.replace(sep, '/').split('/');
    for (let i = 0; i < list.length; i++) {
      const p = list.slice(0, i + 1).join(sep);
      if (p === '') continue;
      if (existsSync(p)) {
        if (!statSync(p).isDirectory()) return false;
        continue;
      }
      mkdirSync(p);
    }
  }
  return true;
}

/** 异步写文件。所在目录不存在则递归创建 */
export const outputFile: typeof promises.writeFile = (filepath, data, options) => {
  if (typeof filepath === 'string') {
    const dir = dirname(filepath);
    if (!existsSync(dir)) mkdirp(dir);
  }

  return promises.writeFile(filepath, data, options);
};

/** 同步写文件。所在目录不存在则递归创建 */
export function outputFileSync(filepath: string, data: string | NodeJS.ArrayBufferView, options?: WriteFileOptions) {
  const dir = dirname(filepath);
  if (!existsSync(dir)) mkdirp(dir);
  writeFileSync(filepath, data, options);
}

/** 复制一个目录 */
export function copyDir(src: string, dest: string, filter: (filepath: string, stats: Stats) => boolean = () => true) {
  for (const filename of readdirSync(src)) {
    const filepath = resolve(src, filename);
    const outpath = resolve(dest, filename);
    const stats = statSync(filepath);

    if (filter(filepath, stats) === false) continue;
    if (stats.isDirectory()) {
      mkdirp(outpath);
      copyDir(filepath, outpath, filter);
      continue;
    }

    try {
      promises.copyFile(filepath, outpath);
    } catch {
      createReadStream(filepath).pipe(createWriteStream(outpath));
    }
  }
}
