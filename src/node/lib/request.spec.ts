import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Request } from './request';

describe('node/lib/request', () => {
  let server: http.Server;
  let port = 0;
  const seen: { url?: string; host?: string; method?: string; body: string }[] = [];

  beforeAll(async () => {
    server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
      let body = '';
      req.on('data', chunk => (body += String(chunk)));
      req.on('end', () => {
        seen.push({ url: req.url, host: req.headers.host, method: req.method, body });
        if (req.url === '/redirect') {
          res.writeHead(302, { location: '/target' });
          res.end();
        } else if (req.url === '/bad-redirect') {
          res.writeHead(302, { location: 'http://127.0.0.1:1/' });
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

  it('GET with parameters puts them in the URL and sends no body', async () => {
    const request = new Request();
    const result = await request.get(`http://127.0.0.1:${port}/search`, { q: 'x' });
    result.response.resume();

    expect(seen[0].method).toBe('GET');
    expect(seen[0].url).toBe('/search?q=x');
    expect(seen[0].body).toBe('');
  });

  it('resolves a relative redirect and recomputes the host header', async () => {
    const request = new Request();
    const { res } = await request.req(`http://127.0.0.1:${port}/redirect`);
    res.resume();

    expect(seen.map(d => d.url)).toEqual(['/redirect', '/target']);
    expect(seen[1].host).toBe(`127.0.0.1:${port}`);
  });

  it('rejects instead of hanging when the redirect target is unreachable', async () => {
    const request = new Request();
    const settled = await Promise.race([
      request.req(`http://127.0.0.1:${port}/bad-redirect`).then(
        () => 'resolved',
        () => 'rejected'
      ),
      new Promise<string>(resolve => setTimeout(() => resolve('timeout'), 2000)),
    ]);

    expect(settled).toBe('rejected');
  });
});
