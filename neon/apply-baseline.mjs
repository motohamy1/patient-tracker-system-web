// neon/apply-baseline.mjs — applies neon/migrations/0000_baseline.sql to Neon.
// Run: `npm run db:apply`. Uses DATABASE_URL_UNPOOLED (direct; migrations must
// not run over the -pooler transaction mode). Statement splitter is
// quote/comment/dollar-tag aware (function bodies use $$, $body$, $f$...).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const env = {};
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(join(root, file), "utf8").split("\n")) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!m) continue;
        let v = m[2].trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        env[m[1]] ??= v;
      }
    } catch {
      // missing env file is fine
    }
  }
  return env;
}

function splitStatements(sql) {
  const out = [];
  let buf = "";
  let i = 0;
  let dollarTag = null;
  const n = sql.length;
  while (i < n) {
    // inside dollar-quoted string: only the matching close tag ends it
    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        buf += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      buf += sql[i];
      i++;
      continue;
    }
    // line comment
    if (sql.startsWith("--", i)) {
      const end = sql.indexOf("\n", i);
      buf += sql.slice(i, end === -1 ? n : end);
      i = end === -1 ? n : end;
      continue;
    }
    // block comment
    if (sql.startsWith("/*", i)) {
      const end = sql.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      buf += sql.slice(i, stop);
      i = stop;
      continue;
    }
    // single-quoted string ('' escape)
    if (sql[i] === "'") {
      if (sql.startsWith("''", i)) {
        buf += "''";
        i += 2;
        continue;
      }
      const end = sql.indexOf("'", i + 1);
      const stop = end === -1 ? n : end + 1;
      buf += sql.slice(i, stop);
      i = stop;
      continue;
    }
    // double-quoted identifier ("" escape)
    if (sql[i] === '"') {
      if (sql.startsWith('""', i)) {
        buf += '""';
        i += 2;
        continue;
      }
      const end = sql.indexOf('"', i + 1);
      const stop = end === -1 ? n : end + 1;
      buf += sql.slice(i, stop);
      i = stop;
      continue;
    }
    // dollar-quote open tag: $tag$ (tag may be empty)
    const dm = sql.slice(i, i + 32).match(/^\$[A-Za-z_][A-Za-z_0-9]*\$|^\$\$/);
    if (dm) {
      dollarTag = dm[0];
      buf += dollarTag;
      i += dollarTag.length;
      continue;
    }
    if (sql[i] === ";") {
      if (buf.replace(/--[^\n]*/g, "").trim()) out.push(buf);
      buf = "";
      i++;
      continue;
    }
    buf += sql[i];
    i++;
  }
  if (buf.replace(/--[^\n]*/g, "").trim()) out.push(buf);
  return out;
}

const env = loadEnv();
const url = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set in .env/.env.local");
  process.exit(1);
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);

// Fresh-project safety: if a previous partial apply left public tables behind,
// reset the schema before retrying. neon_auth is untouched.
const existing = await sql.query(
  "select tablename from pg_tables where schemaname='public' order by 1",
  [],
);
const existingNames = existing.map((r) => r.tablename);
if (existingNames.length > 0 && !existingNames.includes("organizations")) {
  console.log(`resetting partial public schema (${existingNames.length} tables)...`);
  await sql.query("drop schema public cascade", []);
  await sql.query("create schema public", []);
} else if (existingNames.length > 0) {
  console.log(`public schema already has ${existingNames.length} tables; applying on top`);
}

const baseline = readFileSync(join(root, "neon", "migrations", "0000_baseline.sql"), "utf8");
const statements = splitStatements(baseline);
console.log(`applying ${statements.length} statements...`);
let applied = 0;
for (const [idx, stmt] of statements.entries()) {
  try {
    await sql.query(stmt, []);
    applied++;
  } catch (error) {
    console.error(`statement ${idx + 1}/${statements.length} failed:`);
    console.error(stmt.slice(0, 500));
    throw error;
  }
  if (applied % 50 === 0) console.log(`  ${applied}/${statements.length}`);
}
console.log(`applied ${applied}/${statements.length} statements`);
const tables = await sql.query("select count(*)::int as n from pg_tables where schemaname='public'", []);
console.log("public tables:", tables[0]?.n ?? tables?.rows?.[0]?.n);
