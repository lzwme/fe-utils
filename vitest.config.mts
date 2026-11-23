import os from 'node:os';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/cjs/**', '**/esm/**'],
    maxWorkers: os.cpus().length,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.d.ts', 'src/cli.ts', 'src/index.ts'],
      reporter: ['text', 'json', 'html'],
    },
  },
});
