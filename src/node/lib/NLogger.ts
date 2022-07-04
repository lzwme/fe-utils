/*
 * @Author: lzw
 * @Date: 2022-04-08 10:30:02
 * @LastEditors: lzw
 * @LastEditTime: 2022-06-28 22:02:06
 * @Description:
 */
/* eslint no-console: 0 */
import fs from 'fs';
import path from 'path';
import { Logger, type LoggerOptions } from '../../common/Logger';

const fsStreamCache: { [logPath: string]: fs.WriteStream } = {};

/** 用于 Node.js 中的 logger 模块 */
export class NLogger extends Logger {
  public static map: { [tag: string]: NLogger } = {};

  constructor(tag: string, options: LoggerOptions = {}) {
    super(tag, options);
  }
  public override setLogDir(logDir: string) {
    if (!logDir || !fs?.createWriteStream) return;

    let logPath = logDir;

    if (logDir.endsWith('.log')) {
      logDir = path.dirname(logDir);
    } else {
      const curTime = new Date().toISOString().slice(0, 10).replace(/\D/g, '');
      logPath = path.resolve(logDir, `${this.tag.replace(/[^\dA-Za-z]/g, '')}_${curTime}.log`);
    }

    if (logPath === this.logPath) return;

    const logFsStream = fsStreamCache[this.logPath];
    if (logFsStream) {
      logFsStream.close();
      delete fsStreamCache[this.logPath];
    }

    this.logDir = logDir;
    this.logPath = logPath;
  }
  /**
   * 写入到日志文件
   * @todo 增加分包支持
   */
  protected override writeToFile(msg: string) {
    if (!this.logPath) return;
    let logFsStream = fsStreamCache[this.logPath];
    if (!logFsStream || logFsStream.destroyed) {
      if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir, { recursive: true });
      logFsStream = fs.createWriteStream(this.logPath, { encoding: 'utf8', flags: 'a' });
      fsStreamCache[this.logPath] = logFsStream;
    }
    // eslint-disable-next-line no-control-regex
    logFsStream.write(msg.replace(/\u001B\[\d+m/g, ''), 'utf8');
  }

  public static getLogger(tag?: string, options?: LoggerOptions): NLogger {
    if (!tag) tag = '[general]';
    if (!NLogger.map[tag]) NLogger.map[tag] = new NLogger(tag, options);
    else if (options) NLogger.map[tag].updateOptions(options);
    return NLogger.map[tag];
  }
}
