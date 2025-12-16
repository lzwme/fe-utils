/* eslint-disable unicorn/no-array-for-each */
/* eslint-disable unicorn/no-for-loop */

import { ChildProcess, exec } from 'node:child_process';
import { color } from 'console-log-colors';
import { execPromisfy, execSync, execFilePromisfy } from './exec';
import { getLogger } from './get-logger';

export interface ProcessItem {
  name: string;
  cmd: string;
  pid: number;
  ppid: number;
  /** cpu 使用率 */
  load: number;
  /** 内存占用 */
  mem: number;
  children?: ProcessItem[];
}

export function listProcesses(rootPid: number, formatName?: (cmd: string) => string): Promise<ProcessItem> {
  return new Promise((resolve, reject) => {
    let rootItem: ProcessItem | undefined;
    const map = new Map<number, ProcessItem>();

    // eslint-disable-next-line unicorn/consistent-function-scoping
    function findName(cmd: string): string {
      if (typeof formatName === 'function') {
        const cname = formatName(cmd);
        if (cname) return cname;
      }
      const SHARED_PROCESS_HINT = /-window-kind=shared-process/;
      const ISSUE_REPORTER_HINT = /-window-kind=issue-reporter/;
      const PROCESS_EXPLORER_HINT = /-window-kind=process-explorer/;
      const UTILITY_NETWORK_HINT = /--utility-sub-type=network/;
      const WINDOWS_CRASH_REPORTER = /--crashes-directory/;
      const WINDOWS_PTY = /\\pipe\\winpty-control/;
      const WINDOWS_CONSOLE_HOST = /conhost\.exe/;
      const TYPE = /--type=([A-Za-z-]+)/;

      // find windows crash reporter
      if (WINDOWS_CRASH_REPORTER.test(cmd)) {
        return 'electron-crash-reporter';
      }

      // find windows pty process
      if (WINDOWS_PTY.test(cmd)) {
        return 'winpty-process';
      }

      //find windows console host process
      if (WINDOWS_CONSOLE_HOST.test(cmd)) {
        return 'console-window-host (Windows internal process)';
      }

      let matches = TYPE.exec(cmd);
      if (matches && matches.length === 2) {
        if (matches[1] === 'renderer') {
          if (SHARED_PROCESS_HINT.test(cmd)) {
            return 'shared-process';
          }

          if (ISSUE_REPORTER_HINT.test(cmd)) {
            return 'issue-reporter';
          }

          if (PROCESS_EXPLORER_HINT.test(cmd)) {
            return 'process-explorer';
          }

          return `window`;
        } else if (matches[1] === 'utility') {
          if (UTILITY_NETWORK_HINT.test(cmd)) {
            return 'utility-network-service';
          }
        }
        return matches[1];
      }

      // find all xxxx.js
      const JS = /[A-Za-z-]+\.js/g;
      let result = '';
      do {
        matches = JS.exec(cmd);
        if (matches) {
          result += matches[0] + ' ';
        }
      } while (matches);

      if (result) {
        if (!cmd.includes('node ') && !cmd.includes('node.exe')) {
          return `electron_node ${result}`;
        }
      }
      return cmd;
    }

    function addToTree(pid: number, ppid: number, cmd: string, load: number, mem: number) {
      const parent = map.get(ppid);
      if (pid === rootPid || parent) {
        const item: ProcessItem = {
          name: findName(cmd),
          cmd,
          pid,
          ppid,
          load,
          mem,
        };
        map.set(pid, item);

        if (pid === rootPid) {
          rootItem = item;
        }

        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(item);
          if (parent.children.length > 1) {
            parent.children = parent.children.sort((a, b) => a.pid - b.pid);
          }
        }
      }
    }

    if (process.platform === 'win32') {
      const cleanUNCPrefix = (value: string): string => {
        if (value.indexOf('\\\\?\\') === 0) {
          return value.slice(4);
        }
        if (value.indexOf('\\??\\') === 0) {
          return value.slice(4);
        }
        if (value.indexOf('"\\\\?\\') === 0) {
          return '"' + value.slice(5);
        }
        if (value.indexOf('"\\??\\') === 0) {
          return '"' + value.slice(5);
        }

        return value;
      };

      return import('windows-process-tree').then(windowsProcessTree => {
        windowsProcessTree.getProcessList(
          rootPid,
          processList => {
            windowsProcessTree.getProcessCpuUsage(processList || [], completeProcessList => {
              const processItems: Map<number, ProcessItem> = new Map();
              completeProcessList.forEach(process => {
                const commandLine = cleanUNCPrefix(process.commandLine || '');
                processItems.set(process.pid, {
                  name: findName(commandLine),
                  cmd: commandLine,
                  pid: process.pid,
                  ppid: process.ppid,
                  load: process.cpu || 0,
                  mem: process.memory || 0,
                });
              });

              rootItem = processItems.get(rootPid);
              if (rootItem) {
                processItems.forEach(item => {
                  const parent = processItems.get(item.ppid);
                  if (parent) {
                    if (!parent.children) {
                      parent.children = [];
                    }
                    parent.children.push(item);
                  }
                });

                processItems.forEach(item => {
                  if (item.children) {
                    item.children = item.children.sort((a, b) => a.pid - b.pid);
                  }
                });
                resolve(rootItem);
              } else {
                reject(new Error(`Root process ${rootPid} not found`));
              }
            });
          },
          windowsProcessTree.ProcessDataFlag.CommandLine | windowsProcessTree.ProcessDataFlag.Memory
        );
      });
    } else {
      // OS X & Linux

      return exec('which ps', {}, (err, stdout, stderr) => {
        if (err || stderr) {
          if (process.platform !== 'linux') {
            reject(err || new Error(stderr.toString()));
          }
        } else {
          const ps = stdout.toString().trim();
          const args = '-ax -o pid=,ppid=,pcpu=,pmem=,command=';

          // Set numeric locale to ensure '.' is used as the decimal separator
          exec(`${ps} ${args}`, { maxBuffer: 1000 * 1024, env: { LC_NUMERIC: 'en_US.UTF-8' } }, (err, stdout, stderr) => {
            // Silently ignoring the screen size is bogus error. See https://github.com/microsoft/vscode/issues/98590
            if (err || (stderr && !stderr.includes('screen size is bogus'))) {
              reject(err || new Error(stderr.toString()));
            } else {
              parsePsOutput(stdout, addToTree);
              return rootItem ? resolve(rootItem) : reject(new Error(`Root process ${rootPid} not found`));
            }
          });
        }
      });
    }
  });
}

