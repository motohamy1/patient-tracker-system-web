# Phase 1: Research — Project Constitution + Reference UI Specification

**Gathered:** 2026-10-05
**Status:** Complete
**Parent contract:** greenfield repo; Phase 1 delivers documentation/contract artifacts under `docs/governance/` only (Success Criterion 4: no product code).
**Companion artifact:** `01-UI-SPEC.md` (gsd-ui-checker approved, 2026-10-05).

## Summary

This phase freezes rules, not the app. Deliverable families: (1) project constitution recording the §1 source-of-truth hierarchy and anti-generic/anti-gamification constraints (GOV-01, GOV-06); (2) reference UI specification with one shared design-system core plus per-surface grammar, with the old screenshot demoted to diagnostic (GOV-02, GOV-03, D-15); (3) frozen semantic tokens as canonical `tokens.json` plus a human-facing table citing it (GOV-04, D-07); (4) visual QA, responsive and motion rules derived from §21/§26/§9 (GOV-05); (5) reference registry twice — human table + machine manifest with sha256 (D-14); (6) the D-12 path corrections in existing planning docs. Hex/radius/spacing/type values are derived by pixel sampling during execution and owner-approved at this phase's design gate (D-08) — never invented, never deferred.

## Environment Reality

All rows below were executed in this session from `C:\Dev\Dev_World\Web_Projects\patient-tracker-system`.

| Capability | Status | Evidence |
|---|---|---|
| ffmpeg / ffprobe | **AVAILABLE** | `ffmpeg version 8.1.1-full_build-www.gyan.dev` |
| Pixel sampling via ffmpeg | **AVAILABLE — proven end-to-end** | `ffmpeg -v error -i docs/reference/patient-workspace-timeline-primary.jpg -vf "crop=24:24:40:900,scale=1:1:flags=area,format=rgb24" -frames:v 1 -f rawvideo -pix_fmt rgb24 pipe:` piped to a `node -e` byte reader returned `bytes: 3 rgb: dde0e5`. A 24×24 region-average reduces to exactly one RGB triple. This is the canonical sampling primitive. |
| sha256 | **AVAILABLE** | `certutil -hashfile <file> SHA256` (verified, values below). PowerShell `Get-FileHash -Algorithm SHA256` is the equivalent fallback. |
| Node.js | **AVAILABLE** | `v22.22.3` — used for the byte→hex conversion and the `tokens.json` key-set assertion. No project `package.json` exists; use `node -e`, never `npm`. |
| Python + PIL / ImageMagick | **NOT VERIFIED — do not rely on** | Not checked; ffmpeg already covers the need. |
| package.json, src/, Tailwind, app scaffold | **ABSENT (hard fact)** | Repo root holds only `AGENTS.md`, `PRODUCT-MASTER-SPEC.md`, `docs/reference/` (4 JPGs), `.planning/`, `.kilo/`. |

**Reference asset sha256 — recomputed independently this session (all four verified):**

| Asset | sha256 |
|---|---|
| `docs/reference/provider-home-primary.jpg` | `f2a0f03b34c705585ee7ef47705576cd17b34638b75ba9d0f43b2f418e92c3da` |
| `docs/reference/patient-workspace-timeline-primary.jpg` | `820b6bac4fed46dcf3da7aeb269a20e8437bbb2f8ac11ce216c0176fb2fc93e2` |
| `docs/reference/patient-home-primary.jpg` | `7491790279688f4b48651c7e0950102da4d05594eb690d950e962ef8bfb06501` |
| `docs/reference/patient-tracking-dashboard.jpg` | `e1b0b74a5fc248750695ee95b1238d2c84932c5c9c4d5570b88dfa3b23c30c02` |

Fallback order if ffmpeg is unavailable in an executor context: ffmpeg (proven) → PowerShell `System.Drawing` pixel read → manual eyedropper on a magnified crop (acceptable because the owner views every value at the design gate). **Never install packages in this phase.**

## Pixel Sampling Methodology

