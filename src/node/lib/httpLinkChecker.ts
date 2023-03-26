import { RequestOptions } from 'https';
import { assign } from '../../common/objects';
import { Request } from './request';

export async function httpLinkChecker(url: string, options: { reqOptions?: RequestOptions; verify?: (body: string) => boolean } = {}) {
  const request = new Request();
  let r: Awaited<ReturnType<Request['get']>> & { data: string };

  options.reqOptions = assign<RequestOptions>(
    { method: 'get', timeout: 5000, headers: { 'content-type': 'text/html' } },
    options.reqOptions!
  );

  try {
    if (options.verify) {
      r = await request.request<string>(options.reqOptions.method!, url, {}, options.reqOptions, false);
    } else {
      const { res } = await request.req(url, {}, { ...options.reqOptions, method: 'HEAD' }, false);
      r = { response: res, headers: res.headers, data: '', buffer: Buffer.from('') };
      res.destroy();
    }
  } catch (error) {
    const err = error as Error & { code?: number | string };
    return {
      code: err.code || -1,
      errmsg: String(err.message || err.cause || err.stack),
      statusCode: Number(err.code) || -1,
      url: url.replace(/\$/, ''),
      redirected: false,
      body: '',
    };
  }

  const result = {
    code: 0,
    errmsg: r.response.errored?.message || r.response.statusMessage || '',
    statusCode: r.response.statusCode ?? 0,
    url: (r.response.headers['location'] || url).replace(/\/$/, ''),
    redirected: false,
    body: r.data,
  };

  if (String(result.statusCode).startsWith('30') && url !== result.url) {
    result.redirected = true;
  } else if (result.statusCode < 200 || result.statusCode > 299) {
    result.code = result.statusCode;
    if (!result.errmsg) result.errmsg = `HTTP_${result.statusCode}`;
  } else if (r.data && options.verify && !options.verify(r.data)) {
    result.code = -1;
    result.errmsg = r.data;
  }

  return result;
}
