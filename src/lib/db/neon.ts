// src/lib/db/neon.ts — Neon serverless query helper (connect guide pattern).
//
// app/actions.ts shape:
//
//   "use server";
//   import { getSql } from "@/lib/db/neon";
//   const sql = getSql();
//   const rows = await sql`select ...`;
//
// Uses the pooled DATABASE_URL for app traffic (neon-postgres skill); direct
// URL only for migrations. Cached per process so serverless reuses it.
//
// "./parsers" is a load-bearing side effect: it restores the string contract
// for timestamptz/timestamp/date columns (the drivers otherwise return Date).
import "./parsers";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | undefined;

export function getSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set (Neon pooled connection string).");
  }
  sql ??= neon(url);
  return sql;
}
