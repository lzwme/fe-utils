import { getGitLog, isGitRepo, getHeadBranch, getHeadCommitId, getHeadDiffFileList, getUserEmail, setChmod } from './git';
import cp from 'node:child_process';
import fs from 'node:fs';

const gitLogLine = [
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

jest.mock(
  'node:fs',
  jest.fn(() => ({
    existsSync: jest.fn((_filepath: string) => true),
    readFileSync: jest.fn(() => ''),
  }))
);
jest.mock(
  'node:child_process',
  jest.fn(() => ({
    execSync: jest.fn((cmd: string) => {
      if (cmd.includes('git log')) return gitLogLine;
      return '';
    }),
  }))
);

const cpMocked = cp as never as jest.Mocked<typeof cp>;
const fsMocked = fs as never as jest.Mocked<typeof fs>;

describe('git.ts', () => {
  it('getGitLog', () => {
    const res = getGitLog(1, process.cwd());

    expect(res.length).toBe(1);
    expect(res[0]!.s!.length > 0).toBeTruthy();
    expect(getGitLog().length).toBe(1);

    cpMocked.execSync.mockImplementationOnce(() => [gitLogLine, gitLogLine, gitLogLine].join('\n'));
    expect(getGitLog(3).length).toBe(3);
  });

  it('getHeadBranch', () => {
    let mockBranch = 'abc';

    // from env
    process.env.CI_COMMIT_REF_NAME = mockBranch;
    expect(getHeadBranch()).toBe(mockBranch);
    expect(getHeadBranch('.')).toBe(mockBranch);
    process.env.CI_COMMIT_REF_NAME = '';

    // from file
    mockBranch = 'main';
    fsMocked.readFileSync.mockImplementationOnce(() => `refs/heads/${mockBranch}`);
    expect(getHeadBranch()).toBe(mockBranch);

    // from cmd: git rev-parse
    mockBranch = 'master';
    cpMocked.execSync.mockImplementationOnce(() => mockBranch);
    expect(getHeadBranch()).toBe(mockBranch);

    // empty
    cpMocked.execSync.mockImplementationOnce(() => '');
    expect(getHeadBranch()).toBe('');
  });

  it('getHeadCommitId', () => {
    expect(getHeadCommitId(true)).toBe('');

    const mockedId = 'abcdef';
    cpMocked.execSync.mockImplementationOnce(() => mockedId);
    expect(getHeadCommitId()).toBe(mockedId);

    cpMocked.execSync.mockImplementationOnce(() => mockedId);
    expect(getHeadCommitId(false)).toBe(mockedId);
  });

  it('getHeadDiffFileList', () => {
    expect(getHeadCommitId(true)).toBe('');

    const mockedId = `abcdef.ts\ncef.js`;
    const mockedFileList = mockedId.split('\n');

    cpMocked.execSync.mockImplementationOnce(() => mockedId);
    expect(getHeadDiffFileList().length).toBe(mockedFileList.length);

    cpMocked.execSync.mockImplementationOnce(() => mockedId);
    expect(getHeadDiffFileList(1, '.', true)).toEqual(mockedFileList);
  });

  it('getUserEmail', () => {
    expect(getUserEmail()).toBe('');

    const mockedId = 'webmaster@lzw.me';
    cpMocked.execSync.mockImplementationOnce(() => mockedId);
    expect(getUserEmail()).toBe(mockedId);
  });

  it('setChmod', () => {
    expect(setChmod('abc').stdout).toBe('');
  });

  it('isGitRepo', () => {
    expect(isGitRepo()).toBeTruthy();

    cpMocked.execSync.mockImplementationOnce(() => {
      throw new Error('isGitRepo exec error');
    });
    fsMocked.existsSync.mockImplementationOnce(jest.fn(() => false));

    // use cache
    expect(isGitRepo()).toBeTruthy();

    // no cache
    expect(isGitRepo(process.cwd(), false)).toBeFalsy();
    // use cache
    expect(isGitRepo()).toBeFalsy();

    // (reseted)no cache
    expect(isGitRepo('.', false)).toBeTruthy();
  });
});
