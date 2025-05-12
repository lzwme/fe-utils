/*
 * @Author: renxia
 * @Date: 2024-01-15 11:26:52
 * @LastEditors: renxia
 * @LastEditTime: 2025-05-12 14:26:25
 * @Description:
 */
import type { OutgoingHttpHeaders } from 'node:http';
import type { RequestOptions } from 'node:https';
import { urlFormat } from '../url';
import { assign, toLowcaseKeyObject } from '../objects';
import type { AnyObject } from '../../types';
import { cookieParse } from '../cookie';

interface ReqOptions extends Omit<RequestInit, 'headers'> {
  headers?: OutgoingHttpHeaders;
}

export interface ReqConfig {
  cookie?: string;
  headers?: OutgoingHttpHeaders;
  baseURL?: string;
  reqOptions?: ReqOptions | RequestOptions;
}

export function getRandomUA(keyword = '') {
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  let ua = [
    `Mozilla/5.0 (Windows NT ${randomInt(10, 11)}.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomInt(70, 136)}.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1 Edg/122.0.0.0`,
  ];

  if (keyword) {
    const u = ua.filter(d => d.includes(keyword));
    if (u.length) ua = u;
  }

  return ua[Math.floor(Math.random() * ua.length)];
}

export class ReqBase {
  protected headers: OutgoingHttpHeaders = {
    pragma: 'no-cache',
    connection: 'keep-alive',
    'cache-control': 'no-cache',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'accept-language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4,es;q=0.2',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'user-agent': getRandomUA('Win64'),
  };
  protected isBrowser = typeof document !== 'undefined' && typeof window !== 'undefined';
  protected config: ReqConfig = {};
  constructor(config?: string | ReqConfig, headers?: OutgoingHttpHeaders) {
    if (config) {
      if (typeof config === 'string') config = { cookie: config };
      config = assign(this.config, config);
    }
    if (headers) this.config.headers = headers;
    this.setConfig(this.config);

    if (this.isBrowser && !this.config.baseURL) this.config.baseURL = location.origin;
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
  getConfig() {
    return { ...this.config };
  }
  setConfig(cfg: ReqConfig) {
    assign(this.config, cfg);

    if ('prefixUrl' in cfg) this.config.baseURL = cfg.prefixUrl as string;
    if (cfg.cookie) this.setHeaders({ cookie: cfg.cookie });
    if (cfg.headers) this.setHeaders(cfg.headers);
    if (cfg.reqOptions?.headers) this.setHeaders(cfg.reqOptions.headers as OutgoingHttpHeaders);
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

    return headers;
  }
  setHeaders(headers: OutgoingHttpHeaders, type: 'merge' | 'reset' = 'merge') {
    if (type === 'reset') this.headers = {};
    this.headers = Object.assign(this.headers, toLowcaseKeyObject(headers));
    return this;
  }
  getCookie(isString?: true): string;
  getCookie(isString: false): Record<string, string>;
  getCookie(isString = true) {
    const ck = this.headers.cookie! as string;
    return isString ? ck : cookieParse(ck);
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
