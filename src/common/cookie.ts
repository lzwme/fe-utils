/*
 * @Author: renxia
 * @Date: 2024-01-15 11:26:52
 * @LastEditors: renxia
 * @LastEditTime: 2024-07-24 11:38:51
 * @Description: cookie 相关处理工具方法
 */

import { objectFilterByKeys } from './objects';

export function cookieParse(cookie = '', filterNilValue = false) {
  const obj: Record<string, string> = {};
  if (!cookie && typeof document !== 'undefined') cookie = document.cookie;

  if (typeof cookie === 'string' && cookie.length > 0) {
    for (const d of cookie.split(';')) {
      const arr = d.split('=');
      const key = arr[0].trim();
      const value = arr.slice(1).join('=').trim();
      if (filterNilValue && !value) continue;

      try {
        if (value != null) obj[key] = decodeURIComponent(value);
      } catch {
        try {
          obj[key] = unescape(value);
        } catch {
          obj[key] = value || '';
        }
      }
    }
  }
  return obj;
}

export function cookieStringfiy(
  cookieObj: Record<string, string | number | boolean | undefined>,
  options: { removeKeys?: (string | RegExp)[]; onlyKeys?: (string | RegExp)[]; removeNil?: boolean } = {}
) {
  const obj = objectFilterByKeys(cookieObj, options);
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value ? encodeURIComponent(value) : ''}`)
    .join('; ');
}

/**
 * 将 cookie 设置到浏览器
 * @param name - cookie 名称
 * @param value - cookie 值
 * @param options - cookie 选项
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
  } = {}
): boolean {
  if (!globalThis.document) return false;
  const { expires = 365, path = '/', domain = '', secure = false, sameSite = 'strict' } = options;
  const expiresValue = expires instanceof Date ? expires.toUTCString() : `${expires}`;
  const cookieStr = `${name}=${value}; path=${path}; domain=${domain}; expires=${expiresValue}; ${
    secure ? 'secure; ' : ''
  }httponly; samesite=${sameSite}`;

  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = cookieStr;
  return document.cookie.includes(name);
}