A single pixel on a JPG is contaminated by chroma subsampling, edge anti-aliasing, thin strokes, and gradient fills. Discipline:

1. **Median of flat regions, never single pixels.** Per token pick ≥5 disjoint 8–24px windows, each ≥12px from any text, icon, card edge, divider or node boundary. Reject a window if a 4×4 sub-scan spreads channels >4/255. Token value = channel-wise median of accepted windows; record every window and its per-window RGB in the derivation column.
2. **Vision-locate, pixel-confirm.** Locate the region by eye/render first, confirm numerically. Thin strokes / small pills may only be a `vision-estimate` and must be flagged `confirm`.
3. **Tool (proven command shape).** One invocation per window:
   ```bash
   ffmpeg -v error -i docs/reference/<img>.jpg \
     -vf "crop=W:H:X:Y,scale=1:1:flags=area,format=rgb24" \
     -frames:v 1 -f rawvideo -pix_fmt rgb24 pipe:
   ```
   Pipes exactly 3 bytes (`r g b`). Convert inline:
   ```bash
   node -e "let b=[];process.stdin.on('data',d=>b.push(d)).on('end',()=>{const x=Buffer.concat(b);console.log([x[0],x[1],x[2]].map(v=>v.toString(16).padStart(2,'0')).join(''))})"
   ```
   Re-run each window shifted ±4px; values must agree within ±2/255 per channel. **No repo files, no committed scripts** — sampling is an execution-time activity, not a deliverable.

Binding sources are the three primaries only. `patient-tracking-dashboard.jpg` is never sampled for design intent (§3.7 evidence only).

### Region → token mapping

Normalized coordinates; anchors confirmed visually against the decoded timeline primary (2486×1728), relocatable by the executor.

| Token | Image | Region anchor |
|---|---|---|
| `canvas` | timeline primary | outer page field at left margin of the node band (x≈1.5–3%, y≈45–55%) — canonical canvas/surface exemplar per D-06 |
| `surface` | timeline primary | Heart Rate card interior away from numeral and sparkline; cross-check provider-home folder card fill |
| `surfaceMuted` | timeline primary | bottom scrubber track between ticks; cross-check patient-home inset note field |
| `surfaceRaised` | timeline primary | active tab pill fill; raised card edges |
| `frame` | timeline primary | top bar band (y≈2–6%) avoiding search pill and tab bar; cross-check provider-home left rail |
| `frameForeground` | timeline primary | rail / top-bar icon stroke — vision-estimate only |
| `textPrimary` | timeline primary | widest stroke of the "72" numeral — edge risk, take the nearest wide-stroke flat window. Never `#000` (D-06) |
| `textSecondary` | timeline primary | muted axis / secondary label — vision-estimate, owner-flagged |
| `borderSubtle` | timeline primary | timeline axis hairline between month dividers; table row hairline in bottom-row cards |
| `accent` | timeline primary | interior of ≥4 filled circular event nodes (D-02 named source) |
| `success` | patient-home primary | "normal"/ok status pill fill family |
| `info` | patient-home primary | "pending" soft-blue pill fill |
| `warning` | provider-home primary | amber "follow-up" pill — weakest evidence family, must be pixel-confirmed |
| `critical` | provider-home primary | Critical Alerts panel fill/mid tones; freeze the saturated mid of the family, render soft fills by opacity over `surface` |

### Two decisions resolved during sampling

- **One accent, two duties (D-02).** Sample both the timeline node yellow and the provider-home CTA yellow. Only if ≥~8° hue separation **and** owner confirmation at the gate, record the split: `accent` = timeline chartreuse, `accentSoft` = CTA gold (UI-SPEC §4.3 provisional `#EDFE4F` vs `#FFCE04`). No third yellow token, ever.
- **Pastel chips (D-04).** Mint/lavender/blue/putty quick-log chips are decorative; sample only to verify they sit within the neighborhood of `canvas` / `surface` / `borderSubtle`. No new tint family. If a chip falls outside that neighborhood, the first correction is styling strategy (transparency / at-rest tokens), never new tokens.

