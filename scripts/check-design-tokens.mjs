#!/usr/bin/env node
/**
 * scripts/check-design-tokens.mjs — the three machine checks of
 * `docs/governance/project-constitution.md` §8, wired into `npm run lint` and
 * the `prebuild` chain (D-09, D-13).
 *
 * Zero dependencies by construction: the whole import set is `node:fs`,
 * `node:path` and the first-party `./token-namespaces.mjs` sibling, so there is
 * no third-party code inside the gate that decides whether a build passes.
 *
 * Checks implemented — each printed with the `INV-xx` row it answers:
 *   no-raw-hex                  (INV-01)  a hash plus 6/3/4/8 hex digits outside
 *                                         the generated token layer.
 *   no-generic-healthcare-blue  (INV-03)  a default-palette utility (`blue`,
 *                                         `indigo`, `violet`, `purple`, `slate`,
 *                                         `zinc`, `neutral`, `stone`, `gray`)
 *                                         anchored to a Tailwind utility stem.
 *   token-reference-required    (INV-01, INV-13, INV-14)  a component or layout
 *                                         file whose class-list literals reference
 *                                         no utility derived from tokens.json.
 *
 * The token-utility vocabulary is derived at require-time from
 * `docs/governance/tokens.json` through `./token-namespaces.mjs`, so adding a
 * token to the JSON extends the presence check automatically and the check can
 * never go stale (D-11).
 *
 * Scan scope (D-10): every source file under `src/` plus the root configs
 * (`postcss.config.mjs`, `next.config.ts` and any `tailwind.config.*`), limited
 * to `.css .scss .ts .tsx .js .jsx .mjs`, excluding `node_modules`, `.next`,
 * `test-results`, `playwright-report`, `tests/visual/**` and — because they hold
 * the values by definition — `src/styles/tokens.generated.css` and
 * `src/styles/tokens.generated.ts`. `docs/governance/**` is outside this scope
 * by design: it is where the values live.
 *
 * Residual heuristics in `no-raw-hex`, documented rather than hidden:
 *   1. A hash immediately preceded by `/` is never a color literal, and a match
 *      whose enclosing non-space token contains the scheme delimiter `://` — or
 *      which is preceded by `url(` — is a URL reference (fragment or SVG
 *      reference), not a color.
 *   2. A match preceded by an anchor/route attribute (`href`, `xlink:href`,
 *      `to`, `src`, `action`, `formaction`) plus an optional quote is a URL
 *      fragment, not a color declaration.
 *   3. The preceding-character delimiter filter means a hash inside an
 *      identifier (`a` then `#bad`) is never a match.
 *   4. Only the extensions that can carry a color or a class list are scanned.
 *   Residual gap: an ID selector whose name is pure hex (a hash followed by
 *   three to eight hex digits and then `{`) is still reported. That is a false
 *   positive in a stylesheet and the answer is to rename the selector, not to
 *   widen the filter.
 *
 * Residual heuristic in `token-reference-required`: the check fires only on a
 * file that carries a styling construct with an inline literal — a
 * `className` / `class` / `classList` attribute holding a quoted class list, a
 * `style={{...}}` object, or an `@apply` rule. A file with no such literal (the
 * root `src/app/layout.tsx`, which only wires the font variable, is the live
 * example) has no styling to judge and cannot be said to reference a token.
 *
 * Output contract (D-12): exactly one line per violation — `file:line`, the
 * matched literal, the check name and the invariant — then exit 1. There is no
 * auto-correct flag, no rewrite path and no bypass mode: a tool that silently
 * edits design tokens is the wrong tool.
 *
 * Importing this module has no side effects; only direct execution runs the
 * checks.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, TOKENS, loadTokens, utilitiesFor } from './token-namespaces.mjs';

/** Extensions that can carry a color or a class list (D-10, filter 4). */
export const SCANNED_EXTENSIONS = new Set([
  '.css',
  '.scss',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
]);

/** Directories never descended into. */
export const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.next',
  'test-results',
  'playwright-report',
  '.git',
  'tests',
]);

/** Generated artifacts that hold the token values by definition (D-10). */
export const EXCLUDED_FILES = new Set([
  'src/styles/tokens.generated.css',
  'src/styles/tokens.generated.ts',
]);

/** Root config files that are always in scope. */
export const ROOT_CONFIG_FILES = ['postcss.config.mjs', 'next.config.ts'];

