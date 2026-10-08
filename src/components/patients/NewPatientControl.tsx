'use client';

// src/components/patients/NewPatientControl.tsx — the "Add new patient" CTA,
// its modal form and the create flow (PROV-04; D-01/D-02/D-05/D-06/D-07/D-08/
// D-16; 04-UI-SPEC §4.5).
//
// Client island: overlay open state, form state and the create call. The CTA
// is `Button variant="primary"` — `accentSoft` gold with `textPrimary` ink,
// the ONE accent-soft element D-16 reserves (INV-05) — with the 16px leading
// glyph passed as a RENDERED ELEMENT (02-CONTEXT: a component reference cannot
// cross the server→client boundary, so the shell hands glyphs over as nodes).
//
// D-01/D-02: the form collects core identity ONLY — first name, last name,
// date of birth, sex (M/F, D-08) and phone. There is no MRN field (D-07): the
// helper line states it is assigned automatically, and the payload sent to
// `createPatientAction` therefore never carries an `mrn` key.
//
// D-05/D-06: the form is a modal over /provider (the Phase-2 `Overlay`
// primitive, full a11y contract) and on success the overlay CLOSES and the
// page `router.refresh()`es — the action already `revalidatePath`es, so the
// new folder card appears in the grid with NO navigation away.
//
// Validation: `createPatientSchema.safeParse` runs CLIENT-side first for
// instant inline field errors (schemas.ts deliberately lives outside
// `'use server'` for exactly this), then the action re-parses server-side —
// Zod before trust, twice. Field errors render inline under the field as a
// `critical` DOT plus a `textPrimary` message (03-UI-SPEC §4.3 / 04-UI-SPEC
// §4.5: critical is never text ink) and focus moves to the first invalid
// field. A message with no specific copy falls back to the generic line. The
// neutral failure line renders as the same dot grammar on forbidden/error.
//
// Field grammar copies 03-UI-SPEC §8.1: the gate-selected INSET_FILL as a
// PROP (a client chunk may not reference `node:fs` — the login-form /
// invite-creator / audit-browser precedent), `radius.md` inset fields,
// programmatic labels, and the shared `min-h-11 md:min-h-8` height rhythm.
// Sentence case, no exclamation marks, no specialty vocabulary.
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ScanLine } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { makeIcon } from '@/components/primitives/Icon';
import { Overlay } from '@/components/overlays/Overlay';
import { createPatientAction } from '@/lib/patients/actions';
import { createPatientSchema } from '@/lib/patients/schemas';

const ScanGlyph = makeIcon(ScanLine);

/** 04-UI-SPEC §Copywriting — verbatim. */
export const MRN_HELPER = 'The medical record number is assigned automatically.';
export const GENERIC_FIELD_ERROR = 'Check this field and try again.';
const CREATE_ERROR = "Couldn't add this patient. Try again.";

type FieldKey = 'firstName' | 'lastName' | 'dob' | 'sex' | 'phone';
type TextFieldKey = Exclude<FieldKey, 'sex'>;
type FieldErrors = Partial<Record<FieldKey, string>>;

/** The focus order for "move focus to the first invalid field" (§Focus). */
const FIELD_ORDER: readonly FieldKey[] = ['firstName', 'lastName', 'dob', 'sex', 'phone'];

const FIELD_IDS: Record<FieldKey, string> = {
  firstName: 'new-patient-firstname',
  lastName: 'new-patient-lastname',
  dob: 'new-patient-dob',
  sex: 'new-patient-sex',
  phone: 'new-patient-phone',
};

// §4.5 order: 1 first name, 2 last name, 3 date of birth, 4 SEX, 5 phone —
// the segmented sex control therefore renders BETWEEN the DOB and the phone
// field, so the text fields are split around it rather than mapped in one
// block.
type TextFieldSpec = {
  key: TextFieldKey;
  label: string;
  type: 'text' | 'date' | 'tel';
  autoComplete: string;
};

const IDENTITY_FIELDS: readonly TextFieldSpec[] = [
  { key: 'firstName', label: 'First name', type: 'text', autoComplete: 'given-name' },
  { key: 'lastName', label: 'Last name', type: 'text', autoComplete: 'family-name' },
  { key: 'dob', label: 'Date of birth', type: 'date', autoComplete: 'bday' },
];

const PHONE_FIELD: TextFieldSpec = {
  key: 'phone',
  label: 'Phone',
  type: 'tel',
  autoComplete: 'tel',
};

// 03-UI-SPEC §8.1 field wrapper: radius.pill is WRONG here — §8.1 uses
// radius.md so an inset field never reads as a capsule.
const FIELD_WRAPPER =
  'flex w-full items-center gap-xs rounded-md px-lg min-h-11 md:min-h-8 text-text-primary';
const FIELD_INPUT =
  'min-w-0 flex-1 bg-transparent text-body leading-body text-text-primary placeholder:text-text-primary';

/** The dot + textPrimary message line (the Pill grammar applied to errors). */
function ErrorLine({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="flex items-center gap-xs text-label leading-label text-text-primary">
      <span aria-hidden="true" className="inline-block size-4 shrink-0 rounded-pill bg-critical" />
      {message}
    </p>
  );
}

