// src/lib/stats/queries.ts — the provider home's Daily Stats reads (reference
// grammar §6: "a Critical Alerts panel plus Daily Stats on the right as 2x2
// mini stat cards with sparklines"; D-28).
//
// Every number is a real aggregate over the org's rows — nothing estimated,
// nothing invented (the reference's sample "Daily Stats" numbers are
// do-not-reuse content, not a contract to fill). The RLS policies are inert on
// the single-owner Neon connection, so every SELECT carries its own explicit
// `org_id` predicate (the 0005 discipline).
//
// The seven-day series is anchored on the SAME UTC day window the schedule
// panel already uses (listDaySchedule), so a visit can never appear as
// "today" in one panel and a different day in another. Days with no activity
// are filled with zeros client-side — the series is always exactly 7 entries,
// oldest first, ending at `day`.
import { getSql } from '@/lib/db/neon';

export type DailyStatPoint = {
  day: string;
  visits: number;
  completed: number;
  newPatients: number;
};

export type ProviderHomeStats = {
  totalPatients: number;
  newPatientsToday: number;
  todaysVisits: number;
  completedToday: number;
  series: DailyStatPoint[];
};

const DAY_START_SUFFIX = 'T00:00:00.000Z';
const DAY_END_SUFFIX = 'T23:59:59.999Z';

/** The inclusive UTC window: `day` minus `back` days through end of `day`. */
function windowOf(day: string, back: number): { from: string; to: string } {
  const start = new Date(`${day}${DAY_START_SUFFIX}`);
  start.setUTCDate(start.getUTCDate() - back);
  return { from: start.toISOString(), to: `${day}${DAY_END_SUFFIX}` };
}

/** The exact 7-day spine, oldest first — independent of what the reads found. */
function spine(day: string): string[] {
  const anchor = new Date(`${day}${DAY_START_SUFFIX}`);
  const out: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(anchor);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

type TotalsRow = {
  total_patients: number;
  new_patients_today: number;
  todays_visits: number;
  completed_today: number;
};

type PatientDayRow = { day: string; n: number };
type VisitDayRow = { day: string; visits: number; completed: number };

export async function getProviderHomeStats(
  orgId: string,
  day: string,
): Promise<ProviderHomeStats> {
  const sql = getSql();
  const dayStart = `${day}${DAY_START_SUFFIX}`;
  const dayEnd = `${day}${DAY_END_SUFFIX}`;
  const week = windowOf(day, 6);

  const totals = (await sql`
    select
      (select count(*) from public.patients
        where org_id = ${orgId})::int as total_patients,
      (select count(*) from public.patients
        where org_id = ${orgId} and created_at >= ${dayStart} and created_at <= ${dayEnd})::int
        as new_patients_today,
      (select count(*) from public.visits
        where org_id = ${orgId} and scheduled_at >= ${dayStart} and scheduled_at <= ${dayEnd})::int
        as todays_visits,
      (select count(*) from public.visits
        where org_id = ${orgId} and stage = 'after_visit'
          and scheduled_at >= ${dayStart} and scheduled_at <= ${dayEnd})::int
        as completed_today
  `) as unknown as TotalsRow[];

  const patientDays = (await sql`
    select to_char(date_trunc('day', p.created_at at time zone 'UTC'), 'YYYY-MM-DD') as day,
           count(*)::int as n
    from public.patients p
    where p.org_id = ${orgId} and p.created_at >= ${week.from} and p.created_at <= ${week.to}
    group by 1
  `) as unknown as PatientDayRow[];

  const visitDays = (await sql`
    select to_char(date_trunc('day', v.scheduled_at at time zone 'UTC'), 'YYYY-MM-DD') as day,
           count(*)::int as visits,
           count(*) filter (where v.stage = 'after_visit')::int as completed
    from public.visits v
    where v.org_id = ${orgId} and v.scheduled_at >= ${week.from} and v.scheduled_at <= ${week.to}
    group by 1
  `) as unknown as VisitDayRow[];

  const patientsByDay = new Map(patientDays.map((r) => [r.day, r.n]));
  const visitsByDay = new Map(visitDays.map((r) => [r.day, r]));

  const t = totals[0];
  return {
    totalPatients: t?.total_patients ?? 0,
    newPatientsToday: t?.new_patients_today ?? 0,
    todaysVisits: t?.todays_visits ?? 0,
    completedToday: t?.completed_today ?? 0,
    series: spine(day).map((d) => ({
      day: d,
      visits: visitsByDay.get(d)?.visits ?? 0,
      completed: visitsByDay.get(d)?.completed ?? 0,
      newPatients: patientsByDay.get(d) ?? 0,
    })),
  };
}
