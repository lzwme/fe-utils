import { existsSync, unlinkSync, readFileSync } from 'node:fs';
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

  it('getInstance returns same instance for same filepath', async () => {
    const f = resolve('./cache/test-instance.json');
    if (existsSync(f)) unlinkSync(f);

    const s1 = LiteStorage.getInstance<AnyObject>({ filepath: f });
    const s2 = LiteStorage.getInstance<AnyObject>({ filepath: f });

    expect(s1).toBe(s2);

    await s1.clear(true);
    expect(existsSync(f)).toBe(false);
  });

  it('different filepaths produce different instances', async () => {
    const f1 = resolve('./cache/test-instance-1.json');
    const f2 = resolve('./cache/test-instance-2.json');
    if (existsSync(f1)) unlinkSync(f1);
    if (existsSync(f2)) unlinkSync(f2);

    const s1 = LiteStorage.getInstance<AnyObject>({ filepath: f1 });
    const s2 = LiteStorage.getInstance<AnyObject>({ filepath: f2 });

    expect(s1).not.toBe(s2);

    await s1.clear(true);
    await s2.clear(true);
  });

  it('atomic write writes valid JSON file', async () => {
    const f = resolve('./cache/test-atomic.json');
    if (existsSync(f)) unlinkSync(f);

    const stor = LiteStorage.getInstance<AnyObject>({ filepath: f });
    await stor.ready();

    await stor.set({ atomic: true });

    expect(existsSync(f)).toBe(true);
    const content = readFileSync(f, 'utf8');
    expect(() => JSON.parse(content)).not.toThrow();

    await stor.clear(true);
  });
});
