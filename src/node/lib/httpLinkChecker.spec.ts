import { httpLinkChecker } from './httpLinkChecker';

describe('httpLinkChecker', () => {
  it('check for some public websites', async () => {
    const publicSiteList = ['https://www.baidu.com', 'https://cn.bing.com'];
    for (const url of publicSiteList) {
      const r = await httpLinkChecker(url, { reqOptions: { timeout: 500, sessionTimeout: 500 } });
      expect(typeof r.statusCode === 'number').toBeTruthy();
    }

    const r = await httpLinkChecker('https://github.comabc');
    expect(r.code === 'ENOTFOUND').toBeTruthy();
  }, 30_000);

  // @TODO: create local server
});