## sha256 Manifest Method

win32 command (verified working this session):

```bash
certutil -hashfile "docs/reference/<file>.jpg" SHA256
```

Manifest stores lowercase 64-char hex. Machine manifest `docs/governance/reference-manifest.json` (D-14), `role` ∈ {`binding`, `diagnostic`}:

```json
{
  "version": 1,
  "generated": "<ISO-8601 on execution>",
  "assets": [
    { "path": "docs/reference/provider-home-primary.jpg", "role": "binding",
      "sha256": "f2a0f03b34c705585ee7ef47705576cd17b34638b75ba9d0f43b2f418e92c3da",
      "governs": ["§2", "§2.1", "§2.2", "§2.3", "§2.4", "§21", "reference-ui-specification.md §Provider Home"] },
    { "path": "docs/reference/patient-workspace-timeline-primary.jpg", "role": "binding",
      "sha256": "820b6bac4fed46dcf3da7aeb269a20e8437bbb2f8ac11ce216c0176fb2fc93e2",
      "governs": ["§2", "§8.1", "§8.2", "§8.6", "reference-ui-specification.md §Patient Workspace + D3 Timeline"] },
    { "path": "docs/reference/patient-home-primary.jpg", "role": "binding",
      "sha256": "7491790279688f4b48651c7e0950102da4d05594eb690d950e962ef8bfb06501",
      "governs": ["§2", "§14", "reference-ui-specification.md §Patient Home"] },
    { "path": "docs/reference/patient-tracking-dashboard.jpg", "role": "diagnostic",
      "sha256": "e1b0b74a5fc248750695ee95b1238d2c84932c5c9c4d5570b88dfa3b23c30c02",
      "governs": ["§3.3", "§3.4", "§3.5", "§3.7", "never a design source (D-12/D-14)"] }
  ],
  "doNotReuse": {
    "names": ["Sarah Miller", "Robert Garcia", "Tiffany Woodward", "Dr. Eleanor Vance"],
    "labels": ["Cardiology", "Vital Signs", "Communication"],
    "medications": ["Lisinopril 10mg", "Metformin 500mg"],
    "rule": "sample content is not binding grammar — see reference-ui-specification.md §Do-not-reuse"
  }
}
```

Execution recomputes and compares before freezing; a mismatch means the asset changed and is a phase blocker.

## D-12 Reference Path Corrections

Repo-wide literal grep of `diagnostic-current-implementation\.png`, **verified this session**. Executable rows — the phase must edit exactly these:

| File | Line | Correction |
|---|---|---|
| `.planning/PROJECT.md` | 86 | → `docs/reference/patient-tracking-dashboard.jpg` |
| `.planning/PROJECT.md` | 112 | key-decision row path → same |
| `.planning/ROADMAP.md` | 44 | Phase 1 Success Criterion 1 path → same |
| `.planning/STATE.md` | 67 | path → same |
| `.planning/research/PITFALLS.md` | 7 | path → same |
| `.planning/research/PITFALLS.md` | 144 | path → same |

Non-executable rows — leave untouched, they are decision/history records:

| File | Line | Why untouched |
|---|---|---|
| `.planning/phases/01-.../01-CONTEXT.md` | 49, 106 | decision record (D-12 itself names the string it is correcting) |
| `.planning/phases/01-.../01-DISCUSSION-LOG.md` | 67, 71 | historical transcript of the decision |
| `.planning/phases/01-.../01-UI-SPEC.md` | 391 | open-item note; resolves once the six executable rows land |

**D-12's own list is over-inclusive and under-inclusive.** It names `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `AGENTS.md` — but grep finds **no match in `REQUIREMENTS.md` or `AGENTS.md`** (verified). It misses `STATE.md` and `research/PITFALLS.md`, which do contain the stale path. A plan that follows D-12's list literally will report "not found" for two files and silently miss two real ones. **The executable set is the six rows above.**

No `git mv`; the asset keeps its filename.

## docs/governance/ Package Structure

