import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Two Vitest environments, two runners never merged (02-VALIDATION.md, Wave 0):
// Playwright owns tests/visual/** with its own playwright.config.ts.
const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Matches tsconfig.json paths: `@/*` resolves to `./src/*` in both toolchains.
      '@': srcDir,
    },
  },
  test: {
    exclude: ['tests/visual/**', 'node_modules/**', 'dist/**'],
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['tests/unit/scripts/**'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: [
            'tests/unit/primitives/**',
            'tests/unit/overlays/**',
            'tests/unit/motion/**',
          ],
        },
      },
    ],
  },
});
