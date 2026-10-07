// Audit-surface unit proof (D-15, AUTH-06, 03-UI-SPEC §8.7 + §Copywriting):
// the page's guard precedes the audit_log fetch (source assertion), row
// markup carries tabular-nums and borderSubtle row lines with no status-tint
// or badge classes, and the empty-state copy is byte-exact. Static render
// idiom of tests/unit/primitives/EmptyState.test.tsx.
import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { AuditBrowser } from '@/components/security/audit-browser';
import { AuditTable } from '@/components/security/AuditTable';

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
  motion: {
    button(props: Record<string, any>) {
      const { children, whileHover, whileTap, transition, ...rest } = props;
      return createElement('button', rest, children);
    },
  },
}));

const ROWS = [
  {
    id: 'r1',
    actor: 'actor-uuid-1',
    action: 'DELETE',
    entity: 'memberships',
    entity_id: 'm1',
    org_id: 'org-1',
    created_at: '2026-10-07T09:30:00Z',
  },
];

function parse(element: ReactElement): Document {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
}

function classesOf(node: Element | null): string[] {
  if (!node) throw new Error('expected an element');
  return (node.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

describe('AdminAuditPage guard ordering (D-15, source assertion)', () => {
  it('runs runsCapability with CAN_RETRIEVE_AUDIT before the audit_log fetch', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/app/(provider)/provider/admin/audit/page.tsx'),
      'utf8',
    );
    const guardIdx = source.indexOf('CAN_RETRIEVE_AUDIT');
    const fetchIdx = source.indexOf(".from('audit_log')");
    expect(guardIdx).toBeGreaterThan(-1);
    expect(fetchIdx).toBeGreaterThan(-1);
    expect(guardIdx).toBeLessThan(fetchIdx);
    expect(source).toContain("resolveWorkspaceRole('admin')");
    expect(source).toContain("redirectForRole('admin'");
  });
});

describe('AuditTable — §8.7 markup', () => {
  it('renders the Audit log heading at the heading step', () => {
    const doc = parse(<AuditTable rows={ROWS} />);
    const heading = doc.querySelector('h1');
    expect(heading?.textContent).toBe('Audit log');
    expect(classesOf(heading)).toContain('text-heading');
  });

  it('timestamps are tabular-nums at label size; rows use borderSubtle row lines only', () => {
    const doc = parse(<AuditBrowser rows={ROWS} />);
    const timestamp = doc.querySelector('p');
    expect(classesOf(timestamp)).toContain('tabular-nums');
    expect(classesOf(timestamp)).toContain('text-label');
    const row = doc.querySelector('li > div');
    expect(classesOf(row)).toContain('border-border-subtle');
    expect(classesOf(row)).toContain('bg-surface');
  });

  it('no status-tint or badge classes leak into any audit row', () => {
    const doc = parse(<AuditBrowser rows={ROWS} />);
    for (const node of Array.from(doc.querySelectorAll('*'))) {
      const classes = classesOf(node);
      expect(classes.some((name) => /^(text|bg)-(success|info|warning|critical)$/.test(name))).toBe(
        false,
      );
      expect(classes.some((name) => /badge/.test(name))).toBe(false);
    }
  });

  it('renders the only filter: a plain CompactControl search', () => {
    const doc = parse(<AuditBrowser rows={ROWS} />);
    const input = doc.querySelector('input[type="search"]');
    expect(input).not.toBeNull();
    expect(input?.getAttribute('id')).toBe('audit-search');
  });
});

describe('AuditTable empty state — §Copywriting byte-exact', () => {
  it('shows the exact empty copy when there are no rows', () => {
    const doc = parse(<AuditTable rows={[]} />);
    expect(doc.querySelector('h2')?.textContent).toBe('No audit entries yet');
    expect(doc.querySelector('p')?.textContent).toBe(
      'Actions on memberships and invites are recorded here automatically.',
    );
  });
});
