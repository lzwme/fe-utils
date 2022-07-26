import { exec } from 'child_process';

/** 写入文本至剪切板 */
export function writeToClipBoard(text: string) {
  return new Promise<boolean>((resolve, reject) => {
    const platform = process.platform;
    const cmd = platform === 'win32' ? 'clip' : platform === 'darwin' ? 'pbcopy' : 'xclip';
    const proc = exec(cmd);

    proc.on('error', error => reject(error));
    proc.stdin.on('error', error => reject(error));
    proc.stdin.end(text, () => {
      resolve(true);
      proc.kill();
    });
  });
}
