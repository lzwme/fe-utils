import cp from 'node:child_process';
import fs from 'node:fs';
import { resolve } from 'node:path';
import type { Mocked } from 'vitest';
import { getGitLog, getHeadBranch, getHeadCommitId, getHeadDiffFileList, getUserEmail, gitGetTopDir, gitSetChmod, isGitRepo } from './git';

const { gitLogLine } = vi.hoisted(() => ({
  gitLogLine: [
    `a5840084eae998ee4a33ad091d004b9f856c1140`,
    `a584008 _-_ ea936e476429e71abae4d2b92b95331414116e15 _-_ ea936e4 _-_ 3013cd5`,
    `3013cd5a74bbfbab88cc9a0d9adbed745aee80d8 _-_ 2022-11-20 18:56:29 +0800 _-_ 2022-11-20 18:56:29 +0800`,
    `renxia _-_ no@lzw.me _-_ no@lzw.me`,
    `chore: update dependencies`,
    `2 days ago`,
    `2 days ago`,
  ]
    .join(' _-_ ')
    .trim(),
}));

vi.mock('node:fs', () => {
  const mockFs = {
    existsSync: vi.fn((_filepath: string) => true),
    readFileSync: vi.fn(() => ''),
  };
  return { default: mockFs, ...mockFs };
});
vi.mock('node:child_process', () => {
  const mockCp = {
    execSync: vi.fn((cmd: string) => {
      if (cmd.includes('git log')) return gitLogLine;
      return '';
    }),
  };
  return { default: mockCp, ...mockCp };
});

const cpMocked = cp as never as Mocked<typeof cp>;
const fsMocked = fs as never as Mocked<typeof fs>;

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

  it('gitSetChmod', () => {
    expect(gitSetChmod('abc').stdout).toBe('');
  });

  it('isGitRepo', () => {
    expect(isGitRepo()).toBeTruthy();

    cpMocked.execSync.mockImplementationOnce(() => {
      throw new Error('isGitRepo exec error');
    });
    fsMocked.existsSync.mockImplementationOnce(vi.fn(() => false));

    // use cache
    expect(isGitRepo()).toBeTruthy();

    // no cache
    expect(isGitRepo(process.cwd(), false)).toBeFalsy();
    // use cache
    expect(isGitRepo()).toBeFalsy();

    // (reseted)no cache
    expect(isGitRepo('.', false)).toBeTruthy();
  });

  it('gitGetTopDir returns the repo root rather than cwd', () => {
    cpMocked.execSync.mockReturnValueOnce('/repo/root\n');
    expect(gitGetTopDir(resolve('/repo/packages/app'))).toBe(resolve('/repo/root'));
  });
});
