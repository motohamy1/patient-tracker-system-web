---
phase: 1
slug: project-constitution-reference-ui-specification
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-10-06
---

# Phase 1 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Governance corpus → later phases | The 8 artifacts under docs/governance/ are the binding design/authority contract that Phases 002–022 read and cite (constitution §2.1 levels 1 and 3) | Frozen token values, radius/space/font/shadow/motion scales, INV IDs, QA rows, per-surface grammar, reference registry |
| Reference assets → design grammar | docs/reference/*.jpg enter the corpus as the visual authority — 3 binding primaries plus 1 diagnostic | Design-grammar claims and the sample content quarantined in doNotReuse |
| Machine-readable governance → validator process | tokens.json and reference-manifest.json are parsed by scripts/validate-governance.mjs, which spawns certutil and reads repo files | Manifest asset paths + sha256, token values, provenance/review booleans |
| Repository → publication | Governance docs and phase records are committed and may be pushed or published | Local absolute paths, sample clinical content, reference-image bytes/metadata |
| Product security requirements → future runtime | PRODUCT-MASTER-SPEC.md §3.1/§12/§23/§27 and AGENTS.md Constraints cross into future implementation phases | Server-side authz/RLS mandate, provenance/verification-state mandate, §27 hard prohibitions |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|-----------|----------|----------|-------------|------------|--------|
| T-01-01 | Tampering | Frozen design-token contract (docs/governance/tokens.json) | medium | mitigate | scripts/validate-governance.mjs GOV-04a (:131 exact 15-key color order + hex regex + radius/space/font/motion key-set and value equality), GOV-04b (:156 shadow rgba ink derives from textPrimary decimals), GOV-04c (:172 raw hex matches only in tokens.json), GOV-04d (:189 provenance/review integrity); project-constitution.md §4.3 (:145); reference-ui-specification.md §1 (D-07 documentation and code cannot drift) | closed |
| T-01-02 | Tampering | Invariant + QA + artifact-set registries (docs/governance/ui-invariants.md, visual-qa-rules.md) | low | mitigate | GOV-03 (:347 exactly 17 unique INV-01..17 across 3 groupings), GOV-05a (:369 12 QA rows row-for-row against spec §8.1 plus accentSoft/CTA wording across 3 files), GOV-02d (:426 exactly the 8 named artifacts), GOV-04e (:436 no product code); ui-invariants.md §1 (:13 never changes and is never reused) | closed |
| T-01-03 | Tampering | Reference-image set — the visual authority (docs/reference/*.jpg) | medium | mitigate | reference-manifest.json sha256 per asset (:4-52); GOV-02a (:223) recomputes every digest via certutilSha256()/execFileSync('certutil', ['-hashfile', ...]) (:114-115) and compares; project-constitution.md §5 (:170 later phases re-verify the sha256 set at their gates) | closed |
| T-01-04 | Spoofing | Diagnostic asset docs/reference/patient-tracking-dashboard.jpg | medium | mitigate | reference-manifest.json :41-52 role diagnostic + governs never-a-design-source (D-12/D-14); GOV-02a (:223) pins diagnostic path + 3/1 role counts; tokens.json provenance.excludedAssets (:74); reference-ui-specification.md §1 (:60-64) and §3.16 (:514); project-constitution.md §5 (:181); GOV-02c (:270) stale-name confinement; plan 01-01 (:25) and 01-02 (:22) prohibitions | closed |
| T-01-05 | Information Disclosure | Sample clinical content in the corpus (doNotReuse) | low | mitigate | reference-manifest.json doNotReuse (:54-95) with per-category never-a-product-value notes + rule; reference-ui-specification.md §9 (:677); project-constitution.md §6 (:192); GOV-02b (:246) key presence. Values are fictional mockup content; no PHI, IDs/MRNs category-level only | closed |
| T-01-06 | Information Disclosure | Reference JPEG embedded metadata (EXIF/XMP/GPS/ICC) | low | accept | Header probe read docs/reference/patient-tracking-dashboard.jpg:1-3:raw — JFIF APP0 then quantisation/Huffman tables, no APP1/Exif or XMP ASCII marker; corpus never restates image metadata; sha256 pinned. Accepted — see AR-01 | closed |
| T-01-07 | Information Disclosure | Local absolute developer path in a phase record (.planning/phases/01-project-constitution-reference-ui-specification/01-RESEARCH.md:14) | low | accept | C:\Dev\Dev_World\Web_Projects\patient-tracker-system (no username/credential); grep confirms governance corpus + validator clean. Accepted — see AR-02 | closed |
| T-01-08 | Repudiation | D-08 design-gate audit trail (docs/governance/tokens.json review block) | low | mitigate | tokens.json review (:1569) normative:false, gate (:1571), gateStatus approved-with-changes (:1572), accentSplit{measuredHueSeparationDeg:17.12, ownerConfirmed:true, rule, admittedValueSource}, notes (:1596 reviewer: product owner; review date: 2026-10-06); GOV-04d (:189) machine-checks gateStatus/ownerConfirmed/hue; 01-VERIFICATION.md truth #28 (:64); 01-VALIDATION.md (:84); 01-06-SUMMARY.md D3. Residual: reviewer identity is role-level free text and gateStatus is self-attested | closed |
| T-01-09 | Elevation of Privilege | Runtime authorization enforcement placement (§3.1/§12) not carried in the phase-01 UI corpus | low | mitigate | PRODUCT-MASTER-SPEC.md §3.1 (:347-359), §12 (:867-901), §27 (:1610-1627 frontend-only role switching and authorization based only on client state); AGENTS.md Constraints Security (:18); .planning/PROJECT.md Constraints Security + Out of Scope; ROADMAP Phase 003. Residual: project-constitution.md §7 (:219) enumerates the visual/scope §27 items but omits the two auth prohibitions | closed |
| T-01-10 | Tampering | Data-provenance contract (§23/§10 AI-extracted vs clinician-verified) not carried in the phase-01 UI corpus | low | mitigate | PRODUCT-MASTER-SPEC.md §23 (:1531-1547) + §10; AGENTS.md Constraints Provenance (:21); .planning/PROJECT.md Constraints Provenance; reference-ui-specification.md §7 (:612-615 permission-denied copy without leaking the existence of data); ROADMAP Phases 009/011/012/020 | closed |
| T-01-11 | Tampering | Validator execution surface — manifest-controlled path into node:child_process (scripts/validate-governance.mjs) | low | mitigate | certutilSha256() (:114-115) uses execFileSync('certutil', ['-hashfile', rel(relPath), 'SHA256']) — argument array, no shell; rel() = path.join(ROOT, p) with ROOT from import.meta.url (:24-25); readText/readJson called only with hardcoded constants; grep confirms no writeFile/appendFile/unlink/rmSync/mkdir/eval/Function(/process.env/http/https/fetch/net/dns. Residual: path.join does not clamp .. so certutil could hash an out-of-tree file, but only a 64-hex comparison result is used and never printed (no disclosure, no mutation) | closed |
| T-01-12 | Elevation of Privilege | certutil resolved from PATH (command hijack) in scripts/validate-governance.mjs | low | accept | Bare binary name certutil resolved from the developer PATH (:115); a hostile earlier-PATH shim would execute with the developer privileges. Dev-only zero-dependency script, no secrets/network/state mutation; PATH write access already implies local code execution. Accepted — see AR-03 | closed |
| T-01-13 | Tampering | Non-normative provenance/review blocks misread as normative token values (docs/governance/tokens.json) | low | mitigate | tokens.json provenance.normative:false (:70) + disclaimer (:71), review.normative:false (:1570); GOV-04d (:189) asserts both false; reference-ui-specification.md §3 (:253-256 non-normative evidence record) | closed |
| T-01-14 | Tampering | Frozen-contract prose content — invariant objective conditions, QA pass conditions, doNotReuse array values | low | mitigate | Expected: extend scripts/validate-governance.mjs to assert (a) doNotReuse array contents equal reference-ui-specification.md §9 prose, (b) hash/compare invariant + QA objective-condition text. Present controls cover only IDs/row-names/key-presence (GOV-03 :347, GOV-05a :369, GOV-02b :246); content weakening is caught by the reviewer-evaluated gate (ui-invariants.md §5, visual-qa-rules.md §1) + git history + 01-VERIFICATION.md, not a machine check | open — below high threshold (non-blocking) |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-06 | Reference JPEGs may carry embedded metadata (EXIF/XMP/GPS/ICC) that leaks on publication; header inspection showed only JFIF APP0 with no APP1/Exif or XMP marker, the assets are product-owner design mockups, and a full-byte scan was not possible with the available text tools | accepted by: product owner via omp session | 2026-10-06 |
| AR-02 | T-01-07 | .planning/phases/01-project-constitution-reference-ui-specification/01-RESEARCH.md:14 records the local absolute path C:\Dev\Dev_World\Web_Projects\patient-tracker-system (no username or credential); internal planning record, publish-time scrub recommended | accepted by: product owner via omp session | 2026-10-06 |
| AR-03 | T-01-12 | The validator resolves the bare binary name certutil from PATH; it is a dev-only, zero-dependency, read-only script with no network access or secrets, and PATH write access already implies local code execution | accepted by: product owner via omp session | 2026-10-06 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-06 | 14 | 13 | 1 | gsd-security-auditor (retroactive-STRIDE, ASVS L1) |

`threats_open` counts only open threats at or above the `high` block threshold, so the single below-threshold open threat leaves `threats_open: 0`.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-06

### Notes

- **Register origin:** `register_authored_at_plan_time: false` — no PLAN file contained a `<threat_model>` block and no SUMMARY contained a `## Threat Flags` section (01-VALIDATION.md's Per-Task Verification Map carries `Threat Ref = —` on all 20 rows); this register was built retroactively from the artifacts (retroactive-STRIDE, ASVS L1).
- **Rejected candidates (evaluated, deliberately not registered):**
  - Runtime web-app threats (auth bypass, RLS misconfiguration, session fixation, XSS/CSRF, injection, IDOR): no server, database, API or application code exists — GOV-04e and the tree inventory confirm it; these belong to Phases 002/003/020.
  - PHI exposure through a datastore or API: no datastore, no API, no seed data; the only clinical strings are fictional reference-mockup values quarantined in doNotReuse.
  - Credential/secret/token leakage: grep for password/api-key/secret/Bearer/private-key markers across docs/governance, scripts and the phase records returned nothing; no .env exists.
  - Network/supply-chain attack: the validator imports only node:fs, node:child_process, node:path and node:url; no network module, no package.json or node_modules, and installs are prohibited (01-01-PLAN :24, 01-RESEARCH).
  - Arbitrary file read via readText/readJson: both helpers are called only with hardcoded repo-relative constants; the single manifest-derived path goes to execFileSync (see T-01-11).
  - Validator mutating state: no write/append/unlink/mkdir API in the script; it only prints and calls process.exit.
  - `--check <id>` argument abuse: it only selects from the fixed in-file checks array (main() :493-500) and exits 2 on an unknown id; it cannot influence a command or a path.
  - DoS via the repo-wide scan (scan('.') :294-309 and walk('.')): bounded to the repo tree and 4 JPEGs, ~1 s runtime recorded in 01-VALIDATION.md; no attacker-reachable amplification.
  - Git-history old implementation (d69f1f8 and earlier): outside the working tree; project-constitution.md §2.1 places existing-repository implementation below all approved sources.
  - Playwright visual-regression baselines/harness: specified only; no test assets exist to attack (D-18).
  - Human-readable twin drift (constitution §5 table, spec §2.1/§8.1, manifest): partially checked (GOV-05a row names, GOV-02a sha values) and otherwise reviewer-evaluated; merged into T-01-02/T-01-14.
  - tokens.json gateStatus self-attestation: folded as a residual note into T-01-08.
- **Escalations:**
  - Reference-JPEG full metadata scan was not possible with the available text tools: grep skipped the binary files (it reported no match for the literal JFIF bytes that are present), so the negative result is inconclusive; raw header inspection (lines 1-25) showed JFIF APP0 then table data with no APP1/Exif or XMP marker. A binary tool (exiftool / ffprobe) is outside this read-only audit; recorded as accepted risk AR-01.
  - The validator was not executed (read-only audit): mitigations were verified by reading each check body (scripts/validate-governance.mjs:129-489); 01-VALIDATION.md records all 16 checks green, but the run was not reproduced.
  - Phase plans 01-02 through 01-05 were read via targeted greps of their prohibitions fences and D-08 references rather than in full; no security-relevant content beyond the fences was found, and no SUMMARY contains a `## Threat Flags` section.

---
