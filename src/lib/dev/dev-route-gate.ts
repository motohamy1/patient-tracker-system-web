// src/lib/dev/dev-route-gate.ts — the single dev-route gate (D-16, D-26).
//
// WHY THIS MODULE EXISTS. D-16 gates the dev-only primitives gallery on
// `NODE_ENV` alone: the gallery renders in development and is excluded from the
// production build. The intent is correct — a review surface must never ship as
// a product route — but the literal `NODE_ENV` form has a hole:
//
//   `next start` runs the production build with `NODE_ENV=production`, and the
//   visual harness (docs/governance/visual-qa-rules.md §2) captures its
//   baselines against a production build. A gate that refuses the route under
//   `NODE_ENV=production` therefore makes the gallery unreachable under the
//   harness, which contradicts D-14 (baselines cover the gallery) and §2
//   (capture against a production build).
//
// D-26 amends D-16 with a dedicated flag, and this module is the one place that
// reads it. The route is refused when the build is production AND the flag is
// absent; it is allowed otherwise:
//
//   NODE_ENV=production, flag absent  -> refused  (every real deployment)
//   NODE_ENV=production, flag present -> allowed  (the visual harness only)
//   NODE_ENV != production            -> allowed  (local development)
//
// The flag is `ALLOW_DEV_ROUTES`. No real deployment sets it, so the gallery
// stays absent from every deployment and out of the product route map; only
// `playwright.config.ts` (plan 02-11) sets it, in `webServer.env`.
//
// SECURITY CONSEQUENCE (ASVS V14 Configuration). A dev-only route leaking to
// production is a security finding, not a nitpick. `ALLOW_DEV_ROUTES` must
// never appear in `.env`, `.env.production`, `.env.local` or any deployment
// configuration; it is a security-relevant configuration switch, not a
// convenience flag. Its confinement is itself asserted: this file is the only
// source file that names the variable (plan 02-10's acceptance criteria pin
// `grep -rl "ALLOW_DEV_ROUTES" src/` to exactly this path), and plan 02-11
// asserts the route 404s whenever the flag is absent.
//
// This is NOT an authorization mechanism. The gallery is not protected by an
// access-control check; it is *absent* from real deployments, which is a
// stronger and simpler property (T-02-76). No product route may ever rely on
// this gate for access control — Phase 003 owns authorization (D-03).

/**
 * The D-26 condition. Returns `true` when the dev-only route may render.
 *
 * A pure predicate: it reads `process.env` at call time and nothing else, so
 * its whole state space is four rows and it can be exhaustively unit-tested.
 * It does not read any variable other than the two it names, so an unrelated
 * environment key can never change the result.
 */
export function isDevRouteAllowed(): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  const flagSet = Boolean(process.env.ALLOW_DEV_ROUTES);
  return !(isProduction && !flagSet);
}
