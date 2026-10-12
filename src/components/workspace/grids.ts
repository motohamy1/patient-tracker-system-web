// src/components/workspace/grids.ts — the Overview's layout templates,
// declared ONCE and shared by the real body and its skeleton.
//
// The skeleton re-declares the live grid so a loading state and the loaded
// state keep the same shape; sharing the class literals means a proportion
// change (QA row 5's 55 / 22.5 / 22.5) can never land on one side only — the
// skeleton drifting from the live surface is a layout-shift defect the tests
// cannot see.
//
// UPPER_GRID is retained for the header's identity/context split: the
// reference seats the identity card at a fixed 363px with the tab strip,
// diagnosis capsule and vitals flowing in the column beside it, collapsing to
// one column below the 1024px band edge (responsive-rules §4).
//
// BOTTOM_ROW_GRID: Vital Signs History ≈55%, Labs ≈22.5%, Recent Records
// ≈22.5% — `fr` units over the row's content box; at the reference's 1392px
// content width the measured widths land ≈53.6 / 22.2 / 22.2 (inside ±3 of the
// reference either way QA row 5 is read). Below the 768px band edge the row
// collapses to one column, per responsive-rules §4.
export const UPPER_GRID = 'grid grid-cols-1 gap-lg lg:grid-cols-[363px_minmax(0,1fr)]';

export const BOTTOM_ROW_GRID = 'grid grid-cols-1 gap-lg md:grid-cols-[55fr_22.5fr_22.5fr]';
