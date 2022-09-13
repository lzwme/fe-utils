/*
 * @Author: lzw
 * @Date: 2022-09-13 10:59:47
 * @LastEditors: lzw
 * @LastEditTime: 2022-09-13 11:13:29
 * @Description: Semantic Versioning
 */

/**
 * Semantic Versioning compare
 * @see https://github.com/substack/semver-compare/blob/master/index.js
 */
export function semverCompare(a: string, b: string, strict = true) {
  if (!strict) {
    a = a.replace(/[^\d.]/g, '');
    b = b.replace(/[^\d.]/g, '');
  }

  const pa = a.split('.');
  const pb = b.split('.');

  for (let i = 0; i < 3; i++) {
    const na = Number(pa[i]);
    const nb = Number(pb[i]);

    if (na > nb) return 1;
    if (nb > na) return -1;
    if (!Number.isNaN(na) && Number.isNaN(nb)) return 1;
    if (Number.isNaN(na) && !Number.isNaN(nb)) return -1;
  }

  return 0;
}
