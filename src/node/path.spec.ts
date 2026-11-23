import { fixToshortPath, normalizePath } from './path';

describe('node/path', () => {
  console.log = vi.fn();
  console.error = vi.fn();

  it('fixToshortPath', () => {
    expect(fixToshortPath()).toBe('');
    expect(fixToshortPath('./abc\\d.ts')).toBe('abc/d.ts');
  });

  it('normalizePath', () => {
    expect(normalizePath('')).toBe('');
    expect(normalizePath('c:\\abc\\def\\g.ts')).toBe('c:/abc/def/g.ts');
  });
});
