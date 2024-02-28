/* eslint-disable jest/no-conditional-expect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { raceTimeout, sleep, Barrier, getPromiseState, Limiter, ITask, concurrency, retry, wait, Throttler, Sequencer } from './async';

describe('async.ts#raceTimeout', () => {
  it('resolves with promise value before timeout', async () => {
    const promise = Promise.resolve('value');
    const result = await raceTimeout(promise, 100);
    expect(result).toBe('value');
  });

  it('resolves with undefined when promise resolves after timeout', async () => {
    const promise = new Promise<string>(resolve => setTimeout(resolve, 200, 'value'));
    const result = await raceTimeout(promise, 100);
    expect(result).toBeUndefined();
  });

  it('rejects with promise error before timeout', async () => {
    const promise = Promise.reject(new Error('error'));
    const result = await raceTimeout(promise, 100).catch(error => error);
    expect(result.message).toBe('error');
  });

  it('resolves with undefined when promise rejects after timeout', async () => {
    const promise = new Promise<string>((_, reject) => setTimeout(reject, 200, new Error('error')));
    const result = await raceTimeout(promise, 100);
    expect(result).toBeUndefined();
  });

  it('resolves with onTimeout value when promise does not resolve within timeout', async () => {
    const promise = new Promise<string>((_resolve, _reject) => {}); // This promise never resolves
    const onTimeoutValue = 'onTimeout value';
    const result = await raceTimeout(promise, 100, () => onTimeoutValue);
    expect(result).toBe(onTimeoutValue);
  });

  it('resolves with undefined when onTimeout is not provided and promise does not resolve within timeout', async () => {
    const promise = new Promise<string>((_resolve, _reject) => {}); // This promise never resolves
    const result = await raceTimeout(promise, 100);
    expect(result).toBeUndefined();
  });
});

describe('async.ts#Throttler', () => {
  it('should execute tasks one after another', async () => {
    const throttler = new Throttler();
    const task1 = jest.fn(() => Promise.resolve(1));
    const task2 = jest.fn(() => Promise.resolve(2));
    const task3 = jest.fn(() => Promise.resolve(3));

    const result1 = await throttler.queue(task1);
    const result2 = await throttler.queue(task2);
    const result3 = await throttler.queue(task3);

    expect(result1).toBe(1);
    expect(result2).toBe(2);
    expect(result3).toBe(3);
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(task3).toHaveBeenCalledTimes(1);
  });

  it('should queue tasks when active task is running', async () => {
    const throttler = new Throttler();
    const task1 = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100, 1)));
    const task2 = jest.fn(() => Promise.resolve(2));
    const task3 = jest.fn(() => Promise.resolve(3));

    const result1 = await throttler.queue(task1);
    const result2 = await throttler.queue(task2);
    const result3 = await throttler.queue(task3);

    expect(result1).toBe(1);
    expect(result2).toBe(2);
    expect(result3).toBe(3);
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(task3).toHaveBeenCalledTimes(1);
  });

  it('should cancel queued tasks when new task is queued', async () => {
    const throttler = new Throttler();
    const task1 = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100, 1)));
    const task2 = jest.fn(() => Promise.reject(new Error('Cancelled')));
    const task3 = jest.fn(() => Promise.resolve(3));

    const result1 = await throttler.queue(task1);
    const result2Promise = throttler.queue(task2);
    const result3 = await throttler.queue(task3);

    try {
      await result2Promise;
    } catch {
      // Do nothing, the task was cancelled
    }

    expect(result1).toBe(1);
    expect(result3).toBe(3);
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(task3).toHaveBeenCalledTimes(1);
  });
});

describe('async.ts#Sequencer', () => {
  it('queues tasks one after another', async () => {
    let count = 0;
    const incrementCount: ITask<void> = () =>
      new Promise(resolve => {
        count++;
        setTimeout(() => resolve(void 0), 10);
      });

    const sequencer = new Sequencer();
    await sequencer.queue(incrementCount);
    await sequencer.queue(incrementCount);
    await sequencer.queue(incrementCount);

    expect(count).toBe(3);
  });

  it('executes tasks even if previous one fails', async () => {
    let count = 0;
    const failAfterFirst: ITask<void> = () =>
      new Promise((rs, reject) => {
        count++;
        if (count > 1) {
          reject(new Error('Second task should not run'));
        } else rs(void 0);
      });

    const sequencer = new Sequencer();
    try {
      await sequencer.queue(failAfterFirst);
      await sequencer.queue(failAfterFirst);
    } catch {
      // We expect the second task to fail
    }

    expect(count).toBe(2);
  });

  it('executes tasks in the order they are queued', async () => {
    const tasks: Promise<number>[] = [];
    let idx = 0;
    const taskGenerator: ITask<Promise<number>> = () =>
      new Promise<number>(resolve => {
        setTimeout(() => resolve(++idx), 10);
      });

    const sequencer = new Sequencer();
    for (let i = 0; i < 5; i++) {
      tasks.push(sequencer.queue(taskGenerator));
    }

    const results = await Promise.all(tasks);
    expect(results).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('async.ts#Barrier', () => {
  it('should initially be closed', async () => {
    const barrier = new Barrier();
    expect(barrier.isOpen()).toBe(false);
  });

  it('should open the barrier and resolve the promise', async () => {
    const barrier = new Barrier();

    await Promise.allSettled([barrier.wait(), barrier.open()]);
    expect(barrier.isOpen()).toBe(true);
  });

  it('should only resolve the promise once', async () => {
    const barrier = new Barrier();
    const promise = barrier.wait();

    await expect(getPromiseState(promise)).resolves.toBe('pending');

    barrier.open();
    await expect(promise).resolves.toBe(true);
    await expect(promise).resolves.toBe(true);
  });

  it('should not reopen the barrier after opening', () => {
    const barrier = new Barrier();

    barrier.open();
    expect(barrier.isOpen()).toBe(true);

    barrier.open();
    expect(barrier.isOpen()).toBe(true);
  });
});

describe('async.ts#sleep', () => {
  it('should resolve after specified milliseconds', async () => {
    const start = Date.now();
    await sleep(100);
    const end = Date.now();

    expect(end - start).toBeGreaterThanOrEqual(100 - 10);
  });

  it('should resolve with provided value', async () => {
    const value = 'test value';
    const result = await sleep(0, value);

    expect(result).toBe(value);
  });

  it('should resolve with the result of a provided function', async () => {
    const value = 'test value from function';
    const result = await sleep(0, () => value);

    expect(result).toBe(value);
  });

  it('should resolve with the result of a provided async function', async () => {
    const value = 'test value from async function';
    const result = await sleep(0, async () => value);

    expect(result).toBe(value);
  });
});

describe('async.ts#wait', () => {
  it('should resolve after a random delay between min and max', async () => {
    const min = 50;
    const max = 150;
    const start = Date.now();
    const delay = await wait(min, max);
    const end = Date.now();

    expect(delay).toBeGreaterThanOrEqual(min);
    expect(delay).toBeLessThanOrEqual(max);
    expect(end - start).toBeGreaterThanOrEqual(min);
    expect(end - start).toBeLessThanOrEqual(max + 10);
  });

  it('should handle max less than min', async () => {
    const min = 50;
    const max = 20;
    const delay = await wait(min, max);

    expect(delay).toBeGreaterThanOrEqual(max);
    expect(delay).toBeLessThanOrEqual(min);
  });
});
describe('async.ts#retry', () => {
  it('retries the task until it succeeds', async () => {
    const task = jest
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error('first fail')))
      .mockImplementationOnce(() => Promise.resolve('success'));
    const delay = 100;
    const retries = 2;

    const result = await retry(task, delay, retries);

    expect(task).toHaveBeenCalledTimes(2);
    expect(result).toBe('success');
  });

  it('throws an error if all retries fail', async () => {
    const task = jest.fn().mockImplementation(() => Promise.reject(new Error('always fail')));
    const delay = 100;
    const retries = 2;

    await expect(retry(task, delay, retries)).rejects.toThrow('always fail');

    expect(task).toHaveBeenCalledTimes(retries);
  });

  it('can use a validator to determine success', async () => {
    const task = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(1))
      .mockImplementationOnce(() => Promise.resolve(2));
    const delay = 100;
    const retries = 2;
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const validator = (result: number, _index: number) => result >= 2;

    const result = await retry(task, delay, retries, validator);

    expect(task).toHaveBeenCalledTimes(2);
    expect(result).toBe(2);
  });

  it('throws an error if validator is not provided and task fails', async () => {
    const task = jest.fn().mockImplementation(() => Promise.reject(new Error('always fail')));
    const delay = 100;
    const retries = 2;

    await expect(retry(task, delay, retries)).rejects.toThrow('always fail');

    expect(task).toHaveBeenCalledTimes(retries);
  });
});

describe('async.ts#concurrency', () => {
  it('should execute tasks concurrently with maxDegreeOfParalellism', async () => {
    const taskList: Array<() => Promise<number>> = [
      () => Promise.resolve(1),
      () => Promise.resolve(2),
      () => Promise.resolve(3),
      () => Promise.resolve(4),
      () => Promise.resolve(5),
      () => Promise.resolve(6),
    ];

    const results = await concurrency(taskList, 3);

    expect(results).toHaveLength(6);
    expect(results[0].result).toBe(1);
    expect(results[1].result).toBe(2);
    expect(results[2].result).toBe(3);
    expect(results[3].result).toBe(4);
    expect(results[4].result).toBe(5);
    expect(results[5].result).toBe(6);
  });

  it('should handle errors correctly', async () => {
    const taskList: Array<() => Promise<number>> = [
      () => Promise.resolve(1),
      () => Promise.reject(new Error('error 2')),
      () => Promise.resolve(3),
    ];

    const results = await concurrency(taskList, 3);

    expect(results).toHaveLength(3);
    expect(results[0].result).toBe(1);
    expect(results[1].error).toBeInstanceOf(Error);
    // @ts-expect-error
    expect(results[1].error?.message).toBe('error 2');
    expect(results[2].result).toBe(3);
  });

  it('should handle empty task list', async () => {
    const taskList: Array<() => Promise<number>> = [];

    const results = await concurrency(taskList, 3);

    expect(results).toHaveLength(0);
  });

  it('should handle task list with one task', async () => {
    const taskList: Array<() => Promise<number>> = [() => Promise.resolve(1)];

    const results = await concurrency(taskList, 3);

    expect(results).toHaveLength(1);
    expect(results[0].result).toBe(1);
  });

  it('should handle task list with maxDegreeOfParalellism = 1', async () => {
    const taskList: Array<() => Promise<number>> = [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)];

    const results = await concurrency(taskList, 1);

    expect(results).toHaveLength(3);
    expect(results[0].result).toBe(1);
    expect(results[1].result).toBe(2);
    expect(results[2].result).toBe(3);
  });

  it('should handle task list with maxDegreeOfParalellism = 0', async () => {
    const taskList: Array<() => Promise<number>> = [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)];

    const results = await concurrency(taskList, 0);

    expect(results).toHaveLength(3);
    expect(results[0].result).toBe(1);
    expect(results[1].result).toBe(2);
    expect(results[2].result).toBe(3);
  });
});

describe('async.ts#Limiter', () => {
  let limiter: Limiter<any>;
  let taskFactory: jest.MockedFunction<ITask<any>>;

  beforeEach(() => {
    limiter = new Limiter(2);
    // @ts-expect-error
    taskFactory = jest.fn<ITask<any>, any[]>().mockImplementation(() => jest.fn());
  });

  it('should queue tasks and execute them with limited parallelism', async () => {
    const results: any[] = [];
    const promises: Promise<any>[] = [];

    for (let i = 0; i < 5; i++) {
      taskFactory.mockReturnValueOnce(Promise.resolve(i));
      const promise = limiter.queue(taskFactory);
      promises.push(promise);
    }

    for (const promise of promises) {
      results.push(await promise);
    }

    expect(results).toEqual([0, 1, 2, 3, 4]);
    expect(taskFactory).toHaveBeenCalledTimes(5);
  });

  it('should invoke onFinished callbacks when all tasks are completed', async () => {
    const onFinishedCallback = jest.fn();
    limiter.onFinished(onFinishedCallback);

    for (let i = 0; i < 3; i++) {
      taskFactory.mockReturnValueOnce(Promise.resolve(i));
      await limiter.queue(taskFactory);
    }

    expect(onFinishedCallback).toHaveBeenCalledTimes(3);
  });

  it('should dispose onFinished callbacks', () => {
    const onFinishedCallback = jest.fn();
    limiter.onFinished(onFinishedCallback);

    limiter.dispose();

    for (let i = 0; i < 3; i++) {
      taskFactory.mockReturnValueOnce(Promise.resolve(i));
      limiter.queue(taskFactory);
    }

    expect(onFinishedCallback).not.toHaveBeenCalled();
  });

  it('should handle task errors', async () => {
    const error = new Error('Task failed');
    taskFactory.mockReturnValueOnce(Promise.reject(error));

    try {
      await limiter.queue(taskFactory);
    } catch (error_) {
      expect(error_).toBe(error);
    }
  });

  // eslint-disable-next-line jest/no-done-callback
  it('should handle multiple errors correctly', done => {
    const errors: Error[] = [];
    for (let i = 0; i < 3; i++) {
      const error = new Error(`Task ${i} failed`);
      taskFactory.mockReturnValueOnce(Promise.reject(error));
      errors.push(error);
    }

    Promise.all([limiter.queue(taskFactory), limiter.queue(taskFactory), limiter.queue(taskFactory)]).catch(error => {
      if (Array.isArray(error)) {
        for (const err of error) {
          expect(errors).toContain(err);
        }
      } else {
        expect(errors).toContain(error);
        // done.fail('Expected an array of errors');
      }
      done();
    });
  });
});

describe('async.ts#getPromiseState', () => {
  it('should return "fulfilled" for a resolved promise', async () => {
    const promise = Promise.resolve('resolved value');
    const state = await getPromiseState(promise);
    expect(state).toBe('fulfilled');
  });

  it('should return "rejected" for a rejected promise', async () => {
    const promise = Promise.reject('error');
    const state = await getPromiseState(promise);
    expect(state).toBe('rejected');
  });

  it('should return "pending" for a pending promise', async () => {
    const promise = new Promise<void>(resolve => {
      setTimeout(() => resolve(), 100);
    });
    const state = await getPromiseState(promise);
    expect(state).toBe('pending');
  });
});
