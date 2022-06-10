/**
 * 清除指定模块的 require 缓存（内存清理或实现热更新）
 * @example
 * ```ts
 * // hot-reload for simple-mock-config.js
 * const smcFilePath = './simple-mock-config.js';
 * clearRequireCache(smcFilePath);
 * require(smcFilePath);
 * ```
 */
export function clearRequireCache(filePath: string) {
  filePath = require.resolve(filePath);

  const cacheInfo = require.cache[filePath];
  if (!cacheInfo) return false;

  const parent = cacheInfo.parent || require.main;

  if (parent) {
    let i = parent.children.length;
    while (i--) {
      if (parent.children[i].id === filePath) {
        parent.children.splice(i, 1);
      }
    }
  }

  const children = cacheInfo.children.map(d => d.id);
  delete require.cache[filePath];
  for (const id of children) clearRequireCache(id);
  return true;
}