/** Additional root configs discovered by pattern if a Tailwind config appears. */
const ROOT_CONFIG_PATTERN = /^tailwind\.config\.(?:js|ts|mjs|cjs)$/;

/** The generated CSS artifact the production guard protects (Pitfall 5). */
export const GENERATED_CSS_PATH = 'src/styles/tokens.generated.css';

/** Absolute path whose absence fails a production build. */
export const GENERATED_CSS_ABS = path.join(REPO_ROOT, 'src', 'styles', 'tokens.generated.css');

/** `#` plus exactly 6, 3, 4 or 8 hex digits, closed by a word boundary. */
const HEX_SOURCE = '#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\\b';

/** The character that may legitimately precede a color literal. */
const DELIMITER_BEFORE = /[\s:;=,(\[{"'>`]/;

/** An anchor/route attribute preceding a URL fragment. */
const ANCHOR_ATTRIBUTE_BEFORE = /(?:href|xlink:href|to|src|action|formaction)\s*=\s*["'`]?$/i;

/** The `://` delimiter that marks a scheme-qualified URL. */
const URL_SCHEME_DELIMITER = /:\/\//;

/** A CSS URL function immediately preceding the match. */
const CSS_URL_BEFORE = /url\(\s*$/i;

/** Tailwind utility stems that can carry a palette color. */
const GENERIC_STEMS = [
  'bg',
  'text',
  'border',
  'ring',
  'fill',
  'stroke',
  'from',
  'via',
  'to',
  'shadow',
  'outline',
  'decoration',
  'accent',
  'caret',
  'divide',
  'placeholder',
];

/** Default-palette family names the constitution bans in styling (INV-01, INV-03). */
const GENERIC_COLORS = [
  'blue',
  'indigo',
  'violet',
  'purple',
  'slate',
  'zinc',
  'neutral',
  'stone',
  'gray',
];

/**
 * The generic-palette matcher source: a utility stem, a dash, a banned colour
 * family, a dash and a numeric shade. The stem anchor is what makes the check
 * precise — the same words in prose or in a code comment never match, because
 * the violation mode this check exists to catch is a utility, not a word.
 */
const GENERIC_SOURCE = `\\b(?:${GENERIC_STEMS.join('|')})-(?:${GENERIC_COLORS.join('|')})-\\d+(?:\\.\\d+)?`;

/**
 * A styling construct holding an inline literal: a class attribute with a
 * quoted class list (including inside a `{...}` expression), an `@apply` rule,
 * or a `style={{...}}` object.
 */
const STYLE_LITERAL_RE =
  /(?:className|class|classList)\s*=\s*(?:["'`][^"'`]*["'`]|\{[^{}]*["'`][^"'`]*["'`][^{}]*\})|@apply\s+[^;{}]+|style\s*=\s*\{\{/;

/** Escape a utility name for literal use inside a regular expression. */
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Every Tailwind utility a source file could legitimately use, derived from
 * `docs/governance/tokens.json` (D-11). Never a frozen constant: the list is a
 * function of the JSON and nothing else.
 * @param {object} [tokens] parsed tokens.json
 * @returns {string[]}
 */
export function tokenUtilities(tokens = loadTokens()) {
  return TOKENS(tokens).flatMap((entry) => utilitiesFor(entry));
}

/**
 * A whole-token matcher over a utility vocabulary. Longest name first so the
 * alternative that matches is the most specific one. Pass `flags` empty for a
 * reusable presence test; pass `'g'` only for enumeration.
 * @param {string[]} utilities
 * @param {string} [flags]
 * @returns {RegExp}
 */
export function buildUtilityMatcher(utilities, flags = '') {
  const names = [...new Set(utilities)].sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
  return new RegExp(`(?<![\\w-])(?:${names.map(escapeRegExp).join('|')})(?![\\w-])`, flags);
}

/**
 * True when the path is a component or layout file, the only scope in which the
 * presence check applies (D-11). Utilities, hooks and scripts are out of scope:
 * requiring a token reference there would false-positive on pure composition.
 * @param {string} relPath repository-relative path
 * @returns {boolean}
 */
export function isPresenceCheckTarget(relPath) {
  const file = String(relPath).replace(/\\/g, '/');
  if (!file.startsWith('src/')) return false;
  if (file.startsWith('src/components/')) return true;
  return path.posix.basename(file) === 'layout.tsx';
}

/** True when the line offsets the match into a URL or an identifier rather than a color. */
function isUrlOrIdentifierContext(line, index) {
  if (index > 0 && line[index - 1] === '/') return true;
  const before = line.slice(0, index);
  const token = /[^\s]*$/.exec(before)[0];
  if (URL_SCHEME_DELIMITER.test(token)) return true;
  if (CSS_URL_BEFORE.test(before)) return true;
  if (ANCHOR_ATTRIBUTE_BEFORE.test(before)) return true;
  return false;
}

/**
 * `no-raw-hex` (INV-01). A raw color literal anywhere outside the generated
 * token layer.
 * @param {{ path: string, content: string }} record
 * @returns {{ path: string, line: number, literal: string, check: string, inv: string[] }[]}
 */
export function checkNoRawHex({ path: file, content }) {
  const violations = [];
  const lines = String(content).split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const hexRe = new RegExp(HEX_SOURCE, 'g');
    let match;
    while ((match = hexRe.exec(line)) !== null) {
      const index = match.index;
      if (index > 0 && !DELIMITER_BEFORE.test(line[index - 1])) continue;
      if (isUrlOrIdentifierContext(line, index)) continue;
      violations.push({
        path: file,
        line: i + 1,
        literal: match[0],
        check: 'no-raw-hex',
        inv: ['INV-01'],
      });
    }
  }
  return violations;
}

/**
 * `no-generic-healthcare-blue` (INV-01 grep vocabulary, INV-03). A generic
 * default-palette utility in any styling location, including themes and configs.
 * @param {{ path: string, content: string }} record
 * @returns {{ path: string, line: number, literal: string, check: string, inv: string[] }[]}
 */
export function checkNoGenericHealthcareBlue({ path: file, content }) {
  const violations = [];
  const lines = String(content).split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const genericRe = new RegExp(GENERIC_SOURCE, 'g');
    let match;
    while ((match = genericRe.exec(lines[i])) !== null) {
      violations.push({
        path: file,
        line: i + 1,
        literal: match[0],
        check: 'no-generic-healthcare-blue',
        inv: ['INV-03'],
      });
    }
  }
  return violations;
}

/**
 * `token-reference-required` (INV-01, INV-13, INV-14). A component or layout
 * file whose class-list literals reference no derived token utility.
 * @param {{ path: string, content: string }} record
 * @param {string[] | RegExp} [utilities] derived vocabulary, or a prebuilt non-global matcher
 * @returns {{ path: string, line: number, literal: string, check: string, inv: string[] }[]}
 */
export function checkTokenReferenceRequired(record, utilities = tokenUtilities()) {
  if (!isPresenceCheckTarget(record.path)) return [];
  if (!STYLE_LITERAL_RE.test(String(record.content))) return [];
  const matcher = utilities instanceof RegExp ? utilities : buildUtilityMatcher(utilities);
  if (matcher.global) matcher.lastIndex = 0;
  if (matcher.test(String(record.content))) return [];
  return [
    {
      path: record.path,
      line: 1,
      literal: record.path,
      check: 'token-reference-required',
      inv: ['INV-01', 'INV-13', 'INV-14'],
    },
  ];
}

/**
 * Run all three checks over an in-memory list of `{ path, content }` records.
 * Pure with respect to the records; the vocabulary may be injected for tests.
 * @param {{ path: string, content: string }[]} records
 * @param {object} [tokens] parsed tokens.json
 * @returns {{ path: string, line: number, literal: string, check: string, inv: string[] }[]}
 */
export function runChecks(records, tokens = loadTokens()) {
  const violations = [];
  const matcher = buildUtilityMatcher(tokenUtilities(tokens));
  for (const record of records) {
    violations.push(...checkNoRawHex(record));
    violations.push(...checkNoGenericHealthcareBlue(record));
    violations.push(...checkTokenReferenceRequired(record, matcher));
  }
  return violations;
}

/** Recursively collect scanned records beneath a directory. */
function walk(absDir, relDir, out) {
  let entries;
  try {
    entries = readdirSync(absDir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const abs = path.join(absDir, entry.name);
    const rel = `${relDir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walk(abs, rel, out);
    } else if (entry.isFile()) {
      if (EXCLUDED_FILES.has(rel)) continue;
      if (!SCANNED_EXTENSIONS.has(path.extname(entry.name))) continue;
      out.push({ path: rel, content: readFileSync(abs, 'utf8') });
    }
  }
  return out;
}

/**
 * Resolve the scan scope (D-10): every source file under `src/` plus the root
 * configs, minus the generated token layer. Exported so tests can assert the
 * exclusions rather than assume them.
 * @param {string} [root] repository root
 * @returns {{ path: string, content: string }[]}
 */
export function resolveScope(root = REPO_ROOT) {
  const records = [];
  for (const name of ROOT_CONFIG_FILES) {
    const abs = path.join(root, name);
    if (existsSync(abs)) records.push({ path: name, content: readFileSync(abs, 'utf8') });
  }
  let rootEntries = [];
  try {
    rootEntries = readdirSync(root).sort();
  } catch {
    rootEntries = [];
  }
  for (const name of rootEntries) {
    if (!ROOT_CONFIG_PATTERN.test(name)) continue;
    records.push({ path: name, content: readFileSync(path.join(root, name), 'utf8') });
  }
  walk(path.join(root, 'src'), 'src', records);
  records.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return records;
}

/**
 * Advisory assist, not a fourth check and never part of the exit code: the
 * distinct `text-*` / `bg-*` token utilities each component file uses, paired,
 * so the reviewer's contrast job starts from a finite machine-derived list.
 * @param {{ path: string, content: string }[]} records
 * @param {string[]} [utilities]
 * @returns {{ path: string, text: string, bg: string }[]}
 */
export function collectContrastPairs(records, utilities = tokenUtilities()) {
  const candidates = [...new Set(utilities)]
    .filter((utility) => utility.startsWith('text-') || utility.startsWith('bg-'))
    .sort();
  const pairs = [];
  for (const record of records) {
    const file = String(record.path).replace(/\\/g, '/');
    if (!file.startsWith('src/components/')) continue;
    const used = candidates.filter((utility) => {
      const matcher = new RegExp(`(?<![\\w-])${escapeRegExp(utility)}(?![\\w-])`);
      return matcher.test(String(record.content));
    });
    const texts = used.filter((utility) => utility.startsWith('text-'));
    const backgrounds = used.filter((utility) => utility.startsWith('bg-'));
    for (const text of texts) {
      for (const bg of backgrounds) pairs.push({ path: file, text, bg });
    }
  }
  return pairs;
}

/** Format one violation in the D-12 contract. */
function formatViolation(violation) {
  return `${violation.path}:${violation.line}  ${violation.literal}  ${violation.check}  (${violation.inv.join(', ')})`;
}

/**
 * Process entry: production guard, then the three checks, then the exit code
 * and the advisory contrast pairs.
 */
function main() {
  if (process.env.NODE_ENV === 'production' && !existsSync(GENERATED_CSS_ABS)) {
    console.error(
      `check-design-tokens: FATAL — ${GENERATED_CSS_PATH} is missing in a production build.`,
    );
    console.error(
      '  The token layer is produced by scripts/generate-tokens.mjs, which `npm run build` runs through the `prebuild` hook.',
    );
    console.error(
      '  Run `npm run build` (never a bare `next build`), or `npm run tokens:generate` to emit the layer first.',
    );
    process.exit(1);
  }

  const records = resolveScope();
  const violations = runChecks(records);

  if (violations.length > 0) {
    for (const violation of violations) console.error(formatViolation(violation));
    console.error(
      `check-design-tokens: ${violations.length} violation(s) across ${records.length} file(s) — the machine-check contract is docs/governance/project-constitution.md §8.`,
    );
    process.exit(1);
  }

  console.log(
    `check-design-tokens: 0 violations across ${records.length} file(s) — no-raw-hex, no-generic-healthcare-blue and token-reference-required all pass (INV-01, INV-03, INV-13, INV-14).`,
  );

  const pairs = collectContrastPairs(records);
  console.log(
    `contrast-pairs: ${pairs.length} text/bg pairing(s) — advisory for the reviewer's WCAG table, never part of the exit code.`,
  );
  for (const pair of pairs) {
    console.log(`contrast-pair  ${pair.path}  text=${pair.text}  bg=${pair.bg}`);
  }
}

const isEntry =
  Boolean(process.argv[1]) &&
  typeof import.meta.filename === 'string' &&
  path.resolve(process.argv[1]) === import.meta.filename;

if (isEntry) {
  main();
}
