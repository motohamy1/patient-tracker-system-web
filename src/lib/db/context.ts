// src/lib/db/context.ts — per-request identity re-export.
//
// withAppUser lives in client.ts (the pg pool owner). This module keeps the
// existing import shape stable for action modules.
export { withAppUser, type TxClient as DbTx } from "./client";
