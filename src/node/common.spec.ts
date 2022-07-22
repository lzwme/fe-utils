// import test from 'ava';
import * as comm from './common';
jest.mock('readline', () => ({
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
  console.log = jest.fn();
  console.error = jest.fn();

  it('readSyncByRl', async () => {
    expect(await comm.readSyncByRl()).toBe('>');
    expect(await comm.readSyncByRl('ok')).toBe('ok');
  });

  it('fixToshortPath', () => {
    expect(comm.fixToshortPath()).toBe('');
    expect(comm.fixToshortPath('./abc\\d.ts')).toBe('abc/d.ts');
  });

  it('logTimeCost', () => {
    comm.logTimeCost(Date.now());
    expect(1).toBeTruthy();
  });
});
