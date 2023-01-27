/** 复制内容到剪切板 */
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
