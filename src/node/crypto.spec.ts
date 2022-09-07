import { getMd5ByPlainObject, md5 } from './crypto';

describe('common/crypto', () => {
  it('md5', () => {
    expect(md5('abc').length).toEqual(32);
    expect(md5('abc', true).length).toEqual(0);
    expect(md5(__filename, true).length).toEqual(32);
    // @ts-ignore
    expect(md5(void 0)).toEqual('');

    // catch error
    expect(md5({} as never, true)).toEqual('');
  });

  it('getMd5ByPlainObject', () => {
    for (const d of [null, void 0, 0, '', {}]) {
      expect(getMd5ByPlainObject(d as never)).toEqual('');
    }

    expect(getMd5ByPlainObject({ a: 1 }).length).toEqual(32);

    expect(getMd5ByPlainObject({ a: 1, pageSize: 1 }, ['pageSize'])).toEqual(getMd5ByPlainObject({ a: 1 }));
  });
});
