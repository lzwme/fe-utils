import { existsSync, readdirSync, rmdirSync, rmSync, statSync, unlinkSync, promises, mkdirSync } from 'fs';
import { resolve, sep } from 'path';

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
