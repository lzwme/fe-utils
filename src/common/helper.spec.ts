import { formatByteSize, formatQty } from './helper';

describe('helper.ts', () => {
  it('formatByteSize', () => {
    const list = [
      ['abc', 'abc'],
      ['888KB', '888KB'],
      [null, ''],
      [void 0, ''],
      [0, '0B'],
      [8, '8B'],
      [888, '888B'],
      [888_888, '868.05KB'],
      [88_888_888, '84.77MB'],
      [8_888_888_888, '8.28GB'],
      [888_888_888_888, '827.84GB'],
      [88_888_888_888_888, '80.84TB'],
    ] as const;
    for (const [bytes, formated] of list) {
      expect(formatByteSize(bytes as never)).toBe(formated);
    }

    expect(formatByteSize(8888, 0)).toBe('8.6796875KB');
    expect(formatByteSize(8888, 4)).toBe('8.6797KB');
  });

  it('formatQty', () => {
    const list = [
      ['', ''],
      [void 0 as never as number, ''],
      [null as never as number, ''],
      [0, '0'],
      ['abc', 'abc'],
      [123, '123'],
      [-123, '-123'],
      [1234, '1,234'],
      [12_345_678, '12,345,678'],
      [-12_345_678, '-12,345,678'],
      [-12_345_678.123, '-12,345,678.123'],
      [12_345_678.123_456_78, '12,345,678.12345678'],
      [-12_345_678.123_456_78, '-12,345,678.12345678'],
    ] as const;
    for (const [val, formated] of list) {
      expect(formatQty(val)).toBe(formated);
    }
  });
});
