// tests/unit/recent-records.test.tsx — the Phase-5 T-03 recent-activity proof
// (WSP-02 "what changed"; ticket 03; §7 copy contract; INV-04/INV-11/INV-12).
//
// Two layers in one file: the PURE composer (activity.ts — merge, order,
// cap, honesty rules) and the card's rendered copy/geometry. The invitation
// query gets the same chainable-builder harness as patient-record-query so
// its PostgREST contract (org scope, patient scope, order, limit) is asserted
// rather than trusted.
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const h = vi.hoisted(() => ({
  calls: [] as Array<[string, ...unknown[]]>,
  data: [] as unknown[],
  error: null as { message: string } | null,
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    const record =
      (name: string) =>
      (...args: unknown[]): unknown => {
        h.calls.push([name, ...args]);
        return chain;
      };
    const chain: Record<string, unknown> = {};
    for (const op of ['select', 'eq', 'order']) {
      chain[op] = record(op);
    }
    chain.limit = (n: number) => {
      h.calls.push(['limit', n]);
      return Promise.resolve({ data: h.data, error: h.error });
    };
    return { from: () => chain };
  },
}));

import { composeRecentEvents, RECENT_ACTIVITY_LIMIT } from '@/lib/patients/activity';
import { listPatientInvitations, SupabasePermissionError } from '@/lib/patients/queries';
import { RecentRecordsCard } from '@/components/workspace/RecentRecordsCard';
import type { ActivityEvent } from '@/lib/patients/activity';

const ORG = '10000000-0000-0000-0000-000000000001';
const PATIENT_ID = '11111111-1111-4111-8111-111111111111';

const PATIENT = {
  id: PATIENT_ID,
  createdAt: '2025-05-12T08:00:00Z',
  updatedAt: '2026-10-06T09:30:00Z',
};

function render(events: ActivityEvent[]): Document {
  const markup = renderToStaticMarkup(createElement(RecentRecordsCard, { events }));
  return new DOMParser().parseFromString(markup, 'text/html');
}

beforeAll(() => {
  h.calls.length = 0;
});

describe('composeRecentEvents — real patient-scoped facts only (§27, D-18)', () => {
  it('merges record lifecycle and invite events, newest first', () => {
    const events = composeRecentEvents(PATIENT, [
      { id: 'i1', createdAt: '2026-09-01T10:00:00Z', redeemedAt: null },
    ]);
    expect(events.map((e) => e.label)).toEqual(['Record updated', 'Invite sent', 'Record created']);
  });

  it('does not invent an "updated" row for an untouched record', () => {
    const events = composeRecentEvents(
      { ...PATIENT, updatedAt: PATIENT.createdAt },
      [],
    );
    expect(events.map((e) => e.label)).toEqual(['Record created']);
  });

  it('reports a redeemed invite at its redemption time', () => {
    const events = composeRecentEvents(
      { ...PATIENT, updatedAt: PATIENT.createdAt },
      [{ id: 'i1', createdAt: '2025-06-01T10:00:00Z', redeemedAt: '2025-06-02T12:00:00Z' }],
    );
    expect(events.map((e) => e.label)).toEqual(['Invite redeemed', 'Record created']);
  });

  it('caps the trail at the card density limit with stable keys', () => {
    const events = composeRecentEvents(PATIENT, [
      { id: 'i1', createdAt: '2026-09-01T10:00:00Z', redeemedAt: null },
      { id: 'i2', createdAt: '2026-09-02T10:00:00Z', redeemedAt: null },
      { id: 'i3', createdAt: '2026-09-03T10:00:00Z', redeemedAt: null },
    ]);
    expect(events).toHaveLength(RECENT_ACTIVITY_LIMIT);
    expect(new Set(events.map((e) => e.key)).size).toBe(events.length);
    expect(events.every((e) => e.at > '2025')).toBe(true);
  });

  it('never uses the route parameter as an event key (T-02-52)', () => {
    const events = composeRecentEvents(PATIENT, []);
    for (const event of events) {
      expect(event.key).not.toBe(PATIENT_ID);
      expect(event.key.startsWith('patient:') || event.key.startsWith('invite:')).toBe(true);
    }
  });
});

