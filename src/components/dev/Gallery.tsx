// src/components/dev/Gallery.tsx — the dev-only primitives gallery (D-16, D-26).
//
// A ten-section review and baseline surface that renders every product
// primitive in order: from inert material (surfaces, type, icons) through the
// interactive primitives to the overlay, then the two cross-cutting audits
// (focus and reduced motion). It is a surface in the product's visual language,
// not a debug page, and it obeys the same three responsive bands as the product
// with no mobile-only token, spacing value or radius (UX-06).
//
// WHY A SERVER COMPONENT THAT PASSES SLOTS. `TabBar` and `CompactControl` read
// docs/governance/tokens.json through `node:fs` at module load (they select the
// D-27 gate inset fill), so they cannot enter the client graph: Turbopack
// rejects a browser chunk that references `node:fs`. The gallery's overlay and
// reduced-motion sections need the client runtime (`useShellMotion`, overlay
// state), so `GallerySections.tsx` is a Client Component. This file stays a
// Server Component, renders the two fs-dependent primitives here, and passes
// them into the client sections as slots. The primitives are unchanged, and no
// section introduces a gallery-only visual.
//
// The empty-state count arrives as a plain number from the route (the single
// file allowed to import the dev fixtures); no fixture record is rendered.
import { Bell } from 'lucide-react';
import { Surface } from '@/components/primitives';
import { TabBar, WORKSPACE_TABS } from '@/components/primitives/TabBar';
import { CompactControl } from '@/components/primitives/CompactControl';
import {
  SurfacesSection,
  TypographySection,
  IconsSection,
  ButtonsSection,
  PillsAndTabsSection,
  CompactControlsSection,
  EmptyStateSection,
  OverlaySection,
  FocusAndKeyboardSection,
  ReducedMotionSection,
} from './GallerySections';

// The eight canonical workspace tab labels, built once from the one enumeration
// in TabBar.tsx (D-01). This is the product tab set, not a gallery invention.
const GALLERY_TABS = WORKSPACE_TABS.map((label) => ({ value: label, label }));
const GALLERY_TAB_LABELS = WORKSPACE_TABS.join(' · ');

export type GalleryProps = {
  /** A neutral count for the empty-state specimen, derived from the dev fixtures. */
  emptyCount: number;
};

export function Gallery({ emptyCount }: GalleryProps) {
  return (
    <Surface variant="canvas" className="min-h-screen bg-canvas p-lg md:p-xl">
      <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-2xl">
        <SurfacesSection />
        <TypographySection />
        <IconsSection />
        <ButtonsSection />
        <PillsAndTabsSection
          tabGroup={<TabBar items={GALLERY_TABS} value="Overview" ariaLabel="Workspace tabs" />}
          tabLabels={GALLERY_TAB_LABELS}
        />
        <CompactControlsSection
          search={
            <CompactControl
              variant="search"
              label="Search"
              inputId="gallery-search"
              placeholder="Search"
            />
          }
          iconToggleOff={
            <CompactControl
              variant="iconToggle"
              ariaLabel="Status toggle off"
              pressed={false}
              icon={Bell}
            />
          }
          iconToggleOn={
            <CompactControl
              variant="iconToggle"
              ariaLabel="Status toggle on"
              pressed
              icon={Bell}
            />
          }
          rangeInactive={
            <CompactControl
              variant="rangeToggle"
              ariaLabel="Range inactive"
              label="Value"
              active={false}
            />
          }
          rangeActive={
            <CompactControl
              variant="rangeToggle"
              ariaLabel="Range active"
              label="Value"
              active
            />
          }
        />
        <EmptyStateSection count={emptyCount} />
        <OverlaySection />
        <FocusAndKeyboardSection
          tabGroup={<TabBar items={GALLERY_TABS} value="Overview" ariaLabel="Focus specimen tabs" />}
          iconToggleOff={
            <CompactControl
              variant="iconToggle"
              ariaLabel="Focus specimen toggle"
              pressed={false}
              icon={Bell}
            />
          }
          rangeInactive={
            <CompactControl
              variant="rangeToggle"
              ariaLabel="Focus specimen range"
              label="Value"
              active={false}
            />
          }
        />
        <ReducedMotionSection />
      </div>
    </Surface>
  );
}
