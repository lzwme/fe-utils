import { isGitRepo } from './git';

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
  execSync: () => {
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
});
