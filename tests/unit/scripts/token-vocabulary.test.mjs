import { describe, it, expect } from 'vitest';
import {
  DURATIONS,
  GROUPS,
  NAMESPACES,
  TOKENS,
  kebab,
  loadTokens,
  utilitiesFor,
} from '../../../scripts/token-namespaces.mjs';
import { buildUtilityMatcher, tokenUtilities } from '../../../scripts/check-design-tokens.mjs';

// The check's vocabulary must be a function of docs/governance/tokens.json and
// nothing else (D-11). These tests prove the derivation by comparing it with an
// independent walk of the same JSON and by mutating an in-memory fixture and
// observing the derived list change — a frozen constant could never do that.

const tokens = loadTokens();

function groupAt(document, dotted) {
  return dotted.split('.').reduce((accumulator, part) => accumulator?.[part], document);
}

// Independent derivation: GROUPS + NAMESPACES read directly, never utilitiesFor.
const expectedUtilities = GROUPS.flatMap(({ path: dotted, ns }) =>
  Object.entries(groupAt(tokens, dotted) ?? {}).flatMap(([key]) => NAMESPACES[ns].utilities(kebab(key))),
);

const derived = tokenUtilities(tokens);

describe('derived utility vocabulary', () => {
  it('matches tokens.json exactly — count, membership and no extras', () => {
    expect([...derived].sort()).toEqual([...expectedUtilities].sort());
    expect(derived).toHaveLength(expectedUtilities.length);
    expect(new Set(derived).size).toBe(derived.length);
  });

  it('would still match a mutated copy of the JSON, proving the derivation is programmatic', () => {
    const extended = { ...tokens, color: { ...tokens.color, telehealth: '#FFFFFF' } };
    const extendedUtilities = tokenUtilities(extended);
    expect(extendedUtilities).toContain('bg-telehealth');
    expect(extendedUtilities).toContain('text-telehealth');
    expect(extendedUtilities).toHaveLength(derived.length + 6);
    expect(derived).not.toContain('bg-telehealth');
  });

  it('gives motion.duration no Tailwind utility, matching the documented exception', () => {
    expect(DURATIONS(tokens).map((entry) => entry.key)).toEqual(['fast', 'slow']);
    expect(GROUPS.map((entry) => entry.path)).not.toContain('motion.duration');
    for (const entry of DURATIONS(tokens)) {
      expect(utilitiesFor({ ns: 'duration', key: entry.key })).toEqual([]);
    }
    expect(derived).not.toContain('duration-fast');
    expect(derived).not.toContain('duration-slow');
  });

  it('contains exactly the names the phase components will use', () => {
    const required = [
      'bg-canvas',
      'bg-surface',
      'bg-surface-muted',
      'bg-surface-raised',
      'text-text-primary',
      'rounded-pill',
      'shadow-raised',
      'shadow-overlay',
      'gap-lg',
      'p-2xl',
      'text-label',
      'font-semibold',
      'leading-body',
      'ease-standard',
    ];
    for (const utility of required) expect(derived, utility).toContain(utility);
  });

  it('omits the shortened forms that are the namespace-collision traps', () => {
    expect(derived).not.toContain('text-primary');
    expect(derived).not.toContain('bg-muted');
    expect(derived).toContain('text-text-primary');
    expect(derived).toContain('bg-surface-muted');
  });

  it('derives one utility per token entry and namespace stem', () => {
    for (const entry of TOKENS(tokens)) {
      const utilities = utilitiesFor(entry);
      expect(utilities.length).toBeGreaterThan(0);
      for (const utility of utilities) expect(derived).toContain(utility);
    }
  });
});

describe('whole-token matching', () => {
  it('matches a complete utility but not a prefix of a longer one', () => {
    expect(buildUtilityMatcher(['bg-surface']).test('className="bg-surface"')).toBe(true);
    expect(buildUtilityMatcher(['bg-surface']).test('className="bg-surface-muted"')).toBe(false);
    expect(buildUtilityMatcher(derived).test('className="bg-surface-muted"')).toBe(true);
    expect(buildUtilityMatcher(derived).test('className="gap-lg p-2xl"')).toBe(true);
  });

  it('does not match the shortened collision form against the derived vocabulary', () => {
    const matcher = buildUtilityMatcher(derived);
    expect(matcher.test('className="text-primary"')).toBe(false);
    expect(matcher.test('className="bg-muted"')).toBe(false);
  });
});
