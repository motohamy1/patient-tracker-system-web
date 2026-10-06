/**
 * Next.js configuration — intentionally empty of routing/build options.
 *
 * D-03 (02-CONTEXT.md): no `middleware.ts` exists and none is planned for this
 * phase. The routes are open by decision until Phase 003 inserts its
 * server-side role resolution. Do NOT read the absence of middleware as an
 * oversight and do not add a placeholder gate — a fake gate that looks real is
 * worse than none (a client-side gate can never be trusted for authorization;
 * PRODUCT-MASTER-SPEC.md §3.1, §12).
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
