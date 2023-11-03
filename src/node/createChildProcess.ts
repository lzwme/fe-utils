/*
 * @Author: lzw
 * @Date: 2021-08-25 10:12:21
 * @LastEditors: renxia
 * @LastEditTime: 2023-11-03 14:23:57
 * @Description: 在 fork 子进程中执行 Check 任务
 */

import { fork } from 'node:child_process';

export interface CreateThreadOptions<T = Record<string, unknown>> {
  workerFile: string;
  type: string;
  debug?: boolean;
  payload?: T;
}

export interface WorkerMessageBody<T = unknown> {
  type: string;
  data?: T;
  end?: boolean;
}

/** fork 方式创建子进程 */
export function createChildProcess<T>(options: CreateThreadOptions, onMessage?: (d: WorkerMessageBody<T>) => void) {
  const controller = new AbortController();
  const { signal } = controller;
  const worker = fork(options.workerFile, { silent: false, signal });
  let heartbeat = 0;
  let heartbeatTimer: NodeJS.Timeout;
  const exit = () => {
    controller.abort();
    if (!worker.killed) worker.kill();
    clearInterval(heartbeatTimer);
  };

  worker.send(options);

  const wait = new Promise<T>((resolve, reject) => {
    worker.on('message', (info: WorkerMessageBody<T>) => {
      if (typeof info === 'string') info = JSON.parse(info);
      if (options.debug) console.log('received from child proc:', info);

      if (info.type === 'pong') {
        if (heartbeat === 0) {
          heartbeatTimer = setInterval(() => worker.send({ type: 'ping' }), 5000);
        }
        heartbeat++;
        return;
      }

      if (onMessage) onMessage(info);

      if (info.end) {
        exit();
        resolve(info.data as never as T);
      }
    });

    worker.on('error', error => console.log(`[worker][${options.type}]err:`, error));
    worker.on('exit', code => {
      if (options.debug) console.log(`[worker][${options.type}]exit worker`, code);
      exit();
      if (code !== 0) reject(code);
    });

    if (options.debug) {
      worker.once('close', code => console.log(`[worker][${options.type}]Child exited with code ${code}`));
    }
  });

  return { worker, wait, controller };
}

let loaded = false;
const exit = (data: unknown) => {
  process.send!({ data, end: true } as WorkerMessageBody);
  process.exit(0);
};

/** worker init: use in child process */
export function childProcessInit(onmessage: (msg: CreateThreadOptions) => void) {
  if (loaded) return { exit };
  loaded = true;

  process.on('message', (config: CreateThreadOptions) => {
    console.log('[received]msg', config);

    // heartbeat
    if (config.type === 'ping') {
      process.send!({ type: 'pong' });
      return;
    }

    onmessage(config);
  });

  // 立即发送一次心跳
  process.send!({ type: 'pong' });

  return { exit };
}
