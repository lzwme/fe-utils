import { type StdioOptions, execSync as cpExecSync, exec, ExecOptions } from 'node:child_process';
import { color } from 'console-log-colors';
import { getLogger } from './get-logger';

process.stderr.setMaxListeners(0);
process.stdout.setMaxListeners(0);

export function execPromisfy(cmd: string, debug = process.env.DEBUG != null, options: ExecOptions = {}) {
  return new Promise<{ error: Error; stdout: string; stderr: string }>(resolve => {
    if (debug) getLogger().log(color.green('exec cmd:'), color.cyanBright(cmd));

    const proc = exec(cmd, { maxBuffer: 100 * 1024 * 1024, ...options }, (error, stdout, stderr) => {
      if (debug && error) getLogger().error(`\n[exec]命令执行失败：${cmd}\n`, color.redBright(error.message), '\n', error);
      resolve({ error: error as never, stdout: stdout.trim(), stderr });
    });

    if (proc.stderr) proc.stderr.pipe(process.stderr);
    if (debug && proc.stdout) proc.stdout.pipe(process.stdout);
  });
}

export function execSync(cmd: string, stdio?: StdioOptions, cwd = process.cwd(), debug = false, options: ExecOptions = {}) {
  if (debug) getLogger().debug(color.cyanBright('exec cmd:'), color.cyan(cwd));
  const result = { stdout: '', stderr: '', error: null as unknown as Error };

  try {
    // 为 pipe 才会返回输出结果给 res；为 inherit 则打印至 stdout 中，res 为空
    if (!stdio) stdio = debug ? 'inherit' : 'pipe';
    const res = cpExecSync(cmd, { stdio, encoding: 'utf8', cwd, ...options });
    result.stdout = res ? res.toString().trim() : '';
  } catch (error) {
    const e = error as Error;
    if (debug) getLogger().error(color.redBright(e.message));
    result.stderr = e.message;
    result.error = e;
  }
  return result;
}
