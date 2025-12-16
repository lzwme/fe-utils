/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */

import { execFilePromisfy, execSync } from './exec';
import { tryKillProcess } from './ps';

jest.mock('./exec');

describe('node/ps tryKillProcess', () => {
  afterEach(() => jest.resetAllMocks());

  it('rejects unsafe name', async () => {
    const ef = execFilePromisfy as jest.MockedFunction<typeof execFilePromisfy>;

    await tryKillProcess({ name: 'bad;rm -rf /' });

    expect(ef).not.toHaveBeenCalled();
  });

  it('uses pgrep and kill on unix', async () => {
    if (process.platform === 'win32') return; // skip on windows
    const ef = execFilePromisfy as jest.MockedFunction<any>;
    ef.mockImplementation(async (cmd: string) => {
      if (cmd === 'pgrep') return { error: null, stdout: '123\n', stderr: '', code: 0 };
      return { error: null, stdout: '', stderr: '', code: 0 };
    });

    await tryKillProcess({ name: 'safe-name.exe' });

    expect(ef).toHaveBeenCalled();
    expect(ef.mock.calls[0][0]).toBe('pgrep');
    expect(ef.mock.calls[0][1]).toEqual(['-f', 'safe-name']);
    // a subsequent call to kill should be made
    expect(ef.mock.calls.some((c: any) => c[0] === 'kill')).toBe(true);
  });

  it('uses taskkill on windows', async () => {
    if (process.platform !== 'win32') return; // skip on non-windows
    const es = execSync as jest.MockedFunction<any>;
    es.mockReturnValue({ stdout: 'notepad.exe' });
    const ef = execFilePromisfy as jest.MockedFunction<any>;
    ef.mockResolvedValue({ error: null, stdout: '', stderr: '', code: 0 });

    await tryKillProcess({ name: 'notepad.exe' });

    expect(es).toHaveBeenCalledWith('tasklist');
    expect(ef).toHaveBeenCalledWith('taskkill', ['/F', '/T', '/IM', 'notepad.exe'], true);
  });
});
