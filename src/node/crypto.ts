import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';

/**
 * 生成指定字符串或指定文件路径的md5值
 * @param str {string|Buffer} 指定的字符串，或者指定的文件路径
 * @param isFile {boolean} str 是否为一个文件路径
 */
export function md5(str: string | Buffer, isFile = false) {
  try {
    if (isFile && typeof str === 'string') {
      if (!existsSync(str)) return '';
      str = readFileSync(str);
    }
    return createHash('md5').update(str).digest('hex');
  } catch (error) {
    /* eslint-disable no-console */
    console.warn('[md5][error]', (error as Error).message);
    return '';
  }
}

/**
 * 根据 Object 类型的参数值生成 md5
 * @param params
 * @param filterKeyList 要过滤的通用字段
 */
export function getMd5ByPlainObject(params: Record<string | number, unknown>, filterKeyList: string[] = []) {
  if (!params) return '';

  const keys = Object.keys(params)
    .filter(key => params[key] !== '' && !filterKeyList.includes(key))
    .sort();
  if (keys.length === 0) return '';

  const data = keys.map(key => ({ key, value: params[key] }));
  return md5(JSON.stringify(data));
}
