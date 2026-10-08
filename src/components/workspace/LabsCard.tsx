// LabsCard — the right-side (≈22.5%) bottom-row card (ticket 04; reference
// §5 bottom row: "Labs (compact value rows with thin semantic segments) at
// about 22.5%").
//
// Phase 5 has no labs table, so the card is a DELIBERATE §24 state that names
// what will appear — never a placeholder value, row or semantic segment
// (§27, Phase-4 D-18). The empty heading follows the §7 "No {record-type}
// yet" form; the body is one line of what will appear plus one next step.
// When Phase 009 fills this card, the compact value rows land inside this
// same shell at this same proportion.
//
// Server Component: no hook, no client directive.
import { BottomCardShell } from '@/components/workspace/BottomCardShell';

export function LabsCard() {
  return (
    <BottomCardShell label="Labs" heading="Labs">
      <div className="mt-auto flex flex-col gap-xs">
        <span className="text-body font-semibold leading-body text-text-primary">No labs yet</span>
        <span className="text-body leading-body text-text-secondary">
          Lab results will appear here as they are filed.
        </span>
        <span className="text-label leading-label text-text-secondary">
          Results arrive when an order is completed.
        </span>
      </div>
    </BottomCardShell>
  );
}
