'use client';

// Genetic finding control (ALG-02; ticket 10-04). Rendered only for principals
// who may both see and author genetics; the action re-checks server-side.
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { recordGeneticFindingAction } from '@/lib/genetics/actions';
import {
  GENETIC_KINDS,
  GENETIC_KIND_LABELS,
  GENETIC_SIGNIFICANCES,
  GENETIC_SIGNIFICANCE_LABELS,
} from '@/lib/genetics/status';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';
const ERROR = "Couldn't save this finding. Try again.";

export function NewGeneticFindingControl({
  patientId,
  insetFill,
}: {
  patientId: string;
  insetFill: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('variant');
  const [gene, setGene] = useState('');
  const [variant, setVariant] = useState('');
  const [significance, setSignificance] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await recordGeneticFindingAction({
      patientId,
      kind,
      gene,
      variant,
      interpretation,
      significance: significance === '' ? undefined : significance,
    });
    setPending(false);
    if (!result.ok) {
      setError(ERROR);
      return;
    }
    setOpen(false);
    setGene('');
    setVariant('');
    setSignificance('');
    setInterpretation('');
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
        Record finding
      </Button>
      <Overlay open={open} onClose={() => setOpen(false)} title="Record finding" description="Add a genetic finding to this record.">
        <form onSubmit={submit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Kind
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={`${insetFill} ${FIELD}`}>
              {GENETIC_KINDS.map((value) => (
                <option key={value} value={value}>{GENETIC_KIND_LABELS[value]}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-md">
            <label className="flex min-w-0 flex-1 flex-col gap-xs text-label leading-label text-text-primary">
              Gene
              <input type="text" value={gene} onChange={(e) => setGene(e.target.value)} maxLength={80} className={`${insetFill} ${FIELD}`} />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-xs text-label leading-label text-text-primary">
              Variant
              <input type="text" value={variant} onChange={(e) => setVariant(e.target.value)} maxLength={160} className={`${insetFill} ${FIELD}`} />
            </label>
          </div>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Significance
            <select value={significance} onChange={(e) => setSignificance(e.target.value)} className={`${insetFill} ${FIELD}`}>
              <option value="">Not specified</option>
              {GENETIC_SIGNIFICANCES.map((value) => (
                <option key={value} value={value}>{GENETIC_SIGNIFICANCE_LABELS[value]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Interpretation
            <textarea value={interpretation} onChange={(e) => setInterpretation(e.target.value)} maxLength={4000} rows={4} className={`${insetFill} ${FIELD}`} />
          </label>
          {error ? <p role="alert" className="text-label leading-label text-text-primary">{error}</p> : null}
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending} ariaBusy={pending}>Save finding</Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}
