/*
 * @Author: lzw
 * @Date: 2022-01-12 15:10:41
 * @LastEditors: lzw
 * @LastEditTime: 2022-05-25 20:49:49
 * @Description:
 * @see src\vs\base\common\async.ts
 */

export interface ITask<T> {
  (): T;
}

export interface IDisposable {
  dispose(): void;
}

export function raceTimeout<T>(promise: Promise<T>, timeout: number, onTimeout?: () => T | undefined): Promise<T | undefined> {
  let timer: NodeJS.Timer;

  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<T | undefined>(resolve => {
      timer = setTimeout(() => resolve(onTimeout?.()), timeout);
    }),
  ]);
}

/**
 * * 以节流方式执行 async 回调任务
 * A helper to prevent accumulation of sequential async tasks.
 *
 * Imagine a mail man with the sole task of delivering letters. As soon as
 * a letter submitted for delivery, he drives to the destination, delivers it
 * and returns to his base. Imagine that during the trip, N more letters were submitted.
 * When the mail man returns, he picks those N letters and delivers them all in a
 * single trip. Even though N+1 submissions occurred, only 2 deliveries were made.
 *
 * The throttler implements this via the queue() method, by providing it a task
 * factory. Following the example:
 *
 * 		const throttler = new Throttler();
 * 		const letters = [];
 *
 * 		function deliver() {
 * 			const lettersToDeliver = letters;
 * 			letters = [];
 * 			return makeTheTrip(lettersToDeliver);
 * 		}
 *
 * 		function onLetterReceived(l) {
 * 			letters.push(l);
 * 			throttler.queue(deliver);
 * 		}
 */
export class Throttler {
  private activePromise: Promise<unknown> | null;
  private queuedPromise: Promise<unknown> | null;
  private queuedPromiseFactory: ITask<Promise<unknown>> | null;

  constructor() {
    this.activePromise = null;
    this.queuedPromise = null;
    this.queuedPromiseFactory = null;
  }

  queue<T>(promiseFactory: ITask<Promise<T>>): Promise<T> {
    if (this.activePromise) {
      this.queuedPromiseFactory = promiseFactory;

      if (!this.queuedPromise) {
        const onComplete = () => {
          this.queuedPromise = null;

          const result = this.queue(this.queuedPromiseFactory);
          this.queuedPromiseFactory = null;

          return result;
        };

        this.queuedPromise = new Promise(resolve => {
          this.activePromise.then(onComplete, onComplete).then(resolve);
        });
      }

      return new Promise((resolve, reject) => {
        this.queuedPromise.then(resolve, reject);
      });
    }

    this.activePromise = promiseFactory();

    return (this.activePromise as Promise<T>).finally(() => (this.activePromise = null));

    // return new Promise((resolve, reject) => {
    //     this.activePromise!.then(
    //         (result: T) => {
    //             this.activePromise = null;
    //             resolve(result);
    //         },
    //         (err: unknown) => {
    //             this.activePromise = null;
    //             reject(err);
    //         }
    //     );
    // });
  }
}

/**
 * 顺序的执行 async 回调任务
 *
 * @example
 * ```ts
 * const sleep = (time, val) =>  new Promise(rs => setTimeout(() => rs(val), time));
 * const seq = new Sequencer();
 * let i = 0;
 * for(let b =0; b < 100; b++) seq.queue(() => sleep(100, ++i).then(d => console.log(d)));
 * ```
 */
export class Sequencer {
  private current: Promise<unknown> = Promise.resolve(null);

  queue<T>(promiseTask: ITask<Promise<T>>): Promise<T> {
    return (this.current = this.current.then(
      () => promiseTask(),
      () => promiseTask()
    ));
  }
}

export class SequencerByKey<TKey> {
  private promiseMap = new Map<TKey, Promise<unknown>>();

  queue<T>(key: TKey, promiseTask: ITask<Promise<T>>): Promise<T> {
    const runningPromise = this.promiseMap.get(key) ?? Promise.resolve();
    const newPromise = runningPromise
      .catch(() => {})
      .then(promiseTask)
      .finally(() => {
        if (this.promiseMap.get(key) === newPromise) {
          this.promiseMap.delete(key);
        }
      });
    this.promiseMap.set(key, newPromise);
    return newPromise;
  }
}

interface IScheduledLater extends IDisposable {
  isTriggered(): boolean;
}

const timeoutDeferred = (timeout: number, fn: () => void): IScheduledLater => {
  let scheduled = true;
  const handle = setTimeout(() => {
    scheduled = false;
    fn();
  }, timeout);
  return {
    isTriggered: () => scheduled,
    dispose: () => {
      clearTimeout(handle);
      scheduled = false;
    },
  };
};

const microtaskDeferred = (fn: () => void): IScheduledLater => {
  let scheduled = true;
  queueMicrotask(() => {
    if (scheduled) {
      scheduled = false;
      fn();
    }
  });

  return {
    isTriggered: () => scheduled,
    dispose: () => {
      scheduled = false;
    },
  };
};

/** Can be passed into the Delayed to defer using a microtask */
export const MicrotaskDelay = Symbol('MicrotaskDelay');

/**
 * Returns an error that signals cancellation.
 */
export function canceled(): Error {
  const error = new Error('Canceled');
  error.name = error.message;
  return error;
}

