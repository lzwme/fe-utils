/*
 * @Author: lzw
 * @Date: 2022-04-08 10:30:02
 * @LastEditors: lzw
 * @LastEditTime: 2022-11-15 16:16:45
 * @Description:
 */
/* eslint no-console: 0 */

import { type GeneralFn } from '../types';
import { safeStringify } from './objects';

/** 日志级别 */
export enum LogLevel {
  error,
  silent,
  warn,
  info,
  log,
  debug,
}

export interface LoggerOptions {
  /** 日志保存的目录位置。默认为空，则不保存至文件 */
  logDir?: string;
  /** 历史日志文件有效天数。默认为 7 天。设置为 0 则不自动清理 */
  validityDays?: number;
  /** 是否为静默模式。为 true 则不打印至控制台 */
  silent?: boolean;
  /** 是否为调试模式。为 true 控制台打印为对象格式的日志 */
  debug?: boolean;
  /** 日志级别 */
  levelType?: LogLevelType;
  /** 通过外部注入 color 能力 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  color?: Record<string, any>;
}

export type LogLevelType = keyof typeof LogLevel;

const defaultOptions: LoggerOptions = {
  levelType: 'log',
  debug: false,
  silent: false,
  logDir: '',
  color: void 0,
};

let headTipColored = false;
const LogLevelHeadTip = {
  error: ['[ERROR]', 'redBright'],
  warn: ['[WARN]', 'yellowBright'],
  info: ['[INFO]', 'blueBright'],
  log: ['[LOG]', 'cyanBright'],
  debug: ['[DEBUG]', 'gray'],
} as const;

export class Logger {
  public static map: { [tag: string]: Logger } = {};
  /** 日志记录级别 */
  private level: LogLevel = LogLevel.log;

  public silent: GeneralFn = this._log.bind(this, 'error');
  public error: GeneralFn = this._log.bind(this, 'error');
  public warn: GeneralFn = this._log.bind(this, 'warn');
  public info: GeneralFn = this._log.bind(this, 'info');
  public log: GeneralFn = this._log.bind(this, 'log');
  public debug: GeneralFn = this._log.bind(this, 'debug');

  /** 日志路径 */
  protected logPath = '';
  protected logDir = '';
  /** 本机与服务器时间的差值 diff = Date.now() - serverTime */
  private static serverTimeDiff = 0;

  /** 记录日志的次数 */
  private times = 0;

  constructor(protected tag: string, protected options: LoggerOptions = {}) {
    const match = /(\w+)/.exec(tag);
    if (!match) throw 'Logger tag expected';
    this.tag = tag;

    if (!options.levelType || !(options.levelType in LogLevel)) {
      if (process.env.FE_LOG_LEVEL) options.levelType = process.env.FE_LOG_LEVEL as LogLevelType;
    }

    this.updateOptions(options);
  }
  public setLogDir(_logDir: string) {
    // todo: node.js 下可扩展该方法
    console.warn('该接口方法未实现', _logDir);
  }
  /**
   * 写入到日志文件。
   */
  protected writeToFile(_msg: string) {
    // todo: node.js 下可扩展该方法
  }
  /** 更新服务器时间，计算时间差并返回 */
  static setServerTime(serverTime: number) {
    if (!serverTime) return 0;
    Logger.serverTimeDiff = Date.now() - serverTime;
    return Logger.serverTimeDiff;
  }
  public getSeverTime(): number;
  public getSeverTime(toDate: true): Date;
  public getSeverTime(toDate?: boolean) {
    const now = Date.now() - Logger.serverTimeDiff;
    if (toDate === true) return new Date(now);
    return now;
  }

  private _log(type: LogLevelType, ...args: unknown[]) {
    const lvl = LogLevel[type];

    if (lvl <= this.level) {
      this.times++;
      const now = this.getSeverTime(true);
      const curTime = now.toTimeString().slice(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const msg = args.map(s => (typeof s === 'string' ? s : safeStringify(s))).join(' ');

      if (this.writeToFile) this.writeToFile(`[${curTime}]${this.tag}[${type}] ${msg}\n`);
      if (this.options.silent || type === 'silent') return;

      if (console[type]) {
        let header = `[${curTime}]${this.tag}`;
        if (this.options.color) {
          header = this.options.color.greenBright(header);
        }

        if (lvl === LogLevel.debug) header += `[${this.times}]`;
        if (LogLevelHeadTip[type]) {
          header = LogLevelHeadTip[type][0] + header;
        }

        if (!this.options.debug && type !== 'debug') console[type](header, msg);
        else console[type](header, ...args);
      }
    }
  }
  public updateOptions(options: LoggerOptions) {
    if (!headTipColored && options.color) {
      for (const value of Object.values(LogLevelHeadTip)) {
        const [tag, colorType] = value;
        if (options.color[colorType]) {
          // @ts-ignore
          value[0] = options.color[colorType](tag);
          headTipColored = true;
        }
      }
    }

    this.options = Object.assign({}, defaultOptions, this.options);

    for (const key in options) {
      if (key in defaultOptions) {
        if (key === 'logDir') {
          if (null == options.logDir) continue;
          this.setLogDir(options.logDir);
        }
        // @ts-ignore
        this.options[key] = options[key];
      }
    }

    if (options.levelType && options.levelType in LogLevel) this.level = LogLevel[options.levelType];

    return this;
  }

  public static getLogger(tag?: string, options?: LoggerOptions): Logger {
    if (!tag) tag = '[general]';
    if (!Logger.map[tag]) Logger.map[tag] = new Logger(tag, options);
    else if (options) Logger.map[tag].updateOptions(options);
    return Logger.map[tag];
  }
}
