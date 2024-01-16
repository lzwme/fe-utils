import { cookieParse, cookieStringfiy, setCookie } from './cookie';

describe('cookie.ts', () => {
  it('cookieParse', () => {
    globalThis.document = {} as never;

    const list = [
      ['', {}],
      [null, {}],
      [void 0, {}],
      [0, {}],
      ['a=1', { a: '1' }],
      ['a=1;b=b', { a: '1', b: 'b' }],
      ['a=;b=b', { a: '', b: 'b' }],
      ['a=%E6%B5%8B%E8%AF%95001;b=b', { a: '测试001', b: 'b' }],
    ] as const;
    for (const [cookie, obj] of list) {
      expect(cookieParse(cookie as never)).toEqual(obj);
    }
  });

  it('cookieStringfiy', () => {
    const list = [
      ['', ''],
      [void 0 as never as number, ''],
      [null as never as number, ''],
      [0, ''],
      ['abc', ''],
      [123, ''],
      [{}, ''],
      [{ a: 1 }, 'a=1'],
      [{ a: 1, b: 'b' }, 'a=1; b=b'],
      [{ a: '测试001', b: 'b' }, 'a=%E6%B5%8B%E8%AF%95001; b=b'],
    ] as const;
    for (const [val, cookie] of list) {
      expect(cookieStringfiy(val as never)).toBe(cookie);
    }
  });

  it('cookieStringfiy.removeKeys', () => {
    const list = [
      ['', [], ''],
      [{}, ['a'], ''],
      [{ a: 1, b: 1 }, ['a'], 'b=1'],
      [{ a: 1, b: 1 }, ['b'], 'a=1'],
      [{ a: 1, b: 1 }, ['c'], 'a=1; b=1'],
      [{ a: 1, b: 1, ab: 1, bcd: 1 }, [/b/], 'a=1'],
    ] as const;
    for (const [val, keys, cookie] of list) {
      expect(cookieStringfiy(val as never, { removeKeys: keys as never })).toBe(cookie);
    }
  });

  it('cookieStringfiy.onlyKeys', () => {
    const list = [
      ['', [], ''],
      [{}, ['a'], ''],
      [{ a: 1, b: 1 }, ['a'], 'a=1'],
      [{ a: 1, b: 1 }, ['b'], 'b=1'],
      [{ a: 1, b: 1 }, ['c'], ''],
      [{ a: 1, b: 1, ab: 1, bcd: 1 }, [/b/], 'b=1; ab=1; bcd=1'],
    ] as const;
    for (const [val, keys, cookie] of list) {
      expect(cookieStringfiy(val as never, { onlyKeys: keys as never })).toBe(cookie);
    }
  });

  it('cookieStringfiy.removeNil', () => {
    const list = [[{ key1: 'value1', key2: null, key3: 'value3' }, 'key1=value1; key3=value3']] as const;
    for (const [val, cookie] of list) {
      expect(cookieStringfiy(val as never, { removeNil: true })).toBe(cookie);
    }
  });
});

describe('cookie/setCookie', () => {
  test('should set a cookie with the given name, value, and options', () => {
    globalThis.document = {} as never;
    expect(setCookie('myCookie', 'myValue', { expires: 10, path: '/' })).toBe(true);
  });

  test('should return false when the cookie cannot be set', () => {
    global.document = void 0 as never;
    expect(setCookie('myCookie', 'myValue', { expires: -1 })).toBe(false);
  });
});
