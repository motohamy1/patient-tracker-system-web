// src/lib/patients/queries.ts — the Phase-4 server-side retrieval layer
// (PROV-02, D-17..D-20, UX-07). The ONLY place user text meets the database.
//
// D-18: search is server-side — the client debounces a URL param and never
// filters rows itself. D-19: search composes WITH the active filter in ONE
// query (a single indexed `search_text ilike` over the trgm GIN index from
// migration 0005; never four OR'd column filters — 04-RESEARCH Pattern 2 /
// Pitfall 1). D-20: cumulative paging — `shown` grows the fetched window
// (`limit shown+limit+1`) so "Load more" appends and never drops rows already
// on screen; a limit+1 probe row yields `hasMore`. `total` comes from a single
// `count(*) over ()` over the same predicate for the "{n} of {total} patients"
// count line (04-UI-SPEC §4.3).
//
// Neon + explicit org scoping: RLS policies are inert on the single-owner
// connection (neon/README.md posture note), so the `org_id = ${orgId}`
// predicate on every query IS the authorization boundary. Server Component
// call sites only — never import from a client file.
import { getSql } from '@/lib/db/neon';
import type { PatientStatus } from '@/lib/patients/status';

/**
 * A read that failed on PRIVILEGE, not on connectivity: SQLSTATE 42501 /
 * `permission denied`. Callers branch on this type to render the no-leak
 * denial copy instead of the §7 connection-error copy — message-text sniffing
 * would tie security behaviour to English prose.
 */
export class SupabasePermissionError extends Error {}

export type PatientInviteRow = {
  id: string;
  createdAt: string;
  redeemedAt: string | null;
};

type QueryErrorLike = { message?: string; code?: string };

/** Wrap a query failure with its surface name, preserving privilege failures. */
function asQueryError(surface: string, error: unknown): Error {
  const message = (error as QueryErrorLike)?.message ?? String(error);
  const code = (error as QueryErrorLike)?.code;
  return code === '42501' || message.includes('permission denied')
    ? new SupabasePermissionError(`${surface} failed: ${message}`)
    : new Error(`${surface} failed: ${message}`);
}

export type PatientFolderRow = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: 'M' | 'F';
  mrn: string;
  status: PatientStatus;
  userId: string | null;
  lastActivityAt: string;
  age: number;
};

export type ListPatientsQuery = {
  orgId: string;
  q?: string;
  filter?: 'all' | 'recent' | 'today' | 'attention' | 'critical';
  day?: string;
  shown?: number;
  limit?: number;
};

// Escapes ILIKE wildcards in user text — user input must never be able to
// widen the match (04-RESEARCH Pitfall 1).
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function ageFrom(dob: string): number {
  const born = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDelta = now.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

type PatientRowRecord = {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  sex: 'M' | 'F';
  mrn: string;
  status: PatientStatus;
  user_id: string | null;
  last_activity_at: string;
};

function mapRow(row: PatientRowRecord): PatientFolderRow {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dob: row.dob,
    sex: row.sex,
    mrn: row.mrn,
    status: row.status,
    userId: row.user_id,
    lastActivityAt: row.last_activity_at,
    age: ageFrom(row.dob),
  };
}

export type PatientRecord = PatientFolderRow & {
  createdAt: string;
  updatedAt: string;
};

type PatientRecordRow = PatientRowRecord & {
  created_at: string;
  updated_at: string;
};

/**
 * One patient for the workspace Overview (WSP-02, Phase-5 T-01).
 *
 * The id arrives pre-validated as a UUID (patientIdSchema) and is bound as an
 * equality parameter — never interpolated into a string, a path or an
 * interpreter (ASVS V5, T-02-52). The explicit `org_id = ${orgId}` predicate is
 * the org-scoping enforcement on the single-owner Neon connection: a member of
 * another organization gets `null`, and the caller renders the no-leak denial
 * state rather than asking the database twice (AUTH-03).
 *
 * Server Component call sites only — never import from a client file.
 */
