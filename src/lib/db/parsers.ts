// src/lib/db/parsers.ts — restores the string contract for date/time columns.
//
// Both drivers hand back a JS `Date` for `timestamptz`/`timestamp`, and `pg`
// also for `date`, but every domain record in this app types those fields as
// `string` — the wire contract the previous supabase-js client provided. Left
// alone, `patient.lastActivityAt.slice(0, 10)` throws `slice is not a function`
// (FolderCard). Registering the overrides ONCE here fixes every module instead
// of coercing dates in each row mapper.
//
// Each parser wraps the driver's OWN default parser, so timestamp decoding
// stays correct and we only change the serialisation — no format guessing.
import { types as neonTypes } from "@neondatabase/serverless";
import { types as pgTypes } from "pg";

const NEON_IDS = neonTypes.builtins;
const PG_IDS = pgTypes.builtins;

/** ISO-8601 with milliseconds and `Z`, matching the previous client's output. */
function toIsoString(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

/**
 * `date` columns were plain `YYYY-MM-DD` strings before. Pass the wire text
 * through untouched rather than routing it through a Date, which would shift it
 * to midnight UTC and change the calendar day for some time zones.
 */
function rawDate(value: string): string {
  return value;
}

// ── Neon serverless HTTP driver (getSql) ────────────────────────────────────
const neonTimestamptz = neonTypes.getTypeParser(NEON_IDS.TIMESTAMPTZ, "text");
const neonTimestamp = neonTypes.getTypeParser(NEON_IDS.TIMESTAMP, "text");
neonTypes.setTypeParser(NEON_IDS.TIMESTAMPTZ, (value) => toIsoString(neonTimestamptz(value)));
neonTypes.setTypeParser(NEON_IDS.TIMESTAMP, (value) => toIsoString(neonTimestamp(value)));
neonTypes.setTypeParser(NEON_IDS.DATE, rawDate);

// ── node-postgres pool (withAppUser) ────────────────────────────────────────
const pgTimestamptz = pgTypes.getTypeParser(PG_IDS.TIMESTAMPTZ, "text");
const pgTimestamp = pgTypes.getTypeParser(PG_IDS.TIMESTAMP, "text");
pgTypes.setTypeParser(PG_IDS.TIMESTAMPTZ, (value) => toIsoString(pgTimestamptz(value)));
pgTypes.setTypeParser(PG_IDS.TIMESTAMP, (value) => toIsoString(pgTimestamp(value)));
pgTypes.setTypeParser(PG_IDS.DATE, rawDate);
