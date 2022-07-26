import { resolve } from 'path';

/**
 * 将给定的文件路径规整为 a/b/c.js 格式
 */
export function fixToshortPath(filepath = '', rootDir = process.cwd()) {
  const shortPath = resolve(rootDir, filepath).replace(rootDir, '').replace(/\\/g, '/');
  return shortPath.startsWith('/') ? shortPath.slice(1) : shortPath;
}
