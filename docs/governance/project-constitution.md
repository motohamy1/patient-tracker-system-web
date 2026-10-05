# Project Constitution — Patient Clinical Workspace

This document is the permanent project constitution. It sits at the top of the authority
hierarchy it defines, and every later phase is checked against it. It governs the
authority order, the visual character, the color-language grounding, the reference
registry, the do-not-reuse list, the rejection criteria, and the machine checks named for
Phase 002.

---

## 1. Purpose and scope

This constitution governs the *rules and grounding* for the whole product: the
source-of-truth hierarchy (§2), the visual character (§3), the color-language grounding
(§4), the reference registry (§5), the sample-content do-not-reuse list (§6), the
anti-generic and anti-gamification rejection criteria (§7), the machine-check contract
named for Phase 002 (§8), and the index of the rest of the governance package (§9).

This constitution explicitly does **not** contain product code of any kind: no component,
no route, no product feature, and no CSS token layer. The CSS token layer (Tailwind v4
`@theme` plus kebab-case custom properties) is **generated from `docs/governance/tokens.json`
in Phase 002** — no `tokens.css` is written in Phase 001. The canonical token values live
in `docs/governance/tokens.json`; this constitution cites token *names* only and restates no
value.

The rest of the governance package lives alongside this file and is cited by path:

- `docs/governance/reference-ui-specification.md`
- `docs/governance/ui-invariants.md`
- `docs/governance/visual-qa-rules.md`
- `docs/governance/responsive-rules.md`
- `docs/governance/motion-rules.md`
- `docs/governance/tokens.json`
- `docs/governance/reference-manifest.json`

---

## 2. Source-of-truth hierarchy

This section is the load-bearing authority rule for the project. When any two sources
disagree, precedence is resolved by this order.

### 2.1 The 9-level hierarchy (8 numbered levels, 9 named artifacts)

1. **Approved project Constitution** — the document you are reading
   (`docs/governance/project-constitution.md`). It is the highest authority.
2. **Primary Reference UI image supplied by the product owner** — the three per-surface
   primaries registered under `docs/reference/`.
3. **Reference UI Specification and UI Invariants** —
   `docs/governance/reference-ui-specification.md` and `docs/governance/ui-invariants.md`
   (two named artifacts sharing one level).
4. **Approved feature specification for the current phase.**
5. **Approved technical plan.**
6. **Approved tasks/checklist.**
7. **Existing repository implementation** — what the existing repository currently
   contains.
8. **Agent preference.**

The existing repository is NEVER a higher authority than the approved design/specification.

The screenshots of the current implementation are diagnostic evidence only. They show what
went wrong; they are not design references.

---

## 3. Visual character

The interface must feel:

- premium;
- clinical;
- calm;
- highly organized;
- information-dense but easy to scan;
- modern;
- tactile;
- restrained;
- visually sophisticated.

It must NOT feel:

- childish;
- cartoon-like;
- gaming-oriented;
- generic SaaS;
- spreadsheet-like;
- overly glossy;
- over-animated;
- excessively glassmorphic;
- excessively neumorphic;
- filled with arbitrary gradients;
- decorated with unrelated 3D illustrations.

The reference is the visual authority, not the trend names "Neumorphism" or
"Glassmorphism" — reproduce the visual grammar of the reference; do not apply a design
trend blindly.

The enforceable, greppable form of this section is `docs/governance/ui-invariants.md`
INV-01 through INV-06 (visual character). Where this section and those invariants disagree
in wording, INV-01 through INV-06 govern the checkable form and this section governs the
intent.

---

## 4. Color-language grounding

### 4.1 The three reference families

The reference establishes three major visual families:

1. **Olive/khaki structural framing and navigation** — the frame and the navigation
   structure of every surface.
2. **Warm ivory / off-white clinical workspace surfaces** — the field and the cards that
   carry clinical information.
3. **Bright vivid yellow used selectively** — for important interactions, timeline
   milestones, active emphasis, and key state indicators only.

**Substitution ban.** Never substitute these families with generic Tailwind
blue/indigo/purple healthcare colors, and never choose arbitrary theme colors merely
because they look "modern."

### 4.2 The D-01 light-frame interpretation

The §2.2 phrase "dark olive / khaki structural framing and navigation areas" is interpreted
as an **olive-tinted structural gray at high lightness**, not as a dark surface. Across all
three binding primaries the frame and navigation render as a **light warm-gray with an olive undertone** — never a dark surface.

