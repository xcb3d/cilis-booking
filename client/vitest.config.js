import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    reporter: 'verbose',
    logHeapUsage: true,
    outputFile: {
      json: './test-results.json',
    },
  },
});
