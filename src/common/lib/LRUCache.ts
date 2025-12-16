// @see https://www.npmjs.com/package/lru-cache
type DisposeReason = 'set' | 'delete' | 'evict' | 'expired';
export interface LRUCacheOptions<K = string, V = unknown> {
  /** The maximum number of items that remain in the cache. default 500 */
  max?: number;
  /** how long to live in ms. default 0 forever */
  ttl?: number;
  /** Whether to update the age of the cache to Date.now() when get() is called. default true */
  updateAgeOnGet?: boolean;
  /** Function that is called on items when they are dropped from the cache */
  dispose?(val: LRUCacheItem<V>, key: K, reason: DisposeReason): void;
}

export interface LRUCacheItem<V> {
  /** the time when the item was added to the cache */
  t: number;
  /** how long to live in ms. default 0 */
  ttl: number;
  /** the value */
  v: V;
}

export class LRUCache<K = string, V = unknown> {
  protected options: Required<LRUCacheOptions<K, V>>;
  protected cache = new Map<K, LRUCacheItem<V>>();
  constructor(options: LRUCacheOptions<K, V>) {
    this.options = this.updateOptions(options);
  }
  updateOptions(options: LRUCacheOptions<K, V>) {
    options = {
      ttl: 0,
      dispose: () => void 0,
      ...options,
    };

    options.max = Math.max(options.max || 500, 2);
    if (options.ttl) options.ttl = Math.max(+options.ttl || 0, 100);
    this.options = options as never;
    this.purgeStale();
    return options as Required<LRUCacheOptions<K, V>>;
  }
  /** Add a value to the cache */
  set<T extends V = V>(key: K, value: T, opts?: { ttl?: number }) {
    const { cache } = this;

    if (cache.has(key)) this.delete(key, 'set');

    cache.set(key, {
      v: value,
      t: Date.now(),
      ttl: opts?.ttl ?? this.options.ttl,
    });

    if (cache.size > this.options.max) {
      const delKey = cache.keys().next().value;
      if (delKey) this.delete(delKey, 'evict');
    }
  }
  /** Return a value from the cache */
  get<T extends V = V>(key: K, options: { updateAgeOnGet?: boolean } = {}) {
    const cache = this.cache;
    if (!cache.has(key)) return;
    const value = cache.get(key)!;

    if (value.ttl && Date.now() - value.t > value.ttl) {
      this.delete(key, 'expired');
      return;
    }

    if ((options.updateAgeOnGet ?? this.options.updateAgeOnGet) !== false) value.t = Date.now();
    cache.delete(key);
    cache.set(key, value);

    return value.v as T;
  }
  /** Returns true if the cache has a key */
  has(key: K) {
    return this.cache.has(key);
  }
  /** Deletes a key out of the cache */
  delete(key: K, reason: DisposeReason = 'delete') {
    if (!this.cache.has(key)) return false;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.options.dispose(val!, key, reason);
    return true;
  }
  /** Clear the cache */
  clear() {
    for (const key of this.cache.keys()) {
      this.delete(key);
    }
  }
  /** Dump all cache as an array of [key, value] pairs */
  dump() {
    return [...this.cache];
  }
  /** Reset and load an array of [key, value] pairs into the cache */
  load(entries: string | [K, LRUCacheItem<V>][]) {
    if (typeof entries == 'string') entries = JSON.parse(entries) as never;
    this.cache = new Map(entries);
  }
  /** Delete any stale entries. */
  purgeStale() {
    let count = 0;
    for (const [key, value] of this.cache) {
      if (value.ttl && Date.now() - value.t > value.ttl) {
        count++;
        this.delete(key, 'expired');
      }
    }
    return count;
  }
  info() {
    return {
      ...this.options,
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
  get size() {
    return this.cache.size;
  }
}
