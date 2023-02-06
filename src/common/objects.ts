/* eslint-disable @typescript-eslint/no-explicit-any */
import { isObject, isSet, isMap, isArray } from './is';

export function safeStringify(obj: any): string {
  const seen = new Set<any>();
  return JSON.stringify(obj, (_key, value) => {
    if (isObject(value) || Array.isArray(value)) {
      if (seen.has(value)) {
        return '[Circular]';
      } else {
        seen.add(value);
      }
    }
    return value;
  });
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

export function mixin<T = any>(destination: any, source: any, overwrite = true): T {
  if (!isObject(destination)) return source;

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
  return destination;
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
 * 将 b 合并深度到 a
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
 * 将 b 合并深度到 a，但不包括属性值为 nil 的属性
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
