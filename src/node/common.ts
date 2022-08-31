import { color } from 'console-log-colors';
import { getLogger } from './get-logger';
import { formatTimeCost } from '../common/date';

/** 等待并获取用户输入内容 */
export async function readSyncByRl(tips = '> ') {
  const { createInterface } = await import('node:readline');
  return new Promise<string>(resolve => {
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
