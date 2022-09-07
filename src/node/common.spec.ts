// import test from 'ava';
import * as comm from './common';
jest.mock('node:readline', () => ({
  createInterface() {
    return {
      question(tip: string, callback: (answer: string) => void) {
        callback(tip);
      },
      close: jest.fn,
    };
  },
}));

describe('utils/common', () => {
  afterAll(() => jest.restoreAllMocks());

  console.log = jest.fn();
  console.error = jest.fn();

  it('readSyncByRl', async () => {
    expect(await comm.readSyncByRl()).toBe('>');
    expect(await comm.readSyncByRl('ok')).toBe('ok');
  });

  it('calcTimeCost', async () => {
    const r = await comm.calcTimeCost(() => Promise.resolve(1));
    expect(typeof r === 'number').toBeTruthy();
  });

  it('calcTimeCost.label', async () => {
    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => null);

    const r = await comm.calcTimeCost(() => Promise.resolve(1), 'label');
    expect(typeof r === 'number').toBeTruthy();
    expect(spyLog).toHaveBeenCalled();
  });

  it('logTimeCost', () => {
    comm.logTimeCost(Date.now());
    expect(1).toBeTruthy();
  });
});
