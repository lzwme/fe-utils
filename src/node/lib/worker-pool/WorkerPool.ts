import { EventEmitter } from 'node:events';
import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';
import { existsSync } from 'node:fs';

interface WorkerMsgBody<T> {
  type: string;
  data: T;
  [key: string]: unknown;
}
type Callback<R, T> = (err: Error | null, result: WorkerMsgBody<R> | null, task: T) => void;

const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');

/**
 * create worker pools
 * @example
 * ```ts
 * import { WorkerPool } from '@lzwme/fe-utils';
 * import { isMainThread, parentPort } from 'node:worker_threads';
 * import { statSync } from 'node:fs';
 * import { resolve } from 'node:path';
 *
 * if (isMainThread) {
 *   const wp = new WorkerPool<string, number>(path.resolve('wp-test.js'), cpus().length);
 *   wp.runTask('/a.txt', (size) => console.log(size)); // run more tasks...
 * } else {
 *   parentPort.on('message', (filepath: string) => {
 *     parentPort.postMessage(statSync(filepath).size);
 *   });
 * }
 * ```
 */
export class WorkerPool<T = unknown, R = unknown> extends EventEmitter {
  private workers: Worker[] = [];
  private freeWorkers: Worker[] = [];
  private workerTaskInfo = new Map<Worker, { callback: Callback<R, T>; task: T }>();
  private tasks: {
    task: T;
    callback: Callback<R, T>;
  }[] = [];
  constructor(
    private processorFile: string,
    public numThreads = 0
  ) {
    super();

    if (!numThreads || numThreads < 1) numThreads = cpus().length;
    for (let i = 0; i < numThreads; i++) this.addNewWorker(processorFile);

    // 每当发出 kWorkerFreedEvent 时，调度队列中待处理的下一个任务
    this.on(kWorkerFreedEvent, () => {
      if (this.tasks.length > 0) {
        const item = this.tasks.shift();
        if (item) this.runTask(item.task, item.callback);
      }
    });
  }
  private addNewWorker(processorFile = this.processorFile) {
    if (!existsSync(processorFile)) {
      throw new Error(`Not Found: ${processorFile}`);
    }

    const worker = new Worker(processorFile);

    worker.on('message', (result: WorkerMsgBody<R>) => {
      // 如果成功：调用传递给`runTask`的回调，删除与Worker关联的`TaskInfo`，并再次将其标记为空闲。
      const r = this.workerTaskInfo.get(worker);
      if (r) {
        r.callback(null, result, r.task);
        if (result.type !== 'progress') {
          this.workerTaskInfo.delete(worker);
          this.freeWorkers.push(worker);
          this.emit(kWorkerFreedEvent);
        }
      }
    });

    worker.on('error', err => {
      // 如果发生未捕获的异常：调用传递给 `runTask` 并出现错误的回调。
      const r = this.workerTaskInfo.get(worker);
      if (r) {
        r.callback(err, null, r.task);
        this.workerTaskInfo.delete(worker);
      } else this.emit('error', err);

      // 从列表中删除 Worker 并启动一个新的 Worker 来替换当前的 Worker
      this.workers.splice(this.workers.indexOf(worker), 1);
      this.addNewWorker();
    });

    this.workers.push(worker);
    this.freeWorkers.push(worker);
    this.emit(kWorkerFreedEvent);
  }
  public runTask(task: T, callback: Callback<R, T>) {
    if (this.freeWorkers.length === 0) {
      this.tasks.push({ task, callback });
      return;
    }

    const worker = this.freeWorkers.pop();
    if (worker) {
      this.workerTaskInfo.set(worker, { callback, task });
      worker.postMessage(task);
    }
  }
  public status() {
    return {
      file: this.processorFile,
      numThreads: this.numThreads,
      tasksSize: this.tasks.length,
      freeize: this.freeWorkers.length,
    };
  }
  public close() {
    for (const worker of this.workers) worker.terminate();
  }
}
