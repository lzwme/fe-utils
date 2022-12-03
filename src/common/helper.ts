export function formatByteSize(byteSize: number | string, decimal = 2) {
  let formated = +byteSize;
  if (byteSize === '' || byteSize == null || Number.isNaN(formated)) {
    return typeof byteSize === 'string' ? byteSize : '';
  }

  const base = 1024;
  const sizeName = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let idx = 0;

  while (idx < sizeName.length && formated > base) {
    formated /= base;
    idx++;
  }

  return (decimal > 0 ? +formated.toFixed(decimal) : formated) + sizeName[idx];
  //   if (byteSize > 1 << 30) return (byteSize / (1 << 30)).toFixed(2) + 'GB';
  //   if (byteSize > 1 << 20) return (byteSize / (1 << 20)).toFixed(2) + 'MB';
  //   if (byteSize > 1 << 10) return (byteSize / (1 << 10)).toFixed(2) + 'KB';
  //   return byteSize + 'B';
}

export function formatQty(number: number | string) {
  const num = Number(number);
  if (number === '' || number == null || Number.isNaN(num)) return number?.toString() ?? '';
  const [int, de] = String(num).split('.');
  return Number(int).toLocaleString() + (de ? `.${de}` : '');
}
