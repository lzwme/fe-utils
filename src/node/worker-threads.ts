/*
 * @Author: lzw
 * @Date: 2021-08-25 10:12:21
 * @LastEditors: lzw
 * @LastEditTime: 2022-08-31 18:05:08
 * @Description: worker_threads 实现在 worker 线程中执行
 *
 * - worker_threads 比 child_process 和 cluster 更为轻量级的并行性，而且 worker_threads 可有效地共享内存
 * - eslint-plugins 也使用了 worker_threads，会有一些异常现象
 */

import { Worker, isMainThread, workerData } from 'node:worker_threads'; // parentPort
import { getLogger } from './get-logger';
interface CreateThreadOptions {
  debug?: boolean;
  type: string;
  workerFile: string;
}

interface WorkerMessageBody<T = unknown> {
  type: string;
  data: T;
  end: boolean;
}

export function createWorkerThreads<T>(options: CreateThreadOptions, onMessage?: (d: WorkerMessageBody<T>) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!isMainThread) return reject(-2);

    const worker = new Worker(__filename, {
      workerData: options,
      // stderr: true,
      // stdout: true,
    });

    worker.on('message', (info: WorkerMessageBody<T>) => {
      getLogger().debug(`[${options.type}] received from worker thread:`, info);
      if (onMessage) onMessage(info);

      if (info.end) {
        resolve(info.data);
        process.nextTick(() => worker.terminate());
      }
    });

    worker.on('exit', code => {
      getLogger().debug(`[${options.type}] exit worker with code:`, code);
      if (code !== 0) reject(code);
    });
  });
}

if (!isMainThread) {
  const config: CreateThreadOptions = workerData;
  if (config.debug) console.log('workerData:', config);
  // const done = (data: unknown) => {
  //   if (config.debug) console.log('emit msg from worker thread:', { type: config.type, data, end: true });
  //   setTimeout(() => {
  //     parentPort.postMessage({ type: config.type, data, end: true } as WorkerMessageBody);
  //   }, 300);
  // };
  // const resetConfig = { checkOnInit: false, exitOnError: false, mode: 'current' };

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require(config.workerFile)(config);

  // heartbeat and more...
}
