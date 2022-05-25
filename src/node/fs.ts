import { existsSync, readdirSync, rmdirSync, rmSync, statSync, unlinkSync, promises, mkdirSync } from 'fs';
import { normalize, resolve, sep } from 'path';

/** 【同步】删除指定的文件或目录 */
export function rmrf(filepath: string) {
  if (!existsSync(filepath)) return;

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
export async function rmrfAsync(filepath: string) {
  try {
    return promises.rm(filepath, { recursive: true, maxRetries: 3 });
  } catch {
    return rmrfAsync(filepath);
  }
}

/**
 * 创建一个深度的目录
 */
export function mkdirp(dirpath: string) {
  dirpath = normalize(dirpath);
  if (existsSync(dirpath) && statSync(dirpath).isDirectory()) return;

  const segs = dirpath.split(sep);
  for (let i = 0; i < segs.length; i++) {
    const p = segs.slice(0, i + 1).join(sep);
    if (p === '') continue;
    if (existsSync(p)) {
      if (statSync(p).isDirectory()) continue;
      rmrf(p);
    }
    mkdirSync(p);
  }
}
