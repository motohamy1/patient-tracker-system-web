-- Migration 0018: security hardening amendments (phase 20, SEC-01/02).
--
-- Finding F-2 of the Phase-20 audit: the `patient-documents` bucket (0008)
-- granted SELECT and INSERT to STAFF only, so a patient could not retrieve
-- their OWN document objects (a prescription image they uploaded, a scanned
-- result). That is over-restriction, not a leak — but a patient reading
-- their own record is a requirement the storage policies silently denied.
--
-- The path convention `<org_id>/<patient_id>/<uuid>` (0008) makes the patient
-- the SECOND segment. The new policy compares it to the patient row whose
-- `user_id` is the authenticated user, so media access and record access
-- finally agree. The comparison is TEXT (`p.id::text = split_part(...)`) on
-- purpose: a malformed object name fails the compare instead of raising a
-- cast error inside the policy.
--
-- No other table or policy changed in this phase: the audit's other findings
-- were resolved in application code (see 20-SECURITY-AUDIT.md), not here.

create policy "select patient-documents as self"
on storage.objects for select to authenticated
using (
  bucket_id = 'patient-documents'
  and exists (
    select 1 from public.patients p
    where p.user_id = auth.uid()
      and p.id::text = split_part(name, '/', 2)
  )
);
