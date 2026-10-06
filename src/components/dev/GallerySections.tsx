'use client';

// src/components/dev/GallerySections.tsx — the ten gallery sections (D-16, D-26).
//
// Every section composes the PRODUCT primitives from src/components/primitives
// and src/components/overlays. No section introduces a gallery-only primitive,
// token, radius or spacing value: a specimen that cannot be expressed with the
// primitive set is evidence of a gap in the primitive set, and that is recorded
// rather than worked around (INV-12).
//
// This module is a Client Component because the overlay section owns open
// state and the reduced-motion section drives the real `useShellMotion` hook.
// The two primitives that read `node:fs` at module load (`TabBar` and
// `CompactControl`, which select the D-27 gate inset fill) therefore cannot be
// imported here; `Gallery.tsx` renders them as a Server Component and passes
// them in as slots. They are still the product primitives, unchanged.
//
// THE FOUR PROHIBITIONS THAT MAKE THIS SURFACE HONEST (FOUND-01,
// 02-UI-SPEC.md §4.4 and §10):
//   1. No patient name, identifier, medication, vital, lab name, date, specialty
//      or record number appears as gallery content. Captions are the fixed
//      neutral vocabulary: "Card title", "Body copy", "Primary", "Value",
//      "Status label".
//   2. No multi-hue chart colour; no tint family the product has not adopted is
//      imported (the provider-home sparkline colours are never reproduced).
//   3. No gallery-only visual: every specimen is a product primitive.
//   4. This is a surface in the product's visual language, not a debug page.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, CalendarDays, ChartLine, FolderClosed, Home, Users } from 'lucide-react';
import { Button, makeIcon, Surface } from '@/components/primitives';
import { Pill } from '@/components/primitives/Pill';
import { EmptyState } from '@/components/primitives/EmptyState';
import { Overlay } from '@/components/overlays/Overlay';
import { useShellMotion } from '@/lib/motion';

// The six shell icons (the five rail items plus the top-bar notification bell),
// bound once to the shared 1.5px-stroke wrapper. Built at module load so a
// render never rebuilds a wrapper and remounts a glyph (Icon.tsx, D-21).
const HomeGlyph = makeIcon(Home);
const PatientsGlyph = makeIcon(Users);
const ScheduleGlyph = makeIcon(CalendarDays);
const RecordsGlyph = makeIcon(FolderClosed);
const AnalyticsGlyph = makeIcon(ChartLine);
const BellGlyph = makeIcon(Bell);

const SHELL_GLYPHS = [
  { key: 'home', Glyph: HomeGlyph },
  { key: 'patients', Glyph: PatientsGlyph },
  { key: 'schedule', Glyph: ScheduleGlyph },
  { key: 'records', Glyph: RecordsGlyph },
  { key: 'analytics', Glyph: AnalyticsGlyph },
  { key: 'notifications', Glyph: BellGlyph },
] as const;

const STATUS_TONES = ['success', 'info', 'warning'] as const;
const TEXT_VARIANTS = ['primary', 'secondary', 'ghost'] as const;
const BUTTON_STATES = ['rest', 'hover', 'active', 'focus-visible', 'disabled'] as const;

// --- Shared gallery scaffolding -------------------------------------------
// Presentation helpers composed from the token utilities only. They are not
// primitives: they hold a heading, a caption and a specimen slot, adding no
// visual the product does not already use.

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-lg">
      <h2
        id={`${id}-title`}
        className="text-heading font-semibold leading-heading text-text-primary"
      >
        {title}
      </h2>
      <div className="flex flex-col gap-lg">{children}</div>
    </section>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <span className="block text-label font-regular leading-label text-text-primary">{children}</span>;
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-xs">
      <Caption>{label}</Caption>
      {children}
    </div>
  );
}

// --- 1 — Surfaces ----------------------------------------------------------

