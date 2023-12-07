import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fs } from './fs-system';
import { assign } from '../common/objects';

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
}

/**
 * 轻量的本地文件持久性数据存储。主要用于简单的配置信息持久化
 */
export class LiteStorage<T extends object = Record<string, unknown>> {
  private static instance: LiteStorage<object>;
  static getInstance<T extends object>(options?: LSOptions) {
    if (!LiteStorage.instance) LiteStorage.instance = new LiteStorage<T>(options);
    return LiteStorage.instance as LiteStorage<T>;
  }
  private get cachePath() {
    return this.options.filepath;
  }
  private get isToml() {
    return /\.toml$/.test(this.options.filepath);
  }
  // @ts-ignore
  private cache: LSCache<T>;
  private options: Required<LSOptions>;
  private baseDir = resolve(fs.existsSync('./node_modules') ? './node_modules/.cache' : homedir(), '.liteStorage');
  constructor(options?: LSOptions) {
    this.options = {
      version: '0.0.0',
      uuid: 'defaults',
      filepath: resolve(this.baseDir, 'ls.json'),
      initial: {},
      ...options,
    };

    this.init();
    this.reload();
  }
  private init() {
    const { filepath, uuid, version } = this.options;
    if (!filepath.endsWith('.json') && !filepath.endsWith('.toml')) {
      this.options.filepath = resolve(this.baseDir, filepath, 'ls.json');
    }
    this.options.filepath = resolve(this.baseDir, filepath);

    this.cache = {
      version,
      data: {
        [uuid]: (this.options.initial || {}) as T,
      },
    };
  }
  public get config() {
    return { ...this.options };
  }
  /** 主动保存 */
  public async save(value?: T, mode: 'merge' | 'cover' = 'merge') {
    if (value) return this.set(value, mode);

    const cacheDir = dirname(this.cachePath);
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    await this.reload();
    let content = '';
    if (this.isToml) {
      const TOML = await import('@ltd/j-toml');
      content = TOML.stringify(this.cache as never, { newline: '\n' });
    } else {
      content = JSON.stringify(this.cache, null, 4);
    }
    fs.writeFileSync(this.cachePath, content, 'utf8');
    return this;
  }
  /** 从文件中重载数据至内存。在多进程、多线程模式下，需读取最新数据时，可手动调用 */
  public async reload() {
    if (fs.existsSync(this.cachePath)) {
      const content = fs.readFileSync(this.cachePath, 'utf8');
      let localCache: LSCache<T>;
      if (this.isToml) {
        const TOML = await import('@ltd/j-toml');
        localCache = TOML.default.parse(content, '\n', false) as never;
        // localCache = JSON.parse(JSON.stringify(TOML.default.parse(content, '\n', false)));
      } else {
        localCache = JSON.parse(content) as LSCache<T>;
      }

      if (localCache.version === this.options.version) {
        assign(this.cache, assign(localCache, this.cache));
      } else fs.rmSync(this.cachePath, { force: true });
    }
    return this;
  }
  public set(value: T, mode: 'merge' | 'cover' = 'merge') {
    const uuid = this.options.uuid;

    if (value != null && uuid) {
      if (!this.cache.data[uuid]) this.cache.data[uuid] = {} as T;
      if (value !== this.cache.data[uuid]) {
        if (mode === 'merge') assign(this.cache.data[uuid], value);
        else this.cache.data[uuid] = value;
      }
      this.save();
    } else {
      console.warn('[LiteStorage][set]error', uuid, value);
    }
    return this;
  }
  public get(raw = false) {
    const info = this.cache.data[this.options.uuid];
    return raw ? info : { ...info };
  }
  public getAll() {
    return this.cache;
  }
  public del(key: keyof T) {
    const info = this.cache.data[this.options.uuid];
    if (key in info) {
      delete info[key];
      this.save();
    }
    return this;
  }
  public clear(isAll = false) {
    if (isAll) {
      if (fs.existsSync(this.cachePath)) fs.rmSync(this.cachePath, { force: true });
      this.init();
    } else {
      const uuid = this.options.uuid;
      if (this.cache.data[uuid]) delete this.cache.data[uuid];
      this.save();
    }
  }
}
