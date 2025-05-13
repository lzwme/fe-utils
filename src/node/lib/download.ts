import { basename, dirname, resolve } from 'node:path';
import { tmpdir, cpus } from 'node:os';
import { RequestOptions } from 'node:https';
import { type OutgoingHttpHeaders } from 'node:http';
import type { AnyObject } from '../../types';
import { concurrency } from '../../common/async';
import { fs } from '../fs-system';
import { Request } from './request';
import { NLogger } from './NLogger';
import { md5 } from '../crypto';

export interface DownloadOptions {
  url: string;
  /** 文件保存路径 */
  filepath?: string;
  params?: AnyObject;
  requestOptions?: RequestOptions;
  /** 文件已存在时是否仍强制继续下载。默认 flase */
  force?: boolean;
  /** 大文件分段下载时，分段的大小。单位 kB，应不小于 10 */
  segmentSize?: number;
  /** 大文件分段下载时，并行任务数。默认为 cpu 核数 */
  paralelism?: number;
  /** 下载进度回调。若返回 false 则取消下载 */
  onProgress?:
    | boolean
    | ((info: {
        size: number;
        downloaded: number;
        percent: number;
        /** bytes/s */
        speed: number;
        errmsg: string;
      }) => void | boolean);
}

export interface DownloadResult {
  /** 文件总大小 */
  size: number;
  /** 文件下载保存的路径 */
  filepath: string;
  /** 文件是否已存在（没有从网络下载） */
  isExist: boolean;
  /** 下载失败原因 */
  errmsg?: string;
}

/**
 * 文件下载。支持大文件并发分段下载
 *
 * @example
 * ```ts
 *  download({
 *    url: 'https://vscode.download.prss.microsoft.com/dbazure/download/stable/19e0f9e681ecb8e5c09d8784acaa601316ca4571/VSCodeUserSetup-x64-1.100.0.exe',
 *    onProgress(d) {
 *      NLogger.getLogger().logInline(`${d.size} ${d.downloaded} ${d.percent.toFixed(2)}% ${(d.speed / 1024 / 1024).toFixed(2)}MB/S`);
 *    },
 *  }).then(d => console.log(d));
 * ```
 */
export async function download(options: DownloadOptions): Promise<DownloadResult> {
  if (typeof options === 'string') options = { url: options };
  const request = new Request('', options.requestOptions?.headers as OutgoingHttpHeaders);
  const { req, res } = await request.req(options.url, options.params, { ...options.requestOptions, method: 'HEAD' });
  res.destroy();
  if (!options.filepath) {
    options.filepath = res.headers['content-disposition']
      ? decodeURIComponent(res.headers['content-disposition'].split('filename=')[1].trim().split(';')[0].replace(/['"]/g, ''))
      : basename(req.path.split('?')[0]);
  }

  const filepath = resolve(options.filepath);
  const segmentSize = Math.max(Number(options.segmentSize) || 512, 10) * 1024;
  const isSupportRange = !req.getHeader('range') && res.headers['accept-ranges'] === 'bytes';
  const startTime = Date.now();
  let contentLength = Number(res.headers['content-length']) || 0;
  let downloadedLen = 0;
  let cachedLen = 0;
  let isCanceled = false;
  const result: DownloadResult = {
    filepath,
    size: contentLength,
    isExist: false,
  };
  const onProgress = (errmsg = '') => {
    if (options.onProgress) {
      if (typeof options.onProgress === 'boolean') {
        options.onProgress = d => {
          NLogger.getLogger().logInline(`${d.size} ${d.downloaded} ${d.percent.toFixed(2)}% ${(d.speed / 1024 / 1024).toFixed(2)}MB/S`);
        };
      }

      const r = options.onProgress({
        size: contentLength,
        downloaded: downloadedLen + cachedLen,
        percent: contentLength ? Number((100 * (downloadedLen + cachedLen)) / contentLength) : -1,
        speed: (1000 * downloadedLen) / (Date.now() - startTime),
        errmsg,
      });

      if (r === false) {
        isCanceled = true;
        if (!result.errmsg) result.errmsg = '用户取消下载';
      }
    }
  };

  if (fs.existsSync(filepath)) {
    const stats = fs.statSync(filepath);

    if (!options.force && stats.isFile() && stats.size === contentLength) {
      result.isExist = true;
      return result;
    }
  }

  if (!fs.existsSync(dirname(filepath))) fs.mkdirSync(dirname(filepath));

  if (isSupportRange && contentLength > segmentSize * 2) {
    const segments = Math.ceil(contentLength / segmentSize);
    const tasks: (() => Promise<typeof result>)[] = [];
    const tmpDir = resolve(tmpdir(), `fe-utils-tmp`);
    const segmentMd5 = md5(options.url + segmentSize);

    for (let i = 0; i < segments; i++) {
      const start = segmentSize * i;
      const end = i + 1 === segments ? contentLength : (i + 1) * segmentSize - 1;
      const option: DownloadOptions = {
        ...options,
        requestOptions: {
          ...options.requestOptions,
          headers: {
            ...options.requestOptions?.headers,
            range: `bytes=${start}-${end}`,
          },
        },
        filepath: resolve(tmpDir, `${segmentMd5}-${i}`),
        onProgress: false,
      };

      tasks.push(() => {
        if (isCanceled) return Promise.resolve(result);
        return download(option).then(d => {
          if (d.isExist) cachedLen += end - start + 1;
          else downloadedLen += end - start + 1;
          onProgress();
          return d;
        });
      });
    }

    const r = await concurrency(tasks, Number(options.paralelism) || cpus().length);
    const tmpFiles = r.map(d => d.result.filepath);
    const writeStream = fs.createWriteStream(filepath);

    for (const fp of tmpFiles) {
      await new Promise((rs, rj) => {
        const readStream = fs.createReadStream(fp);
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', () => {
          fs.rm(fp, err => err && console.error('[download]删除临时文件失败', err));
          rs(true);
        });
        readStream.on('error', error => rj(error));
      });
    }
    writeStream.end();
  } else {
    const { res } = await request.req(options.url, options.params, options.requestOptions);
    const chunks: Buffer[] = [];
    contentLength = Number(res.headers['content-length']) || 0;
    await new Promise<void>(rs => {
      res.on('data', (buf: Buffer) => {
        downloadedLen += buf.byteLength;
        chunks.push(buf);
        onProgress();
      });
      res.on('end', rs).on('error', error => {
        console.error('[download]下载失败', error);
        result.errmsg = error.message;
      });
    });
    if (chunks.length && !result.errmsg) fs.writeFileSync(filepath, Buffer.concat(chunks));
    result.size = downloadedLen;
  }

  return result;
}
