/*
 * @Author: renxia
 * @Date: 2024-01-15 11:26:52
 * @LastEditors: renxia
 * @LastEditTime: 2024-01-15 11:53:38
 * @Description: cookie 相关处理工具方法
 */

import { objectFilterByKeys } from './objects';

export function cookieParse(cookie = '', filterNilValue = false) {
  const obj: Record<string, string> = {};
  if (!cookie && typeof document !== 'undefined') cookie = document.cookie;

  if (typeof cookie === 'string' && cookie.length > 0) {
    for (const d of cookie.split(';')) {
      const [key, value] = d.split('=').map(d => d.trim());
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
  cookieObj = objectFilterByKeys(cookieObj, options);
  return Object.values(cookieObj)
    .map((key, value) => `${key}=${value ? encodeURIComponent(value) : ''}`)
    .join('; ');
}
