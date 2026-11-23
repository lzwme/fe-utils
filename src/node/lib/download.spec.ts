import fs from 'node:fs';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { download } from './download';

describe('node/lib/download', () => {
  let server: http.Server;
  let port = 0;

  beforeAll(async () => {
    server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
      if (req.url === '/truncated') {
        res.writeHead(200, { 'content-length': '100', 'accept-ranges': 'none' });
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        // 先确保响应头与部分数据已发出，再断开连接，模拟传输中途中断
        res.write('short', () => req.socket.destroy());
        return;
      }

      if (req.url === '/cancel') {
        res.writeHead(200, { 'content-length': '100', 'accept-ranges': 'none' });
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        res.write('a'.repeat(20));
        setTimeout(() => res.end(), 50);
        return;
      }

      res.writeHead(200, { 'content-length': '5', 'accept-ranges': 'none' });
      res.end(req.method === 'HEAD' ? undefined : 'hello');
    });
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>(done => server.close(() => done()));
  });

  const tempPath = (name: string) => resolve(tmpdir(), `fe-utils-download-test-${name}-${Date.now()}.txt`);

  it('does not write a truncated file when the connection drops early', async () => {
    const filepath = tempPath('truncated');
    try {
      const result = await download({ url: `http://127.0.0.1:${port}/truncated`, filepath });
      // 应以错误结束而不是挂起，且不能把部分数据当作完整文件落盘
      expect(result.errmsg).toBeTruthy();
      expect(fs.existsSync(filepath)).toBe(false);
    } finally {
      if (fs.existsSync(filepath)) fs.rmSync(filepath, { force: true });
    }
  });

  it('stops and writes nothing when onProgress cancels', async () => {
    const filepath = tempPath('cancel');
    try {
      const result = await download({
        url: `http://127.0.0.1:${port}/cancel`,
        filepath,
        onProgress: () => false,
      });
      expect(result.errmsg).toBeTruthy();
      expect(fs.existsSync(filepath)).toBe(false);
    } finally {
      if (fs.existsSync(filepath)) fs.rmSync(filepath, { force: true });
    }
  });

  it('writes a complete file on a normal single-stream download', async () => {
    const filepath = tempPath('normal');
    try {
      const result = await download({ url: `http://127.0.0.1:${port}/normal`, filepath });
      expect(result.errmsg).toBeFalsy();
      expect(fs.readFileSync(filepath, 'utf8')).toBe('hello');
    } finally {
      if (fs.existsSync(filepath)) fs.rmSync(filepath, { force: true });
    }
  });
});
