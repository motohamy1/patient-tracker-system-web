# Phase 2 — Security Assessment (02-SECURITY.md)

**Phase:** 2 — Foundation and App Shell
**Plan:** 02-11
**ASVS level:** 1 (`security_enforcement: true`, `security_asvs_level: 1`, `security_block_on: high`)
**Written:** 2026-07 (task-2)

Phase 002 builds no clinical capability, no authentication and no authorization. Its live risk is
**configuration, containment and supply-chain**, not application logic. Each of the four risks this
phase carries is now an automated assertion rather than a convention.

**Block-on-high conclusion:** with the scope as locked, Phase 002 has **no `high`-severity finding
available to it.** The one `high` row in the register (T-02-SC) is a supply-chain row whose
disposition is "mitigate" and whose mitigation is fully in place: this plan installs nothing, the
thirteen packages are pinned exactly, the lockfile is committed, and `.npmrc` enables the engine and
audit checks.

---

## 1. Trust boundaries

| Boundary | Description |
|---|---|
| Environment → production server | The dev-route flag decides whether a dev-only route exists in a production-mode server. This is the phase's central configuration boundary. |
| Browser → third-party origin | Every request the built client makes leaves the product's origin; in a PHI product each is a review item and a disclosure vector. |
| Dev fixture module → client bundle | One import edge decides whether a `Patient`-shaped structure ships to browsers. |
| Headless Chromium → committed baselines | The rendering environment determines the rasterization; a mismatch silently invalidates every committed PNG. |

---

## 2. The four live threats, with dispositions and proving tests

