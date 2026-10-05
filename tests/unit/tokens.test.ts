/*
 * Automated guards for the token layer (FND-10) and the ref-A prohibitions recorded in
 * 01-UI-SPEC.md. These tests exist to fail loudly the moment someone adds an
 * unreferenced token, a second accent, a rejected B-image value, or a forbidden
 * pattern. They are intentionally strict: no `.some()` fallbacks, no "close enough".
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const REPO_ROOT = join(__dirname, "..", "..");
const TOKENS_PATH = join(REPO_ROOT, "src", "styles", "tokens.css");
const SRC_DIR = join(REPO_ROOT, "src");

/**
 * The reserved dark-override file documents the words it forbids (a nested `@theme`
 * block) and how to write overrides. Named exclusion constant rather than an inline
 * conditional so the exemption is visible and greppable.
 */
const PROHIBITION_EXEMPT_PATHS: readonly string[] = ["src/styles/tokens.dark.css"];

/** Hex values the pack rejected; see docs/design/tokens.md and 01-UI-SPEC.md Color. */
const REJECTED_HEX_VALUES: readonly string[] = ["#ECFC4C", "#FCCC00", "#DEE4EA", "#F0F0F6"];

/** The single accent plus the ref-A neutrals, with their documented coordinates. */
const REF_A_SAMPLED_PAIRS: readonly (readonly [string, string])[] = [
  ["--color-frame-olive", "#4F4F28"],
  ["--color-frame-olive-deep", "#434328"],
  ["--color-canvas", "#E0DFD6"],
  ["--color-surface", "#FFFFFF"],
  ["--color-surface-muted", "#EFEFEB"],
  ["--color-surface-inset", "#E9EAE5"],
  ["--color-accent", "#F2FE46"],
  ["--color-ink", "#262D2D"],
  ["--color-ink-strong", "#13110D"],
  ["--color-ink-muted", "#8D8B8A"],
  // derived: ref-A draws its data series in the single accent plus neutrals, never a
  // second hue (the B-image blue/red/green/purple sparklines are forbidden).
  ["--color-series-accent", "#F2FE46"],
];

const FORBIDDEN_VISUAL_PATTERNS: readonly { name: string; regex: RegExp }[] = [
  { name: "gradient", regex: /\bgradient\b/ },
  { name: "backdrop-blur", regex: /\bbackdrop-blur\b/ },
  { name: "backdrop-filter", regex: /\bbackdrop-filter\b/ },
  { name: "confetti", regex: /\bconfetti\b/ },
  { name: "glassmorphism", regex: /\bglassmorphism\b/ },
];

/**
 * Physical direction properties are banned by locked decision D1. Each pattern is
 * anchored on a word or class-token boundary so an unrelated identifier that merely
 * contains the letters (`html-`, `--clinical-`) is not a false positive.
 */
