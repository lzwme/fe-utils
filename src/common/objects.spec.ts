import { AnyObject } from '../types';
import {
  assign,
  mergeArrayLike,
  simpleAssign,
  assignExceptNil,
  mixin,
  deepClone,
  safeStringify,
  ensureArray,
  safeJsonParse,
  tryLoadJSON5,
  toLowcaseKeyObject,
  objectFilterByKeys,
} from './objects';

describe('objects/assign', () => {
  it('safeJsonParse', () => {
    const a: Record<string, unknown> = { a: 1, b: { c: 2, d: 3 } };

    expect(safeJsonParse(a as never)).toEqual(a);
    expect(safeJsonParse(safeStringify(a))).toStrictEqual(a);
    expect(safeJsonParse('')).toStrictEqual({});
    expect(safeJsonParse(null as never)).toStrictEqual({});
    expect(safeJsonParse('abc', true, true)).toStrictEqual({});
  });

  it('safeJsonParse use JSON5', async () => {
    const jsonStr = `{\n// test\n "a": 1, 'b': 2, c: 3}`;
    await tryLoadJSON5();
    expect(safeJsonParse(jsonStr, true).c).toBe(3);
  });

  it('safeStringify', () => {
    const a: Record<string, unknown> = { a: 1, b: { c: 2, d: 3 } };

    expect(safeStringify(a)).toBe(JSON.stringify(a));

    // circular
    a.b = a;

    let error = null;
    try {
      JSON.stringify(a);
    } catch (error_) {
      error = error_;
    }
    expect(error).not.toBeNull();
    expect(safeStringify(a).includes('[Circular]')).toBeTruthy();
  });

  it('safeStringify handles Error and RegExp', () => {
    const err = new Error('boom');
    const reg = /test/gi;

    expect(safeStringify(err)).toContain('Error: boom');
    expect(safeStringify(reg)).toBe(reg.toString());
  });

  it('safeStringify handles duplicate references (non-circular) marking second as [Circular]', () => {
    const x = { n: 1 };
    const obj = { a: x, b: x };
    const normal = JSON.stringify(obj);
    const s = safeStringify(obj);

    // safeStringify will mark the second reference as [Circular]
    expect(s.includes('[Circular]')).toBeTruthy();
    // JSON.stringify does not insert [Circular] for duplicate refs
    expect(normal.includes('[Circular]')).toBeFalsy();
  });

  it('safeStringify respects space parameter and primitives', () => {
    const a = { a: 1 };
    expect(safeStringify(a, 2)).toBe(JSON.stringify(a, null, 2));
    expect(safeStringify('abc')).toBe(JSON.stringify('abc'));
    expect(safeStringify(null)).toBe(JSON.stringify(null));
  });

  it('safeStringify handles Date same as JSON.stringify', () => {
    const d = new Date('2020-01-01T00:00:00Z');
    expect(safeStringify(d)).toBe(JSON.stringify(d));
  });

  it('safeStringify handles nested circular references', () => {
    const a: AnyObject = { n: 1 };
    a.self = a;
    a.child = { parent: a };
    expect(safeStringify(a)).toContain('[Circular]');
  });

  it('deepClone', () => {
    const a = { a: 1, b: { c: 2, d: 3 } };

    const c = deepClone(a);
    expect(a === c).toBeFalsy();
    expect(c.b.c).toBe(a.b.c);
    expect(c.b.d).toBe(3);

    expect(deepClone(null as never)).toBeNull();

    const regex1 = /abc/g;
    expect(deepClone(regex1)).toEqual(regex1);

    expect(deepClone([a]).length === 1).toBeTruthy();
  });

  it('mixin', () => {
    const a = { a: 1, b: { c: 2, d: 3 } };
    const b = { b: { c: null as unknown, d: 5 }, m: 1 };

    let c = mixin(a, b, false);
    expect(c.b.c).toBe(2);
    expect(c.b.d).toBe(3);
    expect(a === c).toBeTruthy();

    c = mixin(a, b);
    expect(c.b.c).toBeNull();
    expect(c.b.d).toBe(5);

    expect(mixin(null as never as AnyObject, a)).toEqual(a);
  });

  it('mergeArrayLike', () => {
    const a = { a: 1, b: { c: 2, d: 3 } };
    const b = { b: { c: null as unknown, d: 5 } };

    expect(mergeArrayLike(a, b)).toBe(a);

    expect(mergeArrayLike([1, 2, 3], [4])[3] === 4).toBeTruthy();
    expect(mergeArrayLike(new Set([1, 2, 3]), new Set([4])).size === 4).toBeTruthy();

    const amap = new Map([['b', { a: 2 }]]);
    const bmap = new Map<string, unknown>();
    bmap.set('b', { a: 1 });
    expect(mergeArrayLike(amap, bmap).get('b')!.a === 1).toBeTruthy();
  });

  it('simpleAssgin', () => {
    const a = { a: 1, b: { c: 2, d: 3, n: [1, 2] } };
    const b = { b: { c: null as unknown, d: 5, n: [2, 3] } };

    let c = simpleAssign(a, b, { filter: value => value != null });
    expect(c.b.c).toBe(2);

    c = simpleAssign(a, b);
    expect(c.b.c).toBeNull();
    expect(a === c).toBeTruthy();

    expect(simpleAssign(null as never, b)).toBeNull();

    // 支持数组合并(去重)
    a.b.n = [1, 2];
    b.b.n = [2, 3];
    expect(simpleAssign(a, b, { mergeArrayLike: true }).b.n.length === 3).toBeTruthy();
    expect(simpleAssign(a, b).b.n === b.b.n).toBeTruthy();
  });

  it('assign', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: Record<string, any> = { b: 1 };
    const b = { a: { b: 1 }, b: 2, c: [1, 2] };

    expect(assign(a, b)).toEqual(a);
    expect(assign(a, b).b).toEqual(2);
    expect(assign(a, [], b).b).toEqual(2);
    expect(Array.isArray(assign(a, b)['c'])).toBeTruthy();

    // @ts-ignore
    expect(assign(void 0, b) === void 0).toBeTruthy();
    // @ts-ignore
    expect(assign(a, void 0)).toEqual(a);

    // 第一个参数是数组，则原样返回
    const array = [b];
    expect(assign(array, b)).toEqual(array);

    // 顺序优先级
    expect(assign(a, b, { b: 3 }).b).toEqual(3);

    // 循环顺序正确性
    expect(assign(a, b, a).b).toEqual(3);
  });

  it('assignMuti', () => {
    const m = assign<Record<string, number | null>>({ a: 1 }, { a: 2 }, { a: null, b: 10 }, { a: 3, b: 3 });
    expect(m.a).toBe(3);
    expect(m.b).toBe(3);
  });

  it('assignExceptNil', () => {
    const a = { a: 1, b: { c: 2 } };
    const b = { b: { c: null as unknown } };

    expect(assignExceptNil(a, b).b.c).toBe(2);

    b.b.c = '';
    expect(assignExceptNil(a, b, false).b.c).toBe(2);
    expect(assignExceptNil(a, b).b.c).toBe('');
    b.b.c = 0;
    expect(assignExceptNil(a, b, true).b.c).toBe(0);
  });

  it('ensureArray', () => {
    const a = { a: 1, b: { c: 2 } };

    expect(ensureArray(a)[0]).toBe(a);
    expect(ensureArray(null).length).toBe(0);
    expect(ensureArray([1])[0]).toBe(1);
  });
});

