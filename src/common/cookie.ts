/*
 * cookie 相关处理工具方法
 */

export function cookieParse(cookie = '') {
  const obj: Record<string, string> = {};
  if (!cookie && typeof document !== 'undefined') cookie = document.cookie;

  if (typeof cookie === 'string' && cookie.length > 0) {
    for (const d of cookie.split(';')) {
      const [key, value] = d.split('=').map(d => d.trim());
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
  cookieObj: Record<string, string | number | boolean>,
  options: { filterKeys?: string[]; onlyKeys?: string[]; removeNil?: boolean } = {}
) {
  return Object.keys(cookieObj)
    .filter(key => {
      if (options.filterKeys?.length && options.filterKeys.includes(key)) return false;
      if (options.onlyKeys?.length && !options.onlyKeys.includes(key)) return false;
      if (options.removeNil && (cookieObj[key] == null || cookieObj[key] === '')) return false;
      return true;
    })
    .map(key => `${key}=${cookieObj[key] ? encodeURIComponent(cookieObj[key]) : ''}`)
    .join('; ');
}
