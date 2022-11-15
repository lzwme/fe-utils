/*
 * @Author: lzw
 * @Date: 2022-04-08 10:30:02
 * @LastEditors: lzw
 * @LastEditTime: 2022-11-15 16:21:29
 * @Description:
 */
/* eslint no-console: 0 */
import path, { resolve } from 'node:path';
import type { WriteStream } from 'node:fs';
import { clearScreenDown, cursorTo } from 'node:readline';
import { fs } from '../fs-system';
import { Logger, type LoggerOptions } from '../../common/Logger';
import { dirname } from 'node:path';

const fsStreamCache: { [logPath: string]: WriteStream } = {};

/** 用于 Node.js 中的 logger 模块 */
export class NLogger extends Logger {
  public static map: { [tag: string]: NLogger } = {};

  constructor(tag: string, options: LoggerOptions = {}) {
    super(tag, options);
    if (!this.options.validityDays) this.options.validityDays = 7;
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
    } else {
      this.cleanup(this.options.validityDays).then(count => {
        if (count) this.log(`log cleanup:`, count);
      });
    }

    this.logDir = logDir;
    this.logPath = logPath;
  }

  /** 历史日志清理 */
  async cleanup(validityDays = 7, logDir?: string): Promise<number> {
    let count = 0;

    if (!logDir && this.options.logDir) logDir = this.options.logDir;
    if (logDir && logDir.endsWith('.log')) logDir = dirname(logDir);
    if (+validityDays < 1 || !logDir || !fs.existsSync(logDir)) return count;

    const list = await fs.promises.readdir(logDir);
    const shelfLifeMs = validityDays * 86_400_000; // 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (let filepath of list) {
      filepath = resolve(logDir, filepath);
      const stats = await fs.promises.stat(filepath);
      if (stats.isDirectory()) count += await this.cleanup(validityDays, filepath);
      else if (stats.isFile() && now - stats.mtimeMs > shelfLifeMs) {
        fs.promises.unlink(filepath);
        count++;
      }
    }

    return count;
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

  public logInline(msg: string, start = 0) {
    cursorTo(process.stdout as never, start);
    clearScreenDown(process.stdout as never);
    process.stdout.write(msg, 'utf8');
  }

  public static getLogger(tag?: string, options?: LoggerOptions): NLogger {
    if (!tag) tag = '[general]';
    if (!NLogger.map[tag]) NLogger.map[tag] = new NLogger(tag, options);
    else if (options) NLogger.map[tag].updateOptions(options);
    return NLogger.map[tag];
  }
}
