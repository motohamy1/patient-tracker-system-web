/**
 * scripts/token-namespaces.mjs — the pure token-vocabulary derivation module.
 *
 * Zero dependencies, no file writes, no side effects at import. Both
 * `scripts/generate-tokens.mjs` (plan 02-03) and `scripts/check-design-tokens.mjs`
 * (plan 02-04) import this module, so the generator and the token-utility
 * presence check share one derivation and can never drift (D-11).
 *
 * Only the six normative groups are read: `color`, `radius`, `space`, `font`,
 * `shadow` and `motion` (tokens.json provenance.disclaimer).
 *
 * Namespace map (binding, 02-RESEARCH.md Pattern 2):
 *   color.*          → --color-*          (bg-/text-/border-/ring-/fill-/stroke-)
 *   radius.*         → --radius-*         (rounded-)
 *   space.*          → --spacing-*        (p-/px-/py-/m-/mx-/gap-/space-x-/space-y-)
 *   font.size.*      → --text-*           (text- font-size utilities)
 *   font.weight.*    → --font-weight-*    (font-)
 *   font.lineHeight.* → --leading-*       (leading-)
 *   shadow.*         → --shadow-*         (shadow-)
 *   motion.easing.*  → --ease-*           (ease-)
 *   motion.duration.* → --duration-*      (NO Tailwind namespace — :root + TS only)
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The fixed map from JSON group to Tailwind namespace and to the utility stems
 * that group produces. `duration` is listed for completeness: it has no
 * utility stem, so `utilitiesFor` yields an empty list for it.
 */
export const NAMESPACES = {
  color: {
    namespace: 'color',
    utilities: (n) => [
      `bg-${n}`,
      `text-${n}`,
      `border-${n}`,
      `ring-${n}`,
      `fill-${n}`,
      `stroke-${n}`,
    ],
  },
  radius: {
    namespace: 'radius',
    utilities: (n) => [`rounded-${n}`],
  },
  spacing: {
    namespace: 'spacing',
    utilities: (n) => [
      `p-${n}`,
      `px-${n}`,
      `py-${n}`,
      `m-${n}`,
      `mx-${n}`,
      `gap-${n}`,
      `space-x-${n}`,
      `space-y-${n}`,
    ],
  },
  text: {
    namespace: 'text',
    utilities: (n) => [`text-${n}`],
  },
  'font-weight': {
    namespace: 'font-weight',
    utilities: (n) => [`font-${n}`],
  },
  leading: {
    namespace: 'leading',
    utilities: (n) => [`leading-${n}`],
  },
  shadow: {
    namespace: 'shadow',
    utilities: (n) => [`shadow-${n}`],
  },
  ease: {
    namespace: 'ease',
    utilities: (n) => [`ease-${n}`],
  },
  duration: {
    namespace: 'duration',
    utilities: () => [],
  },
};

/**
 * JSON group path → Tailwind namespace, in normative emission order.
 */
export const GROUPS = [
  { path: 'color', ns: 'color' },
  { path: 'radius', ns: 'radius' },
  { path: 'space', ns: 'spacing' },
  { path: 'font.size', ns: 'text' },
  { path: 'font.weight', ns: 'font-weight' },
  { path: 'font.lineHeight', ns: 'leading' },
  { path: 'shadow', ns: 'shadow' },
  { path: 'motion.easing', ns: 'ease' },
];

/** Repository root relative to this module (scripts/ is one level below it). */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Read docs/governance/tokens.json from the resolved repository root.
 * @param {string} [root] repository root; defaults to the directory above scripts/
 * @returns {object} the parsed tokens.json document
 */
export function loadTokens(root = REPO_ROOT) {
  const file = path.join(root, 'docs', 'governance', 'tokens.json');
  return JSON.parse(readFileSync(file, 'utf8'));
}

