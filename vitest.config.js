import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/tests/**/*.test.js'],
          setupFiles: ['server/tests/setup.js'],
          fileParallelism: false,
          testTimeout: 15000,
        },
      },
      {
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['client/src/tests/**/*.test.{js,jsx}'],
          setupFiles: ['client/src/test/setup.js'],
          css: false,
        },
      },
    ],
  },
});