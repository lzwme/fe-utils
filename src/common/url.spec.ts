import { getUrlParams, toQueryString, urlFormat } from './url';

describe('common/url', () => {
  it('getUrlParams keeps "=" inside values and ignores empty segments', () => {
    expect(getUrlParams('?token=abc==&empty=&flag&name=a%20b')).toEqual({
      token: 'abc==',
      empty: '',
      flag: '',
      name: 'a b',
    });
  });

  it('getUrlParams does not throw on malformed escapes', () => {
    expect(getUrlParams('?bad=%E0%A4%A')).toEqual({ bad: '%E0%A4%A' });
  });

  it('urlFormat and toQueryString remain consistent', () => {
    const url = urlFormat('https://example.com/p', { a: 1, b: 'x y' });
    expect(url.searchParams.get('a')).toBe('1');
    expect(toQueryString({ a: 1, b: 'x y' })).toBe('a=1&b=x%20y');
  });
});
