import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fs } from './fs-system.js';
import { getLogger } from './get-logger.js';
import { assign, safeJsonParse, safeStringify, tryLoadJSON5 } from '../common/objects.js';
import { Barrier } from '../common/async.js';

export interface LSCache<T> {
  version: string;
  data: {
    [uuid: string]: T;
  };
}

export interface LSOptions<T extends object = Record<string, unknown>> {
  /** 缓存文件保存的路径 */
  filepath?: string;
  /** 缓存版本。当版本不匹配时将清空已有数据 */
  version?: string;
  /** 存储类型的唯一标记，用于区分多个不同类型的存储。默认为 defaults */
  uuid?: string;
  /** 默认初始值 */
  initial?: T;
  /** 是否仅考虑单进程模式读写（内存）。默认为 false，每次保持前都会重载数据 */
  singleMode?: boolean;
}

/**
 * 轻量的本地文件持久性数据存储。主要用于简单的配置信息持久化
 * @example
 * ```ts
 * const stor = await new LiteStorage({ uuid: 'test1' }).ready();
 *
 * // 示例1： 读取缓存
 * const config = stor.get();
 * console.log(config);
 * // 缓存操作
 * // 存入
 * stor.save(config);
 *
 * stor.getItem('key1');
 * stor.setItem('key2', { a: 1 });
 * stor.removeItem('key2');
 * stor.clear();
 * ```
 */
export class LiteStorage<T extends object = Record<string, unknown>> {
  private static instances: Map<string, LiteStorage> = new Map();

  private static computeKey(options?: LSOptions) {
    const baseDir = resolve(fs.existsSync('./node_modules') ? './node_modules/.cache' : homedir(), '.liteStorage');
    let filepath = options?.filepath ?? 'ls.json';
    if (!/\.(json5?|toml)$/i.test(filepath)) filepath = resolve(baseDir, filepath, 'ls.json');
    return resolve(baseDir, filepath);
  }

  static getInstance<T extends object>(options?: LSOptions) {
    const key = this.computeKey(options);
    if (!LiteStorage.instances.has(key)) {
      LiteStorage.instances.set(key, new LiteStorage(options));
    }
    return LiteStorage.instances.get(key) as LiteStorage<T>;
  }
  private get cachePath() {
    return this.options.filepath;
  }
  private barrier = new Barrier();
  private isToml = false;
  private isJson5 = false;
  private isChanged = false;

