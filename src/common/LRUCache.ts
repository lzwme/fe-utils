// @see https://www.npmjs.com/package/lru-cache

export interface LRUCacheOptions {
  /** The maximum number of items that remain in the cache */
  max?: number;
  /** how long to live in ms */
  ttl?: number;
  updateAgeOnGet?: boolean;
  /** Function that is called on items when they are dropped from the cache */
  dispose?(val: unknown, key: string, reason: string): void;
}

interface LRUCacheItem {
  t: number;
  ttl: number;
  v: unknown;
}

export class LRUCache {
  protected options: Required<LRUCacheOptions>;
  protected cache = new Map<string, LRUCacheItem>();
  constructor(options: LRUCacheOptions) {
    options = {
      ttl: 0,
      dispose: () => void 0,
      ...options,
    };

    options.max = Math.max(options.max || 500, 2);
    if (options.ttl) options.ttl = Math.max(+options.ttl || 0, 100);
    this.options = options as never;
  }
  /** Add a value to the cache */
  set<T>(key: string, value: T, opts?: { ttl?: number }) {
    const { cache } = this;

    if (cache.has(key)) this.delete(key, 'set');

    cache.set(key, {
      v: value,
      t: Date.now(),
      ttl: opts?.ttl ?? this.options.ttl,
    });

    if (cache.size > this.options.max) {
      const delKey = cache.keys().next().value;
      this.delete(delKey, 'evict');
    }
  }
  /** Return a value from the cache */
  get<T>(key: string, options: { updateAgeOnGet?: boolean } = {}) {
    const cache = this.cache;
    if (!cache.has(key)) return;
    const value = cache.get(key)!;

    if (value.ttl && Date.now() - value.t > value.ttl) {
      this.delete(key, 'expired');
      return;
    }

    if (this.options.updateAgeOnGet || options.updateAgeOnGet) value.t = Date.now();
    cache.delete(key);
    cache.set(key, value);

    return value.v as T;
  }
  /** Deletes a key out of the cache */
  delete(key: string, reason = 'delete') {
    if (!this.cache.has(key)) return false;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.options.dispose(val, key, reason);
    return true;
  }
  /** Clear the cache */
  clear() {
    for (const key of this.cache.keys()) {
      this.delete(key);
    }
  }
  dump() {
    return [...this.cache];
  }
  load(entries: string | [string, LRUCacheItem][]) {
    if (typeof entries == 'string') entries = JSON.parse(entries) as never;
    this.cache = new Map(entries);
  }
  /** Delete any stale entries. */
  purgeStale() {
    let hasDeleted = false;
    for (const [key, value] of this.cache) {
      if (value.ttl && Date.now() - value.t > value.ttl) {
        hasDeleted = true;
        this.delete(key, 'expired');
      }
    }
    return hasDeleted;
  }
  info() {
    return {
      capacity: this.options.max,
      /** The total number of items held in the cache at the current moment */
      size: this.cache.size,
    };
  }
  keys() {
    return [...this.cache.keys()];
  }
  values() {
    return [...this.cache.values()].map(d => d.v);
  }
}
