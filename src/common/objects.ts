/* eslint-disable @typescript-eslint/no-explicit-any, unicorn/prefer-top-level-await */
import type { AnyObject } from '../types';
import { isObject, isSet, isMap, isArray } from './is';

let JSON5: typeof globalThis.JSON;

export async function tryLoadJSON5(useCache = false) {
  if (!JSON5 || !useCache) {
    JSON5 = globalThis.JSON;
    try {
      // @ts-ignore
      if (globalThis.JSON5) JSON5 = globalThis.JSON5;
      else {
        if (typeof require === 'function') JSON5 = require('json5');
        else {
          const t = await import('json5');
          JSON5 = (t.default || t) as never;
        }
      }
    } catch (error) {
      if (!useCache) console.error(error);
    }
  }
  return JSON5;
}
tryLoadJSON5(true);

export function safeJsonParse<T extends AnyObject>(input: string, useJSON5 = false, ignoreError = false): T {
  try {
    if (input == null) return {} as T;
    if (typeof input === 'object') return input;
    return (useJSON5 ? JSON5 : JSON).parse(input) as T;
  } catch (error: any) {
    if (useJSON5 && !JSON5) console.error('[safeJsonParse]JSON5 尚未加载, 请先调用方法 `tryLoadJSON5`');
    if (!ignoreError) console.error('[safeJsonParse]parse error', error.message, error.stack);
  }

  return {} as T;
}

export function safeStringify(obj: any, space?: string | number, useJSON5 = false): string {
  if (obj instanceof Error) return `Error: ${obj.message}\n${obj.stack}`;
  if (obj instanceof RegExp) return obj.toString();

  const seen = new Set<any>();
  return (useJSON5 ? JSON5 : JSON).stringify(
    obj,
    (_key, value) => {
      if (isObject(value) || Array.isArray(value)) {
        if (seen.has(value)) {
          return '[Circular]';
        } else {
          seen.add(value);
        }
      }
      return value;
    },
    space
  );
}

/**
 * 获取一个对象的 key 列表（返回指定的类型）
 */
export function getObjectKeysUnsafe<T extends object>(value: T): (keyof T)[] {
  return Object.keys(value) as (keyof T)[];
}

export function deepClone<T extends object>(obj: T): T {
  if (!obj || typeof obj !== 'object' || obj instanceof RegExp) return obj;

  const result: any = Array.isArray(obj) ? [] : {};
  // eslint-disable-next-line unicorn/no-array-for-each
  getObjectKeysUnsafe(obj).forEach(key => {
    result[key] = (<any>obj)[key] && typeof (<any>obj)[key] === 'object' ? deepClone((<any>obj)[key]) : (<any>obj)[key];
  });
  return result;
}

export function mixin<T = any>(destination: AnyObject, source: AnyObject, overwrite = true): T {
  if (!isObject(destination)) return source as T;

  if (isObject(source)) {
    for (const key of Object.keys(source)) {
      if (key in destination) {
        if (overwrite) {
          if (isObject(destination[key]) && isObject(source[key])) {
            mixin(destination[key], source[key], overwrite);
          } else {
            destination[key] = source[key];
          }
        }
      } else {
        destination[key] = source[key];
      }
    }
  }
  return destination as T;
}

/** 合并类数组对象。若执行了合并，会去除重复的值 */
export function mergeArrayLike<T>(a: T, b: unknown) {
  let result: unknown = a;

  if (Array.isArray(b)) {
    const shouldMerge = Array.isArray(a);
    result = shouldMerge ? [...new Set([...(a as Array<unknown>), ...b])] : [...b];
  } else if (isSet(b)) {
    result = isSet(a) ? new Set([...(a as Set<unknown>), ...b]) : b;
  } else if (isMap(b)) {
    if (isMap(a)) {
      const source = a as Map<string, unknown>;
      for (const [k, v] of b as Map<string, unknown>) {
        if (source.has(k)) source.set(k, simpleAssign(source.get(k) as never, v, { mergeArrayLike: true }));
        else source.set(k, v);
      }
    } else {
      result = b;
    }
  }

  return result as T;
}

