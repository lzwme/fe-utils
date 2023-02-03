/** 复制内容到剪切板1 */
export function copyToClipboard(msg: unknown) {
  function copy(e: ClipboardEvent) {
    e.preventDefault();
    if (e.clipboardData) e.clipboardData.setData('text/plain', typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  document.addEventListener('copy', copy);
  document.execCommand('copy');
  document.removeEventListener('copy', copy);
}

/** 复制内容到剪切板2 */
export function copyToClipboard2(msg: unknown) {
  const oInput = document.createElement('input');
  oInput.style.display = 'none';
  oInput.value = typeof msg === 'string' ? msg : JSON.stringify(msg);
  document.body.append(oInput);
  oInput.select();
  document.execCommand('copy');
  oInput.remove();
}

/** 复制内容到剪切板 */
export function writeToClipboard(msg: unknown) {
  return navigator.clipboard
    .writeText(typeof msg === 'string' ? msg : JSON.stringify(msg))
    .catch(() => copyToClipboard(msg))
    .catch(() => copyToClipboard2(msg));
}

/** 复制图片到剪切板 */
export function copyImage(file: File, title = 'download') {
  const blob = new Blob([title], { type: 'text/plain' });
  const clipboardItem = new ClipboardItem({
    'text/rt': blob,
    'image/png': file,
  });
  return navigator.clipboard.write([clipboardItem]);
}