describe('listPatientInvitations — org-scoped, patient-scoped, bounded', () => {
  it('selects the three columns, filters org then patient, orders desc, limits 5', async () => {
    h.calls.length = 0;
    h.error = null;
    h.data = [];
    await listPatientInvitations(ORG, PATIENT_ID);

    expect(h.calls).toEqual([
      ['select', 'id, created_at, redeemed_at'],
      ['eq', 'org_id', ORG],
      ['eq', 'patient_id', PATIENT_ID],
      ['order', 'created_at', { ascending: false }],
      ['limit', 5],
    ]);
  });

  it('maps rows to camelCase invite rows', async () => {
    h.calls.length = 0;
    h.data = [
      { id: 'i1', created_at: '2026-09-01T10:00:00Z', redeemed_at: null },
      { id: 'i2', created_at: '2025-06-01T10:00:00Z', redeemed_at: '2025-06-02T12:00:00Z' },
    ];
    const rows = await listPatientInvitations(ORG, PATIENT_ID);
    expect(rows).toEqual([
      { id: 'i1', createdAt: '2026-09-01T10:00:00Z', redeemedAt: null },
      { id: 'i2', createdAt: '2025-06-01T10:00:00Z', redeemedAt: '2025-06-02T12:00:00Z' },
    ]);
  });

  it('throws a privilege-classified error on a permission failure', async () => {
    h.calls.length = 0;
    h.error = { message: 'permission denied' };
    await expect(listPatientInvitations(ORG, PATIENT_ID)).rejects.toBeInstanceOf(
      SupabasePermissionError,
    );
    await expect(listPatientInvitations(ORG, PATIENT_ID)).rejects.toThrow(
      'listPatientInvitations failed: permission denied',
    );
    h.error = null;
  });
});

describe('RecentRecordsCard — §5 grammar and §7 copy', () => {
  const EVENTS: ActivityEvent[] = [
    { key: 'patient:p:updated', kind: 'updated', at: '2026-10-06T09:30:00Z', label: 'Record updated' },
    { key: 'invite:i1:sent', kind: 'invite', at: '2026-09-01T10:00:00Z', label: 'Invite sent' },
    { key: 'patient:p:created', kind: 'created', at: '2025-05-12T08:00:00Z', label: 'Record created' },
  ];

  it('renders the title and one row per event with its date block', () => {
    const doc = render(EVENTS);
    expect(doc.body.textContent).toContain('Recent Records');
    expect(doc.body.textContent).toContain('Record updated');
    expect(doc.body.textContent).toContain('Invite sent');
    expect(doc.body.textContent).toContain('Record created');
    // date blocks: day numeral + month abbreviation
    expect(doc.body.textContent).toContain('06');
    expect(doc.body.textContent).toContain('Oct');
    expect(doc.querySelectorAll('li')).toHaveLength(3);
  });

  it('paints the type pill in the frozen critical family, text carrying the meaning (INV-04)', () => {
    const doc = render(EVENTS);
    const pills = doc.querySelectorAll('li .bg-critical');
    expect(pills.length).toBe(3);
    // label ink is textPrimary, never the tint itself
    for (const pill of pills) {
      expect(pill.className).toContain('text-text-primary');
      expect(pill.className).toContain('rounded-pill');
    }
    expect(doc.querySelector('.bg-warning')).toBeNull();
    expect(doc.querySelector('.bg-success')).toBeNull();
    expect(doc.querySelector('.bg-info')).toBeNull();
  });

  it('caps the rendered rows at the density limit (INV-12)', () => {
    const overflow = Array.from({ length: 6 }, (_, i) => ({
      key: `k${i}`,
      kind: 'updated' as const,
      at: `2026-10-0${i + 1}T00:00:00Z`,
      label: 'Record updated',
    }));
    const doc = render(overflow);
    expect(doc.querySelectorAll('li')).toHaveLength(RECENT_ACTIVITY_LIMIT);
  });

  it('reads the §7 contract verbatim when there is nothing yet', () => {
    const doc = render([]);
    expect(doc.body.textContent).toContain('No records yet');
    expect(doc.body.textContent).toContain('Records will appear here as care progresses.');
    expect(doc.querySelectorAll('li')).toHaveLength(0);
  });

  it('sets tabular-nums on the day numeral and draws no divider rail (INV-11, QA row 7)', () => {
    const markup = renderToStaticMarkup(createElement(RecentRecordsCard, { events: EVENTS }));
    expect(markup).toContain('tabular-nums');
    // no rules, no borders, no divide-* — rows separate by gap alone
    expect(markup).not.toMatch(/\bborder-/);
    expect(markup).not.toMatch(/\bdivide-/);
    expect(markup).not.toMatch(/\bborder-t\b|\bborder-b\b/);
    // frozen type scale only
    expect(markup).not.toMatch(/text-(xs|sm|lg|xl|\dxl)/);
    expect(markup).not.toMatch(/font-(thin|light|normal|medium|bold|extrabold|black)/);
    // no dead header control (the reference "..." chrome is not faked)
    expect(markup).not.toContain('<button');
  });
});
