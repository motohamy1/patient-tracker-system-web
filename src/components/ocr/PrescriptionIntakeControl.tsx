'use client';

// PrescriptionIntakeControl — the upload entry to the §11 pipeline (Phase 12,
// ticket 12-03).
//
// The browser writes the image straight to the private `patient-documents`
// bucket under `<org>/<patient>/<uuid>` (the storage policies authorize staff
// writes and read the org from the path), then the server action validates the
// path, runs preprocessing, and creates the document + extraction work item.
// The control then navigates to the intake route where the clinician verifies
// against the original image.
//
// The component never decides anything: the action re-checks the capability
// and the path prefix server-side (§3.1/§12).
import { useRouter } from 'next/navigation';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { createClient } from '@/lib/supabase/client';
import { uploadPrescriptionAction } from '@/lib/ocr/actions';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';

export function PrescriptionIntakeControl({
  patientId,
  orgId,
  insetFill,
}: {
  patientId: string;
  orgId: string;
  insetFill: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setFile(event.target.files?.[0] ?? null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (file === null) {
      setError('Choose the prescription image first.');
      return;
    }
    setPending(true);
    setError(null);

    // 1. The object write, to the exact path the storage policies expect.
    const objectId = crypto.randomUUID();
    const extension = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
    const storagePath = `${orgId}/${patientId}/${objectId}${extension}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from('patient-documents')
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setPending(false);
      setError("That image couldn't be stored. Try again.");
      return;
    }

    // 2. The server-side validation + work item.
    const result = await uploadPrescriptionAction({
      patientId,
      storagePath,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    setPending(false);
    if (!result.ok || result.extractionId === undefined) {
      setError("That prescription couldn't be accepted. Check the file and try again.");
      return;
    }

    setOpen(false);
    setFile(null);
    if (inputRef.current !== null) inputRef.current.value = '';
    router.push(`/provider/patients/${patientId}/medications/intake/${result.extractionId}`);
  }

  return (
    <>
      <Button variant="secondary" icon={Upload} onClick={() => setOpen(true)}>
        New from prescription
      </Button>
      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title="Add a prescription"
        description="Upload the prescription image. You will confirm every field before anything is recorded."
      >
        <form onSubmit={submit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Prescription image
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={pick}
              className={`${insetFill} ${FIELD}`}
              required
            />
          </label>
          <p className="text-label leading-label text-text-secondary">
            JPEG, PNG, WebP or PDF, up to 10 MB. The original stays beside the extracted fields while you verify.
          </p>
          {error ? (
            <p role="alert" className="text-label leading-label text-text-primary">
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending} ariaBusy={pending}>
              Upload prescription
            </Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}