function parsePsOutput(stdout: string, addToTree: (pid: number, ppid: number, cmd: string, load: number, mem: number) => void): void {
  const PID_CMD = /^\s*(\d+)\s+(\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(.+)$/;
  const lines = stdout.toString().split('\n');
  for (const line of lines) {
    const matches = PID_CMD.exec(line.trim());
    if (matches && matches.length === 6) {
      addToTree(
        Number.parseInt(matches[1]),
        Number.parseInt(matches[2]),
        matches[5],
        Number.parseFloat(matches[3]),
        Number.parseFloat(matches[4])
      );
    }
  }
}

/** 按进程实例或程序进程名称杀死进程 */
export async function tryKillProcess(params: { proc?: ChildProcess; name?: string }) {
  const logger = getLogger();

  try {
    if (params.proc) {
      logger.log(`try kill by pid: ${params.proc.pid}`);
      params.proc.removeAllListeners();
      if (params.proc.pid) process.kill(params.proc.pid);
      if (!params.proc.killed) params.proc.kill('SIGKILL');
    }

    if (params.name) {
      const name = params.name;
      logger.log(`kill by program name: ${color.green(name)}`);

      // validate name: allow alnum, ., -, _, optional .exe suffix
      if (!/^[A-Za-z0-9_.-]+(?:\.exe)?$/.test(name)) {
        logger.warn(`[tryKillProcess] rejected unsafe name: ${name}`);
        return;
      }

      if (process.platform === 'win32') {
        const taskList = execSync('tasklist').stdout;
        if (taskList.includes(name)) await execFilePromisfy('taskkill', ['/F', '/T', '/IM', name], true);
      } else {
        const simpleName = name.replace(/\.exe$/i, '');
        // prefer pgrep -f if available
        const pgrep = await execFilePromisfy('pgrep', ['-f', simpleName], true);
        let pidList: string[] = [];
        if (!pgrep.error && pgrep.stdout) {
          pidList = pgrep.stdout
            .split('\n')
            .map(d => String(d).trim())
            .filter(Boolean);
        } else {
          // fallback: get ps -ef and filter safely in JS
          const psOut = execPromisfy('ps -ef', true);
          const stdout = (await psOut).stdout;
          pidList = stdout
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean)
            .filter(l => l.includes(simpleName))
            .map(l => {
              const m = /^\s*(\d+)\s+/.exec(l);
              return m ? m[1] : '';
            })
            .filter(Boolean);
        }

        if (pidList.length > 0) {
          const killTaskList = pidList.map(pid => execFilePromisfy('kill', ['-9', pid], true));
          await Promise.all(killTaskList);
        }
      }
    }
  } catch (error) {
    logger.error('[tryKillProcess][error]\n', error);
  }
}

// if (module === require.main) listProcesses(process.ppid).then(d => console.log(JSON.stringify(d, null, 2)));