1. **`project-constitution.md`** — Purpose & scope; source-of-truth hierarchy (§1); visual-character invariants (§2.1 must/must-not feel); color-language grounding with the explicit D-01 light-frame interpretation; anti-generic/anti-gamification reject-on-sight list; **human-readable reference registry table** (D-14); machine-check contract naming the three Phase-002 lint rules (D-17); do-not-reuse list (D-13).
2. **`reference-ui-specification.md`** — Scope (one core + per-surface grammar, D-15); design-system core: tokens / geometry / typography / depth / spacing; Provider Home grammar; Patient Workspace + D3 Timeline grammar; Patient Home grammar; binding-vs-sample-content statement; **human-facing token table citing `tokens.json`** (D-07).
3. **`ui-invariants.md`** — numbered `INV-xx` invariants (token-only styling; exactly two elevation levels; hairline-only borders; no outlined cards; no upstream-cited dark frame; one accent family, status = success/info/warning only) so later phases can grep named IDs.
4. **`visual-qa-rules.md`** — the 12-row pass/fail checklist plus the Playwright harness contract below.
5. **`responsive-rules.md`** — §26 bands (desktop ≥1024, tablet 768–1023, mobile <768) + expectation notes; exact breakpoint map is Phase-002 detail.
6. **`motion-rules.md`** — values below.
7. **`tokens.json`** — canonical tokens (schema below).
8. **`reference-manifest.json`** — D-14 manifest.

## tokens.json Schema

14 camelCase color keys (D-10 names are immutable vocabulary) plus radius, spacing, typography, exactly two shadows (D-03), role-based (D-11). `accentSoft` is present **only if** the D-02 split is confirmed at the gate.

```json
{
  "name": "patient-clinical-workspace-tokens",
  "version": 1,
  "mode": "light",
  "color": {
    "frame": "#…", "frameForeground": "#…",
    "canvas": "#…", "surface": "#…",
    "surfaceMuted": "#…", "surfaceRaised": "#…",
    "textPrimary": "#…", "textSecondary": "#…",
    "borderSubtle": "#…",
    "accent": "#…", "accentSoft": "#… (optional)",
    "success": "#…", "warning": "#…",
    "critical": "#…", "info": "#…"
  },
  "radius": { "sm": "8px", "md": "12px", "lg": "16px", "xl": "24px", "pill": "999px" },
  "space":  { "xs": "4px", "sm": "8px", "md": "12px", "lg": "16px", "xl": "24px", "2xl": "32px" },
  "font": {
    "size":       { "label": "12px", "body": "14px", "heading": "16px", "display": "28px" },
    "weight":     { "regular": "400", "semibold": "600" },
    "lineHeight": { "tight": "1.1", "heading": "1.25", "body": "1.5", "label": "1.4" }
  },
  "shadow": {
    "raised":  "0 2px 6px rgba(r,g,b,.07), 0 8px 24px rgba(r,g,b,.05)",
    "overlay": "0 12px 32px rgba(r,g,b,.16), 0 4px 12px rgba(r,g,b,.10)"
  },
  "motion": {
    "duration": { "fast": "120ms", "slow": "240ms" },
    "easing":   { "standard": "cubic-bezier(0.2, 0, 0, 1)", "exit": "cubic-bezier(0.4, 0, 1, 1)" }
  }
}
```

No `tokens.css` here (Phase 002 generates it from this JSON). Values are sampled per the methodology; the shadow `rgba` ink must derive from `textPrimary`, not an arbitrary black.

## Visual QA Checklist + Playwright Harness Contract

The 12 §21 rows with objective pass conditions — this table is the gate content of `visual-qa-rules.md`:

