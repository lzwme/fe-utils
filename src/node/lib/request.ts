import { URL } from 'node:url';
import zlib from 'node:zlib';
import http, { type IncomingMessage, type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http';
import https, { type RequestOptions } from 'node:https';
import { urlFormat } from '../../common/url';
import { ReqBase, type ReqConfig } from '../../common/lib/ReqFetch';
import type { AnyObject } from '../../types';

const MAX_REDIRECT_COUNT = 10;

export class Request extends ReqBase {
  static instance: Request;
  static getInstance() {
    if (!this.instance) this.instance = new Request();
    return this.instance;
  }
  constructor(cookie?: string | (Omit<ReqConfig, 'reqOptions'> & { reqOptions?: RequestOptions }), headers?: OutgoingHttpHeaders) {
    super(cookie, headers);
  }
  req(url: string | URL, parameters?: AnyObject, options: RequestOptions = {}, autoRedirect = true, _redirectCount = 0) {
    url = this.formatUrl(url);
    const method = String(options.method || 'GET').toUpperCase();
    // GET/HEAD 的参数需要拼进 URL，否则下载 HEAD 探测会丢失 query，导致探测到错误的资源
    if ((method === 'GET' || method === 'HEAD') && parameters) url = urlFormat(url.toString(), parameters);

    let postBody = '';
    const { protocol, port } = url;
    const headers = this.getHeaders(url, options.headers as OutgoingHttpHeaders);
    options = {
      ...(this.config.reqOptions as RequestOptions),
      ...options,
      hostname: url.host.split(':')[0],
      port,
      path: url.pathname + url.search,
      headers,
    };

    if (parameters && method !== 'GET' && method !== 'HEAD') {
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
          // 消费掉重定向响应体，释放连接
          res.resume();

          if (_redirectCount >= MAX_REDIRECT_COUNT) {
            req.destroy();
            reject(new Error(`重定向次数过多（超过 ${MAX_REDIRECT_COUNT} 次）`));
            return;
          }

          let rurl: URL;
          try {
            // 相对 Location 必须基于当前 URL 解析，响应头中的 host 并不可靠
            rurl = new URL(res.headers['location'], url);
          } catch (error) {
            req.destroy();
            reject(error);
            return;
          }

          const headers: OutgoingHttpHeaders = { ...(options.headers as OutgoingHttpHeaders) };
          // 仅当主机确实变化时才丢弃 host/origin，保留同主机重定向下用户显式设置的值
          if (headers.host && headers.host !== rurl.host) delete headers.host;
          if (headers.origin && headers.origin !== rurl.origin) delete headers.origin;
          // 跨主机重定向不能沿用上一次的凭据，避免 cookie/authorization 泄露给第三方主机
          if (rurl.host !== url.host) {
            headers.cookie = undefined;
            headers.authorization = undefined;
          }

          // Location 已是完整 URL，GET/HEAD 不再重复拼接 parameters
          const nextParams = method === 'GET' || method === 'HEAD' ? undefined : parameters;
          this.req(rurl, nextParams, { ...options, headers }, true, _redirectCount + 1).then(resolve, reject);
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
          zlib.gunzip(buffer, (_error, decoded) => {
            if (_error) return reject(_error);
            resolveData(decoded.toString());
          });
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, (_error, decoded) => {
            if (_error) return reject(_error);
            resolveData(decoded.toString());
          });
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
