import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Two Vitest environments, two runners never merged (02-VALIDATION.md, Wave 0):
// Playwright owns tests/visual/** with its own playwright.config.ts.
const srcDir = fileURLToPath(new URL('./src', import.meta.url));
const serverOnlyStub = fileURLToPath(new URL('./tests/unit/stubs/server-only.ts', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Matches tsconfig.json paths: `@/*` resolves to `./src/*` in both toolchains.
      '@': srcDir,
      // The `server-only` package is not installed; workspace.ts imports it and
      // the jsdom project cannot resolve it at transform time even with vi.mock.
      'server-only': serverOnlyStub,
    },
  },
  test: {
    exclude: ['tests/visual/**', 'node_modules/**', 'dist/**'],
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          // `tests/unit/scripts/**` is the codegen/check tooling; the top-level
          // `.test.ts` glob owns non-component unit tests that read the
          // filesystem (the D-18 fixture scope/reachability test).
          include: ['tests/unit/scripts/**', 'tests/unit/*.test.ts'],
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
            'tests/unit/*.test.tsx',
          ],
        },
      },
    ],
  },
});