export interface SimpleAssignOptions {
  filter?: (value: unknown, key: string) => boolean;
  /** 是否对类数组(Array、Set、Map) 作合并并去重。为 false 则简单替换。默认为 false */
  mergeArrayLike?: boolean;
}
/**
 * 将 b 深度合并到 a
 */
export function simpleAssign<T extends Record<string, any>, U>(
  a: T,
  b: U,
  options: SimpleAssignOptions = {},
  seen = new Set<unknown>()
): T & U {
  const result: Record<string, unknown> = a;

  // 入参不是对象格式则忽略
  if (!a || typeof a !== 'object') return result as T & U;
  if (typeof b !== 'object' || b instanceof RegExp || Array.isArray(b)) {
    return result as T & U;
  }

  seen.add(b);

  for (const [key, value] of Object.entries(b as Record<string, unknown>)) {
    // eslint bug
    // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
    if (typeof options.filter === 'function' && !options.filter(value, key)) continue;

    if (null == value || typeof value !== 'object' || value instanceof RegExp) {
      result[key] = value;
    } else if (Array.isArray(value) || isSet(value) || isMap(value)) {
      result[key] = options.mergeArrayLike ? mergeArrayLike(result[key], value) : value;
    } else {
      if (!result[key]) result[key] = {};
      if (seen.has(value)) {
        result[key] = value as never;
      } else {
        seen.add(value);
        simpleAssign(result[key] as object, value, options, seen);
      }
    }
  }

  return result as T & U;
}

/**
 * 将 b 深度合并到 a，但不包括属性值为 null 的属性
 * @param {boolean} [isOnlyNil=true] 是否仅忽略 null 和 undefined。为 false 则忽略所有空值(![key] === true)
 */
export function assignExceptNil<T extends object, U>(a: T, b: U, isOnlyExceptNull = true) {
  return simpleAssign(a, b, {
    filter: value => (null == value ? false : !!value || isOnlyExceptNull),
  });
}

/** 简易的对象深复制 */
export function assign<T extends object>(a: T, ...args: Record<any, any>[]): T {
  if (a && typeof a === 'object') {
    const tmp = {};
    for (const arg of args) simpleAssign(tmp, arg);
    simpleAssign(a, tmp);
  }
  return a;
}

export function ensureArray<T>(input: readonly T[] | T | undefined | null): readonly T[] {
  if (isArray(input)) return input as T[];
  if (input == null) return [];
  return [input as T];
}

/** 将 object 所有 key 转换为小写 */
export function toLowcaseKeyObject<T extends Record<string, unknown>>(info: T = {} as T) {
  for (const key of Object.keys(info)) {
    const lowCaseKey = key.toLocaleLowerCase();
    if (key !== lowCaseKey) {
      // @ts-expect-error
      info[lowCaseKey] = info[key];
      delete info[key];
    }
  }
  return info;
}

/** 过滤指定的key或空值，返回新的对象 */
export function objectFilterByKeys<T extends Record<string, unknown>>(
  obj: T,
  options: { removeKeys?: (string | RegExp)[]; onlyKeys?: (string | RegExp)[]; removeNil?: boolean } = {}
) {
  const newObj: Record<string, any> = {};
  if (!obj || typeof obj !== 'object') return newObj;

  const keys = Object.keys(obj).filter(key => {
    if (options.removeKeys?.length && options.removeKeys.some(d => (d instanceof RegExp ? d.test(key) : d === key))) return false;
    if (options.onlyKeys?.length && !options.onlyKeys.some(d => (d instanceof RegExp ? d.test(key) : d === key))) return false;
    if (options.removeNil && (obj[key] == null || obj[key] === '')) return false;
    return true;
  });

  for (const k of keys) newObj[k] = obj[k];
  return newObj as Partial<typeof obj>;
}