const FORBIDDEN_DIRECTION_PATTERNS: readonly { name: string; regex: RegExp }[] = [
  { name: "margin-left", regex: /\bmargin-left\b/ },
  { name: "margin-right", regex: /\bmargin-right\b/ },
  { name: "padding-left", regex: /\bpadding-left\b/ },
  { name: "padding-right", regex: /\bpadding-right\b/ },
  { name: "text-align: left", regex: /text-align\s*:\s*left\b/ },
  { name: "text-align: right", regex: /text-align\s*:\s*right\b/ },
  { name: "rounded-tl-", regex: /(^|[\s"'`])rounded-tl-/ },
  { name: "rounded-br-", regex: /(^|[\s"'`])rounded-br-/ },
];

function isExempt(absolutePath: string): boolean {
  const repoRelative = relative(REPO_ROOT, absolutePath).split(sep).join("/");
  return PROHIBITION_EXEMPT_PATHS.includes(repoRelative);
}

/** Recursively collect every file under `src/`, skipping binary and asset extensions. */
function walkSrcFiles(dir: string = SRC_DIR): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walkSrcFiles(absolute));
    } else if (/\.(ts|tsx|css|scss|js|jsx|mjs)$/.test(entry.name)) {
      found.push(absolute);
    }
  }
  return found;
}

/**
 * Strip block and line comments so a compliance comment that documents a prohibition
 * ("no gradients") cannot fail the very rule it documents.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function readCommentsInOrder(lines: string[]): { line: number; text: string }[] {
  const comments: { line: number; text: string }[] = [];
  lines.forEach((raw, index) => {
    const matches = raw.matchAll(/\/\*([\s\S]*?)\*\//g);
    for (const match of matches) {
      comments.push({ line: index, text: match[1] });
    }
  });
  return comments;
}

const tokensSource = readFileSync(TOKENS_PATH, "utf8");
const tokensLines = tokensSource.split(/\r?\n/);
const tokenComments = readCommentsInOrder(tokensLines);

/** True when the given comment carries an accepted provenance marker. */
function carriesProvenance(commentText: string): boolean {
  return /\bref-A\b/.test(commentText) || /\bderived\b/.test(commentText) || /\bOWNER DECISION\b/.test(commentText);
}

function tokenDeclarations(): { name: string; line: number; value: string }[] {
  const declarations: { name: string; line: number; value: string }[] = [];
  tokensLines.forEach((raw, index) => {
    const match = raw.match(/^\s*(--[\w-]+)\s*:\s*([^;]+);/);
    if (match) {
      declarations.push({ name: match[1], line: index, value: match[2].trim() });
    }
  });
  return declarations;
}

describe("design token provenance (FND-10)", () => {
  it("declares exactly one @theme static block and resets the default palette", () => {
    const themeBlocks = tokensSource.match(/@theme\s+static\s*\{/g) ?? [];
    expect(themeBlocks).toHaveLength(1);
    expect(tokensSource).toContain("--color-*: initial;");
  });

  it("gives every token a ref-A, derived, or OWNER DECISION provenance comment", () => {
    const missing: string[] = [];
    for (const declaration of tokenDeclarations()) {
      const inherited = tokenComments
        .filter((comment) => comment.line < declaration.line)
        .reduce(
          (nearest, comment) => (comment.line > nearest.line ? comment : nearest),
          { line: -1, text: "" },
        );
      if (!carriesProvenance(inherited.text)) {
        const excerpt = tokensLines[declaration.line]?.trim() ?? "";
        missing.push(`${declaration.name} (line ${declaration.line + 1}): ${excerpt}`);
      }
    }
    expect(missing).toEqual([]);
    expect(tokenDeclarations().length).toBeGreaterThan(0);
  });

  it("keeps the accent list at exactly one entry", () => {
    const accents = [...tokensSource.matchAll(/^\s*(--color-accent[\w-]*)\s*:/gm)].map((match) => match[1]);
    expect(accents).toEqual(["--color-accent"]);
  });

  it("uses the exact ref-A sampled values from docs/design/tokens.md", () => {
    for (const [name, value] of REF_A_SAMPLED_PAIRS) {
      expect(tokensSource).toContain(`${name}: ${value}`);
    }
  });

  it("never contains a rejected B-image hex value", () => {
    for (const hex of REJECTED_HEX_VALUES) {
      expect(tokensSource).not.toContain(hex);
    }
  });

  it("keeps every spacing token a multiple of 4 pixels", () => {
    const spacingTokens = tokenDeclarations().filter(
      (declaration) => declaration.name === "--spacing" || declaration.name.startsWith("--space-"),
    );
    expect(spacingTokens.length).toBeGreaterThan(0);
    for (const token of spacingTokens) {
      const pixels = Number.parseFloat(token.value) * 16;
      expect(Number.isFinite(pixels), `${token.name}: unparsable value "${token.value}"`).toBe(true);
      expect(pixels % 4, `${token.name}: ${token.value} is ${pixels}px, not a multiple of 4`).toBe(0);
    }
  });
});

describe("ref-A prohibitions across src/", () => {
  it("finds no gradient, glassmorphism, backdrop-blur, or confetti in src/", () => {
    const offenders: string[] = [];
    for (const file of walkSrcFiles()) {
      if (isExempt(file)) continue;
      const source = stripComments(readFileSync(file, "utf8"));
      for (const pattern of FORBIDDEN_VISUAL_PATTERNS) {
        if (pattern.regex.test(source)) {
          offenders.push(`${relative(REPO_ROOT, file).split(sep).join("/")}: ${pattern.name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("finds no physical CSS direction property in src/ (locked decision D1)", () => {
    const offenders: string[] = [];
    for (const file of walkSrcFiles()) {
      if (isExempt(file)) continue;
      const source = stripComments(readFileSync(file, "utf8"));
      for (const pattern of FORBIDDEN_DIRECTION_PATTERNS) {
        if (pattern.regex.test(source)) {
          offenders.push(`${relative(REPO_ROOT, file).split(sep).join("/")}: ${pattern.name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("walks src/ recursively rather than reading a single hardcoded file", () => {
    const files = walkSrcFiles();
    expect(files.length).toBeGreaterThan(1);
    // Nested directories must be reached, and every walk target must really exist.
    expect(files.every((file) => statSync(file).isFile())).toBe(true);
    expect(files.some((file) => file.includes(`${sep}app${sep}`))).toBe(true);
    expect(files.some((file) => file.includes(`${sep}styles${sep}`))).toBe(true);
  });
});