| # | Check | Objective pass condition |
|---|---|---|
| 1 | Outer structure | Columns/rails/grid match the cited per-surface grammar section; no reflow invented |
| 2 | Color relationships | Frame renders light warm-gray (D-01); cards separate by shadow, not border; accent occupies ≤10% of visible area (pixel-share estimate on a screenshot) |
| 3 | Spacing rhythm | Every gap/padding value is one of `space.xs`…`space.2xl`; no page-level >32px section gaps |
| 4 | Compactness | No control or card height exceeds its closest reference counterpart; no card with ≤1 line of content |
| 5 | Card proportions | Provider folder grid = 3 columns at ≥1024px; workspace bottom row ≈55/22.5/22.5 within ±3% of measured widths |
| 6 | Pill controls | Nav/compact controls use `radius.pill`; no sharp-corner (≤4px) control anywhere |
| 7 | Typography hierarchy | Only `font.size` values and weights 400/600; `tabular-nums` on every clinical/statistic value |
| 8 | Timeline proportions | Axis height, month divider spacing, node diameter, branch stroke width within ±10% of reference measurements |
| 9 | Node/branch behavior | Filled nodes use `accent`; branches are thin, smooth, collision-free (no crossings between sibling sub-event arcs) |
| 10 | Bottom scrubber | Capsule track in `surfaceMuted`, tick marks present, year labels present, dark viewport window at overlay shadow level |
| 11 | Visual density | Provider/workspace = dense; patient home = sparse upper-range spacing; both read as the same language |
| 12 | Accent restraint | Accent appears only on the reserved list (timeline nodes/milestones, primary CTA, active emphasis, state dots); status colors limited to success/info/warning (D-04) |

Reject the phase for a generic-SaaS look, a second visual language, or any gamified treatment (§21).

**Playwright contract** (specified now, built in Phase 002 — D-18): viewports `1440×900` (canonical), `1280×800`, `768×1024`, `390×844`; baselines at `tests/visual/baselines/{surface}/{viewport}/{state}.png` (e.g. `provider-home/1440x900/default.png`); states `default` and `reduced-motion`; capture against a production build with animations disabled and reduced-motion via emulation; `maxDiffPixelRatio: 0.01`, per-pixel `threshold: 0.2`; baselines committed, regeneration only via a recorded `--update-snapshots` run.

## Motion Rule Values

`duration.fast` **120ms** for hovers, toggles, pill/badge state. `duration.slow` **240ms** for panels, sheets, surface and timeline-choreography segments. The easing set is exactly two curves: `standard` `cubic-bezier(0.2,0,0,1)` for entrances/emphasis, `exit` `cubic-bezier(0.4,0,1,1)` for exits.

Framer Motion (`motion`) owns component entrance/exit, layout transitions, panels, sheets, folder→workspace transitions, micro-interactions. GSAP owns complex SVG drawing, timeline path animation and scrubber-driven choreography, scoped by `gsap.context()` / `useGSAP()`. **Never both for one animation.**

Reduced-motion contract: every animation routes through Framer `useReducedMotion` and GSAP `gsap.matchMedia('(prefers-reduced-motion: reduce)')`; degrade to opacity-only ≤120ms, or a static render for timeline choreography. Motion is fast, smooth, subtle, interruptible, purposeful — never gamified (§9).

## Product Spec Constraints

- **§1** hierarchy: constitution → reference image → UI spec/invariants → phase spec → plan → tasks → repo → agent preference. The repository is never higher authority than approved design.
- **§2** the reference UI image is the visual source of truth; the product evolves it.
- **§2.1** must/must-not feel lists (GOV-06).
- **§2.2** three color families; the three named dark structural surfaces in `patient-tracking-dashboard.jpg` are §3.7 failure evidence, not intent; 14 semantic tokens; values frozen after visual review; semantic tokens, not scattered raw hex.
- **§2.3** pills, very rounded cards, soft corners, thin lines; avoid sharp corners, mixed radius systems, bulky tiles, huge empty cards.
- **§2.4** subtle depth; reference over trend names.
- **§3.7** current colors incorrect — rebuild the token layer first, never patch component-by-component.
- **§9** two-layer motion (Framer vs GSAP), reduced-motion compatible.
- **§19 Phase 001** creates exactly constitution / reference UI spec / invariants / tokens / QA / responsive / motion / anti-generic constraints — no product feature, approved before feature-heavy implementation.
- **§20.9** no autonomous "build everything" start.
- **§21** the 12-row gate above.
- **§26** web and mobile share the language, not the layout; mobile adapts for touch.
- **§27** hard prohibitions (generic dashboard, saturated multi-color, gamification, out-of-phase work, build-pass-is-not-done, …).
- **§29 Step 4** stop after planning init and confirm greenfield + reference-as-source-of-truth — the same review discipline applies to this phase's design gate.

