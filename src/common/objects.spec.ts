import { assign, simpleAssign, assignExceptNil, mixin, deepClone, safeStringify, ensureArray } from './objects';

describe('objects/assign', () => {
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

    expect(mixin(null, a)).toEqual(a);
  });

  it('simpleAssgin', () => {
    const a = { a: 1, b: { c: 2, d: 3 } };
    const b = { b: { c: null as unknown, d: 5 } };

    let c = simpleAssign(a, b, value => value != null);
    expect(c.b.c).toBe(2);

    c = simpleAssign(a, b);
    expect(c.b.c).toBeNull();
    expect(a === c).toBeTruthy();

    expect(simpleAssign(null as never, b)).toBeNull();
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
