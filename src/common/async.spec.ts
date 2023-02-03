import { sleep } from './async';

describe('async.ts', () => {
  it('sleep', async () => {
    const startTime = Date.now();
    const value = await sleep(100, 10);
    const timeCost = Date.now() - startTime;
    expect(value).toBe(10);
    expect(timeCost > 99).toBeTruthy();
  });
});
