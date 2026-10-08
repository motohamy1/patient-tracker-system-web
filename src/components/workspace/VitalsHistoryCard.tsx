// VitalsHistoryCard — the wide (≈55%) bottom-row card (ticket 04; reference
// §5 bottom row: "Vital Signs History (wide, about 55%) with Month/Week range
// toggles as pills where the active one is emphasized").
//
// Phase 5 has no vitals table, so the card is a DELIBERATE §24 state that
// names what will appear — never a placeholder number, sparkline, bar or
// fabricated value (§27, Phase-4 D-18). The empty heading follows the §7
// "No {record-type} yet" form; the body is one line of what will appear plus
// one next step.
//
// The Month/Week range chips are the reference's compact temporal navigation,
// present as `radius.pill` chrome with the active one emphasized
// (`surfaceRaised` fill + `shadow.raised` — the CompactControl range-toggle
// state language, INV-08). They are rendered as plain spans, NOT buttons:
// there is no range state to switch yet, and a button that answers nothing is
// a dead control (INV-08 / no-fake-interactivity). They are `aria-hidden` so
// assistive tech is never offered a control that does not exist; Phase 006
// replaces this chrome with the wired control.
//
// Server Component: no hook, no client directive.
import { BottomCardShell } from '@/components/workspace/BottomCardShell';

const RANGE_CHIPS = [
  { label: 'Month', active: true },
  { label: 'Week', active: false },
] as const;

function RangeChips() {
  return (
    <span aria-hidden="true" className="flex items-center gap-xs">
      {RANGE_CHIPS.map((chip) => (
        <span
          key={chip.label}
          className={`inline-flex min-h-8 items-center justify-center rounded-pill px-md text-label leading-label text-text-primary ${
            chip.active ? 'bg-surface-raised shadow-raised' : 'bg-transparent'
          }`}
        >
          {chip.label}
        </span>
      ))}
    </span>
  );
}

export function VitalsHistoryCard() {
  return (
    <BottomCardShell label="Vital Signs History" heading="Vital Signs History" headerExtra={<RangeChips />}>
      <div className="mt-auto flex flex-col gap-xs">
        <span className="text-body font-semibold leading-body text-text-primary">
          No vital signs yet
        </span>
        <span className="text-body leading-body text-text-secondary">
          Blood pressure, heart rate and other readings will appear here as care progresses.
        </span>
        <span className="text-label leading-label text-text-secondary">
          Readings recorded during a visit fill this history.
        </span>
      </div>
    </BottomCardShell>
  );
}
