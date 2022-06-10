/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * @Author: lzw
 * @Date: 2021-12-24 13:01:39
 * @LastEditors: lzw
 * @LastEditTime: 2022-06-10 11:35:02
 * @Description: 企业微信机器人通知
 */

import { Request } from './request';

const api = new Request();
const webhook = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=';

interface WxWorkResult {
  errcode: number;
  errmsg: string;
}

/** 企业微信机器人消息通知 */
export function wxWorkNotify(params: string | Record<string, any>, webhookUrl: string[], debug?: boolean): Promise<WxWorkResult[]>;
export function wxWorkNotify(params: string | Record<string, any>, webhookUrl: string, debug?: boolean): Promise<WxWorkResult>;
export function wxWorkNotify(params: string | Record<string, any>, webhookUrl: string | string[], debug = false) {
  if (!webhookUrl) return Promise.resolve({ errcode: -1, errmsg: '[wxWorkNotify][webhook] cannot be empty' });

  if (Array.isArray(webhookUrl)) {
    return Promise.all(webhookUrl.map(u => wxWorkNotify(params, u)));
  }

  if (!/[\da-z]{8}(-[\da-z]{4}){3}-[\da-z]{12}/i.test(webhookUrl)) {
    return Promise.resolve({ errcode: -2, errmsg: '[wxWorkNotify][webhook]invalid format' });
  }

  if (!webhookUrl.startsWith('http')) webhookUrl = webhook + webhookUrl;

  if (typeof params === 'string') {
    params = {
      msgtype: 'text',
      text: {
        content: params,
        mentioned_list: ['@all'],
      },
    };
  }

  return api.post<WxWorkResult>(webhookUrl, params, { 'content-type': 'application/json' }).then(d => {
    if (debug) console.log(`[wxWorkNotify][${d.data.errcode}]`, JSON.stringify(d.data));
    return d.data;
  });
}

// wxWorkNotify('hello!');
