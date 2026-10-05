# Motion Rules — the §9 motion contract

This document is the **normative** motion contract. Motion is **tokenized, not merely
qualitative** (D-19): the values below are copied from `docs/governance/tokens.json` → `motion`
and that file is their single source of truth. This document contains **no raw color value**;
every color resolves through `docs/governance/tokens.json` and is cited by token name.

---

## 1. Tokenized values

The normative values live in `docs/governance/tokens.json` → `motion`. This table mirrors them
exactly; if the two ever disagree, the JSON wins.

| Token | Value | Used for |
|---|---|---|
| `duration.fast` | `120ms` | Micro-interactions including hovers, toggles, pill state changes and badge changes |
| `duration.slow` | `240ms` | Panels, surfaces, sheets and timeline choreography segments |
| `easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` | Entrances and emphasis |
| `easing.exit` | `cubic-bezier(0.4, 0, 1, 1)` | Exits |

These are the **only two durations** and the **only two curves**. A third duration or a fourth
curve requires a decision recorded in `docs/governance/tokens.json`; a component may never
declare one locally. Every animation cites one of the two durations and one of the two curves.

---

## 2. Two-layer architecture

The split is locked:

- **Framer Motion** (the `motion` package) owns component entrance and exit, layout transitions,
  panels, sheets, folder-to-workspace transitions and compact micro-interactions.
- **GSAP** owns complex SVG drawing, timeline path animation, timeline choreography and
  scrubber-driven progressive rendering, scoped via `gsap.context()` / `useGSAP()`.

**never both** for one animation, and do not automatically reach for both libraries on every
animation (`PRODUCT-MASTER-SPEC.md` §9). Reach for GSAP only where SVG drawing or timeline
choreography genuinely needs it; everything else is Framer Motion.

Owning phases, so later work knows the boundary: **Phase 002** establishes the motion foundation,
and **Phase 006** owns the timeline choreography.

---

## 3. Reduced-motion contract

This is a **written invariant, not an aspiration**. Every animation routes through
`useReducedMotion` in Framer Motion and `gsap.matchMedia('(prefers-reduced-motion: reduce)')` in
GSAP.

Under reduced motion:

- degrade to an **opacity-only** transition at or below the `duration.fast` value (`120ms`); or
- render **statically** for timeline choreography.

The check: an animation **without a reduced-motion branch fails Phase 002's acceptance**, and
`docs/governance/visual-qa-rules.md` §2 captures a `reduced-motion` baseline state for every
visual-regression surface.

---

## 4. Character of motion

All motion is **fast, smooth, subtle, interruptible and purposeful**; **never gamified**
(`PRODUCT-MASTER-SPEC.md` §9). Motion must never be decorative — it either:

- communicates a state change,
- preserves spatial continuity, or
- explains a transition.

No bounce, no overshoot past the target, no attention-seeking loops. The visual grammar is a calm
clinical workspace, so motion duration stays at or below `duration.slow` (`240ms`) everywhere.

---

*Normative motion contract; derives from `PRODUCT-MASTER-SPEC.md` §9 (D-19). Token values live in
`docs/governance/tokens.json` → `motion` only. Companion to
`docs/governance/ui-invariants.md` and `docs/governance/visual-qa-rules.md`.*
