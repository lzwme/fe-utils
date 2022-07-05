/* eslint-disable @typescript-eslint/no-explicit-any */
import { type PlainObject } from './types';
import { isObject, isSet, isMap } from './is';

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

export function deepClone<T>(obj: T): T {
  if (!obj || typeof obj !== 'object' || obj instanceof RegExp) return obj;

  const result: any = Array.isArray(obj) ? [] : {};
  // eslint-disable-next-line unicorn/no-array-for-each
  getObjectKeysUnsafe(<any>obj).forEach((key: string) => {
    if ((<any>obj)[key] && typeof (<any>obj)[key] === 'object') {
      result[key] = deepClone((<any>obj)[key]);
    } else {
      result[key] = (<any>obj)[key];
    }
  });
  return result;
}

export function mixin<T = any>(destination: any, source: any, overwrite = true): T {
  if (!isObject(destination)) source;

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

/**
 * 将 b 合并深度到 a
 */
export function simpleAssign<T extends Record<string, any>, U>(a: T, b: U, filter?: (value: unknown) => boolean): T & U {
  // 入参不是对象格式则忽略
  if (!a || typeof a !== 'object') return a as T & U;
  if (typeof b !== 'object' || b instanceof RegExp || Array.isArray(b)) {
    return a as T & U;
  }

  for (const key in b) {
    const value = b[key];
    if (typeof filter === 'function' && !filter(value)) continue;

    if (null == value || typeof value !== 'object' || value instanceof RegExp || isSet(value) || isMap(value)) {
      // @ts-ignore
      a[key] = value;
    }
    // 如果是数组，则只简单的复制一份（不考虑数组内的类型）
    else if (Array.isArray(value)) {
      // @ts-ignore
      a[key] = [...value];
    } else {
      // @ts-ignore
      if (!a[key as string]) a[key] = {};
      simpleAssign(a[key as string], value, filter);
    }
  }

  return a as T & U;
}

/**
 * 将 b 合并深度到 a，但不包括属性值为 nil 的属性
 * @param {boolean} [isOnlyNil=true] 是否仅忽略 null 和 undefined。为 false 则忽略所有空值(![key] === true)
 */
export function assignExceptNil<T extends object, U>(a: T, b: U, isOnlyExceptNull = true) {
  return simpleAssign(a, b, value => {
    if (null == value) return false;
    return !!value || isOnlyExceptNull;
  });
}

/** 简易的对象深复制 */
export function assign<T extends object>(a: T, ...args: PlainObject[]): T {
  if (a && typeof a === 'object') {
    for (const arg of args) simpleAssign(a, arg);
  }
  return a;
}
