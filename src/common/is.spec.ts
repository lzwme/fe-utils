/* eslint-disable @typescript-eslint/no-empty-function */
import * as IS from './is';

describe('is.ts', () => {
  it('isObject', () => {
    const y = [{}, { a: 1 }];
    const n = ['', null, void 0, 0, [], Number.NaN, /ab/i, new Date(), new Set(), new Map(), new Set([1]), new Map([['a', 1]])];

    for (const v of y) expect(IS.isObject(v)).toBeTruthy();
    for (const v of n) expect(IS.isObject(v)).toBeFalsy();
  });

  it('isEmpty', () => {
    const y = ['', null, void 0, 0, [], {}, new Set(), new Map(), Number.NaN];
    const n = ['a', 1, { a: 1 }, [1], new Set([1]), new Map([['a', 1]]), new Date(), /ab/i];
    for (const v of y) expect(IS.isEmpty(v)).toBeTruthy();
    for (const v of n) expect(IS.isEmpty(v)).toBeFalsy();
  });

  it('isEmptyObject', () => {
    const y = [{}];
    const n = [
      { a: 1 }, //
      '',
      true,
      false,
      null,
      void 0,
      0,
      [],
      Number.NaN,
      /ab/i,
      new Date(),
      new Set(),
      new Map(),
    ];
    for (const v of y) expect(IS.isEmptyObject(v)).toBeTruthy();
    for (const v of n) expect(IS.isEmptyObject(v)).toBeFalsy();
  });

  it('isNumber', () => {
    const y = [33_333_333.23, 1.23, 2, 3, -1, -3];
    const n = ['1', '0', 'a', '', true, false];
    for (const v of y) expect(IS.isNumber(v)).toBeTruthy();
    for (const v of n) expect(IS.isNumber(v)).toBeFalsy();
  });

  it('isArray', () => {
    const list = [
      [null, false],
      [void 0, false],
      [0, false],
      [[], true],
    ] as const;
    for (const [p, v] of list) expect(IS.isArray(p)).toBe(v);
  });

  it('isUndefinedOrNull', () => {
    const y = [null, undefined, void 0];
    const n = ['1', '0', 'a', '', true, false, 0, {}, []];
    for (const v of y) expect(IS.isUndefinedOrNull(v)).toBeTruthy();
    for (const v of n) expect(IS.isUndefinedOrNull(v)).toBeFalsy();
  });

  it('isFunction', () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const noop = () => {};
    const y = [function a() {}, noop];
    const n = [null, void 0, '1', '0', 'a', '', true, false, 0, {}, []];
    for (const v of y) expect(IS.isFunction(v)).toBeTruthy();
    for (const v of n) expect(IS.isFunction(v)).toBeFalsy();
  });

  it('isSet', () => {
    const y = [new Set(), new Set([1, 2, 3])];
    const n = ['1', '0', 'a', '', true, false, 0, {}, []];
    for (const v of y) expect(IS.isSet(v)).toBeTruthy();
    for (const v of n) expect(IS.isSet(v)).toBeFalsy();
  });

  it('isMap', () => {
    const y = [new Map(), new Map([[2, 3]])];
    const n = ['1', '0', 'a', '', true, false, 0, {}, []];
    for (const v of y) expect(IS.isMap(v)).toBeTruthy();
    for (const v of n) expect(IS.isMap(v)).toBeFalsy();
  });

  it('isPromise', () => {
    const y = [Promise.resolve(), new Promise(r => r(1))];
    const n = ['1', '0', 'a', '', true, false, 0, {}, []];
    for (const v of y) expect(IS.isPromise(v)).toBeTruthy();
    for (const v of n) expect(IS.isPromise(v)).toBeFalsy();
  });

  it('isIterable', () => {
    const y = ['', '1', new Map(), new Set(), []];
    const n = [null, void 0, true, false, 0, 3, {}, /a/, new Date()];
    for (const v of y) expect(IS.isIterable(v)).toBeTruthy();
    for (const v of n) expect(IS.isIterable(v)).toBeFalsy();
  });
});