export type NewPatientFormProps = {
  /** The gate-selected INSET_FILL, read server-side. */
  insetFill: string;
  /** Cancels the modal (the ghost "Cancel" button). */
  onCancel: () => void;
  /** Closes the modal and refreshes — the D-06 no-navigation success path. */
  onSuccess: () => void;
};

export function NewPatientForm({ insetFill, onCancel, onSuccess }: NewPatientFormProps) {
  const [sex, setSex] = useState<'M' | 'F' | ''>('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function clearError(key: FieldKey): void {
    setErrors((current) => {
      if (!current[key]) return current;
      const next: FieldErrors = { ...current };
      next[key] = undefined;
      return next;
    });
  }

  function focusFirstError(next: FieldErrors): void {
    const first = FIELD_ORDER.find((key) => next[key]);
    if (first) document.getElementById(FIELD_IDS[first])?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      firstName: String(data.get('firstName') ?? ''),
      lastName: String(data.get('lastName') ?? ''),
      dob: String(data.get('dob') ?? ''),
      sex,
      phone: String(data.get('phone') ?? ''),
    };

    const parsed = createPatientSchema.safeParse(payload);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'firstName') as FieldKey;
        // The schema's own sentences end in a period; anything else (a Zod
        // default such as the enum message) takes the generic line.
        next[key] = issue.message.endsWith('.') ? issue.message : GENERIC_FIELD_ERROR;
      }
      setErrors(next);
      setPageError(null);
      focusFirstError(next);
      return;
    }

    setErrors({});
    setPageError(null);
    setPending(true);
    void createPatientAction(parsed.data).then((result) => {
      setPending(false);
      if (result.ok) {
        onSuccess();
        return;
      }
      setPageError(result.kind === 'invalid' ? GENERIC_FIELD_ERROR : CREATE_ERROR);
    });
  }

  /** One §8.1 field block — rendered three times before sex, once after. */
  function renderTextField(field: TextFieldSpec) {
    const id = FIELD_IDS[field.key];
    const error = errors[field.key];
    return (
      <div key={field.key} className="flex flex-col gap-xs">
        <label htmlFor={id} className="text-label leading-label text-text-primary">
          {field.label}
        </label>
        <div className={[FIELD_WRAPPER, insetFill].filter(Boolean).join(' ')}>
          <input
            id={id}
            name={field.key}
            type={field.type}
            autoComplete={field.autoComplete}
            readOnly={pending}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={error ? () => clearError(field.key) : undefined}
            className={FIELD_INPUT}
          />
        </div>
        {error ? <ErrorLine id={`${id}-error`} message={error} /> : null}
      </div>
    );
  }

  return (
    <form
      noValidate
      aria-busy={pending}
      className="flex w-full flex-col gap-md"
      onSubmit={handleSubmit}
    >
      {pageError ? <ErrorLine id="new-patient-error" message={pageError} /> : null}

      {/* 1–3: first name, last name, date of birth (§4.5 order). */}
      {IDENTITY_FIELDS.map((field) => renderTextField(field))}

      {/* Sex — segmented M | F, D-08: the options are exactly these two. */}
      <div className="flex flex-col gap-xs">
        <span className="text-label leading-label text-text-primary">Sex</span>
        <div
          role="group"
          aria-label="Sex"
          className={['inline-flex items-center gap-xs rounded-pill p-xs', insetFill]
            .filter(Boolean)
            .join(' ')}
        >
          {(['M', 'F'] as const).map((option) => (
            <button
              key={option}
              id={option === 'M' ? FIELD_IDS.sex : undefined}
              type="button"
              aria-pressed={sex === option}
              disabled={pending}
              onClick={() => {
                setSex(option);
                clearError('sex');
              }}
              className={[
                'inline-flex min-h-11 items-center justify-center rounded-pill px-md text-body font-semibold leading-body text-text-primary',
                sex === option ? 'bg-surface-raised shadow-raised' : 'bg-transparent',
              ].join(' ')}
            >
              {option}
            </button>
          ))}
        </div>
        {errors.sex ? <ErrorLine id={`${FIELD_IDS.sex}-error`} message={errors.sex} /> : null}
      </div>

      {/* 5: phone — the last field of the §4.5 order. */}
      {renderTextField(PHONE_FIELD)}

      {/* D-07: the provider never types an MRN. */}
      <p className="text-label leading-label text-text-secondary">{MRN_HELPER}</p>

      <div className="flex justify-end gap-sm">
        <Button variant="primary" type="submit" disabled={pending}>
          Add patient
        </Button>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export type NewPatientControlProps = {
  /** The gate-selected INSET_FILL, read server-side (never from this chunk). */
  insetFill: string;
  /** `secondary` for the grid's empty-state trigger; the CTA stays primary. */
  variant?: 'primary' | 'secondary';
  className?: string;
};

export function NewPatientControl({
  insetFill,
  variant = 'primary',
  className,
}: NewPatientControlProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        <ScanGlyph size="sm" />
        Add new patient
      </Button>
      <Overlay open={open} onClose={() => setOpen(false)} title="Add new patient">
        <NewPatientForm
          insetFill={insetFill}
          onCancel={() => setOpen(false)}
          onSuccess={() => {
            // D-06: no navigation — the action revalidated /provider and the
            // refresh repaints the grid with the new folder card.
            setOpen(false);
            router.refresh();
          }}
        />
      </Overlay>
    </>
  );
}
