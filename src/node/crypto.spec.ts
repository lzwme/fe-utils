import { md5 } from './crypto';

describe('common/crypto', () => {
  it('md5', () => {
    expect(md5('abc').length).toEqual(32);
    expect(md5('abc', true).length).toEqual(0);
    expect(md5(__filename, true).length).toEqual(32);
    expect(md5(void 0)).toEqual('');

    // catch error
    expect(md5({} as never, true)).toEqual('');
  });
});
