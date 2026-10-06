import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOKENS, DURATIONS, cssName, utilitiesFor, loadTokens } from '../../../scripts/token-namespaces.mjs';
import { MOTION } from '../../../src/styles/tokens.generated.ts';

// Proven against the REAL generated artifacts (written by `npm run tokens:generate`),
// never against a fixture: the assertions below read
//   src/styles/tokens.generated.css  and  src/styles/tokens.generated.ts
// from disk, so a failing run points at the artifact the browser would receive.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const tokens = loadTokens(ROOT);
const normative = TOKENS(tokens);
const durations = DURATIONS(tokens);

const css = readFileSync(path.join(ROOT, 'src', 'styles', 'tokens.generated.css'), 'utf8');
const themeBlock = css.split('@theme inline {')[1].split('\n}')[0];
const rootBlock = css.split(':root {')[1].split('\n}')[0];

describe('generated token CSS — dual emission (D-08)', () => {
  it('carries both the @theme inline block and the :root block', () => {
    expect(css.match(/^@theme inline \{/gm)).toHaveLength(1);
    expect(css.match(/^:root \{/gm)).toHaveLength(1);
  });

  it('emits every normative token in BOTH blocks with literal values', () => {
    for (const entry of normative) {
      const declaration = `${cssName(entry)}: ${entry.value};`;
      expect(themeBlock).toContain(declaration);
      expect(rootBlock).toContain(declaration);
    }
  });

  it('emits motion.duration in the :root block ONLY (Pitfall 1)', () => {
    for (const duration of durations) {
      const declaration = `${cssName({ ns: 'duration', key: duration.key })}: ${duration.value};`;
      expect(rootBlock).toContain(declaration);
      expect(themeBlock).not.toContain(declaration);
    }
  });

  it('writes a literal value in every @theme inline declaration — no self-reference', () => {
    const selfReferential = themeBlock
      .split('\n')
      .filter((line) => line.includes('var('))
      .map((line) => line.trim());
    expect(selfReferential).toEqual([]);
  });

  it('keeps the camelCase-to-kebab identifier transform (D-07)', () => {
    for (const [camel, kebabName] of [
      ['surfaceMuted', 'surface-muted'],
      ['frameForeground', 'frame-foreground'],
      ['textPrimary', 'text-primary'],
      ['accentSoft', 'accent-soft'],
    ]) {
      expect(css).toContain(`--color-${kebabName}:`);
      expect(utilitiesFor({ ns: 'color', key: camel })).toContain(`bg-${kebabName}`);
    }
  });
});

describe('generated motion TypeScript module', () => {
  it('exports fastSec and slowSec equal to the millisecond values divided by 1000', () => {
    for (const duration of durations) {
      const key = duration.key.endsWith('Sec') ? duration.key.slice(0, -3) : duration.key;
      const seconds = Number.parseFloat(duration.value) / 1000;
      expect(MOTION.duration[`${key}Sec`]).toBe(seconds);
    }
  });

  it('exports easing curves as four-number arrays derived from the frozen strings', () => {
    for (const [key, value] of Object.entries(tokens.motion.easing)) {
      const curve = value
        .replace(/^cubic-bezier\(|\)$/g, '')
        .split(',')
        .map((n) => Number.parseFloat(n.trim()));
      expect(MOTION.easing[key]).toEqual(curve);
      expect(MOTION.easing[key]).toHaveLength(4);
    }
  });
});

describe('utility vocabulary derived from the namespace module (D-11)', () => {
  const utilities = normative.flatMap(utilitiesFor);

  it('derives the frozen utility list', () => {
    const required = [
      'bg-canvas',
      'bg-surface',
      'bg-surface-muted',
      'bg-surface-raised',
      'text-text-primary',
      'rounded-pill',
      'gap-lg',
      'p-2xl',
      'text-label',
      'font-semibold',
      'leading-tight',
      'shadow-raised',
      'shadow-overlay',
      'ease-standard',
    ];
    for (const utility of required) {
      expect(utilities).toContain(utility);
    }
  });

  it('gives motion.duration no utility stem', () => {
    for (const duration of durations) {
      expect(utilitiesFor({ ns: 'duration', key: duration.key })).toEqual([]);
    }
  });
});