export function SurfacesSection() {
  return (
    <Section id="surfaces" title="Surfaces">
      <div className="grid gap-lg md:grid-cols-2">
        <Specimen label="canvas — page field — no radius, no padding, no shadow">
          <Surface variant="canvas" className="min-h-16 bg-canvas" />
        </Specimen>
        <Specimen label="surface — default card — radius.lg — space.lg padding — shadow.raised">
          <Surface variant="surface">
            <span className="text-body font-regular leading-body text-text-primary">Card title</span>
          </Surface>
        </Specimen>
        <Specimen label="surfaceMuted — inset panel — radius.lg — space.lg padding — no shadow">
          <Surface variant="surfaceMuted">
            <span className="text-body font-regular leading-body text-text-primary">Body copy</span>
          </Surface>
        </Specimen>
        <Specimen label="surfaceRaised — elevated card — radius.xl — space.xl padding — shadow.raised">
          <Surface variant="surfaceRaised">
            <span className="text-body font-regular leading-body text-text-primary">Card title</span>
          </Surface>
        </Specimen>
      </div>
    </Section>
  );
}

// --- 2 — Typography --------------------------------------------------------

export function TypographySection() {
  return (
    <Section id="typography" title="Typography">
      <div className="grid gap-lg md:grid-cols-2">
        <Specimen label="display 28px — semibold">
          <span className="text-display font-semibold leading-tight text-text-primary">Value</span>
        </Specimen>
        <Specimen label="display 28px — regular (weight comparison)">
          <span className="text-display font-regular leading-tight text-text-primary">Value</span>
        </Specimen>
        <Specimen label="heading 16px — semibold">
          <span className="text-heading font-semibold leading-heading text-text-primary">
            Card title
          </span>
        </Specimen>
        <Specimen label="heading 16px — regular (weight comparison)">
          <span className="text-heading font-regular leading-heading text-text-primary">
            Card title
          </span>
        </Specimen>
        <Specimen label="body 14px — regular">
          <span className="text-body font-regular leading-body text-text-primary">Body copy</span>
        </Specimen>
        <Specimen label="body 14px — semibold (weight comparison)">
          <span className="text-body font-semibold leading-body text-text-primary">Body copy</span>
        </Specimen>
        <Specimen label="label 12px — regular">
          <span className="text-label font-regular leading-label text-text-primary">
            Status label
          </span>
        </Specimen>
        <Specimen label="label 12px — semibold (weight comparison)">
          <span className="text-label font-semibold leading-label text-text-primary">
            Status label
          </span>
        </Specimen>
      </div>
      <Specimen label="eyebrow — label size, regular, uppercase, letter-spacing 0.08em">
        <span className="text-label font-regular uppercase leading-label tracking-[0.08em] text-text-primary">
          Section label
        </span>
      </Specimen>
      <div className="grid gap-lg md:grid-cols-2">
        <Specimen label="tabular-nums specimen — even digit advance">
          <span className="text-display font-semibold leading-tight tabular-nums text-text-primary">
            111 111
          </span>
        </Specimen>
        <Specimen label="proportional specimen — the same digits, default figures">
          <span className="text-display font-semibold leading-tight text-text-primary">111 111</span>
        </Specimen>
      </div>
    </Section>
  );
}

// --- 3 — Icons -------------------------------------------------------------

export function IconsSection() {
  return (
    <Section id="icons" title="Icons">
      <Specimen label="24px shell icons — stroke width 1.5 — ink textPrimary (standalone, icon-only)">
        <div className="flex flex-wrap items-center gap-lg text-text-primary">
          {SHELL_GLYPHS.map(({ key, Glyph }) => (
            <Glyph key={key} size="lg" />
          ))}
        </div>
      </Specimen>
      <Specimen label="16px icon paired with a label — gap.xs between glyph and label">
        <span className="inline-flex items-center gap-xs text-text-primary">
          <BellGlyph size="sm" />
          <span className="text-body font-regular leading-body text-text-primary">Status label</span>
        </span>
      </Specimen>
    </Section>
  );
}

// --- 4 — Buttons -----------------------------------------------------------

