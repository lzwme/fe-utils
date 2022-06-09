/*
 * @Author: lzw
 * @Date: 2022-04-08 10:30:02
 * @LastEditors: lzw
 * @LastEditTime: 2022-06-09 22:09:01
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
  public setLogDir(logDir: string) {
    if (!logDir || !fs?.createWriteStream) return;
    if (logDir === this.logDir) return;
    this.logDir = logDir;

    const logFsStream = fsStreamCache[this.logPath];
    if (logFsStream) {
      logFsStream.destroy();
      delete fsStreamCache[this.logPath];
    }

    if (logDir.endsWith('.log')) {
      this.logPath = logDir;
      this.logDir = path.dirname(logDir);
    } else {
      const curTime = new Date().toTimeString().slice(0, 8).replace(/\D/g, '');
      this.logPath = path.resolve(logDir, `${this.tag.replace(/[^\dA-Za-z]/g, '')}_${curTime}.log`);
    }
  }
  /**
   * 写入到日志文件
   * @todo 增加分包支持
   */
  protected writeToFile(msg: string) {
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
