import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2023',
  },
  test: {
    setupFiles: [
      './tests/webgpu-setup.ts',
      './tests/vitest-extensions-setup.ts',
    ],
    globals: true,
    silent: 'passed-only',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.ts'],
      reportOnFailure: true,
    },
  },
});
