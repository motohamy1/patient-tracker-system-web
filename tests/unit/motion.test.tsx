/*
 * Guards for the motion layer (FND-05).
 *
 * Three things are easy to break silently and are pinned here:
 *   1. The app-wide reduced-motion policy (the provider, and every primitive's
 *      internal reduced branch).
 *   2. The CSS/JS motion-token pairing. Motion needs numeric seconds and CSS needs
 *      length strings, so the two declarations cannot literally be one; drift has to
 *      fail a test instead of shipping.
 *   3. The primitive layer is the only place `motion/react` may be imported.
 *
 * Assertion strategy: assert on the ANIMATION DEFINITION each primitive passes down,
 * not on a rendered frame. `motion` schedules style work after mount, so frame-based
 * assertions would be both flaky and meaningless.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type * as MotionReact from "motion/react";

/* `vi.mock` is hoisted above the imports by the vitest transform, so the primitives
   below still bind to the mocked module. */
const reducedMotionState = { value: false };
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof MotionReact>();
  return {
    ...actual,
    // Every other export (motion, MotionConfig) stays real, so the primitives and the
    // provider still render for real; only the OS preference becomes controllable.
    useReducedMotion: () => reducedMotionState.value,
  };
});

import { ExpandCollapse, Fade, PressScale, RevealUp } from "@/components/motion/motion-primitives";
import { MotionProvider } from "@/components/motion/motion-provider";
import { durations, easeOut } from "@/components/motion/variants";

const REPO_ROOT = join(__dirname, "..", "..");
const SRC_DIR = join(REPO_ROOT, "src");
const MOTION_DIR = join(SRC_DIR, "components", "motion");
const TOKENS_PATH = join(SRC_DIR, "styles", "tokens.css");

/** Recursively collect every source file under `src/`. */
function walkSrcFiles(dir: string = SRC_DIR): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walkSrcFiles(absolute));
    } else if (/\.(ts|tsx|js|jsx|mjs|css|scss)$/.test(entry.name)) {
      found.push(absolute);
    }
  }
  return found;
}

/** Strip comments so a note documenting a prohibition cannot trip the rule it documents. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

beforeEach(() => {
  reducedMotionState.value = false;
});

describe("motion primitives render inside the app-wide provider", () => {
  it("renders Fade children", () => {
    render(
      <MotionProvider>
        <Fade>loading patients</Fade>
      </MotionProvider>,
    );
    expect(screen.getByText("loading patients")).toBeInTheDocument();
  });

  it("renders RevealUp children", () => {
    render(
      <MotionProvider>
        <RevealUp>timeline</RevealUp>
      </MotionProvider>,
    );
    expect(screen.getByText("timeline")).toBeInTheDocument();
  });

  it("renders PressScale as a real button with children", () => {
    render(
      <MotionProvider>
        <PressScale>save</PressScale>
      </MotionProvider>,
    );
    expect(screen.getByRole("button", { name: "save" })).toHaveAttribute("type", "button");
  });

  it("renders ExpandCollapse open and closed", () => {
    const { rerender } = render(
      <MotionProvider>
        <ExpandCollapse open>details</ExpandCollapse>
      </MotionProvider>,
    );
    expect(screen.getByText("details")).toBeInTheDocument();
    rerender(
      <MotionProvider>
        <ExpandCollapse open={false}>details</ExpandCollapse>
      </MotionProvider>,
    );
    expect(screen.getByText("details")).toBeInTheDocument();
  });
});

describe("reduced-motion branches", () => {
  it("RevealUp animates a y transform when motion is allowed", () => {
    const { container } = render(
      <MotionProvider>
        <RevealUp>up</RevealUp>
      </MotionProvider>,
    );
    expect((container.firstElementChild as HTMLElement).style.transform).toContain("translateY");
  });

  it("RevealUp drops the y transform under reduced motion (opacity only)", () => {
    reducedMotionState.value = true;
    const { container } = render(
      <MotionProvider>
        <RevealUp>up</RevealUp>
      </MotionProvider>,
    );
    // The branch is proven by the ABSENCE of a transform: the reduced definition never
    // mentions `y`, so no translate can be emitted at all.
    expect((container.firstElementChild as HTMLElement).style.transform).not.toContain("translateY");
  });

  it("PressScale omits the scale transform under reduced motion", () => {
    reducedMotionState.value = true;
    const { container } = render(
      <MotionProvider>
        <PressScale>tap</PressScale>
      </MotionProvider>,
    );
    expect((container.firstElementChild as HTMLElement).style.transform).toBe("");
  });

  it("ExpandCollapse uses an instant hidden state under reduced motion", () => {
    reducedMotionState.value = true;
    const { container } = render(
      <MotionProvider>
        <ExpandCollapse open={false}>panel</ExpandCollapse>
      </MotionProvider>,
    );
    expect(container.firstElementChild).toHaveAttribute("hidden");
  });
});

describe("motion tokens stay paired with the CSS tokens", () => {
  const tokensCss = readFileSync(TOKENS_PATH, "utf8");

  it("durations.fast matches --motion-duration-fast", () => {
    const declared = tokensCss.match(/--motion-duration-fast:\s*(\d+)ms/);
    expect(declared).not.toBeNull();
    expect(durations.fast).toBe(Number(declared![1]) / 1000);
  });

  it("durations.base matches --motion-duration-base", () => {
    const declared = tokensCss.match(/--motion-duration-base:\s*(\d+)ms/);
    expect(declared).not.toBeNull();
    expect(durations.base).toBe(Number(declared![1]) / 1000);
  });

  it("easeOut matches --motion-ease-out control points", () => {
    const declared = tokensCss.match(/--motion-ease-out:\s*cubic-bezier\(([^)]+)\)/);
    expect(declared).not.toBeNull();
    expect([...easeOut]).toEqual(declared![1].split(",").map((value) => Number(value.trim())));
  });
});

describe("the motion layer cannot be bypassed", () => {
  it("imports motion/react nowhere else in src/", () => {
    const offenders = walkSrcFiles()
      .filter((file) => !file.startsWith(MOTION_DIR + sep))
      .filter((file) => /from\s+["']motion\/react/.test(stripComments(readFileSync(file, "utf8"))))
      .map((file) => relative(REPO_ROOT, file).split(sep).join("/"));
    expect(offenders).toEqual([]);
  });

  it("imports framer-motion nowhere in src/ (it is not a dependency)", () => {
    const offenders = walkSrcFiles()
      .filter((file) => /["']framer-motion/.test(stripComments(readFileSync(file, "utf8"))))
      .map((file) => relative(REPO_ROOT, file).split(sep).join("/"));
    expect(offenders).toEqual([]);
  });

  it("actually walks a non-trivial src/ tree", () => {
    const files = walkSrcFiles();
    expect(files.some((file) => file.startsWith(MOTION_DIR + sep))).toBe(true);
    expect(files.length).toBeGreaterThan(5);
  });
});
