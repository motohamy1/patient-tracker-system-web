// Testing Library setup, wired explicitly through `test.setupFiles` in vitest.config.ts.
//
// jest-dom/vitest registers the DOM matchers (toBeInTheDocument, toHaveAttribute, …) as
// vitest expect extensions; `cleanup` unmounts each rendered tree after every test so a
// query can never match DOM left behind by the previous one.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});