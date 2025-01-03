import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { LiteStorage } from './LiteStorage';
import { AnyObject } from '../types';

describe('node/LiteStorage', () => {
  // eslint-disable-next-line no-console
  // console.log = jest.fn();
  console.error = jest.fn();

  const filepath = resolve('./cache/test.json');

  it('init', async () => {
    if (existsSync(filepath)) unlinkSync(filepath);

    const stor = LiteStorage.getInstance<AnyObject>({ filepath });
    await stor.ready();

    expect(stor.config.filepath).toBe(filepath);
    expect(existsSync(filepath)).toBe(false);

    await stor.set({ a: 1, b: 2 });
    expect(stor.getItem('a')).toBe(1);
    // 写了数据才创建文件
    expect(existsSync(filepath)).toBe(true);

    await stor.set({ a: 2, c: 3 }, 'cover');
    expect(stor.length).toBe(2);
    expect(stor.getItem('b')).toBeUndefined();

    await stor.save({ a: 3, b: 10 });
    expect(stor.getItem('a')).toBe(3);
    // 默认 merge 模式合并数据
    expect(stor.length).toBe(3);

    const d = stor.get();
    expect(d).toEqual({ a: 3, b: 10, c: 3 });

    await stor.removeItem('a');
    expect(stor.getItem('a')).toBeUndefined();

    await stor.setItem('a', 1);
    expect(stor.getItem('a')).toBe(1);

    await stor.del('b');
    expect(stor.getItem('b')).toBeUndefined();

    await stor.clear();
    expect(stor.getItem('a')).toBeUndefined();
    expect(stor.length).toBe(0);

    await stor.clear(true);
    expect(existsSync(filepath)).toBe(false);
  });
});
