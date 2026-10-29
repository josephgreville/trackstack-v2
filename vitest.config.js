import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  plugins: [react()],
  test: {
    projects: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/tests/**/*.test.js'],
          setupFiles: ['server/tests/setup.js'],
          fileParallelism: false,
          maxWorkers: 1,
          testTimeout: 15000,
        },
      },
      {
        plugins: [react()],
        esbuild: { jsx: 'automatic' },
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
