import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';

/**
 * 生成指定字符串或指定文件路径的md5值
 * @param str {string} 指定的字符串，或者指定的文件路径
 * @param isFile {boolean} str 是否为一个文件路径
 */
export function md5(str: string | Buffer, isFile = false) {
  try {
    if (isFile) {
      if (!existsSync(str)) return '';
      str = readFileSync(str);
    }
    const md5 = createHash('md5').update(str).digest('hex');
    return md5;
  } catch (error) {
    /* eslint-disable no-console */
    console.log(error);
    return '';
  }
}
