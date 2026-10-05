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

The 14 semantic color tokens are the only color vocabulary. They are named exactly:

`frame`, `frameForeground`, `canvas`, `surface`, `surfaceMuted`, `surfaceRaised`,
`textPrimary`, `textSecondary`, `borderSubtle`, `accent`, `success`, `warning`, `critical`,
`info`.

A fifteenth token, `accentSoft`, is admitted **only if** the D-02 accent split is confirmed
at the design gate; when it is admitted it is added to this enumeration in the same edit.
No other color token may be invented.

The canonical values live in `docs/governance/tokens.json`. This constitution deliberately
restates no hex value — resolve every color through the JSON.

`textPrimary` is a near-black warm gray, **never pure black** (D-06). The token contract is
**role-based, not literal-value-based** (D-11): a dark-mode set can be added later without
renaming any token. This package ships light-mode values only — the reference grammar is a
light-mode product.

---

## 5. Reference registry

## 6. Sample content — do not reuse

## 7. Anti-generic and anti-gamification rejections

## 8. Machine-check contract (implemented in Phase 002)

## 9. Where the rest of this package lives

