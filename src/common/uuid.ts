/*
 * @Author: lzw
 * @Date: 2022-01-12 15:12:40
 * @LastEditors: lzw
 * @LastEditTime: 2022-06-09 22:46:51
 * @Description:
 * @see src/vs/base/common/uuid.ts
 */

const _UUIDPattern = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

export function isUUID(value: string): boolean {
  return _UUIDPattern.test(value);
}

// prep-work
const _data = new Uint8Array(16);
const _hex: string[] = [];
for (let i = 0; i < 256; i++) {
  _hex.push(i.toString(16).padStart(2, '0'));
}

let _fillRandomValues: (bucket: Uint8Array) => Uint8Array;

declare const crypto: undefined | { getRandomValues(data: Uint8Array): Uint8Array };

// eslint-disable-next-line unicorn/prefer-ternary
if (typeof crypto === 'object' && typeof crypto.getRandomValues === 'function') {
  // browser
  _fillRandomValues = crypto.getRandomValues.bind(crypto);
} else {
  _fillRandomValues = function (bucket: Uint8Array): Uint8Array {
    for (let i = 0; i < bucket.length; i++) {
      bucket[i] = Math.floor(Math.random() * 256);
    }
    return bucket;
  };
}

/** 生成 uuid */
export function generateUuid(): string {
  // get data
  _fillRandomValues(_data);

  // set version bits
  // eslint-disable-next-line unicorn/number-literal-case
  _data[6] = (_data[6] & 0x0f) | 0x40;
  // eslint-disable-next-line unicorn/number-literal-case
  _data[8] = (_data[8] & 0x3f) | 0x80;

  // print as string
  let i = 0;
  let result = '';
  result += _hex[_data[i++]];
  result += _hex[_data[i++]];
  result += _hex[_data[i++]];
  result += _hex[_data[i++]];
  result += '-';
  result += _hex[_data[i++]];
  result += _hex[_data[i++]];
  result += '-';
  result += _hex[_data[i++]];
  result += _hex[_data[i++]];
  result += '-';
  result += _hex[_data[i++]];
  result += _hex[_data[i++]];
  result += '-';
  result += _hex[_data[i++]];
  result += _hex[_data[i++]];
  result += _hex[_data[i++]];
  result += _hex[_data[i++]];
  result += _hex[_data[i++]];
  result += _hex[_data[i++]];
  return result;
}

/** @see generateUuid */
export const v1 = generateUuid;

export function formatToUuid(keys: string | string[]) {
  if (!keys) return [];
  if (!Array.isArray(keys)) keys = [keys];
  return keys
    .filter(d => /[\da-z]{8}(-?[\da-z]{4}){3}-?[\da-z]{12}/i.test(d))
    .map(d => {
      if (/^[\da-z]{32}$/i.test(d)) {
        d = [...d].map((s, index) => ([7, 11, 15, 19].includes(index) ? `${s}-` : s)).join('');
      }
      return d;
    });
}
