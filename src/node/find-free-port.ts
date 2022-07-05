/**
 * Starting at the `start` port, look for a free port incrementing
 * by 1 until `end` inclusive. If no port is found error is thrown.
 *
 * @param {number} start
 * @param {number} end
 * @param {number} port
 * @returns {Promise<number>}
 * @throws
 */
export async function findFreePort(start = 3000, end = 99_999, port = 0) {
  const http = await import('http');
  return new Promise<number>(resolve => {
    if (!port || port < start) port = start;
    if (port > end) {
      throw new Error(`Could not find free port in range: ${start}-${end}`);
    }

    const server = http.createServer();
    server
      .listen(port, () => {
        server.close();
        resolve(port);
      })
      .on('error', () => {
        resolve(findFreePort(start, end, port + 1));
      });
  });
}
