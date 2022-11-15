import { getMd5ByPlainObject, md5, md5ByFileStream } from './crypto';

const md5Abc = '900150983cd24fb0d6963f7d28e17f72';

describe('common/crypto', () => {
  it('md5', () => {
    expect(md5('abc')).toEqual(md5Abc);
    expect(md5(__filename, true).length).toEqual(32);
    // @ts-ignore
    expect(md5(void 0)).toEqual('');
    expect(md5('abc', true).length).toEqual(0);

    // catch error
    expect(md5({} as never, true)).toEqual('');
  });
  it('md5ByFileStream', async () => {
    let r = await md5ByFileStream('abc');
    expect(r).toEqual('');

    r = await md5ByFileStream(__filename);
    expect(r.length).toEqual(32);
  });

  it('getMd5ByPlainObject', () => {
    for (const d of [null, void 0, 0, '', {}]) {
      expect(getMd5ByPlainObject(d as never)).toEqual('');
    }

    expect(getMd5ByPlainObject({ a: 1 }).length).toEqual(32);

    expect(getMd5ByPlainObject({ a: 1, pageSize: 1 }, ['pageSize'])).toEqual(getMd5ByPlainObject({ a: 1 }));
  });
});