The reason: §2.2 names the family's **hue neighborhood** (olive/khaki), while the primaries
render that family at high lightness. The images are the visual source of truth per §2, so
the lightness reading wins.

The corroborating note: the only dark structural surface in the entire asset set is the old
implementation's charcoal bezel in `docs/reference/patient-tracking-dashboard.jpg`, which is
diagnostic evidence of the §3.7 color failure and is **never design intent**.

**Standing prohibition.** No phase may "restore", "correct toward", or reintroduce a dark
frame or dark navigation on the grounds that §2.2 says "dark olive." This resolution is
recorded here precisely so that later re-reads do not reopen it.

The two contained dark elements *inside* binding primaries — the timeline scrubber's dark
viewport window and the MRI event card — are sanctioned. They render as the single overlay
elevation level, not as a frame.

### 4.3 Token discipline

The 15 semantic color tokens are the only color vocabulary. They are named exactly:

`frame`, `frameForeground`, `canvas`, `surface`, `surfaceMuted`, `surfaceRaised`,
`textPrimary`, `textSecondary`, `borderSubtle`, `accent`, `accentSoft`, `success`, `warning`,
`critical`, `info`.

`accentSoft` was admitted at the D-08 owner design gate (2026-10-06): the D-02 accent split is
confirmed, so the timeline chartreuse (`accent`) and the provider-home primary-CTA gold
(`accentSoft`) are two distinct hues — there is no third yellow token. No other color token may
be invented.

The canonical values live in `docs/governance/tokens.json`. This constitution deliberately
restates no hex value — resolve every color through the JSON.

`textPrimary` is a near-black warm gray, **never pure black** (D-06). The token contract is
**role-based, not literal-value-based** (D-11): a dark-mode set can be added later without
renaming any token. This package ships light-mode values only — the reference grammar is a
light-mode product.

---

## 5. Reference registry

The four reference assets are registered here in human-readable form. This is the
human-readable twin of the machine-readable `docs/governance/reference-manifest.json`.

| Asset | Role | Governing spec sections | sha256 |
|---|---|---|---|
| `docs/reference/provider-home-primary.jpg` | binding | §2, §2.1, §2.2, §2.3, §2.4, §21, reference UI spec §Provider Home | `f2a0f03b34c705585ee7ef47705576cd17b34638b75ba9d0f43b2f418e92c3da` |
| `docs/reference/patient-workspace-timeline-primary.jpg` | binding | §2, §8.1, §8.2, §8.6, reference UI spec §Patient Workspace and D3 Timeline | `820b6bac4fed46dcf3da7aeb269a20e8437bbb2f8ac11ce216c0176fb2fc93e2` |
| `docs/reference/patient-home-primary.jpg` | binding | §2, §14, reference UI spec §Patient Home | `7491790279688f4b48651c7e0950102da4d05594eb690d950e962ef8bfb06501` |
| `docs/reference/patient-tracking-dashboard.jpg` | **diagnostic only** | §3.3, §3.4, §3.5, §3.7 — never a design source | `e1b0b74a5fc248750695ee95b1238d2c84932c5c9c4d5570b88dfa3b23c30c02` |

The three binding primaries bind **design grammar only** — layout, geometry, density,
proportion, interaction patterns, and color relationships. The diagnostic asset is
**never a design source**, and its role is recorded here so that no later phase can
mistake the charcoal-bezel old implementation for intent. The diagnostic asset keeps its
filename, with no `git mv`.

`docs/governance/reference-manifest.json` is the machine-readable twin of this table, and
later phases re-verify the sha256 set at their gates so that a re-exported baseline is
detectable.

---

## 6. Sample content — do not reuse

**Rule first:** layout, geometry, density, and interaction patterns are the binding
grammar; sample content is never copied into the product.

The following categories of sample content visible in the reference images must never be
copied as content the product renders:

- **Patient names** — `Sarah Miller`, `Robert Garcia`, `Tiffany Woodward`,
  `Dr. Eleanor Vance`, `Dr. Smith`.
