/*
 * Regression guard for the design gallery's `frame` section (FND-07).
 *
 * The section once embedded the page-level AppFrame verbatim. AppFrame fills the viewport
 * (`min-h-dvh`) because that is the page-level shell contract, so inside the section's
 * flex-wrap row the accent field became a full-viewport-tall box squeezed to its content
 * width: a narrow lime stripe standing in for a frame. Reviewing the rendered PNG caught
 * it once; a screenshot comparison alone will not, because a re-broken specimen still
 * produces a stable image against an equally stale baseline.
 *
 * What is asserted is the CONTRACT, not the fix: no element inside a gallery section may
 * size itself in viewport units, and the frame specimen must still demonstrate the frame
 * COMPOSITION (accent field, olive inset, header plus a real surface inside it) rather
 * than a single word.
 */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { GalleryStateMatrix } from "@/components/gallery/GalleryStateMatrix";

function renderGallery() {
  const { container } = render(<GalleryStateMatrix locale="en" />);
  const frame = container.querySelector('[data-gallery-section="frame"]');
  if (!frame) throw new Error("the gallery has no [data-gallery-section=\"frame\"] section");
  return frame;
}

describe("design gallery frame specimen", () => {
  it("carries no viewport-unit sizing, so it cannot collapse into a stripe", () => {
    const frame = renderGallery();
    const offenders = Array.from(frame.querySelectorAll("*"))
      .map((el) => el.className)
      .filter((name): name is string => typeof name === "string")
      .filter((name) => /\b[a-z-]*dvh\b/.test(name));
    expect(offenders).toEqual([]);
  });

  it("demonstrates the frame composition with a header and a surface inside it", () => {
    const frame = renderGallery();
    // The accent outer field, then the olive rounded frame inset inside it.
    expect(frame.querySelector(".bg-accent")).not.toBeNull();
    expect(frame.querySelector(".bg-accent > .rounded-frame")).not.toBeNull();
    // Representative content: the specimen is a frame holding real primitives, not a
    // bare accent-coloured sliver with one word in it.
    expect(frame.querySelector(".bg-accent .rounded-frame header")).not.toBeNull();
    expect(frame.querySelectorAll(".bg-accent .rounded-frame section").length).toBeGreaterThan(0);
  });
});