/**
 * 防抖式的执行任务
 *
 * A helper to delay (debounce) execution of a task that is being requested often.
 *
 * Following the throttler, now imagine the mail man wants to optimize the number of
 * trips proactively. The trip itself can be long, so he decides not to make the trip
 * as soon as a letter is submitted. Instead he waits a while, in case more
 * letters are submitted. After said waiting period, if no letters were submitted, he
 * decides to make the trip. Imagine that N more letters were submitted after the first
 * one, all within a short period of time between each other. Even though N+1
 * submissions occurred, only 1 delivery was made.
 *
 * The delayer offers this behavior via the trigger() method, into which both the task
 * to be executed and the waiting period (delay) must be passed in as arguments. Following
 * the example:
 *
 * 		const delayer = new Delayer(WAITING_PERIOD);
 * 		const letters = [];
 *
 * 		function letterReceived(l) {
 * 			letters.push(l);
 * 			delayer.trigger(() => { return makeTheTrip(); });
 * 		}
 */
export class Delayer<T> implements IDisposable {
  private deferred: IScheduledLater | null;
  private completionPromise: Promise<unknown> | null;
  private doResolve: ((value?: unknown | Promise<unknown>) => void) | null;
  private doReject: ((err: unknown) => void) | null;
  private task: ITask<T | Promise<T>> | null;

  constructor(public defaultDelay: number | typeof MicrotaskDelay) {
    this.deferred = null;
    this.completionPromise = null;
    this.doResolve = null;
    this.doReject = null;
    this.task = null;
  }

  trigger(task: ITask<T | Promise<T>>, delay = this.defaultDelay): Promise<T> {
    this.task = task;
    this.cancelTimeout();

    if (!this.completionPromise) {
      this.completionPromise = new Promise((resolve, reject) => {
        this.doResolve = resolve;
        this.doReject = reject;
      }).then(() => {
        this.completionPromise = null;
        this.doResolve = null;
        if (this.task) {
          const task = this.task;
          this.task = null;
          return task();
        }
        return void 0;
      });
    }

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const fn = () => {
      this.deferred = null;
      this.doResolve?.(null);
    };

    this.deferred = delay === MicrotaskDelay ? microtaskDeferred(fn) : timeoutDeferred(delay, fn);

    return this.completionPromise as Promise<T>;
  }

  isTriggered(): boolean {
    return !!this.deferred?.isTriggered();
  }

  cancel(): void {
    this.cancelTimeout();

    if (this.completionPromise) {
      if (this.doReject) {
        this.doReject(canceled());
      }
      this.completionPromise = null;
    }
  }

  private cancelTimeout(): void {
    this.deferred?.dispose();
    this.deferred = null;
  }

  dispose(): void {
    this.cancel();
  }
}

/**
 * A helper to delay execution of a task that is being requested often, while
 * preventing accumulation of consecutive executions, while the task runs.
 *
 * The mail man is clever and waits for a certain amount of time, before going
 * out to deliver letters. While the mail man is going out, more letters arrive
 * and can only be delivered once he is back. Once he is back the mail man will
 * do one more trip to deliver the letters that have accumulated while he was out.
 */
export class ThrottledDelayer<T> {
  private delayer: Delayer<Promise<T>>;
  private throttler: Throttler;

  constructor(defaultDelay: number) {
    this.delayer = new Delayer(defaultDelay);
    this.throttler = new Throttler();
  }

  trigger(promiseFactory: ITask<Promise<T>>, delay?: number): Promise<T> {
    return this.delayer.trigger(() => this.throttler.queue(promiseFactory), delay) as unknown as Promise<T>;
  }

  isTriggered(): boolean {
    return this.delayer.isTriggered();
  }

  cancel(): void {
    this.delayer.cancel();
  }

  dispose(): void {
    this.delayer.dispose();
  }
}

/**
 * 创建一个初始状态为关闭、最后为永久打开的一个屏障
 * A barrier that is initially closed and then becomes opened permanently.
 */
export class Barrier {
  private _isOpen = false;
  private _promise: Promise<boolean>;
  private _completePromise!: (v: boolean) => void;

  constructor() {
    this._promise = new Promise<boolean>((c, _e) => {
      this._completePromise = c;
    });
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  open(): void {
    this._isOpen = true;
    this._completePromise(true);
  }

  wait(): Promise<boolean> {
    return this._promise;
  }
}

/**
 * A barrier that is initially closed and then becomes opened permanently after a certain period of
 * time or when open is called explicitly
 */
export class AutoOpenBarrier extends Barrier {
  private readonly _timeout: NodeJS.Timer;

  constructor(autoOpenTimeMs: number) {
    super();
    this._timeout = setTimeout(() => this.open(), autoOpenTimeMs);
  }

  override open(): void {
    clearTimeout(this._timeout);
    super.open();
  }
}

export const sleep = <T>(milliseconds = 0, value?: T | (() => T | Promise<T>)): Promise<T> =>
  // @ts-ignore
  new Promise(resolve => setTimeout(() => resolve(), milliseconds)).then(() => (typeof value === 'function' ? value() : value));

export async function retry<T>(task: ITask<Promise<T>>, delay: number, retries: number, validator?: (r: T) => boolean): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      const result = await task();
      if (!validator || validator(result)) return result;
    } catch (error) {
      lastError = error;

      await sleep(delay);
    }
  }

  throw lastError;
}
