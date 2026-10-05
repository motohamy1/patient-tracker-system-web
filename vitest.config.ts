import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
  },
  resolve: {
    // MUST match the `paths` mapping in tsconfig.json so unit tests and the
    // app resolve imports identically.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});