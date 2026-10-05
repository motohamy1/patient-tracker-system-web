/*
 * Guards for the Supabase client wiring (FND-09).
 *
 * FND-09 is a claim about the SHIPPED product — no privileged credential may be
 * reachable from client code — so source inspection alone is not enough. These checks
 * cover the source tree AND the production bundle produced by `npm run build`.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const REPO_ROOT = join(__dirname, "..", "..");
const SRC_DIR = join(REPO_ROOT, "src");
const SUPABASE_DIR = join(SRC_DIR, "lib", "supabase");
const CLIENT_PATH = join(SUPABASE_DIR, "client.ts");
const STATIC_DIR = join(REPO_ROOT, ".next", "static");

/** String literals that must never appear anywhere in src/ or in the client bundle. */
const PRIVILEGED_KEY_MARKERS: readonly string[] = ["service_role", "sb_secret_"];

/** Recursively collect every source file under `src/`. */
function walkSrcFiles(dir: string = SRC_DIR): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walkSrcFiles(absolute));
    } else if (/\.(ts|tsx|js|jsx|mjs|css|scss)$/.test(entry.name)) {
      found.push(absolute);
    }
  }
  return found;
}

/** Strip comments so prose documenting a prohibition is not mistaken for a use of it. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

describe("Supabase browser client (FND-09)", () => {
  const source = readFileSync(CLIENT_PATH, "utf8");

  it("builds the client with createBrowserClient from @supabase/ssr", () => {
    expect(source).toMatch(/import \{ createBrowserClient \} from "@supabase\/ssr"/);
    expect(source).toContain("createBrowserClient(");
  });

  it("references exactly the two public env vars and no others", () => {
    // Only executable code counts: the file's comment block deliberately names the
    // legacy variable to warn future editors away from it.
    const referenced = [...stripComments(source).matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)].map((m) => m[0]);
    expect([...new Set(referenced)].sort()).toEqual([
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
    ]);
  });

  it("names no privileged credential and no secret in the browser client", () => {
    for (const marker of [...PRIVILEGED_KEY_MARKERS, "SECRET"]) {
      expect(source).not.toContain(marker);
    }
  });
});

describe("privileged credentials are unreachable from src/", () => {
  it("finds no privileged key name in any source file", () => {
    const offenders: string[] = [];
    for (const file of walkSrcFiles()) {
      const text = readFileSync(file, "utf8");
      for (const marker of PRIVILEGED_KEY_MARKERS) {
        if (text.includes(marker)) {
          offenders.push(`${relative(REPO_ROOT, file).split(sep).join("/")}: ${marker}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("finds no admin/privileged client module in src/lib/supabase/", () => {
    // Phase 1 ships exactly two modules. A third one would mean a privileged client
    // crept in before Phase 2 owns that decision.
    expect(readdirSync(SUPABASE_DIR).sort()).toEqual(["client.ts", "server.ts"]);
  });
});

/*
 * BUILD-ARTIFACT CHECK — the executed form of FND-09.
 * Skipped when `.next/static` is absent (a clean checkout before `npm run build`);
 * run `npm run build` first for this check to have any force. Skipping is reported
 * rather than hidden, so a green run can never be mistaken for a proven check.
 */
describe.skipIf(!existsSync(STATIC_DIR))("production bundle carries no privileged credential", () => {
  it("finds no privileged key name in any file under .next/static", () => {
    const files: string[] = [];
    const collect = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const absolute = join(dir, entry.name);
        if (entry.isDirectory()) collect(absolute);
        else files.push(absolute);
      }
    };
    collect(STATIC_DIR);

    // A silently empty walk would make this test vacuous; assert it really read files.
    expect(files.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const marker of PRIVILEGED_KEY_MARKERS) {
        if (text.includes(marker)) {
          offenders.push(`${relative(REPO_ROOT, file).split(sep).join("/")}: ${marker}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
