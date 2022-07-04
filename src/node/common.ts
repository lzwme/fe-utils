import path from 'path';
import { color } from 'console-log-colors';
import { createInterface } from 'readline';
import { getLogger } from './get-logger';
import { formatTimeCost } from '../common/date';

/** 等待并获取用户输入内容 */
export function readSyncByRl(tips = '> ') {
  return new Promise(resolve => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(tips, answer => {
      resolve(answer.trim());
      rl.close();
    });
  });
}

/**
 * 将给定的文件路径规整为 a/b/c.js 格式
 */
export function fixToshortPath(filepath = '', rootDir = process.cwd()) {
  const shortPath = path.resolve(rootDir, filepath).replace(rootDir, '').replace(/\\/g, '/');
  return shortPath.startsWith('/') ? shortPath.slice(1) : shortPath;
}

/** 计算指定函数的执行耗时。返回值单位为 ns */
export async function calcTimeCost(fn: () => unknown, label?: string) {
  const startTime = process.hrtime.bigint();
  await fn();
  const endTime = process.hrtime.bigint();
  const timeCost = Number(endTime - startTime);

  if (label) getLogger().log(`[${color.cyanBright(label)}] timeCost:`, color.greenBright(`${timeCost / 1e9}s`));

  return timeCost;
}

export function getFormatedTimeCost(startTime: number, withTip = true) {
  let timeCost = formatTimeCost(startTime); // (Date.now() - startTime) / 1000 + 's';
  if (withTip) timeCost = `TimeCost: ${color.greenBright(timeCost)}`;
  return timeCost;
}

/**
 * 打印时间消耗
 * @param {number} startTime 开始时间戳
 */
export function logTimeCost(startTime: number, prefix = '') {
  getLogger().log(color.cyan(prefix), getFormatedTimeCost(startTime));
}

// @see async.ts
// export const sleep = (delay = 100) => new Promise(rs => setTimeout(() => rs(true), delay));

export function formatWxWorkKeys(keys: string | string[]) {
  if (!keys) return [];
  if (!Array.isArray(keys)) keys = [keys];
  return keys
    .filter(d => /[\da-z]{8}(-?[\da-z]{4}){3}-?[\da-z]{12}/i.test(d))
    .map(d => {
      if (/^[\da-z]{32}$/i.test(d)) {
        d = [...d].map((s, index) => ([7, 11, 15, 19].includes(index) ? `${s}-` : s)).join('');
      }
      return d;
    });
}