export async function getPatient(orgId: string, patientId: string): Promise<PatientRecord | null> {
  const sql = getSql();
  let rows: PatientRecordRow[];
  try {
    rows = (await sql`
      select id, first_name, last_name, dob, sex, mrn, status, user_id, last_activity_at,
             created_at, updated_at
      from public.patients
      where org_id = ${orgId} and id = ${patientId}
      limit 1
    `) as unknown as PatientRecordRow[];
  } catch (error) {
    throw asQueryError('getPatient', error);
  }

  const row = rows[0];
  if (!row) return null;

  return {
    ...mapRow(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The narrow header row the workspace top bar needs (identity + status). */
export type PatientHeaderRow = {
  id: string;
  firstName: string;
  lastName: string;
  sex: string;
  /** Whole years derived from `dob` — the header's "Sex · Age" secondary line. */
  age: number;
  /** The medical record number — the header's compact identifier (§5.2). */
  mrn: string;
  status: PatientStatus;
};

/**
 * The patient record's banner identity: name, sex, age, MRN and status — the
 * one extra read the workspace top bar takes so the olive band can carry the
 * patient instead of a placeholder (§5.2). `dob` and `mrn` are already stored
 * columns (see `PatientRowRecord`), exposed here so the header shows a truthful
 * age and identifier without a second query. Same org-scoping discipline as
 * `getPatient`: the id is bound as an equality parameter, a cross-org visitor
 * gets `null` and the bar falls back to its generic title, and the query
 * never interpolates the value into anything (ASVS V5, T-02-52).
 *
 * Server Component call sites only — never import from a client file.
 */
export async function getPatientHeader(
  orgId: string,
  patientId: string,
): Promise<PatientHeaderRow | null> {
  const sql = getSql();
  let rows: {
    id: string;
    first_name: string;
    last_name: string;
    sex: string;
    dob: string;
    mrn: string;
    status: PatientStatus;
  }[];
  try {
    rows = (await sql`
      select id, first_name, last_name, sex, dob, mrn, status
      from public.patients
      where org_id = ${orgId} and id = ${patientId}
      limit 1
    `) as unknown as typeof rows;
  } catch (error) {
    throw asQueryError('getPatientHeader', error);
  }

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    sex: row.sex,
    age: ageFrom(row.dob),
    mrn: row.mrn,
    status: row.status,
  };
}

/**
 * This patient's invitations, newest first (Phase-5 T-03, WSP-02 "invite
 * sent"). The 0002 policy's role-based narrowing is inert on the single-owner
 * Neon connection, so the org scope is an explicit predicate: a caller outside
 * the org gets an empty list, never an error, and the composer simply shows
 * fewer events. Bound parameters only (ASVS V5, T-02-52).
 */
export async function listPatientInvitations(
  orgId: string,
  patientId: string,
): Promise<PatientInviteRow[]> {
  const sql = getSql();
  let rows: Array<{ id: string; created_at: string; redeemed_at: string | null }>;
  try {
    rows = (await sql`
      select id, created_at, redeemed_at
      from public.invitations
      where org_id = ${orgId} and patient_id = ${patientId}
      order by created_at desc
      limit 5
    `) as unknown as Array<{ id: string; created_at: string; redeemed_at: string | null }>;
  } catch (error) {
    throw asQueryError('listPatientInvitations', error);
  }

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    redeemedAt: row.redeemed_at,
  }));
}

export async function listPatients(
  query: ListPatientsQuery,
): Promise<{ rows: PatientFolderRow[]; hasMore: boolean; total: number }> {
  const { orgId, q, filter = 'all', day, shown = 0, limit = 24 } = query;
  const sql = getSql();
  const windowRows = shown + limit; // cumulative: rows 0..windowRows inclusive

  // A null pattern disables the search half of the predicate; the OR-guard
  // below keeps ONE query text for every filter/search combination (D-19).
  const trimmed = q?.trim() ?? '';
  const pattern = trimmed === '' ? null : `%${escapeLike(trimmed.toLowerCase())}%`;

  const attention = filter === 'attention';
  const critical = filter === 'critical';

  let dayStart: string | null = null;
  let dayEnd: string | null = null;
  if (filter === 'today') {
    // D-14: created OR updated within the client's LOCAL calendar day. `day`
    // is regex-validated (schemas.ts) before it can reach this predicate.
    const start = new Date(`${day ?? new Date().toISOString().slice(0, 10)}T00:00:00`);
    dayStart = start.toISOString();
    dayEnd = new Date(start.getTime() + 86_400_000).toISOString();
  }

  let rows: Array<PatientRowRecord & { total: number }>;
  try {
    rows = (await sql`
      select id, first_name, last_name, dob, sex, mrn, status, user_id, last_activity_at,
             (count(*) over ())::int as total
      from public.patients
      where org_id = ${orgId}
        and (${pattern}::text is null or search_text ilike ${pattern})
        and (${attention}::boolean is not true or status in ('follow_up', 'needs_review'))
        and (${critical}::boolean is not true or status = 'critical')
        and (${dayStart}::timestamptz is null
             or ((created_at >= ${dayStart} and created_at < ${dayEnd})
                 or (updated_at >= ${dayStart} and updated_at < ${dayEnd})))
      order by last_activity_at desc, id desc
      limit ${windowRows + 1}
    `) as unknown as Array<PatientRowRecord & { total: number }>;
  } catch (error) {
    throw new Error(`listPatients failed: ${(error as QueryErrorLike)?.message ?? String(error)}`);
  }

  const mapped = rows.map(mapRow);
  return {
    rows: mapped.slice(0, windowRows),
    hasMore: mapped.length > windowRows,
    total: Number(rows[0]?.total ?? 0),
  };
}