## Requirement Coverage Map (GOV-01…GOV-06)

| Req | Concrete deliverable | Verified by |
|---|---|---|
| GOV-01 | `project-constitution.md` §Source-of-truth hierarchy reproducing the 9-level order and the "repo is never higher authority" clause | grep for all 9 levels in the file; reviewer confirms order |
| GOV-02 | `reference-ui-specification.md` registry + per-surface grammar sections; `patient-tracking-dashboard.jpg` marked `role: diagnostic` in the manifest and the human table with "never a design source" | grep `diagnostic` in manifest + spec; manifest hash recompute |
| GOV-03 | `ui-invariants.md` INV-01… covering §2.1 character, §2.3 geometry, §2.4 depth | file exists with all three groupings + named IDs |
| GOV-04 | `tokens.json` with exactly the 14 camelCase keys + scales; human table in the reference UI spec **cites** the JSON rather than duplicating values; no raw hex elsewhere under `docs/governance/` | JSON key-set assertion; hex grep returns matches only in `tokens.json`. Provenance (per-window sampled RGB) must live in a table explicitly marked **non-normative** so the "no scattered raw hex" claim stays checkable. |
| GOV-05 | `visual-qa-rules.md` 12-row table + Playwright contract; `responsive-rules.md` §26 bands; `motion-rules.md` values + reduced-motion contract | headings/rows present; values match the `tokens.json` motion block |
| GOV-06 | `project-constitution.md` anti-generic/anti-gamification section listing the §21/§27 rejection criteria | grep for each prohibition keyword |

## Risks and Landmines

- **D-01 frame darkness (spec vs images).** §2.2 lists "dark olive / khaki structural framing and navigation" as a color family; all three binding primaries render frame and navigation as light warm-gray with an olive undertone. The constitution **must** state this interpretation explicitly with its reason (the spec text names the hue neighborhood; the images render it at high lightness), and name the charcoal bezel in `patient-tracking-dashboard.jpg` as §3.7 failure evidence — otherwise a later phase will "restore" a dark frame and violate D-01.
- **Anti-aliased sampling trap.** Single pixels on thin strokes, node edges and small pills produce wrong and unstable values. `warning`, `textSecondary` and `frameForeground` are the known weak spots. Median-of-5-windows plus ±4px re-sample agreement is mandatory; weak values must be flagged, not silently accepted.
- **D-12 list over- and under-inclusive.** See the D-12 section — REQUIREMENTS.md and AGENTS.md have no match; STATE.md and research/PITFALLS.md do and are missed by D-12's list.
- **D-02 accent split left open.** `tokens.json` must permit `accentSoft` present-or-absent at the design gate. Freezing both unconditionally, or neither, contradicts D-02 / UI-SPEC §4.3.
- **D-07 duplication trap.** If the human token table restates hex values instead of citing `tokens.json`, docs and code drift and the phase's whole anti-drift claim fails.
- **Zero-product-code discipline.** Any `package.json`, `src/`, Tailwind config, or `tokens.css` produced here breaks Success Criterion 4.
- **Registry-drift risk.** Baseline images could be re-exported; the manifest's sha256 set makes that detectable — verification must actually run at each later phase's gate.

## Validation Architecture

Nyquist validation is enabled (`.planning/config.json`: `workflow.nyquist_validation: true`, `verifier: true`, `ui_safety_gate: true`, `human_verify_mode: end-of-phase`). Each deliverable is verifiable now except the two Phase-002 implementations.

