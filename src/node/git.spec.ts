import { getGitLog, isGitRepo } from './git';

let exists = true;
let execSyncResult = '';

jest.mock('node:fs', () => ({
  existsSync: (_filepath: string) => {
    // console.log(_filepath, exists);
    return exists;
  },
  readFileSync: () => '',
}));
jest.mock('node:child_process', () => ({
  execSync: (cmd: string) => {
    if (cmd.includes('git log')) {
      return [
        `a5840084eae998ee4a33ad091d004b9f856c1140`,
        `a584008 _-_ ea936e476429e71abae4d2b92b95331414116e15 _-_ ea936e4 _-_ 3013cd5`,
        `3013cd5a74bbfbab88cc9a0d9adbed745aee80d8 _-_ 2022-11-20 18:56:29 +0800 _-_ 2022-11-20 18:56:29 +0800`,
        `renxia _-_ no@lzw.me _-_ no@lzw.me`,
        `chore: update dependencies`,
        `2 days ago`,
        `2 days ago`,
      ]
        .join(' _-_ ')
        .trim();
    }

    if (execSyncResult) throw new Error(execSyncResult);
    return '';
  },
}));

describe('git.ts', () => {
  it('isGitRepo', () => {
    expect(isGitRepo()).toBeTruthy();

    exists = false;
    execSyncResult = 'isGitRepo exec error';
    expect(isGitRepo()).toBeTruthy();
    expect(isGitRepo(process.cwd(), false)).toBeFalsy();

    exists = false;
    expect(isGitRepo('abc')).toBeFalsy();
  });

  it('getGitLog', () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const is = (a: unknown, b: unknown) => expect(a).toBe(b);

    const res = getGitLog(1, process.cwd());
    is(res.length, 1);
    is(res[0]!.s!.length > 0, true);

    is(getGitLog().length, 1);
    is(getGitLog(3).length, 1);
  });
});
