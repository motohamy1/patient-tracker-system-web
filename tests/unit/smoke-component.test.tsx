import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

function Smoke() {
  return <div data-smoke="ok" />;
}

describe("unit test harness (tsx)", () => {
  it("renders a JSX component into jsdom", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<Smoke />);
    });

    expect(document.querySelector('[data-smoke="ok"]')).not.toBeNull();

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("resolves the @/ alias to app source", () => {
    expect(typeof Home).toBe("function");
  });
});