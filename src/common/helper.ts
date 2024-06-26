export function formatByteSize(byteSize: number | string, decimal = 2, toFixed = false) {
  let formated = +byteSize;
  if (byteSize === '' || byteSize == null || Number.isNaN(formated)) {
    return typeof byteSize === 'string' ? byteSize : '';
  }

  const neg = formated < 0 ? '-' : '';
  if (neg) formated = -formated;
  if (formated < 1) return neg + formated + 'B';

  const base = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let idx = 0;

  while (idx < units.length && formated > base) {
    formated /= base;
    idx++;
  }

  return neg + (decimal > 0 ? (toFixed ? formated.toFixed(decimal) : +formated.toFixed(decimal)) : formated) + units[idx];
}

export function formatQty(number: number | string) {
  const num = Number(number);
  if (number === '' || number == null || Number.isNaN(num)) return number?.toString() ?? '';
  const [int, de] = String(num).split('.');
  return Number(int).toLocaleString() + (de ? `.${de}` : '');
}

/** 生成指定长度的随机字符串 */
export function genRandomString(length: number) {
  let ret = '';
  while (length--) {
    const rdm62 = 0 | (Math.random() * 62);
    ret += String.fromCharCode(rdm62 + (rdm62 < 10 ? 48 : rdm62 < 36 ? 55 : 61));
  }
  return ret;
}