| Deliverable | Verification (runnable at phase close) |
|---|---|
| `tokens.json` valid + exact key set | `node -e "const t=require('./docs/governance/tokens.json');const req=['frame','frameForeground','canvas','surface','surfaceMuted','surfaceRaised','textPrimary','textSecondary','borderSubtle','accent','success','warning','critical','info'];const extra=Object.keys(t.color).filter(k=>!req.includes(k));const missing=req.filter(k=>!(k in t.color));console.log(extra.length||missing.length?('EXTRA:'+extra+' MISSING:'+missing):'OK')"` plus a regex check that every value matches `^#[0-9A-Fa-f]{6}$` |
| `tokens.json` values sampled, not invented | provenance table in `reference-ui-specification.md` lists ≥5 windows per token with ±4px re-sample agreement within ±2/255 recorded in the derivation column |
| `reference-manifest.json` | `certutil -hashfile <each path> SHA256` compared to manifest values; all four match; every entry has path/role/sha256/governs; roles are exactly 3 `binding` + 1 `diagnostic` |
| D-12 corrections | grep for `diagnostic-current-implementation\.png` returns matches only in `01-CONTEXT.md`, `01-DISCUSSION-LOG.md` and `01-UI-SPEC.md:391`; the six corrected rows contain `patient-tracking-dashboard.jpg` |
| Constitution content | grep for each of the 9 hierarchy levels; grep for the D-01 light-frame statement; grep for each §27 prohibition keyword |
| UI invariants | `ui-invariants.md` contains INV IDs covering §2.1 / §2.3 / §2.4 with objective pass conditions |
| Visual QA rules | 12 rows present, each with an objective condition; Playwright contract names 4 viewports, the baseline path scheme, and tolerance numbers |
| Motion rules | duration/easing values match `tokens.json.motion`; reduced-motion fallback wording matches §9 + STACK.md GSAP/Framer hooks |
| No product code | `git status --short` shows changes only under `docs/governance/` and the six D-12 planning-doc lines; no `package.json`, `src/`, Tailwind config, or `tokens.css` created |
| GOV-01…06 | the mapping table above; each row's verification executed |
| Owner design gate | end-of-phase human review of sampled values against the images before Phase 002 (D-08, §20.9, §29 Step 4 discipline) |

**Specified now, implemented in Phase 002:** the three machine checks `no-raw-hex`, `no-generic-healthcare-blue`, `token-reference-required` (named in the constitution per D-17), and the Playwright visual-regression harness with committed baselines (D-18).

## Sources

- `PRODUCT-MASTER-SPEC.md` §1, §2/§2.1–§2.4, §3.7, §3.8, §9, §19 Phase 001, §20.9, §21, §26, §27, §29 Step 4 (read directly).
- `.planning/phases/01-.../01-CONTEXT.md` (D-01…D-19), `01-UI-SPEC.md` (§1.4 provenance, §4.2–4.3 accent rules, §7 motion, §11 QA + Playwright, §12 machine checks, §13 registry + sha256, §14 tokens.json contract).
- `.planning/REQUIREMENTS.md` GOV-01…GOV-06; `.planning/ROADMAP.md` Phase 1 success criteria; `.planning/PROJECT.md`; `.planning/STATE.md`; `.planning/config.json` (nyquist/verifier/ui gates); `AGENTS.md` §15–20 constraints.
- `.planning/research/STACK.md` and `.planning/research/PITFALLS.md` (drift pitfalls; Playwright 1.63.x; GSAP `matchMedia` + Framer `useReducedMotion` reduced-motion pattern).
- Live checks this session: `ffmpeg -version` (8.1.1), `node --version` (v22.22.3), four `certutil -hashfile` runs, one full pixel-sampling pipeline smoke test (`rgb: dde0e5`), repo-wide grep of `diagnostic-current-implementation\.png` for the D-12 table, repo-root glob (absent toolchain), and image decode of the timeline primary (2486×1728; confirms accent event nodes, bottom scrubber, and the dark viewport window).

---

*Phase: 1-project-constitution-reference-ui-specification*
*Researched: 2026-10-05*