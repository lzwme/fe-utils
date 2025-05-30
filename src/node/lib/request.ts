import { URL } from 'node:url';
import zlib from 'node:zlib';
import http, { type IncomingMessage, type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http';
import https, { type RequestOptions } from 'node:https';
import { urlFormat } from '../../common/url';
import { ReqBase, type ReqConfig } from '../../common/lib/ReqFetch';
import type { AnyObject } from '../../types';

export class Request extends ReqBase {
  static instance: Request;
  static getInstance() {
    if (!this.instance) this.instance = new Request();
    return this.instance;
  }
  constructor(cookie?: string | (Omit<ReqConfig, 'reqOptions'> & { reqOptions?: RequestOptions }), headers?: OutgoingHttpHeaders) {
    super(cookie, headers);
  }
  req(url: string | URL, parameters?: AnyObject, options: RequestOptions = {}, autoRedirect = true) {
    url = this.formatUrl(url);
    if (options.method === 'GET' && parameters) url = urlFormat(url.toString(), parameters);

    let postBody = '';
    const { protocol, port } = url;
    const headers = this.getHeaders(url, options.headers as OutgoingHttpHeaders);
    options = {
      ...(this.config.reqOptions as RequestOptions),
      ...options,
      hostname: url.host.split(':')[0],
      port,
      path: url.href.split(url.host)[1],
      headers,
    };

    if (parameters) {
      postBody = String(headers!['content-type']).includes('application/json')
        ? JSON.stringify(parameters)
        : new URLSearchParams(parameters as Record<string, string>).toString();
      headers!['content-length'] = Buffer.byteLength(postBody).toString();
    }

    return new Promise<{ req: http.ClientRequest; res: IncomingMessage }>((resolve, reject) => {
      const h = protocol === 'http:' ? http : https;
      let timer: NodeJS.Timeout;
      const req: http.ClientRequest = h.request(options, res => {
        globalThis.clearTimeout(timer);
        if (autoRedirect && String(res.statusCode).startsWith('30') && res.headers['location']) {
          let rurl = res.headers['location'];
          if (!rurl.startsWith('http')) rurl = (res.headers['host'] || url.host) + rurl;
          this.req(rurl, parameters, options, true).then(resolve);
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
    return this.request<T>('GET', url, parameters, { ...options, headers: { ...options?.headers, ...headers } });
  }
  post<T = AnyObject>(url: string, parameters: AnyObject, headers?: OutgoingHttpHeaders, options?: RequestOptions) {
    return this.request<T>('POST', url, parameters, { ...options, headers: { ...options?.headers, ...headers } });
  }
}

// new Request({ baseURL: 'https://www.baidu.com' })
//   .get('s?wd=pinphp')
//   .then(d => console.log('title:', String(d.data).match(/title>([^<]+)</)?.[1]));
