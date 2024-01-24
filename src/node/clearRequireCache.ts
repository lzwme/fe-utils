import { fs } from './fs-system';
import { LRUCache } from '../common/lib/LRUCache';

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

const hotLoadCache = new LRUCache({ max: 1000 });
// cache.delete(cache.keys().next().value);

/** require 热加载指定的文件 */
export function requireHotLoad(filePath: string, force = false) {
  let needClearCache = force;
  let lastModified = 0;

  if (!needClearCache) {
    lastModified = fs.statSync(filePath).mtimeMs;
    needClearCache = hotLoadCache.get<number>(filePath) !== lastModified;
  }

  if (needClearCache) {
    clearRequireCache(filePath);
    hotLoadCache.set(filePath, lastModified || fs.statSync(filePath).mtimeMs);
  }

  return require(filePath);
}
