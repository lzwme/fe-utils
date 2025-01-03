/*
 * @Author: renxia
 * @Date: 2024-01-15 11:26:52
 * @LastEditors: renxia
 * @LastEditTime: 2024-12-18 09:12:30
 * @Description:
 */
import type { OutgoingHttpHeaders } from 'node:http';
import type { RequestOptions } from 'node:https';
import { urlFormat } from '../url';
import { assign, toLowcaseKeyObject } from '../objects';
import type { AnyObject } from '../../types';
import { cookieParse, cookieStringfiy } from '../cookie';

interface ReqOptions extends Omit<RequestInit, 'headers'> {
  headers?: OutgoingHttpHeaders;
}

export interface ReqConfig {
  cookie?: string;
  headers?: OutgoingHttpHeaders;
  baseURL?: string;
  reqOptions?: ReqOptions | RequestOptions;
}

export class ReqBase {
  protected cookies: Record<string, string> = {};
  protected headers: OutgoingHttpHeaders = {
    pragma: 'no-cache',
    connection: 'keep-alive',
    'cache-control': 'no-cache',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'accept-language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4,es;q=0.2',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  };
  protected isBrowser = typeof document !== 'undefined' && typeof window !== 'undefined';
  protected config: ReqConfig = {};
  constructor(config?: string | ReqConfig, headers?: OutgoingHttpHeaders) {
    if (config) {
      if (typeof config === 'string') config = { cookie: config };
      config = assign(this.config, config);
    }

    if ('prefixUrl' in this.config) this.config.baseURL = this.config.prefixUrl as string;
    if (this.isBrowser && !this.config.baseURL) this.config.baseURL = location.origin;
    if (this.config.cookie) this.setCookie(this.config.cookie);
    if (this.config.headers) this.setHeaders(this.config.headers);
    if (headers) this.setHeaders(headers);
    if (this.config.reqOptions?.headers) this.setHeaders(this.config.reqOptions.headers);
  }
  protected formatUrl(url: string | URL) {
    if (typeof url === 'string') {
      if (!url.startsWith('http')) {
        if (!this.config.baseURL?.endsWith('/')) this.config.baseURL += '/';
        url = this.config.baseURL + (url.startsWith('/') ? url.slice(1) : url);
      }
      url = new URL(url);
    }
    return url;
  }
  getHeaders(urlObject?: URL, headers?: OutgoingHttpHeaders) {
    headers = {
      ...this.headers,
      ...toLowcaseKeyObject(headers),
    };

    if (!this.isBrowser && urlObject) {
      if (!headers.host) headers.host = urlObject.host;
      if (!headers.origin) headers.origin = urlObject.origin || `${urlObject.protocol}://${urlObject.hostname}`;
    }
    if (!headers.cookie && Object.keys(this.cookies).length > 0) headers.cookie = this.getCookie();

    return headers;
  }
  setHeaders(headers: OutgoingHttpHeaders) {
    if (headers) this.headers = Object.assign(this.headers, toLowcaseKeyObject(headers));
    return this;
  }
  setCookie(cookie: string, reset = false) {
    if (reset) this.cookies = {};
    Object.assign(this.cookies, cookieParse(cookie));
    return this;
  }
  getCookie(isString?: true): string;
  getCookie(isString: false): Record<string, string>;
  getCookie(isString = true) {
    return isString ? cookieStringfiy(this.cookies) : this.cookies;
  }
}

export class ReqFetch extends ReqBase {
  static instance: ReqFetch;
  static getInstance() {
    if (!this.instance) this.instance = new ReqFetch();
    return this.instance;
  }
  constructor(cookie?: string | (Omit<ReqConfig, 'reqOptions'> & { reqOptions?: ReqOptions }), headers?: OutgoingHttpHeaders) {
    super(cookie, headers);
  }
  req(url: string | URL, parameters?: AnyObject, options: ReqOptions = {}) {
    url = this.formatUrl(url);
    if (options.method === 'GET' && parameters) url = urlFormat(url.toString(), parameters);
    options = { ...this.config.reqOptions, ...options, headers: this.getHeaders(url, options.headers) };

    if (parameters) {
      options.body = String(options.headers!['content-type']).includes('application/json')
        ? JSON.stringify(parameters)
        : new URLSearchParams(parameters as Record<string, string>).toString();
    }

    return fetch(url, options as never);
  }
  async request<T = AnyObject>(method: string, url: string | URL, parameters?: AnyObject, options?: ReqOptions) {
    const response = await this.req(url, parameters, { ...options, method });
    const buffer = await response.arrayBuffer();
    const str = new TextDecoder().decode(buffer);
    const r = { response, buffer, data: str as T };
    try {
      r.data = JSON.parse(str);
    } catch {
      r.data = str as T;
    }
    return r;
  }
  get<T = AnyObject>(url: string, parameters?: AnyObject, headers?: OutgoingHttpHeaders, options?: ReqOptions) {
    return this.request<T>('GET', url, parameters, { ...options, headers: { ...options?.headers, ...headers } });
  }
  post<T = AnyObject>(url: string, parameters: AnyObject, headers?: OutgoingHttpHeaders, options?: ReqOptions) {
    return this.request<T>('POST', url, parameters, { ...options, headers: { ...options?.headers, ...headers } });
  }
}

// new ReqFetch({ baseURL: 'https://www.baidu.com' })
//   .get('s?wd=pinphp')
//   .then(d => console.log('title:', String(d.data).match(/title>([^<]+)</)?.[1]));
