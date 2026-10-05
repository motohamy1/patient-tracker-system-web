import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    globals: true,
    // Explicit entry so the Testing Library matchers and cleanup are visible in the
    // config rather than hidden behind an import inside setup.ts.
    setupFiles: ["./tests/unit/setup.ts", "./tests/unit/testing-library.ts"],
  },
  resolve: {
    // MUST match the `paths` mapping in tsconfig.json so unit tests and the
    // app resolve imports identically.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});