  private cache!: LSCache<T>;
  private options: Required<LSOptions>;
  private baseDir = resolve(fs.existsSync('./node_modules') ? './node_modules/.cache' : homedir(), '.liteStorage');
  constructor(options?: LSOptions) {
    this.options = {
      version: '0.0.0',
      uuid: 'defaults',
      filepath: 'ls.json',
      initial: {},
      singleMode: false,
      ...options,
    };

    this.init();
    this.reload().then(() => this.barrier.open());
  }
  private init() {
    let { filepath = 'ls.json', uuid, version } = this.options;
    if (!/\.(json5?|toml)$/i.test(filepath)) filepath = resolve(this.baseDir, filepath, 'ls.json');

    this.isJson5 = /\.json5$/i.test(filepath);
    this.isToml = /\.toml$/i.test(filepath);
    this.options.filepath = resolve(this.baseDir, filepath);
    this.cache = {
      version,
      data: {
        [uuid]: (this.options.initial || {}) as T,
      },
    };
  }
  public get length() {
    return Object.keys(this.get(true)).length;
  }
  public get config() {
    return { ...this.options };
  }
  public async ready() {
    await this.barrier.wait();
    return this;
  }
  /** 主动保存 */
  public async save(value?: T, mode: 'merge' | 'cover' = 'merge', reload = true) {
    if (value) return this.set(value, mode);
    if (!this.isChanged) return this;

    await this.barrier.wait();
    this.barrier = new Barrier();
    try {
      if (reload && !this.options.singleMode) await this.reload();
      await this.toCache();
    } catch (e) {
      getLogger().error('[LiteStorage][save][error]', e);
    }

    this.barrier.open();
    return this;
  }
  private cacheTimer: NodeJS.Timeout | undefined;
  private async toCache(): Promise<this> {
    const tc = async () => {
      const cacheDir = dirname(this.cachePath);
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      let content = '';
      if (this.isToml) {
        const TOML = await import('@iarna/toml');
        content = TOML.stringify(this.cache as never);
      } else {
        content = safeStringify(this.cache, 4, this.isJson5);
      }
      // atomic write: write to tmp file then rename
      const tmpPath = `${this.cachePath}.tmp-${process.pid}-${Date.now()}`;
      fs.writeFileSync(tmpPath, content, 'utf8');
      try {
        fs.renameSync(tmpPath, this.cachePath);
      } catch (e) {
        // cleanup tmp on error
        try {
          if (fs.existsSync(tmpPath)) fs.rmSync(tmpPath, { force: true });
        } catch {
          /* ignore */
        }
        throw e;
      }
      this.isChanged = false;
      return this;
    };

    if (!this.options.singleMode) return tc();

    return new Promise(rs => {
      if (this.cacheTimer) clearTimeout(this.cacheTimer);
      this.cacheTimer = setTimeout(async () => tc().then(rs), 100);
    });
  }
  /** 从文件中重载数据至内存。在多进程、多线程模式下，需读取最新数据时，可手动调用 */
  public async reload() {
    if (fs.existsSync(this.cachePath)) {
      const content = fs.readFileSync(this.cachePath, 'utf8');
      let localCache: LSCache<T> | undefined;
      try {
        if (this.isToml) {
          const TOML = await import('@iarna/toml');
          localCache = JSON.parse(JSON.stringify(TOML.default.parse(content)));
        } else {
          if (this.isJson5) await tryLoadJSON5();
          localCache = safeJsonParse<never>(content, this.isJson5) as LSCache<T>;
        }
      } catch (e) {
        getLogger().error('[LiteStorage][reload][parseError]', e);
        try {
          const corruptPath = `${this.cachePath}.corrupt-${Date.now()}`;
          fs.renameSync(this.cachePath, corruptPath);
        } catch {
          /* ignore */
        }
        return this;
      }

      if (localCache && localCache.version === this.options.version) {
        assign(this.cache, assign(localCache, this.cache));
      } else if (localCache) {
        try {
          fs.renameSync(this.cachePath, this.cachePath + `-${localCache.version}.bak`);
        } catch (e) {
          getLogger().error('[LiteStorage][reload][renameBakError]', e);
        }
      }
    }
    return this;
  }
  /** 以 options.uuid 为 key 设置数据 */
  public async set(value: T, mode: 'merge' | 'cover' = 'merge') {
    const uuid = this.options.uuid;

    if (value != null && uuid) {
      if (!this.options.singleMode) await this.reload();
      if (!this.cache.data[uuid]) this.cache.data[uuid] = {} as T;
      if (value !== this.cache.data[uuid]) {
        if (mode === 'merge') assign(this.cache.data[uuid], value);
        else this.cache.data[uuid] = value;
      }
      this.isChanged = true;
      await this.toCache();
    } else {
      console.warn('[LiteStorage][set]error', uuid, value);
    }
    return this;
  }
  /**
   * 以 options.uuid 为 key 获取数据
   * @param raw 是否返回原始数据（不进行深拷贝）。默认为 false
   */
  public get(raw = false) {
    const info = this.cache.data[this.options.uuid] || {};
    return raw ? info : { ...info };
  }
  /** 获取全量缓存的原始数据 */
  public getAll() {
    return this.cache;
  }
  /** 移除一项数据。同 removeItem 方法 */
  public del(key: keyof T) {
    return this.removeItem(key);
  }
  /** 设置并保存一个数据项。提示：setItem、removeItem 都会触发文件读写，应避免密集高频调用 */
  public setItem<K extends keyof T>(key: K, value: T[K] extends object ? Partial<T[K]> : T[K], mode: 'merge' | 'cover' = 'cover') {
    const data = this.get(true);
    if (mode === 'cover') data[key] = value as T[K];
    else assign(data, { [key]: value });

    return this.set(data, 'cover');
  }
  public getItem<K extends keyof T>(key: K): T[K] {
    const value = this.get(true)[key];
    if (value && !Array.isArray(value) && typeof value === 'object') return assign({}, value) as T[K];
    return value;
  }
  /** 移除一项数据 */
  public async removeItem(key: keyof T) {
    const info = this.cache.data[this.options.uuid];
    if (key in info) {
      if (!this.options.singleMode) await this.reload();

      if (key in info) {
        delete info[key];
        return this.toCache();
      }
    }
    return this;
  }
  /**
   * 清理缓存
   * @param isAll 是否清空全部缓存（即移除缓存文件重新初始化）。默认为 false，只清空当前 uuid 约束下的缓存数据
   */
  public async clear(isAll = false) {
    if (isAll) {
      if (fs.existsSync(this.cachePath)) fs.rmSync(this.cachePath, { force: true });
      this.init();
    } else {
      const uuid = this.options.uuid;
      if (this.cache.data[uuid]) {
        if (!this.options.singleMode) await this.reload();
        delete this.cache.data[uuid];
        return this.toCache();
      }
    }
    return this;
  }
}