export function ButtonsSection() {
  return (
    <Section id="buttons" title="Buttons">
      <div className="grid gap-lg md:grid-cols-2">
        <Specimen label="primary — fill is accentSoft, NOT accent — textPrimary ink — no shadow">
          <span className="inline-flex">
            <Button variant="primary">Primary</Button>
          </span>
        </Specimen>
        <Specimen label="iconOnly — surfaceRaised — shadow.raised — accessible name required">
          <span className="inline-flex">
            <Button variant="iconOnly" ariaLabel="Status label" icon={Bell} />
          </span>
        </Specimen>
      </div>
      {TEXT_VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-col gap-sm">
          <Caption>{variant} — rest, hover, active, focus-visible and disabled</Caption>
          <div className="flex flex-wrap items-start gap-lg">
            {BUTTON_STATES.map((state) => (
              <span key={state} className="inline-flex flex-col items-start gap-xs">
                <Button variant={variant} disabled={state === 'disabled'}>
                  {state === 'disabled' ? 'Disabled' : 'Primary'}
                </Button>
                <Caption>{state}</Caption>
              </span>
            ))}
          </div>
        </div>
      ))}
      <Caption>
        Hover, active and focus-visible are interaction states: hover and press a specimen, or Tab
        to it, and the treatment is the global :focus-visible ring. Disabled carries the native
        disabled attribute.
      </Caption>
    </Section>
  );
}

// --- 5 — Pills and tabs ----------------------------------------------------

export function PillsAndTabsSection({
  tabGroup,
  tabLabels,
}: {
  tabGroup: ReactNode;
  tabLabels: string;
}) {
  return (
    <Section id="pills-and-tabs" title="Pills and tabs">
      <Specimen label="status pills — decorative tint dot plus a textPrimary label (colour is never the only channel)">
        <div className="flex flex-wrap gap-sm">
          {STATUS_TONES.map((tone) => (
            <Pill key={tone} tone={tone} label="Status label" />
          ))}
        </div>
      </Specimen>
      <Specimen label="tint removed — the same three labels with no dot, so the meaning survives without colour">
        <div className="flex flex-wrap gap-sm">
          {STATUS_TONES.map((tone) => (
            <Pill key={tone} tone="neutral" label="Status label" />
          ))}
        </div>
      </Specimen>
      <div className="flex flex-col gap-sm">
        <Caption>
          tab group — active item surfaceRaised + shadow.raised, inactive transparent — one ink
          (textPrimary) in both states
        </Caption>
        {tabGroup}
        <Caption>the eight canonical tab labels: {tabLabels}</Caption>
      </div>
    </Section>
  );
}

// --- 6 — Compact controls --------------------------------------------------

export function CompactControlsSection({
  search,
  iconToggleOff,
  iconToggleOn,
  rangeInactive,
  rangeActive,
}: {
  search: ReactNode;
  iconToggleOff: ReactNode;
  iconToggleOn: ReactNode;
  rangeInactive: ReactNode;
  rangeActive: ReactNode;
}) {
  return (
    <Section id="compact-controls" title="Compact controls">
      <div className="grid gap-lg md:grid-cols-2">
        <Specimen label="search — inset fill — no border — no shadow">
          {search}
        </Specimen>
        <Specimen label="icon toggle — off (inset fill, no shadow) and on (surfaceRaised + shadow.raised)">
          <div className="flex items-center gap-lg">
            {iconToggleOff}
            {iconToggleOn}
          </div>
        </Specimen>
        <Specimen label="range toggle — inactive (transparent) and active (surfaceRaised + shadow.raised)">
          <div className="flex items-center gap-lg">
            {rangeInactive}
            {rangeActive}
          </div>
        </Specimen>
      </div>
    </Section>
  );
}

// --- 7 — Empty state -------------------------------------------------------

export function EmptyStateSection({ count }: { count: number }) {
  return (
    <Section id="empty-state" title="Empty state">
      <div className="grid gap-lg md:grid-cols-3">
        <EmptyState title="Card title" />
        <EmptyState title="Card title" body="Body copy" />
        <EmptyState
          title="Card title"
          body="Body copy"
          action={{ label: 'Primary', onClick: () => undefined }}
        />
      </div>
      <Specimen label="count specimen — tabular figures for aligned digits">
        <span className="text-display font-semibold leading-tight tabular-nums text-text-primary">
          {count}
        </span>
      </Specimen>
    </Section>
  );
}

