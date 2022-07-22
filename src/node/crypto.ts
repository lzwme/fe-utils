import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { basename } from 'path';

/**
 * 生成指定字符串或指定文件路径的md5值
 * @param str 指定的字符串，或者指定的文件路径
 * @param isFile str 是否为一个文件路径
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

/**
 * 根据 Object 类型的参数值生成 md5
 * @param params
 * @param filterKeyList 要过滤的通用字段
 */
export function getMd5ByPlainObject(params: Record<string | number, unknown>, filterKeyList: string[] = []) {
  if (!params) return '';
  // const filterKeyList = ['current_page', 'page_size', 'uid', 'pageSize', 'currentPage'];

  const keys = Object.keys(params)
    .sort()
    .filter(key => params[key] !== '' && !filterKeyList.includes(key));
  if (keys.length === 0) return '';

  const data = keys.map(key => ({ key, value: params[key] }));
  return md5(JSON.stringify(data));
}

/**
 * tar.gz 压缩。需添加依赖库 `compressing`
 * @param srcDir 要压缩的目录路径
 * @param dest 解压输出目录路径
 */
export async function tgzip(srcDir: string, dest?: string) {
  if (!dest) dest = srcDir.replace(/\/$/, '');
  if (!dest.endsWith('.tar.gz')) dest += '.tar.gz';

  return import('compressing').then(({ tgz }) => tgz.compressDir(srcDir, dest));
}

/**
 * tar.gz 文件解压。需添加依赖库 `compressing`
 * @param tgzFilePath 要解压的 tar.gz 文件路径
 * @param dest 解压输出目录路径
 */
export async function untgzip(tgzFilePath: string, dest?: string) {
  return import('compressing').then(({ tgz }) => tgz.uncompress(tgzFilePath, dest || basename(tgzFilePath)));
}

/**
 * zip 压缩。需添加依赖库 `compressing`
 * @param srcDir 要压缩的目录路径
 * @param dest 解压输出目录路径
 */
export async function zip(srcDir: string, dest?: string) {
  if (!dest) dest = srcDir.replace(/\/$/, '');
  if (!dest.endsWith('.zip')) dest += '.zip';

  return import('compressing').then(({ zip }) => zip.compressDir(srcDir, dest));
}

/**
 * zip 文件解压。需添加依赖库 `compressing`
 * @param tgzFilePath 要解压的 tar.gz 文件路径
 * @param dest 解压输出目录路径
 */
export async function unzip(tgzFilePath: string, dest?: string) {
  return import('compressing').then(({ zip }) => zip.uncompress(tgzFilePath, dest || basename(tgzFilePath)));
}
