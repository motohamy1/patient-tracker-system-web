# Responsive Rules — the §26 band contract

This document is the **normative** responsive contract for every surface in the product. It
records the three `PRODUCT-MASTER-SPEC.md` §26 bands, the adaptation expectation for each band,
and the prohibitions that keep a smaller viewport from becoming a second design language. It
contains **no raw color value**; every color resolves through `docs/governance/tokens.json` and is
cited by token name.

The band edges (`1024px`, `768px`, `1023px`) are the contract. Exact breakpoint pixel values
*inside* a band are Phase 002 implementation detail within these bands, but the three edges
themselves are fixed: a later phase must not invent a fourth band and must not move an edge.

---

## 1. One language, adapted layouts

Web and mobile share the design language but **not necessarily identical layouts**
(`PRODUCT-MASTER-SPEC.md` §26). Across all three bands the following are **identical**:

- the semantic token set (`docs/governance/tokens.json` → `color`, `radius`, `space`, `font`,
  `shadow`, `motion`);
- the geometry and the radius steps (`radius.sm` through `radius.pill`);
- the typography hierarchy (`font.size`, `font.weight`, `font.lineHeight`);
- the depth model (exactly the two elevation levels, `shadow.raised` and `shadow.overlay`);
- the motion model (the two durations and the two easing curves).

Only **layout, density and control sizing** adapt between bands. A band never gets its own color,
its own font family, its own radius step or its own visual language.

`docs/governance/visual-qa-rules.md` row 1 requires the rendered structure to match the cited
per-surface grammar rather than an invented reflow. Responsive adaptation rearranges the grammar
of `docs/governance/reference-ui-specification.md`; it never replaces it.

---

## 2. Desktop (1024px and above)

The desktop band is the reference presentation:

- The **horizontal timeline** is the default timeline presentation.
- The provider **folder grid is a dense 3-column grid** (measured from
  `docs/reference/provider-home-primary.jpg`).
- Information surfaces are large; the **full compact clinical density** is used.
- A **persistent left icon rail** is present on provider and workspace surfaces.
- In the patient workspace, the bottom row keeps its measured proportions of
  **55/22.5/22.5** within plus or minus 3%.
- The timeline **scrubber is a full-width capsule track**.

---

## 3. Tablet (768px to 1023px)

Tablet is an **adapted column flow**, not a scaled-down desktop. It keeps:

- the same token set;
- the same geometry and the same radius steps;
- the same two elevation levels.

It adapts:

- the folder grid is reduced toward **2 columns**;
- the timeline **remains horizontal** and the scrubber **remains usable**;
- touch targets stay at **44px minimum in both axes**.

---

## 4. Mobile (below 768px)

Mobile is adapted for touch:

- targets at **44px minimum in both axes**;
- compact navigation, reduced density, reachable controls, safe interaction.

Concrete expectations:

- **Compact navigation** uses horizontally scrolling **pill tabs** rather than a collapsed
  hamburger-only pattern on surfaces where tabs are primary.
- The folder grid reduces to **1 or 2 columns**.
- The **timeline and the bottom scrubber remain reachable and usable** — they are **not** dropped
  on mobile, because the timeline is the product's centerpiece.
- Patient home already sits at the sparse upper range of the spacing scale on desktop, so mobile
  reduces density further by using the **same** scale's lower steps inside cards — never by
  introducing new spacing values.

---

## 5. What is forbidden

Each prohibition is tied to its source:

- **Do not simply shrink the desktop version** (`PRODUCT-MASTER-SPEC.md` §26). A band adapts the
  layout; it does not scale it down.
- Do not introduce a spacing value outside the six `space.` steps in
  `docs/governance/tokens.json` → `space`. No other spacing value is permitted.
- Do not introduce a radius outside the five `radius.` steps in
  `docs/governance/tokens.json` → `radius`. No other radius value is permitted.
- Do not introduce a fourth elevation level — there are exactly two (`shadow.raised`,
  `shadow.overlay`).
- Do not introduce a mobile-only color, a mobile-only font family, or a mobile-only visual
  language.
- Do not drop the timeline or the scrubber on mobile.
- Do not let a breakpoint silently move a band edge: a change to the three band edges
  (`1024px`, `768px`, `1023px`) requires a constitution-level decision.

---

*Normative responsive contract; derives from `PRODUCT-MASTER-SPEC.md` §26. Companion to
`docs/governance/visual-qa-rules.md` and `docs/governance/ui-invariants.md`. Token values live in
`docs/governance/tokens.json` only.*
