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
  // 使用 null 原型对象：避免 __proto__ 等键被原型 setter 吞掉或改写返回值的原型
  const ret: Record<string, string> = Object.create(null);
  if (query) {
    if (query.includes('?')) query = query.slice(query.indexOf('?') + 1);
    const parts = query.split('&');
    for (const line of parts) {
      if (!line) continue;
      // 值中可能包含 '='（如 base64），只能按第一个 '=' 拆分
      const eqIndex = line.indexOf('=');
      const rawKey = eqIndex === -1 ? line : line.slice(0, eqIndex);
      const rawValue = eqIndex === -1 ? '' : line.slice(eqIndex + 1);
      let key = rawKey;
      let value = rawValue;
      try {
        key = decodeURIComponent(rawKey);
        value = decodeURIComponent(rawValue);
      } catch {
        // 非法转义时保留原始内容，避免整次解析抛错
      }
      ret[key] = value;
    }
  }
  return ret;
}