- **Numeric IDs and MRNs.**
- **Medications** — `Lisinopril 10mg`, `Metformin 500mg`.
- **The `Cardiology` specialty label.**
- **The `Vital Signs` and `Communication` tabs.**
- **Vitals values** — `72 bpm`, `118/75`, `98%`, `36.8°C`.
- **Lab names** — `CBC Panel`, `Lipid Profile`, `Glucose`.
- **Appointment and sample rows.**
- **"Daily Stats" numbers.**

**Consequence (D-15):** the canonical patient-workspace primary nav is exactly the 8 tabs
`Overview | AI Analytics | Visits | Medications | Labs | Imaging | Allergies | Genetics`,
so `Vital Signs` and `Communication` are sample content and never a layout rule; vitals
belong inside Overview and Communication is a provider/profile surface, not a primary
clinical tab.

---

## 7. Anti-generic and anti-gamification rejections

These are **reject-at-review-time criteria**, not aspirations. A phase that fails any of
them is rejected at its review gate.

**Reject conditions (§21):**

- Reject the phase if it looks like a generic SaaS dashboard even when the requested
  functionality works.
- Reject the phase if new features introduce a different visual language.
- Reject the phase if the implementation starts becoming overly gamified.

**Explicit violations (reject on sight, §27 / §16), each with its reason:**

- Generic Tailwind `blue/indigo/purple` healthcare substitution — violates the §2.2
  substitution ban.
- Generic dashboard chrome unrelated to the reference — abandons the reference grammar.
- A `saturated multi-color` redesign (every folder a different color) — breaks the D-04
  multi-hue restriction.
- `points`, levels, `streaks`, `fireworks`, cartoon rewards, or gamified animation —
  the product is clinical, never a game.
- Hardcoded `Cardiology`-style specialty labels — §3.3 failure: specialty must be
  data-driven, never hardcoded in the shell.
- Generic tables replacing the folder-first patient collection — loses the reference's
  scan pattern.
- A `static chart` replacing the `D3` timeline — the timeline is D3-mandated (§8) and
  interactive; a static chart is a spec violation.
- Random extra navbar categories — navigation is a fixed contract.
- Excessive `glassmorphism` — the reference is the authority, not the trend.
- Excessive `neumorphism` — controls must stay distinguishable.
- An `outlined-card` look (D-05) — card edges separate by shadow, not border.
- A `dark frame` or dark navigation (D-01) — overridden by the light-frame interpretation
  in §4.2.
- Unrelated `3D` illustrations — decoration unrelated to content is prohibited.
- Arbitrary `gradients` — not part of the reference color language.
- Declaring a feature complete solely because the `build passes` — completion requires
  the named acceptance criteria, not a green build.
- Implementing future phases during the current phase — scope discipline is a hard rule.

---

## 8. Machine-check contract (implemented in Phase 002)

These three checks are **specified by this phase and implemented in Phase 002** (D-17).
This phase writes no lint rule and no CI configuration — here the checks are names and
written rules only.

- **`no-raw-hex`** — no raw hex color literal outside the generated token layer
  (`docs/governance/tokens.json` → the Phase-002-generated CSS/`@theme` layer); all
  component styling references semantic tokens. **Scope:** every source file.
  **Failure:** any raw hex color literal outside the generated token layer.
- **`no-generic-healthcare-blue`** — no generic Tailwind blue/indigo/purple default
  palette anywhere in styling (§2.2 substitution ban). **Scope:** every source file
  including theme and config. **Failure:** a generic blue/indigo/purple default-palette
  color in any styling location.
- **`token-reference-required`** — component styling must reference the semantic token
  utilities; ad-hoc color literals and default Tailwind color utilities are rejected.
  **Scope:** every component and layout file. **Failure:** component styling that does
  not reference the semantic token utilities.

Anti-drift is enforced in two layers: by the prose rules in this document **and** by these
named checks. Phase 002 implements exactly what this phase wrote — no more, no fewer.

---

## 9. Where the rest of this package lives

| File | Answers the question |
|---|---|
| `docs/governance/tokens.json` | What is the frozen value? |
| `docs/governance/reference-ui-specification.md` | What does each surface look like? |
| `docs/governance/ui-invariants.md` | What must not drift (as greppable INV-xx IDs)? |
| `docs/governance/visual-qa-rules.md` | How is a phase judged visually? |
| `docs/governance/responsive-rules.md` | How does the layout adapt? |
| `docs/governance/motion-rules.md` | How does it move? |
| `docs/governance/reference-manifest.json` | Are the reference assets unmodified? |


