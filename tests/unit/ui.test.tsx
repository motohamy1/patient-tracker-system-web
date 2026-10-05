/*
 * Render tests for every primitive (FND-04). These make "the design gallery renders the
 * primitives" provable BEFORE the gallery route exists in Plan 01-05.
 *
 * The final case is a mechanical token-conformance guard: no file under src/components/ui/
 * may contain a hex color literal. Review alone does not keep that true; a test does.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import AppFrame from "@/components/ui/AppFrame";
import NotchHeader from "@/components/ui/NotchHeader";
import PrimaryPillTabs from "@/components/ui/PrimaryPillTabs";
import SecondaryPillRow from "@/components/ui/SecondaryPillRow";
import CircularIconButton from "@/components/ui/CircularIconButton";
import Chip from "@/components/ui/Chip";
import ModuleSurface from "@/components/ui/ModuleSurface";
import StatusLabel from "@/components/ui/StatusLabel";
import DarkScrubber from "@/components/ui/DarkScrubber";
import AccentNode from "@/components/ui/AccentNode";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";

const REPO_ROOT = join(__dirname, "..", "..");
const UI_DIR = join(REPO_ROOT, "src", "components", "ui");

function walkUiFiles(dir: string = UI_DIR): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkUiFiles(full));
    else if (statSync(full).isFile()) out.push(full);
  }
  return out;
}

describe("AppFrame", () => {
  it("renders its children inside the frame", () => {
    render(
      <AppFrame>
        <p>frame content</p>
      </AppFrame>,
    );
    expect(screen.getByText("frame content")).toBeInTheDocument();
  });
});

describe("NotchHeader", () => {
  it("renders the title and an accessible close control", () => {
    render(<NotchHeader title="Cardiology" onClose={() => {}} />);
    expect(screen.getByText("Cardiology")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });
});

describe("PrimaryPillTabs", () => {
  const items = [
    { id: "dynamics", label: "Treatment Dynamics" },
    { id: "labs", label: "Labs" },
  ];

  it("renders every label and marks the active item", () => {
    render(<PrimaryPillTabs items={items} activeId="labs" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "Treatment Dynamics" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Labs" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Treatment Dynamics" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("fires onChange with the clicked id", () => {
    const onChange = vi.fn();
    render(<PrimaryPillTabs items={items} activeId="dynamics" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Labs" }));
    expect(onChange).toHaveBeenCalledWith("labs");
  });
});

describe("SecondaryPillRow", () => {
  it("renders its items and reflects the filter toggle's pressed state", () => {
    const onToggle = vi.fn();
    render(
      <SecondaryPillRow
        items={[{ id: "office", label: "Office Visits" }]}
        activeId="office"
        onChange={() => {}}
        filter={{ label: "Filter", pressed: true, onToggle }}
      />,
    );
    expect(screen.getByRole("button", { name: "Office Visits" })).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Filter" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalled();
  });
});

describe("CircularIconButton", () => {
  it("takes its accessible name from label and honors disabled", () => {
    const onClick = vi.fn();
    render(<CircularIconButton icon={CloseIcon} label="Close" onClick={onClick} disabled />);
    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires onClick when enabled", () => {
    const onClick = vi.fn();
    render(<CircularIconButton icon={SearchIcon} label="Search" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(onClick).toHaveBeenCalled();
  });
});

describe("Chip", () => {
  it("renders label and optional meta", () => {
    render(<Chip icon={SearchIcon} label="Aspirin" meta="2 doses" />);
    expect(screen.getByText("Aspirin")).toBeInTheDocument();
    expect(screen.getByText("2 doses")).toBeInTheDocument();
  });
});

describe("ModuleSurface", () => {
  it("renders its title and children", () => {
    render(
      <ModuleSurface title="Blood Pressure">
        <p>module body</p>
      </ModuleSurface>,
    );
    expect(screen.getByRole("heading", { name: "Blood Pressure" })).toBeInTheDocument();
    expect(screen.getByText("module body")).toBeInTheDocument();
  });
});

describe("StatusLabel", () => {
  it("renders its text", () => {
    render(<StatusLabel>No data recorded</StatusLabel>);
    expect(screen.getByText("No data recorded")).toBeInTheDocument();
  });
});

describe("DarkScrubber", () => {
  it("renders with its default window", () => {
    const { container } = render(<DarkScrubber />);
    expect(container.querySelector("[style]")).not.toBeNull();
  });
});

describe("AccentNode", () => {
  it("renders and applies the requested size", () => {
    const { container } = render(<AccentNode size={24} />);
    const node = container.querySelector("[data-size]");
    expect(node).not.toBeNull();
    expect(node).toHaveAttribute("data-size", "24");
    expect(node).toHaveStyle({ inlineSize: "24px", blockSize: "24px" });
  });
});

describe("token conformance", () => {
  it("contains no hex color literal anywhere under src/components/ui/", () => {
    const offenders: string[] = [];
    for (const file of walkUiFiles()) {
      if (/#[0-9a-fA-F]{3,6}\b/.test(readFileSync(file, "utf8"))) {
        offenders.push(relative(REPO_ROOT, file).split(sep).join("/"));
      }
    }
    expect(offenders).toEqual([]);
  });
});