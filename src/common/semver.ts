/*
 * @Author: lzw
 * @Date: 2022-09-13 10:59:47
 * @LastEditors: lzw
 * @LastEditTime: 2022-09-13 13:28:43
 * @Description: Semantic Versioning
 */

/**
 * Semantic Versioning compare
 * @see https://github.com/substack/semver-compare/blob/master/index.js
 */
export function semverCompare(a: string, b: string, strict = true) {
  a = String(a || '');
  b = String(b || '');

  if (!strict) {
    a = a.replace('-', '.').replace(/[^\d.]/g, '');
    b = b.replace('-', '.').replace(/[^\d.]/g, '');
  }

  const pa = a.split('.');
  const pb = b.split('.');
  const count = strict ? 3 : Math.max(pa.length, pb.length, 3);

  for (let i = 0; i < count; i++) {
    const na = Number(pa[i]);
    const nb = Number(pb[i]);

    if (na > nb) return 1;
    if (nb > na) return -1;
    if (!Number.isNaN(na) && Number.isNaN(nb)) return 1;
    if (Number.isNaN(na) && !Number.isNaN(nb)) return -1;
  }

  return 0;
}
