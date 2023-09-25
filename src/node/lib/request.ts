import { URL } from 'node:url';
import zlib from 'node:zlib';
import http, { type IncomingMessage, type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http';
import https, { type RequestOptions } from 'node:https';
import { urlFormat } from '../../common/url';
import type { AnyObject } from '../../types';

function toLowcaseKeyObject(info: Record<string, unknown> = {}) {
  for (const key of Object.keys(info)) {
    const lowCaseKey = key.toLocaleLowerCase();
    if (key !== lowCaseKey) {
      info[lowCaseKey] = info[key];
      delete info[key];
    }
  }
  return info;
}

export class Request {
  static instance: Request;
  static getInstance() {
    if (!this.instance) this.instance = new Request();
    return this.instance;
  }
  private cookies: string[] = [];
  private headers: OutgoingHttpHeaders = {
    pragma: 'no-cache',
    connection: 'keep-alive',
    'cache-control': 'no-cache',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'accept-language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4,es;q=0.2',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
  };

  constructor(cookie?: string, headers?: OutgoingHttpHeaders) {
    if (cookie) this.setCookie(cookie);
    if (headers) this.setHeaders(headers);
  }
  private getHeaders(urlObject: URL, headers?: OutgoingHttpHeaders) {
    headers = {
      ...this.headers,
      host: urlObject.host,
      origin: urlObject.origin || `${urlObject.protocol}://${urlObject.hostname}`,
      ...toLowcaseKeyObject(headers),
    };

    if (!headers.cookie && this.cookies.length > 0) headers.cookie = this.getCookie() as string;

    return headers;
  }
  setHeaders(headers: OutgoingHttpHeaders) {
    if (headers) this.headers = Object.assign(this.headers, toLowcaseKeyObject(headers));
  }
  setCookie(cookie: string, reset = false) {
    if (reset) this.cookies = [];
    const cookies = cookie.split(';').map(d => d.trim());
    for (const c of cookies) !this.cookies.includes(c) && this.cookies.push(c);
    return this;
  }
  getCookie(isString = true) {
    return isString ? this.cookies.join('; ') : this.cookies;
  }
  req(url: string | URL, parameters?: AnyObject, options: RequestOptions = {}, autoRedirect = true) {
    const urlObject = typeof url === 'string' ? new URL(url) : url;
    options = {
      ...options,
      hostname: urlObject.host.split(':')[0],
      port: urlObject.port,
      path: urlObject.href.split(urlObject.host)[1],
      headers: this.getHeaders(urlObject, options.headers),
    };
    let postBody = '';

    if (parameters) {
      postBody = String(options.headers!['content-type']).includes('application/json')
        ? JSON.stringify(parameters)
        : new URLSearchParams(parameters as Record<string, string>).toString();
      options.headers!['content-length'] = Buffer.byteLength(postBody).toString();
    }

    return new Promise<{ req: http.ClientRequest; res: IncomingMessage }>((resolve, reject) => {
      const h = urlObject.protocol === 'http:' ? http : https;
      let timer: NodeJS.Timeout;
      const req: http.ClientRequest = h.request(options, res => {
        globalThis.clearTimeout(timer);
        if (autoRedirect && String(res.statusCode).startsWith('30') && res.headers['location']) {
          this.req(res.headers['location'], parameters, options, true).then(resolve);
        } else resolve({ req, res });
      });

      req.on('error', error => {
        clearTimeout(timer);
        reject(error);
      });

      if (options.timeout) {
        timer = setTimeout(() => {
          req.destroy();
          reject(new Error('timeout', { cause: `timeout: ${options.timeout}` }));
        }, options.timeout);
      }

      if (postBody) req.write(postBody);
      req.end();
    });
  }
  async request<T = AnyObject>(method: string, url: string | URL, parameters?: AnyObject, options?: RequestOptions, autoRedirect = true) {
    const { res: response, req } = await this.req(url, parameters, { ...options, method }, autoRedirect);

    return new Promise<{ data: T; buffer: Buffer; headers: IncomingHttpHeaders; response: IncomingMessage }>((resolve, reject) => {
      const chunks: Buffer[] = [];
      response.on('error', reject);
      response.on('data', data => chunks.push(data));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const encoding = response.headers['content-encoding'];
        const shouldToJson = [req.getHeader('content-type'), response.headers['content-type']].some(d => String(d).includes('json'));
        const resolveData = (body: string | Buffer) => {
          const result = { data: body as never as T, buffer, headers: response.headers, response };

          try {
            if (typeof body === 'string' && shouldToJson) result.data = JSON.parse(body);
            resolve(result);
          } catch (error) {
            console.warn((error as Error).message, url);
            resolve(result);
          }
        };

        if (encoding === 'gzip') {
          zlib.gunzip(buffer, (_error, decoded) => resolveData(decoded.toString()));
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, (_error, decoded) => resolveData(decoded.toString()));
        } else {
          resolveData(buffer.toString());
        }
      });
    });
  }
  get<T = AnyObject>(url: string, parameters?: AnyObject, headers?: OutgoingHttpHeaders, options?: RequestOptions) {
    return this.request<T>('GET', urlFormat(url, parameters), void 0, { ...options, headers: { ...options?.headers, ...headers } });
  }
  post<T = AnyObject>(url: string, parameters: AnyObject, headers?: OutgoingHttpHeaders, options?: RequestOptions) {
    return this.request<T>('POST', url, parameters, { ...options, headers: { ...options?.headers, ...headers } });
  }
}