| Threat ID | Category | Component | Severity | Disposition | Proving test / evidence |
|---|---|---|---|---|---|
| **T-02-77** | Information disclosure | The dev-route flag reaching `.env`, `.env.production` or a deployment config, opening `/dev/gallery` publicly (ASVS V14) | medium | **mitigate** | `tests/visual/security.spec.ts` → *"the dev gallery 404s on a production server started without the flag"* starts a second production server with the flag removed and asserts `404`; its companion test *"the dev-route flag is named only in its gate module and the harness config"* asserts the flag appears in exactly `src/lib/dev/dev-route-gate.ts` and `playwright.config.ts`. `tests/unit/dev-route-gate.test.ts` exhausts the four-row truth table. No `.env` file exists; `.gitignore` blocks `.env`, `.env.local` and `.env.production`. |
| **T-02-78** | Information disclosure | The dev fixture module's structure reaching the shipped client bundle (ASVS V8) | medium | **mitigate** | `tests/visual/security.spec.ts` → *"the dev fixture placeholder literal is absent from the client bundle"* reads `.next/static` and asserts `dev-placeholder` is absent. `tests/unit/dev-fixtures.test.ts` asserts only the gallery imports the module (no `src/app/**` or `src/components/**` file does) and that every fixture collection is empty. |
| **T-02-79** | Information disclosure | A third-party request at runtime — CDN font, icon sprite, analytics beacon — leaking page visits from a PHI product (ASVS V8) | medium | **mitigate** | `tests/visual/security.spec.ts` → *"the built client makes no off-origin request"* records every request across six routes and asserts each is same-origin. `next/font` self-hosting (D-19) and inlined Lucide components (D-21) are what make a zero count achievable. |
| **T-02-SC** | Tampering | A malicious or slopsquatted package entering via `npm install` (ASVS V10) | **high** | **mitigate** | **This plan installs nothing.** The thirteen packages are pinned to exact versions in `package.json` (next 16.3.8, react/react-dom 19.3.0, tailwindcss + @tailwindcss/postcss 4.3.3, motion 14.0.0, gsap 3.15.0, lucide-react 1.52.0, typescript ~5.9, @playwright/test 1.63.0, vitest 5.0.3, @vitejs/plugin-react 6.1.2, jsdom 30.1.2, @types/*); `package-lock.json` is committed; `.npmrc` enables the engine and audit checks. Any later install must carry its own legitimacy check and that gate is never auto-approved. |

### 2.1 Additional register rows recorded (baseline / CI / gate integrity)

| Threat ID | Category | Component | Severity | Disposition | Mitigation |
|---|---|---|---|---|---|
| T-02-80 | Repudiation | Committed baselines passing locally and being assumed valid elsewhere | medium | mitigate | Every pinnable value is pinned; no `{platform}` segment; `02-VERIFICATION.md` §6 records that baselines are workstation-local and must be **regenerated, never copied**, on a new runner. |
| T-02-81 | Tampering | Baselines hand-tuned or silently regenerated to pass | medium | mitigate | Regeneration was a deliberate `--update-snapshots` act recorded in `02-VERIFICATION.md` §1; the task-3 human gate forbids editing a token, component or route to make a row pass. |
| T-02-82 | Tampering | A CI provider added, inheriting machine-local baselines never verified on that runner | medium | mitigate | No CI configuration exists (D-17); `ls .github/workflows` and `ls .gitlab-ci.yml` both fail; the suite runs locally via `npm run test:visual`. |
| T-02-83 | Repudiation | A green suite cited as acceptance while QA rows/invariants were never judged | medium | mitigate | `02-VERIFICATION.md` carries a row per QA row and an entry per applicable invariant; task-3 is a blocking human gate; §27 makes a build-only pass a hard prohibition. |
| T-02-84 | Elevation of privilege | The dev gallery treated as an access-control boundary | medium | mitigate | The gate module states the gallery is protected by **absence**, not by an authorization check; both role layouts and `/login` carry the Phase 003 server-side slot marker. |

---

## 3. ASVS scope statement — V2 through V6 assessed and NOT YET APPLICABLE to Phase 002

**ASVS V2 Authentication, V3 Session Management, V4 Access Control, V5 Input Validation and V6
Cryptography were assessed and are NOT YET APPLICABLE to Phase 002 as a whole, and this section is
where that assessment is recorded formally.** Each category is assessed, not skipped.

- **V2 Authentication — NOT YET APPLICABLE.** No credential is created, read or verified anywhere in
  the phase. `/login` renders a typed empty state and **no form**; `src/app/(auth)/` has no submit
  control. Owned by **Phase 003**.
- **V3 Session Management — NOT YET APPLICABLE.** No cookie, token or session state is created or
  read. There is no `middleware.ts` and no auth helper. Owned by **Phase 003**.
- **V4 Access Control — NOT YET APPLICABLE.** No authorization is implemented; the routes render
  openly by decision **D-03**. Owned by **Phase 003**.
- **V5 Input Validation — NOT YET APPLICABLE.** No user-supplied data is accepted anywhere in the
  phase. The one attacker-controlled input is the `[patientId]` route parameter, and it is never
  rendered, never passed to a query, a filesystem path, a shell, a template or a log (it is consumed
  only through `tabHref`, which percent-encodes it into a relative href). Owned by **Phase 003**.
- **V6 Cryptography — NOT YET APPLICABLE.** Nothing is encrypted, signed or hashed in the phase. The
  font fetch is a build-time fetch, not a runtime credential. Owned by **Phase 003**.

### 3.1 V4 hard negative rule (recorded explicitly)

**No client-side gate of any kind was created, and no role is read from anywhere client-held.**
There is no `middleware.ts`, no client-side redirect, no hidden form and no conditional render that
derives a workspace from `localStorage`, browser state or a URL parameter. The routes are openly
temporary by decision D-03, and the exact slot where Phase 003's **server-side** role resolution
lands is marked in `src/app/(provider)/layout.tsx`, `src/app/(patient)/layout.tsx` and
`src/app/(auth)/login/page.tsx`.

The dev-only gallery (T-02-77) is **not** an access-control boundary: it is protected by **absence**
from real deployments (proven by the 404 test), not by an authorization check. A fake gate that looks
real is worse than none.

### 3.2 Categories that DO apply in Phase 002

| ASVS category | How Phase 002 satisfies it |
|---|---|
| **V8 Data Protection** | Zero third-party egress (proven by test); dev fixtures kept out of the client bundle (proven by test); fixtures carry shape, never clinical value (unit test). |
| **V10 Malicious Code / Supply Chain** | Thirteen audited packages, exact pins, committed lockfile, `.npmrc` engine/audit checks; this plan installs nothing (T-02-SC). |
| **V12 Files and Resources** | Self-hosted fonts only (`next/font`); inlined Lucide SVG icons; no third-party script/sprite/CDN. |
| **V14 Configuration** | The dev-route flag is confined to one source file (`src/lib/dev/dev-route-gate.ts`) plus the harness config, and its confinement is itself a test; the route is absent from any real deployment. |

---

*Phase: 2 — Foundation and App Shell · Plan 02-11 · security assessment written by task-2.*