describe('objects/toLowcaseKeyObject', () => {
  test('should return an empty object when no object is provided', () => {
    expect(toLowcaseKeyObject()).toBeDefined();
  });

  test('should return a new object with lowercase keys', () => {
    const cookieObj = {
      Key1: 'value1',
      KeY2: 'value2',
      Key3: 'value3',
    };
    const expectedObj = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    };

    expect(toLowcaseKeyObject(cookieObj)).toEqual(expectedObj);
  });

  test('should return a new object with lowercase keys and ignore non-string keys', () => {
    const cookieObj = {
      Key1: 'value1',
      Key2: 'value2',
      Key3: 'value3',
      nUm: 42,
    };
    const expectedObj = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
      num: 42,
    };

    expect(toLowcaseKeyObject(cookieObj)).toEqual(expectedObj);
  });
});

describe('objects/objectFilterByKeys', () => {
  test('should return an empty object when no object is provided', () => {
    expect(objectFilterByKeys(void 0 as never)).toBeDefined();
  });

  test('should return an empty object when object is empty', () => {
    expect(objectFilterByKeys({})).toBeDefined();
  });

  test('should return a new object with filtered keys', () => {
    const cookieObj = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    };
    const removeKeys = ['key2'];
    const expectedObj = {
      key1: 'value1',
      key3: 'value3',
    };

    expect(objectFilterByKeys(cookieObj, { removeKeys })).toEqual(expectedObj);
  });

  test('should return a new object with filtered keys and onlyKeys', () => {
    const cookieObj = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    };
    const onlyKeys = ['key1'];
    const expectedObj = {
      key1: 'value1',
    };

    expect(objectFilterByKeys(cookieObj, { onlyKeys })).toEqual(expectedObj);
  });

  test('should return a new object with filtered keys and removeNil', () => {
    const cookieObj = {
      key1: 'value1',
      key2: null,
      key3: 'value3',
    };
    const removeNil = true;
    const expectedObj = {
      key1: 'value1',
      key3: 'value3',
    };

    expect(objectFilterByKeys(cookieObj, { removeNil })).toEqual(expectedObj);
  });
});
