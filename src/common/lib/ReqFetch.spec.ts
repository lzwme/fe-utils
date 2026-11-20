import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { ReqFetch } from './ReqFetch';

describe('common/lib/ReqFetch', () => {
  let server: http.Server;
  let port = 0;
  const seen: { url?: string; method?: string; body: string }[] = [];

  beforeAll(async () => {
    server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
      let body = '';
      req.on('data', chunk => (body += String(chunk)));
      req.on('end', () => {
        seen.push({ url: req.url, method: req.method, body });
        if (req.url === '/redirect') {
          res.writeHead(302, { location: '/target' });
          res.end();
        } else {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end('{"ok":true}');
        }
      });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  beforeEach(() => {
    seen.length = 0;
  });

  it('GET with parameters sends no body', async () => {
    const req = new ReqFetch();
    const response = await req.req(`http://127.0.0.1:${port}/search?q=x`);
    await response.arrayBuffer();

    expect(seen[0].method).toBe('GET');
    expect(seen[0].body).toBe('');
  });

  it('resolves a relative redirect based on the current URL', async () => {
    const req = new ReqFetch();
    const response = await req.req(`http://127.0.0.1:${port}/redirect`);
    await response.arrayBuffer();

    expect(seen.map(d => d.url)).toEqual(['/redirect', '/target']);
  });

  it('rejects a relative URL without baseURL with a clear error', async () => {
    await expect(new ReqFetch().get('/relative')).rejects.toThrow(/baseURL/);
  });
});
