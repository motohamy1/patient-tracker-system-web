import { describe, it, expect } from 'vitest';
import {
  EXCLUDED_FILES,
  GENERATED_CSS_PATH,
  SCANNED_EXTENSIONS,
  checkNoGenericHealthcareBlue,
  checkNoRawHex,
  checkTokenReferenceRequired,
  isPresenceCheckTarget,
  resolveScope,
  runChecks,
  tokenUtilities,
} from '../../../scripts/check-design-tokens.mjs';

// Fixtures are in-memory `{ path, content }` records: the checks are pure
// functions over records, so a must-fail fixture is a real regression guard
// rather than a comment. Assertions read the returned violation array (check
// name, INV-xx, line), never console text, so a formatting change cannot
// silently turn a failing fixture into a passing one.

const TOKEN_CLASS = 'text-text-primary';

function violationsFor(records, check) {
  return runChecks(records).filter((violation) => violation.check === check);
}

describe('no-raw-hex (INV-01)', () => {
  const mustFail = [
    {
      path: 'src/components/RawHex.tsx',
      content: `export function RawHex() {
  return <div className="bg-[#3366CC] ${TOKEN_CLASS}" />;
}
`,
      line: 2,
      literal: '#3366CC',
    },
    {
      path: 'src/components/EightDigit.tsx',
      content: `export const tone = "bg-[#11223344] text-body";
`,
      line: 1,
      literal: '#11223344',
    },
  ];

  it('reports a six- and an eight-digit literal with INV-01 and the right line', () => {
    for (const fixture of mustFail) {
      const found = violationsFor([fixture], 'no-raw-hex');
      expect(found, fixture.path).toHaveLength(1);
      expect(found[0]).toMatchObject({
        path: fixture.path,
        line: fixture.line,
        literal: fixture.literal,
        inv: ['INV-01'],
      });
    }
  });

  it('suppresses a URL fragment of six hex characters (Pitfall 6)', () => {
    const fixture = {
      path: 'src/components/Anchor.tsx',
      content: `export function Anchor() {
  return <a className="${TOKEN_CLASS}" href="#abcdef">reference</a>;
}
`,
    };
    expect(violationsFor([fixture], 'no-raw-hex')).toEqual([]);
  });

  it('suppresses a scheme-qualified URL and a CSS url() reference', () => {
    const fixture = {
      path: 'src/app/theme.css',
      content: `/* see https://example.com/docs/#abcdef for the palette */
.rule { filter: url(#fade); }
`,
    };
    const rawHex = violationsFor([fixture], 'no-raw-hex');
    expect(rawHex.map((violation) => violation.literal)).toEqual([]);
  });

  it('does not treat an anchor, a non-hex fragment or an identifier as a color', () => {
    const fixture = {
      path: 'src/components/Links.tsx',
      content: `export function Links() {
  const id = "a#b";
  const worse = "a#bad";
  return <a className="${TOKEN_CLASS}" href="#section-2">{id}{worse}</a>;
}
`,
    };
    expect(violationsFor([fixture], 'no-raw-hex')).toEqual([]);
  });

  it('still flags a literal that is only three or four digits long', () => {
    const fixture = {
      path: 'src/app/short.css',
      content: `.rule { color: #abc; border-color: #abcd; }
`,
    };
    const literals = violationsFor([fixture], 'no-raw-hex').map((violation) => violation.literal);
    expect(literals).toEqual(['#abc', '#abcd']);
  });

  it('scans the root configs as well as src/', () => {
    const fixture = { path: 'postcss.config.mjs', content: "export default { theme: '#3366CC' };\n" };
    const found = checkNoRawHex(fixture);
    expect(found).toHaveLength(1);
    expect(found[0].path).toBe('postcss.config.mjs');
  });
});

describe('no-generic-healthcare-blue (INV-03)', () => {
  it('reports bg-blue-500 and text-gray-300 with INV-03 and their lines', () => {
    const fixture = {
      path: 'src/components/Generic.tsx',
      content: `export const a = "bg-blue-500";
export const b = "text-gray-300";
`,
    };
    const found = checkNoGenericHealthcareBlue(fixture);
    expect(found.map((violation) => violation.literal)).toEqual(['bg-blue-500', 'text-gray-300']);
    expect(found.map((violation) => violation.line)).toEqual([1, 2]);
    for (const violation of found) expect(violation.inv).toEqual(['INV-03']);
  });

  it('covers the whole banned family, including violet and slate', () => {
    const fixture = {
      path: 'src/app/theme.ts',
      content: `const tints = ['border-violet-400', 'ring-slate-900', 'divide-zinc-200'];
`,
    };
    const literals = checkNoGenericHealthcareBlue(fixture).map((violation) => violation.literal);
    expect(literals).toEqual(['border-violet-400', 'ring-slate-900', 'divide-zinc-200']);
  });

  it('does not fire on the same colour name in prose without a utility stem', () => {
    const fixture = {
      path: 'src/components/Prose.tsx',
      content: `export function Prose() {
  // slate-900 was rejected at the design gate; the note is prose, not a utility
  return <p className="text-text-secondary">note</p>;
}
`,
    };
    expect(checkNoGenericHealthcareBlue(fixture)).toEqual([]);
  });
});

