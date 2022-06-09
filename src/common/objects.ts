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

export function deepClone<T>(obj: T): T {
  if (!obj || typeof obj !== 'object' || obj instanceof RegExp) return obj;

  const result: any = Array.isArray(obj) ? [] : {};
  // eslint-disable-next-line unicorn/no-array-for-each
  Object.keys(<any>obj).forEach((key: string) => {
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

export function simpleAssign<T = PlainObject>(a: T, b: PlainObject, isIgnoreNull = false): T {
  // 入参不是对象格式则忽略
  if (!a || typeof a !== 'object') return a;
  if (typeof b !== 'object' || b instanceof RegExp || Array.isArray(b)) {
    return a;
  }

  // todo: Set、Map
  for (const key in b) {
    if (null == b[key] || typeof b[key] !== 'object' || b[key] instanceof RegExp || isSet(b[key] || isMap(b[key]))) {
      if (!isIgnoreNull || null != b[key]) a[key] = b[key];
    }
    // 如果是数组，则只简单的复制一份（不考虑数组内的类型）
    else if (Array.isArray(b[key])) {
      a[key] = [...b[key]];
    } else {
      if (!a[key]) a[key] = {};
      simpleAssign(a[key], b[key], isIgnoreNull);
    }
  }

  return a;
}

/** 简易的对象深复制 */
export function assign<T = PlainObject>(a: T, ...args: PlainObject[]): T {
  if (a && typeof a === 'object') {
    for (const arg of args) simpleAssign(a, arg);
  }
  return a;
}
