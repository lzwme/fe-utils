import { posix, resolve, win32 } from 'node:path';

/**
 * 将给定的文件路径规整为 a/b/c.js 格式
 */
export function fixToshortPath(filepath = '', rootDir = process.cwd()) {
  const shortPath = resolve(rootDir, filepath).replace(rootDir, '').replace(/\\/g, '/');
  return shortPath.startsWith('/') ? shortPath.slice(1) : shortPath;
}

export function normalizePath(filename: string) {
  // return filename.replace(/\\/g, '/');
  return filename.split(win32.sep).join(posix.sep);
}
