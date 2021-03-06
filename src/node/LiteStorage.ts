import { homedir } from 'os';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { assign } from '../common/objects';

interface LSCache<T> {
  version: string;
  data: {
    [uuid: string]: T;
  };
}

export interface LSOptions {
  /** 缓存文件保存的路径 */
  filepath?: string;
  /** 缓存版本。当版本不匹配时将清空已有数据 */
  version?: string;
  /** 存储类型的唯一标记，用于区分多个不同类型的存储。默认为 defaults */
  uuid?: string;
}

/**
 * 轻量的本地文件持久性数据存储。主要用于建安的配置参数等的持久化
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
  private cache: LSCache<T>;
  private options: Required<LSOptions>;
  constructor(options?: LSOptions) {
    this.options = {
      version: '0.0.0',
      uuid: 'defaults',
      filepath: resolve(existsSync('./node_modules') ? './node_modules/' : homedir(), '.liteStoreage/ls.json'),
      ...options,
    };

    this.init();
    this.reload();
  }
  private init() {
    const { filepath, uuid, version } = this.options;
    if (!filepath.endsWith('.json')) {
      this.options.filepath = resolve(filepath, '.liteStoreage/ls.json');
    }

    this.cache = {
      version,
      data: {
        [uuid]: {} as T,
      },
    };
  }
  private save() {
    const cacheDir = dirname(this.cachePath);
    if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
    this.reload();
    writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 4), 'utf8');
  }
  /** 从文件中重载数据至内存。在多进程、多线程模式下，需读取最新数据时，可手动调用 */
  public reload() {
    if (existsSync(this.cachePath)) {
      const localCache = JSON.parse(readFileSync(this.cachePath, 'utf8')) as LSCache<T>;
      if (localCache.version === this.options.version) assign(this.cache, localCache);
      else rmSync(this.cachePath, { force: true });
    }
    return this;
  }
  public set(value: T) {
    const uuid = this.options.uuid;
    if (value && uuid) {
      if (!this.cache.data[uuid]) this.cache.data[uuid] = {} as T;
      assign(this.cache.data[uuid], value);
      this.save();
    }
    return this;
  }
  public get() {
    const info = this.cache.data[this.options.uuid];
    return { ...info };
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
    if (!isAll) {
      const uuid = this.options.uuid;
      if (this.cache.data[uuid]) delete this.cache.data[uuid];
      this.save();
    } else {
      if (existsSync(this.cachePath)) rmSync(this.cachePath, { force: true });
      this.init();
    }
  }
}
