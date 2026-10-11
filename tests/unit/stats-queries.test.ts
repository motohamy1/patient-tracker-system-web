// tests/unit/stats-queries.test.ts — the provider home's Daily Stats read
// (reference grammar §6, D-28). The Neon helper is mocked at the module
// boundary (patient-queries idiom): every call records its SQL text and bound
// values, and the assertions pin the three contracts that matter:
//  1. every SELECT carries the explicit `org_id` scope (0005 discipline —
//     RLS is inert on the single-owner connection);
//  2. the day windows are UTC-bounded strings, shared in spirit with
//     listDaySchedule (a visit cannot be "today" in one panel and another
//     day in the next);
//  3. the merged series is always exactly 7 entries, oldest first, ending at
//     `day`, with zero-filled gaps.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  sql: vi.fn(),
  byQuery: new Map<string, unknown[]>(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/neon', () => ({ getSql: () => h.sql }));

import { getProviderHomeStats } from '@/lib/stats/queries';

const ORG = '10000000-0000-0000-0000-000000000001';
const DAY = '2026-10-10';

function calls(): { text: string; values: unknown[] }[] {
  return h.sql.mock.calls.map((call) => {
    const [strings, ...values] = call as [TemplateStringsArray, ...unknown[]];
    return { text: strings.join('?'), values };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.byQuery.clear();
  h.sql.mockImplementation(async (strings: TemplateStringsArray) => {
    const text = strings.join(' ');
    for (const [needle, rows] of h.byQuery) {
      if (text.includes(needle)) return rows;
    }
    return [];
  });
});

describe('getProviderHomeStats — org scope and honest windows', () => {
  it('binds org_id into every one of the three SELECTs', async () => {
    await getProviderHomeStats(ORG, DAY);
    const seen = calls();
    expect(seen.length).toBe(3);
    for (const { text, values } of seen) {
      expect(text).toContain('org_id');
      expect(values).toContain(ORG);
    }
  });

  it('bounds the day reads with the UTC open/close suffixes', async () => {
    await getProviderHomeStats(ORG, DAY);
    const values = calls()[0].values;
    expect(values).toContain(`${DAY}T00:00:00.000Z`);
    expect(values).toContain(`${DAY}T23:59:59.999Z`);
  });

  it('maps the totals row to the four card values', async () => {
    h.byQuery.set('total_patients', [
      {
        total_patients: 190,
        new_patients_today: 3,
        todays_visits: 7,
        completed_today: 2,
      },
    ]);
    const stats = await getProviderHomeStats(ORG, DAY);
    expect(stats.totalPatients).toBe(190);
    expect(stats.newPatientsToday).toBe(3);
    expect(stats.todaysVisits).toBe(7);
    expect(stats.completedToday).toBe(2);
  });
});

describe('getProviderHomeStats — the 7-day series', () => {
  it('is exactly seven entries, oldest first, ending at the day', async () => {
    const stats = await getProviderHomeStats(ORG, DAY);
    expect(stats.series.map((p) => p.day)).toEqual([
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
    ]);
  });

  it('zero-fills days with no rows', async () => {
    const stats = await getProviderHomeStats(ORG, DAY);
    expect(stats.series.every((p) => p.visits === 0 && p.completed === 0 && p.newPatients === 0)).toBe(
      true,
    );
  });

  it('merges visit and patient day rows into the right cells', async () => {
    h.byQuery.set('from public.patients p', [{ day: '2026-10-08', n: 2 }]);
    h.byQuery.set('from public.visits v', [
      { day: '2026-10-08', visits: 4, completed: 1 },
      { day: '2026-10-10', visits: 3, completed: 3 },
    ]);
    const stats = await getProviderHomeStats(ORG, DAY);
    const oct8 = stats.series.find((p) => p.day === '2026-10-08');
    const oct10 = stats.series.find((p) => p.day === '2026-10-10');
    expect(oct8).toEqual({ day: '2026-10-08', visits: 4, completed: 1, newPatients: 2 });
    expect(oct10).toEqual({ day: '2026-10-10', visits: 3, completed: 3, newPatients: 0 });
  });
});