/**
 * camelCase → kebab-case. `surfaceMuted` → `surface-muted`;
 * `frameForeground` → `frame-foreground`; `textPrimary` → `text-primary`;
 * `2xl` stays `2xl` (digits are untouched); `easing.standard` → `standard`.
 * @param {string} name camelCase token name
 * @returns {string} kebab-case name
 */
export function kebab(name) {
  return String(name).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * CSS custom-property name for one entry: `--<namespace>-<kebab(key)>`.
 * @param {{ ns: string, key: string }} entry
 * @returns {string}
 */
export function cssName({ ns, key }) {
  return `--${ns}-${kebab(key)}`;
}

/**
 * Every utility class name a source file could legitimately use for that
 * entry, derived from NAMESPACES and kebab(key). This is the list plan 02-04's
 * presence check consumes (D-11) so it can never go stale.
 * @param {{ ns: string, key: string }} entry
 * @returns {string[]}
 */
export function utilitiesFor({ ns, key }) {
  const spec = NAMESPACES[ns];
  if (!spec) return [];
  return spec.utilities(kebab(key));
}

/** Read a nested JSON group by dotted path, e.g. `font.size`. */
function group(tokens, dotted) {
  return dotted.split('.').reduce((acc, part) => acc?.[part], tokens);
}

/**
 * Flat array of { ns, key, value } covering every normative token entry:
 * color, radius, space, font.size, font.weight, font.lineHeight, shadow and
 * motion.easing. motion.duration is excluded here and handled by DURATIONS.
 * @param {object} tokens parsed tokens.json
 * @returns {{ ns: string, key: string, value: string }[]}
 */
export function TOKENS(tokens) {
  return GROUPS.flatMap(({ path: dotted, ns }) =>
    Object.entries(group(tokens, dotted) ?? {}).map(([key, value]) => ({ ns, key, value })),
  );
}

/**
 * Flat array of { key, value } from motion.duration. These have NO Tailwind
 * namespace: they are emitted to :root and the generated TypeScript module
 * only, never to @theme inline (02-RESEARCH.md Pitfall 1).
 * @param {object} tokens parsed tokens.json
 * @returns {{ key: string, value: string }[]}
 */
export function DURATIONS(tokens) {
  return Object.entries(group(tokens, 'motion.duration') ?? {}).map(([key, value]) => ({
    key,
    value,
  }));
}

/**
 * Parse a `cubic-bezier(a, b, c, d)` string into a four-number array.
 * @param {string} value easing string from tokens.json motion.easing
 * @returns {number[]}
 */
function bezier(value) {
  const match = /cubic-bezier\(([^)]*)\)/.exec(value);
  if (!match) throw new Error(`Unsupported easing curve: ${value}`);
  return match[1].split(',').map((n) => Number.parseFloat(n.trim()));
}

/**
 * Parse a millisecond duration string ("120ms") into a number.
 * @param {string} value duration string from tokens.json motion.duration
 * @returns {number} milliseconds
 */
function milliseconds(value) {
  const match = /^(\d+(?:\.\d+)?)ms$/.exec(value);
  if (!match) throw new Error(`Unsupported duration: ${value}`);
  return Number.parseFloat(match[1]);
}

/**
 * The numeric motion constants for the generated TypeScript module.
 *
 * Motion's `transition.duration` is a number in seconds and cannot consume a
 * CSS variable, which is why this derivation exists alongside the CSS. It is
 * NOT a second source of truth: the CSS artifact and this module both come
 * from one walk of tokens.json in one run, and neither is committed (D-05/D-06).
 *
 * @param {object} tokens parsed tokens.json
 * @returns {{ duration: { fastSec: number, slowSec: number }, easing: { standard: number[], exit: number[] } }}
 */
export function MOTION(tokens) {
  const [fast, slow] = DURATIONS(tokens).map((d) => milliseconds(d.value) / 1000);
  return {
    duration: { fastSec: fast, slowSec: slow },
    easing: {
      standard: bezier(group(tokens, 'motion.easing').standard),
      exit: bezier(group(tokens, 'motion.easing').exit),
    },
  };
}
