// src/lib/timeline/branches.ts — milestone branch layout (TL-05; ticket
// 06-05; §8.5, QA row 9).
//
// Pure geometry, deterministic by construction. A milestone's sub-events are
// assigned to LANES below it; siblings are laid out in chronological order
// and lanes are MONOTONE (a lane index never decreases as time advances),
// which is what rules out the crossing-spaghetti failure QA row 9 grades:
// two sibling paths can only cross if a later child sits in a shallower lane
// than an earlier one, and the monotone rule forbids exactly that.
//
// Paths are thin (1px, the timeline stroke convention), smoothly curved
// (a symmetric cubic whose control points share the vertical midpoint) and
// spatially predictable (lane = chronological rank, offset is constant).
//
// Coordinates are BASE pixels (the same `baseX` space as every mark); the
// renderer recomputes each path per frame from `baseX` values, so branches
// pan and zoom with the nodes instead of being re-laid-out.
import type { CareEvent } from '@/lib/timeline/events';

/** Vertical distance between branch lanes, in px. */
export const BRANCH_LANE_HEIGHT = 14;
/** Minimum horizontal separation before two siblings may share a lane. */
export const BRANCH_MIN_GAP = 10;

export type BranchChild = {
  id: string;
  /** ISO instant — the chronological sort key. */
  at: string;
  /** Base-pixel x from the timeline scale. */
  baseX: number;
};

export type BranchPlacement = {
  childId: string;
  /** Lane index, 0-based, non-decreasing in time. */
  lane: number;
  childBaseX: number;
  /** Absolute band y for the child node. */
  childY: number;
};

export type MilestoneBranch = {
  parentKey: string;
  parentBaseX: number;
  parentY: number;
  placements: BranchPlacement[];
};

type BranchInput = {
  parentKey: string;
  parentBaseX: number;
  parentY: number;
  children: readonly BranchChild[];
  laneHeight?: number;
  minGap?: number;
};

/**
 * Assign lanes to one milestone's children. Greedy first-fit scanning from
 * the PREVIOUS child's lane upward (never back down → monotone), so:
 *   * siblings in a lane are at least `minGap` apart (collision-free);
 *   * lane order follows chronology (predictable);
 *   * no two sibling paths can cross (QA row 9).
 */
export function layoutMilestoneBranch({
  parentKey,
  parentBaseX,
  parentY,
  children,
  laneHeight = BRANCH_LANE_HEIGHT,
  minGap = BRANCH_MIN_GAP,
}: BranchInput): MilestoneBranch {
  const sorted = [...children].sort(
    (a, b) => a.baseX - b.baseX || a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
  );

  const laneLastX: number[] = [];
  const placements: BranchPlacement[] = [];
  let previousLane = 0;

  for (const child of sorted) {
    let lane = -1;
    for (let candidate = previousLane; candidate <= laneLastX.length; candidate += 1) {
      const lastX = laneLastX[candidate];
      if (lastX === undefined || child.baseX - lastX >= minGap) {
        lane = candidate;
        break;
      }
    }
    if (lane === -1) lane = laneLastX.length; // unreachable, kept explicit
    laneLastX[lane] = child.baseX;
    previousLane = lane; // monotone: the next child may not move to a shallower lane
    placements.push({
      childId: child.id,
      lane,
      childBaseX: child.baseX,
      childY: parentY + laneHeight * (lane + 1),
    });
  }

  return { parentKey, parentBaseX, parentY, placements };
}

/**
 * The branch curve: symmetric cubic with both control points on the vertical
 * midpoint between parent and child — one calm S, no elbows, no overshoot.
 */
export function branchPath(
  parentX: number,
  parentY: number,
  childX: number,
  childY: number,
): string {
  const midY = (parentY + childY) / 2;
  return `M${parentX},${parentY} C${parentX},${midY} ${childX},${midY} ${childX},${childY}`;
}

/** Convenience: layout every milestone in a set that has children. */
export function layoutMilestones(
  milestones: readonly {
    parentKey: string;
    parentBaseX: number;
    parentY: number;
    children: readonly BranchChild[];
  }[],
  options?: { laneHeight?: number; minGap?: number },
): MilestoneBranch[] {
  return milestones.map((milestone) => layoutMilestoneBranch({ ...milestone, ...options }));
}

/** True when an event carries sub-events to branch to (today: never). */
export function hasChildren(event: CareEvent): boolean {
  return (event.children?.length ?? 0) > 0;
}
