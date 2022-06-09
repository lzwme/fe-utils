import { PlainObject } from './types';

export function urlFormat(url: string, params: PlainObject, isRepalce = false) {
  if (!url || !params) return url;

  const u = new URL(url, 'file:');
  for (let [key, value] of Object.entries(params)) {
    if (value == null) value = '';
    else if (typeof value !== 'string') value = JSON.stringify(value);

    if (isRepalce) u.searchParams.set(key, value);
    else u.searchParams.append(key, value);
  }

  return u.toString();
}

export function toFileUri(filePath: string): string {
  return new URL(filePath, 'file:').toString();
}

/** 将对象参数转换为 url searchParams 格式 */
export function toQueryString(params: PlainObject) {
  // return new URLSearchParams(params).toString();

  const list: string[] = [];

  if (params && typeof params === 'object') {
    for (let [key, value] of Object.entries(params)) {
      if (value == null) value = '';
      else if (typeof value !== 'string') value = JSON.stringify(value);
      list.push(`${key}=${encodeURIComponent(value)}`);
    }
  }

  return list.join('&');
}

export function getUrlParams(query = location.search) {
  const ret: PlainObject = {};
  if (query) {
    const parts = query.slice(1).split('&');
    for (const line of parts) {
      const kv = line.split('=').map(d => decodeURIComponent(d));
      ret[kv[0]] = kv[1] || null;
    }
  }
  return ret;
}
