/*
 * @Author: renxia
 * @Date: 2023-03-23 23:05:16
 * @LastEditors: renxia
 * @LastEditTime: 2024-08-02 13:40:01
 * @Description:
 */

export function isObject(obj: unknown): obj is object {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    !Array.isArray(obj) &&
    !(obj instanceof RegExp) &&
    !(obj instanceof Date) &&
    !isSet(obj) &&
    !isMap(obj)
  );
}

export function isEmpty(obj: unknown): boolean {
  if (!obj) return true;
  if (isSet(obj) || isMap(obj)) return obj.size === 0;
  if (Array.isArray(obj)) return obj.length === 0;
  return isEmptyObject(obj);
}

export function isEmptyObject(obj: unknown): boolean {
  if (!isObject(obj)) return false;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
  }

  return true;
}

export function isNumber(obj: unknown): obj is number {
  return typeof obj === 'number' && !Number.isNaN(obj);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isArray(array: any): array is any[] {
  return Array.isArray(array);
}

export function isUndefinedOrNull(value: unknown) {
  return null == value;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function isFunction(obj: unknown): obj is Function {
  return typeof obj === 'function';
}

export function isSet(obj: unknown): obj is Set<unknown> {
  if (!globalThis.Set) return false;
  return obj instanceof Set; // String(obj) === '[object Set]';
}

export function isMap(obj: unknown): obj is Map<unknown, unknown> {
  if (!globalThis.Map) return false;
  return !!obj && obj instanceof Map; // String(obj) === '[object Map]';
}

export function isPromise<T>(obj: unknown): obj is Promise<T> {
  return !!obj && typeof (obj as Promise<T>).then === 'function' && typeof (obj as Promise<T>).catch === 'function';
}

export function isIterable<T>(obj: unknown): obj is Iterable<T> {
  if (typeof obj === 'string') return true;
  return !!obj && typeof (obj as never)[Symbol.iterator] === 'function';
}
