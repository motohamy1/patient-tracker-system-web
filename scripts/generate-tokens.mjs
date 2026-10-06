#!/usr/bin/env node
/**
 * scripts/generate-tokens.mjs — zero-dependency token codegen (D-05).
 *
 * Reads docs/governance/tokens.json (the ONLY committed source of token
 * values, D-06) and writes:
 *   - src/styles/tokens.generated.css — a `@theme inline` block of literal
 *     values for every normative token, plus an unconditional `:root` block
 *     carrying the same literals PLUS both motion.duration entries (D-08 /
 *     02-RESEARCH.md Pitfall 1: a token no utility consumes must still exist).
 *   - src/styles/tokens.generated.ts — the numeric MOTION constants for
 *     Framer Motion / GSAP call sites (a transition duration is a number in
 *     seconds and cannot read a CSS custom property).
 *
 * All token names are camelCase in the JSON and become kebab-case custom
 * properties here (D-07); every value is read from the JSON — nothing is
 * hardcoded in this script.
 *
 * Both artifacts are gitignored and must never be committed.
 *
 * The writes happen ONLY when this file is the process entry point (import
 * scripts/token-namespaces.mjs instead to derive without writing). Invoked
 * with `--check` it regenerates only when an artifact is missing or differs
 * from the fresh computation, and always exits 0 on success — the artifacts
 * are gitignored build outputs derived entirely from a committed source, so
 * regenerating them is the correct action for any inconsistency.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TOKENS, DURATIONS, cssName, loadTokens, MOTION, REPO_ROOT } from './token-namespaces.mjs';

const CSS_PATH = path.join('src', 'styles', 'tokens.generated.css');
const TS_PATH = path.join('src', 'styles', 'tokens.generated.ts');

function themeBlock(tokens) {
  const lines = TOKENS(tokens).map((entry) => `  ${cssName(entry)}: ${entry.value};`);
  return `@theme inline {\n${lines.join('\n')}\n}`;
}

function rootBlock(tokens) {
  const entries = [
    ...TOKENS(tokens),
    ...DURATIONS(tokens).map(({ key, value }) => ({ ns: 'duration', key, value })),
  ];
  const lines = entries.map((entry) => `  ${cssName(entry)}: ${entry.value};`);
  return `:root {\n${lines.join('\n')}\n}`;
}

/**
 * Build both artifacts as strings from one walk of the parsed JSON.
 * @param {string} root repository root
 */
export function buildArtifacts(root = REPO_ROOT) {
  const tokens = loadTokens(root);
  const header =
    `/* GENERATED FILE — do not edit.\n` +
    `   Source: docs/governance/tokens.json v${tokens.version} via scripts/generate-tokens.mjs.\n` +
    `   This file is gitignored (D-06): the JSON above is the only committed place\n` +
    `   a token value lives. Hand edits here are overwritten by predev/prebuild. */\n\n`;
  const css =
    header +
    `${themeBlock(tokens)}\n\n` +
    `/* The :root block is emitted UNCONDITIONALLY so a token no utility consumes —\n` +
    `   the two motion durations — still exists for raw CSS, GSAP and JS reads\n` +
    `   (02-RESEARCH.md Pitfall 1). */\n` +
    `${rootBlock(tokens)}\n`;

  const motion = MOTION(tokens);
  const ts =
    `// GENERATED FILE — do not edit.\n` +
    `// Source: docs/governance/tokens.json v${tokens.version} via scripts/generate-tokens.mjs.\n` +
    `//\n` +
    `// Motion's transition.duration is a number in seconds and cannot consume a CSS\n` +
    `// variable, which is why this module exists alongside the generated CSS. It is\n` +
    `// not a second source of truth: both artifacts come from one walk of the JSON\n` +
    `// in one run, and neither file is committed (D-05/D-06).\n\n` +
    `export const MOTION = {\n` +
    `  duration: {\n` +
    `    fastSec: ${motion.duration.fastSec},\n` +
    `    slowSec: ${motion.duration.slowSec},\n` +
    `  },\n` +
    `  easing: {\n` +
    `    standard: [${motion.easing.standard.join(', ')}],\n` +
    `    exit: [${motion.easing.exit.join(', ')}],\n` +
    `  },\n` +
    `} as const;\n`;

  return { css, ts };
}

/**
 * Write both artifacts to disk, creating src/styles/ if absent.
 * @param {string} root repository root
 * @returns {{ cssPath: string, tsPath: string }}
 */
export function writeArtifacts(root = REPO_ROOT) {
  const { css, ts } = buildArtifacts(root);
  const stylesDir = path.join(root, 'src', 'styles');
  mkdirSync(stylesDir, { recursive: true });
  const cssPath = path.join(stylesDir, 'tokens.generated.css');
  const tsPath = path.join(stylesDir, 'tokens.generated.ts');
  writeFileSync(cssPath, css, 'utf8');
  writeFileSync(tsPath, ts, 'utf8');
  return { cssPath, tsPath };
}

/** True when this module was invoked as the process entry point. */
function isEntry() {
  if (!process.argv[1]) return false;
  return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

function main() {
  const check = process.argv.includes('--check');
  const fresh = buildArtifacts(REPO_ROOT);
  const planned = [
    [CSS_PATH, fresh.css],
    [TS_PATH, fresh.ts],
  ];
  let wrote = false;
  for (const [rel, content] of planned) {
    const abs = path.join(REPO_ROOT, rel);
    let existing = null;
    try {
      existing = readFileSync(abs, 'utf8');
    } catch {
      existing = null;
    }
    if (existing === content && check) {
      console.log(`up to date: ${rel}`);
      continue;
    }
    wrote = true;
  }
  if (wrote) {
    const { cssPath, tsPath } = writeArtifacts(REPO_ROOT);
    console.log(`generated: ${cssPath}`);
    console.log(`generated: ${tsPath}`);
  } else {
    console.log(`generated: (nothing to write)`);
  }
}

if (isEntry()) {
  main();
}
