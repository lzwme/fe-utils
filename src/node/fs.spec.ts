import { resolve } from 'node:path';
import { fs } from './fs-system';
import { rmrf, mkdirp, outputFile, outputFileSync, readJsonFile, readJsonFileSync, copyDir, rmEmptyDir, findFiles } from './fs';

describe('fs utils', () => {
  const testDir = resolve(__dirname, '.test-fs');
  const testFile = resolve(testDir, 'test.txt');
  const testJson = resolve(testDir, 'test.json');

  beforeEach(() => {
    rmrf(testDir);
    mkdirp(testDir);
  });

  afterAll(() => {
    rmrf(testDir);
  });

  describe('rmrf', () => {
    it('should remove file', () => {
      outputFileSync(testFile, 'test');
      expect(fs.existsSync(testFile)).toBe(true);
      rmrf(testFile);
      expect(fs.existsSync(testFile)).toBe(false);
    });

    it('should remove directory recursively', () => {
      const subDir = resolve(testDir, 'sub');
      const subFile = resolve(subDir, 'test.txt');
      mkdirp(subDir);
      outputFileSync(subFile, 'test');
      expect(fs.existsSync(subDir)).toBe(true);
      rmrf(testDir);
      expect(fs.existsSync(testDir)).toBe(false);
    });
  });

  describe('mkdirp', () => {
    it('should create directory recursively', () => {
      const deepDir = resolve(testDir, 'a/b/c');
      expect(fs.existsSync(deepDir)).toBe(false);
      mkdirp(deepDir);
      expect(fs.existsSync(deepDir)).toBe(true);
    });

    it('should return false if path exists as file', () => {
      outputFileSync(testFile, 'test');
      expect(mkdirp(testFile)).toBe(false);
    });
  });

  describe('outputFile', () => {
    it('should create file with directories', async () => {
      const deepFile = resolve(testDir, 'a/b/c/test.txt');
      await outputFile(deepFile, 'test');
      expect(fs.existsSync(deepFile)).toBe(true);
      expect(fs.readFileSync(deepFile, 'utf8')).toBe('test');
    });
  });

  describe('readJsonFile', () => {
    const testData = { test: 'data' };

    beforeEach(() => {
      outputFileSync(testJson, JSON.stringify(testData));
    });

    it('should read JSON file async', async () => {
      const data = await readJsonFile(testJson);
      expect(data).toEqual(testData);
    });

    it('should read JSON file sync', () => {
      const data = readJsonFileSync(testJson);
      expect(data).toEqual(testData);
    });
  });

  describe('copyDir', () => {
    const srcDir = resolve(testDir, 'src');
    const destDir = resolve(testDir, 'dest');

    beforeEach(() => {
      mkdirp(srcDir);
      outputFileSync(resolve(srcDir, 'test.txt'), 'test');
      outputFileSync(resolve(srcDir, 'test.json'), '{"test":"data"}');
    });

    it('should copy directory with filter', () => {
      copyDir(srcDir, destDir, (f, s) => s.isDirectory() || !f.endsWith('.json'));
      expect(fs.existsSync(resolve(destDir, 'test.txt'))).toBe(true);
      expect(fs.existsSync(resolve(destDir, 'test.json'))).toBe(false);
    });
  });

  describe('findFiles', () => {
    beforeEach(() => {
      const deepDir = resolve(testDir, 'findFiles/b/c');
      outputFileSync(resolve(testDir, 'test1.txt'), 'test1');
      outputFileSync(resolve(deepDir, 'test2.txt'), 'test2');
    });

    it('should find files with validate function', () => {
      const files = findFiles(resolve(testDir));
      expect(files.length).toBe(2);
      expect(files.every(f => f.endsWith('.txt'))).toBe(true);
    });

    it('should respect file limit', () => {
      const files = findFiles(testDir, undefined, 1);
      expect(files.length).toBe(1);
    });
  });

  describe('rmEmptyDir', () => {
    it('should remove empty directories', () => {
      const deepDir = resolve(testDir, 'rmEmptyDir/b/c');
      mkdirp(deepDir);
      expect(fs.existsSync(testDir)).toBe(true); // root dir remains
      rmEmptyDir(testDir);
      expect(fs.existsSync(deepDir)).toBe(false);
    });

    it('should not remove non-empty directories', () => {
      const deepDir = resolve(testDir, 'a/b/c');
      mkdirp(deepDir);
      outputFileSync(resolve(deepDir, 'test.txt'), 'test');
      rmEmptyDir(testDir);
      expect(fs.existsSync(deepDir)).toBe(true);
    });
  });
});