// --- 8 — Overlay -----------------------------------------------------------

export function OverlaySection() {
  const [firstOpen, setFirstOpen] = useState(false);
  const [secondOpen, setSecondOpen] = useState(false);

  return (
    <Section id="overlay" title="Overlay">
      <Caption>
        One `Overlay` primitive, two presentations: the centered modal at and above the 1024px band
        edge and the bottom sheet below it. The same component flips presentation at the band edge —
        it is not two overlays. Both use the textPrimary scrim and show the focus ring on the first
        focusable element.
      </Caption>
      <div className="flex flex-wrap gap-lg">
        <Button variant="secondary" onClick={() => setFirstOpen(true)}>
          Open overlay specimen A
        </Button>
        <Button variant="secondary" onClick={() => setSecondOpen(true)}>
          Open overlay specimen B
        </Button>
      </div>
      <Overlay
        open={firstOpen}
        onClose={() => setFirstOpen(false)}
        title="Overlay specimen A"
        description="Body copy"
      >
        <Button variant="primary" onClick={() => setFirstOpen(false)}>
          Primary
        </Button>
      </Overlay>
      <Overlay
        open={secondOpen}
        onClose={() => setSecondOpen(false)}
        title="Overlay specimen B"
        description="Body copy"
      >
        <Button variant="primary" onClick={() => setSecondOpen(false)}>
          Primary
        </Button>
      </Overlay>
    </Section>
  );
}

// --- 9 — Focus and keyboard ------------------------------------------------

export function FocusAndKeyboardSection({
  tabGroup,
  iconToggleOff,
  rangeInactive,
}: {
  tabGroup: ReactNode;
  iconToggleOff: ReactNode;
  rangeInactive: ReactNode;
}) {
  return (
    <Section id="focus-and-keyboard" title="Focus and keyboard">
      <Caption>
        One row per interactive primitive from the sections above. Tab through the row: the focus
        ring is the global :focus-visible treatment (a 2px textPrimary outline at the element's own
        radius, offset 2px on the accentSoft primary). On the overlay panel the ring inverts to the
        surface token against the textPrimary scrim. No control is reachable by pointer only.
      </Caption>
      <div className="flex flex-wrap items-center gap-lg">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="iconOnly" ariaLabel="Status label" icon={Bell} />
        <Pill tone="success" label="Status label" />
        {iconToggleOff}
        {rangeInactive}
        <Button variant="secondary">Open overlay</Button>
      </div>
      {tabGroup}
    </Section>
  );
}

// --- 10 — Reduced motion ---------------------------------------------------

export function ReducedMotionSection() {
  const shell = useShellMotion();
  const activeBranch = shell.reduce ? 'reduced-motion' : 'default';

  return (
    <Section id="reduced-motion" title="Reduced motion">
      <Caption>
        Contract: under prefers-reduced-motion, motion degrades to opacity-only at or below the
        fastest tokenized duration, or renders statically for timeline choreography. Every animated
        primitive is rendered twice below, once per branch, by driving the real useShellMotion hook.
        No test flag and no query parameter is used.
      </Caption>
      <Specimen label={`active branch at this render: ${activeBranch}`}>
        <div
          className="flex flex-wrap items-center gap-lg"
          data-motion-fast={shell.duration('fast')}
          data-motion-slow={shell.duration('slow')}
        >
          <Button variant="primary">Primary</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="iconOnly" ariaLabel="Status label" icon={Bell} />
          <Button variant="iconOnly" ariaLabel="Status label" icon={Bell} />
        </div>
      </Specimen>
      <Caption>
        The animated overlay panel is the second animated primitive; it is rendered on both branches
        in the Overlay section above, where the same component shows the modal and the sheet.
      </Caption>
    </Section>
  );
}
