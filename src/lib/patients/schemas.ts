// src/lib/patients/schemas.ts — Zod validation for the Phase-4 patient
// mutations and the list query (D-02 core identity only, D-08 M/F,
// D-11/D-14/D-20 retrieval params). PROV-04, AUTH-05 pre-validation.
//
// This module is deliberately NOT 'use server': a 'use server' module may only
// export async functions (03-PATTERNS rule, same reason src/lib/auth/invite.ts
// exists), and the new-patient FORM imports createPatientSchema for instant
// client-side field errors before the action re-parses server-side.
//
// No MRN field exists anywhere here — D-07: the provider never types one.
import { z } from 'zod';
import { PATIENT_STATUSES } from '@/lib/patients/status';

const dobInPast = (v: string): boolean => {
  const d = new Date(v);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
};

export const createPatientSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter a first name.').max(80),
  lastName: z.string().trim().min(1, 'Enter a last name.').max(80),
  dob: z.string().refine(dobInPast, 'Enter a date of birth in the past.'),
  sex: z.enum(['M', 'F']), // D-08: M/F only
  phone: z.string().trim().min(1, 'Enter a phone number.').max(32),
});

export const changePatientStatusSchema = z.object({
  patientId: z.string().uuid(),
  status: z.enum(PATIENT_STATUSES),
});

// D-11/D-14/D-20: the retrieval contract the /provider page parses out of
// searchParams. `day` is the CLIENT's local calendar day (regex-constrained —
// 04-RESEARCH Pitfall 1/2: it is the only user value that may enter a PostgREST
// .or() string, and only in this exact YYYY-MM-DD form). `shown` is the count
// already loaded: cumulative paging, never an offset window (D-20/UX-07).
export const listPatientsQuerySchema = z.object({
  q: z.string().max(120).optional(),
  filter: z.enum(['all', 'recent', 'today', 'attention', 'critical']).default('all'),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  shown: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(30).default(24),
});

// One strict id gate for every patient mutation (matches z.string().uuid():
// v4 gen_random_uuid() ids pass; hand-shaped fakes fail loudly).
export const patientIdSchema = z.string().uuid();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type ChangePatientStatusInput = z.infer<typeof changePatientStatusSchema>;
export type ListPatientsQueryInput = z.infer<typeof listPatientsQuerySchema>;
