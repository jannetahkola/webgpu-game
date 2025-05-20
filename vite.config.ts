import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2023',
  },
  test: {
    setupFiles: ['./tests/test-setup.ts'],
    globals: true,
    silent: 'passed-only',
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.ts'],
    },
  },
});
