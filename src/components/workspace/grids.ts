// src/components/workspace/grids.ts — the Overview's three layout templates,
// declared ONCE and shared by the real body and its skeleton.
//
// The skeleton re-declares the live grid so a loading state and the loaded
// state keep the same shape; sharing the class literals means a proportion
// change (QA row 5's 55 / 22.5 / 22.5, or the identity rail width) can never
// land on one side only — the skeleton drifting from the live surface is a
// layout-shift defect the tests cannot see.
//
// UPPER_GRID: identity rail (19rem) + the context/vitals stat row.
// STAT_ROW_GRID: the four context/snapshot cards beside the identity rail —
// one column below 640px, two from 640, four beside the rail from 1024.
// BOTTOM_ROW_GRID: Vital Signs History ≈55%, Labs ≈22.5%, Recent Records
// ≈22.5% — `fr` units over the row's content box; at the 80rem desktop
// container the measured widths land ≈53.6 / 22.2 / 22.2 (inside ±3 of the
// reference either way QA row 5 is read). Below the 768px band edge the row
// collapses to one column, per responsive-rules §4.
export const UPPER_GRID = 'grid grid-cols-1 gap-lg lg:grid-cols-[19rem_minmax(0,1fr)]';

export const STAT_ROW_GRID = 'grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-4';

export const BOTTOM_ROW_GRID = 'grid grid-cols-1 gap-lg md:grid-cols-[55fr_22.5fr_22.5fr]';