describe('token-reference-required (INV-01, INV-13, INV-14)', () => {
  const plainComponent = {
    path: 'src/components/Plain.tsx',
    content: `export function Plain() {
  return <section className="flex flex-col p-4">plain</section>;
}
`,
  };

  it('fails a component whose class list references no derived utility', () => {
    const found = checkTokenReferenceRequired(plainComponent, tokenUtilities());
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      path: 'src/components/Plain.tsx',
      line: 1,
      literal: 'src/components/Plain.tsx',
      inv: ['INV-01', 'INV-13', 'INV-14'],
    });
  });

  it('fails a layout.tsx anywhere under src/, proving the layout scope is active', () => {
    const fixture = {
      path: 'src/app/layout.tsx',
      content: `export default function Layout({ children }: { children: unknown }) {
  return <body className="flex p-4">{children as never}</body>;
}
`,
    };
    const found = checkTokenReferenceRequired(fixture, tokenUtilities());
    expect(found).toHaveLength(1);
    expect(found[0].path).toBe('src/app/layout.tsx');
  });

  it('does not fire outside component and layout files', () => {
    const fixture = {
      path: 'src/lib/classnames.ts',
      content: `export const box = 'className="flex flex-col p-4"';
`,
    };
    expect(checkTokenReferenceRequired(fixture, tokenUtilities())).toEqual([]);
    expect(isPresenceCheckTarget(fixture.path)).toBe(false);
  });

  it('passes a component that references any derived utility as a whole token', () => {
    const fixture = {
      path: 'src/components/Card.tsx',
      content: `export function Card() {
  return <div className="rounded-pill shadow-raised bg-surface" />;
}
`,
    };
    expect(checkTokenReferenceRequired(fixture, tokenUtilities())).toEqual([]);
  });

  it('does not count a shortened collision form as a token reference', () => {
    const fixture = {
      path: 'src/components/Collision.tsx',
      content: `export function Collision() {
  return <div className="p-4 text-primary bg-muted" />;
}
`,
    };
    const found = checkTokenReferenceRequired(fixture, tokenUtilities());
    expect(found).toHaveLength(1);
  });

  it('leaves a file with no styling literal alone', () => {
    const fixture = {
      path: 'src/components/NoStyling.tsx',
      content: `export const VALUE = 1;
`,
    };
    expect(checkTokenReferenceRequired(fixture, tokenUtilities())).toEqual([]);
  });
});

describe('runChecks and the scan scope', () => {
  it('returns every check name for a single pathological record', () => {
    const fixture = {
      path: 'src/components/Worst.tsx',
      content: `export function Worst() {
  return <div className="flex" style={{ color: '#3366CC' }} data-tone="bg-blue-500" />;
}
`,
    };
    const found = runChecks([fixture]);
    expect(new Set(found.map((violation) => violation.check))).toEqual(
      new Set(['no-raw-hex', 'no-generic-healthcare-blue', 'token-reference-required']),
    );
  });

  it('returns zero violations for the must-not-fail fixtures together', () => {
    const fixtures = [
      {
        path: 'src/components/Anchor.tsx',
        content: `<a className="${TOKEN_CLASS}" href="#abcdef">reference</a>\n`,
      },
      {
        path: 'src/components/Prose.tsx',
        content: `<p className="text-text-secondary">slate-900 in prose</p>\n`,
      },
      {
        path: 'src/components/Links.tsx',
        content: `<a className="${TOKEN_CLASS}" href="#section-2">section</a>\nconst id = "a#b";\n`,
      },
    ];
    expect(runChecks(fixtures)).toEqual([]);
  });

  it('resolves a scope that includes src/ and the root configs but not the generated layer', () => {
    const scope = resolveScope();
    const paths = scope.map((record) => record.path);
    expect(paths).toContain('src/app/layout.tsx');
    expect(paths).toContain('src/app/globals.css');
    expect(paths).toContain('postcss.config.mjs');
    expect(paths).toContain('next.config.ts');
    for (const excluded of EXCLUDED_FILES) expect(paths).not.toContain(excluded);
    expect(paths.some((file) => file.includes('tokens.generated'))).toBe(false);
    expect(GENERATED_CSS_PATH).toBe('src/styles/tokens.generated.css');
  });

  it('scans only the declared extensions', () => {
    const scope = resolveScope();
    const declared = [...SCANNED_EXTENSIONS].map((extension) => extension.slice(1));
    const suffixes = scope.map((record) => record.path.split('.').pop());
    expect(scope.length).toBeGreaterThan(0);
    for (const suffix of suffixes) expect(declared, suffix).toContain(suffix);
    expect([...new Set(suffixes)]).toContain('tsx');
    expect([...new Set(suffixes)]).toContain('css');
  });
});
