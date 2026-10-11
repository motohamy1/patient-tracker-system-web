// src/lib/db/client.ts — Neon direct pool (node-postgres, per neon-postgres skill).
//
// DATABASE_URL_UNPOOLED (direct) is REQUIRED: migrations, SET LOCAL
// app.user_id, and any session state must not run over the -pooler
// transaction mode. getSql() (pooled HTTP) stays for plain reads;
// withAppUser() below checks out a real session for identity-scoped writes.
//
// "./parsers" is a load-bearing side effect: it restores the string contract
// for timestamptz/timestamp/date columns (pg otherwise returns Date).
import "./parsers";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

let pool: Pool | undefined;

function connectionString(): string {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
    }
    throw new Error("DATABASE_URL_UNPOOLED is not set (Neon direct connection string).");
  }
  return url;
}

export function getPool(): Pool {
  pool ??= new Pool({ connectionString: connectionString(), max: 5 });
  return pool;
}

export type TxClient = {
  query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
};

/** Run fn inside a session transaction with app.user_id set (trigger identity). */
export async function withAppUser<T>(userId: string | null, fn: (tx: TxClient) => Promise<T>): Promise<T> {
  const client: PoolClient = await getPool().connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.user_id', $1, true)", [userId ?? ""]);
    try {
      const result = await fn({
        query: async <R extends QueryResultRow>(text: string, params?: unknown[]) => {
          const res = await client.query<R>(text, params as unknown[]);
          return { rows: res.rows };
        },
      });
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  } finally {
    client.release();
  }
}
