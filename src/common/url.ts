/*
 * @Author: renxia
 * @Date: 2023-03-23 23:05:16
 * @LastEditors: renxia
 * @LastEditTime: 2024-04-01 11:23:08
 * @Description:
 */
/**
 * url 格式化，返回一个 URL 对象
 * @param url
 * @param params 参数
 * @param isRepalce 是否替换已存在于 url 中的参数
 * @returns
 */
export function urlFormat<T = unknown>(url: string, params?: Record<string, T>, isRepalce = false) {
  const u = new URL(url, 'file:');

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      const val = value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value);

      if (isRepalce) u.searchParams.set(key, val);
      else u.searchParams.append(key, val);
    }
  }

  return u;
}

export function toFileUri<T = unknown>(filePath: string, params?: Record<string, T>): string {
  // if (!params) return new URL(filePath, 'file:').toString();
  return urlFormat<T>(filePath, params || {}).toString();
}

/** 将对象参数转换为 url searchParams 格式 */
export function toQueryString(params: Record<string, unknown>) {
  // return new URLSearchParams(params).toString();

  const list: string[] = [];

  if (params && typeof params === 'object') {
    for (let [key, value] of Object.entries(params)) {
      if (value == null) value = '';
      else if (typeof value !== 'string') value = JSON.stringify(value);
      list.push(`${key}=${encodeURIComponent(value as string)}`);
    }
  }

  return list.join('&');
}

export function getUrlParams(query = location.search) {
  const ret: Record<string, string> = {};
  if (query) {
    if (query.includes('?')) query = query.slice(query.indexOf('?') + 1);
    const parts = query.split('&');
    for (const line of parts) {
      const kv = line.split('=').map(d => decodeURIComponent(d));
      ret[kv[0]] = kv[1] || '';
    }
  }
  return ret;
}
