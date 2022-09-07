import { createFilePathFilter } from './createFilePathFilter';
import { isMatch } from 'micromatch';

describe('createFilePathFilter', () => {
  it('options empty', () => {
    const fileList = ['abc/def/abc.ts', 'abc', 'def.js', 'readme.md', ''] as const;
    const r = createFilePathFilter();

    expect(fileList.filter(d => r(d)).length).toBe(fileList.length);
  });

  it('options.extensions', () => {
    const fileList = ['abc/def/abc.ts', 'abc', 'def.js', 'readme.md', '', null, '\0abc.ts'] as const;
    const r = createFilePathFilter({
      extensions: ['ts', '.abc'],
    });

    expect(r(fileList[0])).toBeTruthy();
    expect(r(fileList[1])).toBeFalsy();
    expect(r(fileList[2])).toBeFalsy();
    expect(fileList.filter(d => r(d)).length === 1).toBeTruthy();
  });

  it('options.include', () => {
    const fileList = ['abc/def/abc.ts', 'abc', 'def.js', 'readme.md', ''] as const;
    const r = createFilePathFilter({
      include: ['abc'],
    });

    expect(r(fileList[0])).toBeTruthy();
    expect(r(fileList[1])).toBeTruthy();
    expect(r(fileList[2])).toBeFalsy();
  });

  it('options.exclude', () => {
    const fileList = ['abc/def/abc.ts', 'abc', 'def.js', 'readme.md', ''] as const;
    const r = createFilePathFilter({
      exclude: ['abc'],
    });

    expect(r(fileList[0])).toBeFalsy();
    expect(r(fileList[1])).toBeFalsy();
    expect(r(fileList[2])).toBeTruthy();
  });

  it('options.globMatcher.include', () => {
    const fileList = ['abc/def/abc.ts', 'abc', 'def.js', 'readme.md', ''] as const;
    const r = createFilePathFilter({
      include: ['**/*.{ts,js}'],
      resolve: false,
      globMatcher: (pathId, ruleIdNormalized) => isMatch(pathId, ruleIdNormalized, { dot: true }),
    });

    expect(r(fileList[0])).toBeTruthy();
    expect(r(fileList[1])).toBeFalsy();
    expect(r(fileList[2])).toBeTruthy();
    expect(r(fileList[3])).toBeFalsy();
  });

  it('options.globMatcher.exclude', () => {
    const fileList = ['abc/def/abc.ts', 'abc', 'def.js', 'readme.md', '/abcd'] as const;
    const r = createFilePathFilter({
      exclude: ['**/*.{ts,js}', /\.ts$/],
      resolve: process.cwd(),
      globMatcher: (pathId, ruleIdNormalized) => isMatch(pathId, ruleIdNormalized, { dot: true }),
    });

    expect(r(fileList[0])).toBeFalsy();
    expect(r(fileList[1])).toBeTruthy();
    expect(r(fileList[2])).toBeFalsy();
    expect(r(fileList[3])).toBeTruthy();

    expect(fileList.filter(d => r(d)).length > 1).toBeTruthy();

    expect(r('/abc/def.ts')).toBeFalsy();
  });
});
