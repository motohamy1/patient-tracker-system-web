// src/lib/ai/generate.ts — the deterministic insight generator (Phase 11,
// AI-01/02/03; §10).
//
// PURE: this module performs no I/O. Callers pass the records they already
// hold (the same rows the workspace tabs read, so an insight can never tell a
// different story than the record) and a clock; the same input always yields
// the same insights. There is no LLM call, no network, and no guessing —
// every generated insight cites the exact source rows it was derived from
// (0010 requires at least one evidence reference), and where the record is
// thin the family simply produces nothing rather than inventing content.
//
// AI-03: nothing here diagnoses, prescribes, or directs. Every output is an
// OBSERVATION about the stored record, phrased in the §7 sentence-case copy
// contract, awaiting clinician review (verification starts ai-extracted).
//
// The families map to §10's priority questions:
//   what changed / what is new  → change
//   summarize recent history,
//   summarize the last period   → summary
//   what matters /
//   what needs attention        → attention
//   notable trends              → trend
//   missing follow-up /
//   documentation               → documentation-gap
import type { AllergyRecord } from '@/lib/allergies/queries';
import type { LabOrderRecord, LabResultRecord } from '@/lib/labs/queries';
import type { MedicationRecord, MedicationEventRecord } from '@/lib/medications/queries';
import type { ImagingOrderRecord, ImagingResultRecord } from '@/lib/imaging/queries';
import type { VisitRecord } from '@/lib/visits/queries';
import type { InsightEvidenceRef, InsightKind, InsightWindow } from '@/lib/ai/status';

/** Everything the generator may look at, already loaded under org RLS. */
export type InsightInput = {
  visits: readonly VisitRecord[];
  medications: readonly MedicationRecord[];
  medicationEvents: readonly MedicationEventRecord[];
  allergies: readonly AllergyRecord[];
  labOrders: readonly LabOrderRecord[];
  labResults: readonly LabResultRecord[];
  imagingOrders: readonly ImagingOrderRecord[];
  imagingResults: readonly ImagingResultRecord[];
};

/** A generated insight, exactly as 0010 stores it (minus identity columns). */
export type GeneratedInsight = {
  kind: InsightKind;
  title: string;
  body: string;
  evidence: readonly InsightEvidenceRef[];
  window: InsightWindow | null;
};

/** The change-detection window: the recent fortnight vs the one before it. */
export const CHANGE_WINDOW_DAYS = 14;
/** The summary window: the last quarter vs the quarter before it. */
export const SUMMARY_WINDOW_DAYS = 90;
/** Evidence references per insight are capped so one row stays readable. */
const MAX_EVIDENCE = 12;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

function inWindow(at: string, from: Date, to: Date): boolean {
  const t = Date.parse(at);
  return t >= from.getTime() && t <= to.getTime();
}

function isoDate(at: string): string {
  return at.slice(0, 10);
}

function formatDate(at: string): string {
  return new Date(at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** A calm count phrase: "3 lab results", "1 visit" (§7 sentence case). */
function countPhrase(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Numeric formatting that never invents precision the record does not have. */
function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

/** The visit's label: its scheduling type, else its date (never clinical prose). */
function visitLabel(visit: VisitRecord): string {
  return visit.visitType ?? `Visit on ${formatDate(visit.scheduledAt)}`;
}

function capEvidence(refs: readonly InsightEvidenceRef[]): {
  evidence: readonly InsightEvidenceRef[];
  overflow: number;
} {
  if (refs.length <= MAX_EVIDENCE) return { evidence: refs, overflow: 0 };
  return { evidence: refs.slice(0, MAX_EVIDENCE), overflow: refs.length - MAX_EVIDENCE };
}

// ---------------------------------------------------------------------------
// change — what changed / what is new (§10)
// ---------------------------------------------------------------------------

function generateChange(
  input: InsightInput,
  from: Date,
  to: Date,
  priorFrom: Date,
  priorTo: Date,
): GeneratedInsight[] {
  const visits = input.visits.filter((v) => inWindow(v.createdAt, from, to));
  const medEvents = input.medicationEvents.filter((e) => inWindow(e.at, from, to));
  const labResults = input.labResults.filter((r) => inWindow(r.resultedAt, from, to));
  const imagingResults = input.imagingResults.filter((r) => inWindow(r.resultedAt, from, to));
  const allergies = input.allergies.filter((a) => inWindow(a.notedAt, from, to));

  const priorCount =
    input.visits.filter((v) => inWindow(v.createdAt, priorFrom, priorTo)).length +
    input.medicationEvents.filter((e) => inWindow(e.at, priorFrom, priorTo)).length +
    input.labResults.filter((r) => inWindow(r.resultedAt, priorFrom, priorTo)).length +
    input.imagingResults.filter((r) => inWindow(r.resultedAt, priorFrom, priorTo)).length +
    input.allergies.filter((a) => inWindow(a.notedAt, priorFrom, priorTo)).length;

  const total = visits.length + medEvents.length + labResults.length + imagingResults.length + allergies.length;
  if (total === 0) return [];

  const parts: string[] = [];
  const refs: InsightEvidenceRef[] = [];

  for (const visit of visits) {
    parts.push(`visit scheduled (${visitLabel(visit)})`);
    refs.push({ table: 'visits', id: visit.id, label: visitLabel(visit) });
  }
  for (const event of medEvents) {
    const label = event.medicationName !== null ? `${event.medicationName}` : 'Medication';
    parts.push(`medication ${event.kind} (${label})`);
    refs.push({ table: 'medication_events', id: event.id, label: `Medication ${event.kind}: ${label}` });
  }
  for (const result of labResults) {
    const label = `${result.analyte} result`;
    parts.push(`lab result (${result.analyte})`);
    refs.push({ table: 'lab_results', id: result.id, label });
  }
  for (const result of imagingResults) {
    parts.push(`imaging result (${result.orderModality ?? 'imaging'})`);
    refs.push({ table: 'imaging_results', id: result.id, label: `Imaging result: ${result.orderModality ?? 'imaging'}` });
  }
  for (const allergy of allergies) {
    parts.push(`allergy recorded (${allergy.allergen})`);
    refs.push({ table: 'allergies', id: allergy.id, label: `Allergy: ${allergy.allergen}` });
  }

  const body =
    priorCount === 0
      ? `${countPhrase(total, 'recorded change')} in the last ${CHANGE_WINDOW_DAYS} days; nothing was recorded in the ${CHANGE_WINDOW_DAYS} days before that.`
      : `${countPhrase(total, 'recorded change')} in the last ${CHANGE_WINDOW_DAYS} days, compared with ${countPhrase(priorCount, 'recorded change')} in the prior ${CHANGE_WINDOW_DAYS} days.`;

  return [
    {
      kind: 'change',
      title: `${countPhrase(total, 'change')} in the last ${CHANGE_WINDOW_DAYS} days`,
      body: `${body} Includes: ${parts.join('; ')}.`,
      evidence: refs,
      window: { from: from.toISOString(), to: to.toISOString() },
    },
  ];
}

// ---------------------------------------------------------------------------
// summary — recent history and the last period (§10)
// ---------------------------------------------------------------------------

function summarize(input: InsightInput, from: Date, to: Date): { total: number; parts: string[]; refs: InsightEvidenceRef[] } | null {
  const visits = input.visits.filter((v) => inWindow(v.createdAt, from, to));
  const medications = input.medications.filter((m) => inWindow(m.startedAt, from, to));
  const labResults = input.labResults.filter((r) => inWindow(r.resultedAt, from, to));
  const imagingResults = input.imagingResults.filter((r) => inWindow(r.resultedAt, from, to));
  const allergies = input.allergies.filter((a) => inWindow(a.notedAt, from, to));

  const total = visits.length + medications.length + labResults.length + imagingResults.length + allergies.length;
  if (total === 0) return null;

  const parts: string[] = [];
  const refs: InsightEvidenceRef[] = [];
  if (visits.length > 0) {
    parts.push(countPhrase(visits.length, 'visit'));
    refs.push(...visits.slice(0, MAX_EVIDENCE).map((v) => ({ table: 'visits' as const, id: v.id, label: visitLabel(v) })));
  }
  if (medications.length > 0) {
    parts.push(`${countPhrase(medications.length, 'medication')} started`);
    refs.push(...medications.slice(0, MAX_EVIDENCE).map((m) => ({ table: 'medications' as const, id: m.id, label: m.name })));
  }
  if (labResults.length > 0) {
    parts.push(countPhrase(labResults.length, 'lab result'));
    refs.push(...labResults.slice(0, MAX_EVIDENCE).map((r) => ({ table: 'lab_results' as const, id: r.id, label: `${r.analyte} result` })));
  }
  if (imagingResults.length > 0) {
    parts.push(countPhrase(imagingResults.length, 'imaging result'));
    refs.push(...imagingResults.slice(0, MAX_EVIDENCE).map((r) => ({ table: 'imaging_results' as const, id: r.id, label: `Imaging result: ${r.orderModality ?? 'imaging'}` })));
  }
  if (allergies.length > 0) {
    parts.push(countPhrase(allergies.length, 'allergy', 'allergies'));
    refs.push(...allergies.slice(0, MAX_EVIDENCE).map((a) => ({ table: 'allergies' as const, id: a.id, label: `Allergy: ${a.allergen}` })));
  }
  return { total, parts, refs };
}

function generateSummaries(
  input: InsightInput,
  recentFrom: Date,
  recentTo: Date,
  priorFrom: Date,
  priorTo: Date,
): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  const recent = summarize(input, recentFrom, recentTo);
  if (recent !== null) {
    insights.push({
      kind: 'summary',
      title: `Record summary — last ${SUMMARY_WINDOW_DAYS} days`,
      body: `The last ${SUMMARY_WINDOW_DAYS} days hold ${recent.parts.join(', ')}. This is a description of the record, not an assessment of it.`,
      evidence: recent.refs,
      window: { from: recentFrom.toISOString(), to: recentTo.toISOString() },
    });
  }

  const prior = summarize(input, priorFrom, priorTo);
  if (prior !== null) {
    insights.push({
      kind: 'summary',
      title: `Record summary — the ${SUMMARY_WINDOW_DAYS} days before that`,
      body: `The preceding ${SUMMARY_WINDOW_DAYS} days hold ${prior.parts.join(', ')}.`,
      evidence: prior.refs,
      window: { from: priorFrom.toISOString(), to: priorTo.toISOString() },
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// attention — what matters / what needs attention (§10)
// ---------------------------------------------------------------------------

function generateAttention(input: InsightInput, now: Date): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  // Abnormal results, read from the record's own flag — no threshold invented.
  const abnormal = input.labResults.filter((r) => r.flag === 'low' || r.flag === 'high' || r.flag === 'critical');
  if (abnormal.length > 0) {
    const { evidence, overflow } = capEvidence(
      abnormal.map((r) => ({
        table: 'lab_results' as const,
        id: r.id,
        label: `${r.analyte}: ${r.value !== null ? `${formatValue(r.value)}${r.unit ? ` ${r.unit}` : ''}` : 'no value'} (${r.flag})`,
      })),
    );
    insights.push({
      kind: 'attention',
      title: `${countPhrase(abnormal.length, 'lab result')} flagged abnormal`,
      body: `The record flags ${countPhrase(abnormal.length, 'lab result')} as low, high or critical: ${evidence
        .map((e) => e.label)
        .join('; ')}${overflow > 0 ? `; and ${overflow} more` : ''}.`,
      evidence,
      window: null,
    });
  }

  // Follow-ups whose date has passed.
  const overdue = input.visits.filter((v) => v.followUpAt !== null && Date.parse(v.followUpAt) <= now.getTime());
  if (overdue.length > 0) {
    const { evidence, overflow } = capEvidence(
      overdue.map((v) => ({
        table: 'visits' as const,
        id: v.id,
        label: `Follow-up from ${visitLabel(v)} (${isoDate(v.followUpAt as string)})`,
      })),
    );
    insights.push({
      kind: 'attention',
      title: `${countPhrase(overdue.length, 'follow-up')} past its scheduled date`,
      body: `The record has ${countPhrase(overdue.length, 'follow-up')} with a scheduled date on or before today: ${evidence
        .map((e) => e.label)
        .join('; ')}${overflow > 0 ? `; and ${overflow} more` : ''}.`,
      evidence,
      window: null,
    });
  }

  // Active severe allergies: a bedside safety fact that needs eyes on it.
  const severe = input.allergies.filter(
    (a) => a.status === 'active' && (a.severity === 'severe' || a.severity === 'anaphylaxis'),
  );
  if (severe.length > 0) {
    const { evidence, overflow } = capEvidence(
      severe.map((a) => ({
        table: 'allergies' as const,
        id: a.id,
        label: `${a.allergen} (${a.severity})${a.reaction !== null ? ` — ${a.reaction}` : ''}`,
      })),
    );
    insights.push({
      kind: 'attention',
      title: `${countPhrase(severe.length, 'active severe allergy', 'active severe allergies')}`,
      body: `The record lists ${evidence.map((e) => e.label).join('; ')}${
        overflow > 0 ? `; and ${overflow} more` : ''
      }.`,
      evidence,
      window: null,
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// trend — notable trends (§10)
// ---------------------------------------------------------------------------

function generateTrends(input: InsightInput): GeneratedInsight[] {
  const byAnalyte = new Map<string, LabResultRecord[]>();
  for (const result of input.labResults) {
    if (result.value === null) continue;
    const key = result.analyte.trim().toLowerCase();
    const list = byAnalyte.get(key);
    if (list) list.push(result);
    else byAnalyte.set(key, [result]);
  }

  const insights: GeneratedInsight[] = [];
  for (const series of byAnalyte.values()) {
    if (series.length < 2) continue;
    // Oldest → newest; the record's own order breaks ties deterministically.
    const ordered = [...series].sort((a, b) => a.resultedAt.localeCompare(b.resultedAt) || a.id.localeCompare(b.id));
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const firstValue = first.value as number;
    const lastValue = last.value as number;
    const direction = lastValue > firstValue ? 'increasing' : lastValue < firstValue ? 'decreasing' : 'stable';
    const analyteLabel = ordered[ordered.length - 1].analyte;

    insights.push({
      kind: 'trend',
      title: `${analyteLabel}: ${direction} across ${countPhrase(ordered.length, 'measurement')}`,
      body: `${analyteLabel} was measured ${countPhrase(ordered.length, 'time')} between ${formatDate(
        first.resultedAt,
      )} and ${formatDate(last.resultedAt)}, moving ${direction} from ${formatValue(firstValue)}${
        first.unit ? ` ${first.unit}` : ''
      } to ${formatValue(lastValue)}${last.unit ? ` ${last.unit}` : ''}. This reports stored values only; it makes no assessment.`,
      evidence: ordered.map((r) => ({
        table: 'lab_results' as const,
        id: r.id,
        label: `${r.analyte}: ${formatValue(r.value as number)}${r.unit ? ` ${r.unit}` : ''} (${isoDate(r.resultedAt)})`,
      })),
      window: { from: first.resultedAt, to: last.resultedAt },
    });
  }

  // Most recently measured analyte first; calm ordering for the surface.
  return insights.sort((a, b) => (b.window?.to ?? '').localeCompare(a.window?.to ?? ''));
}

// ---------------------------------------------------------------------------
// documentation-gap — missing follow-up / documentation (§10)
// ---------------------------------------------------------------------------

function generateDocumentationGaps(input: InsightInput): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  // A follow-up date without documentation for the visit that scheduled it.
  const undocumented = input.visits.filter((v) => v.followUpAt !== null && v.documentation === null);
  if (undocumented.length > 0) {
    const { evidence, overflow } = capEvidence(
      undocumented.map((v) => ({
        table: 'visits' as const,
        id: v.id,
        label: `${visitLabel(v)} — follow-up dated ${isoDate(v.followUpAt as string)}, no documentation`,
      })),
    );
    insights.push({
      kind: 'documentation-gap',
      title: `${countPhrase(undocumented.length, 'visit')} with a follow-up but no documentation`,
      body: `${countPhrase(undocumented.length, 'visit', 'visits')} in the record carry a follow-up date with no documentation: ${evidence
        .map((e) => e.label)
        .join('; ')}${overflow > 0 ? `; and ${overflow} more` : ''}.`,
      evidence,
      window: null,
    });
  }

  // Medications recorded without structured dosage/frequency/route (the
  // CDSS-ready fields MED-03 asks for).
  const incompleteMeds = input.medications.filter(
    (m) => m.doseAmount === null || m.frequency === null || m.route === null,
  );
  if (incompleteMeds.length > 0) {
    const missing = (m: MedicationRecord): string[] => {
      const gaps: string[] = [];
      if (m.doseAmount === null) gaps.push('dosage');
      if (m.frequency === null) gaps.push('frequency');
      if (m.route === null) gaps.push('route');
      return gaps;
    };
    const { evidence, overflow } = capEvidence(
      incompleteMeds.map((m) => ({
        table: 'medications' as const,
        id: m.id,
        label: `${m.name} — missing ${missing(m).join(', ')}`,
      })),
    );
    insights.push({
      kind: 'documentation-gap',
      title: `${countPhrase(incompleteMeds.length, 'medication')} without full dosage detail`,
      body: `${countPhrase(incompleteMeds.length, 'medication')} in the record is missing structured detail: ${evidence
        .map((e) => e.label)
        .join('; ')}${overflow > 0 ? `; and ${overflow} more` : ''}.`,
      evidence,
      window: null,
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------

/**
 * Generate every insight the record currently supports, in display order
 * (attention first — what needs eyes now). `now` is injected so the output is
 * deterministic and unit-testable.
 */
export function generateInsights(input: InsightInput, now: Date): GeneratedInsight[] {
  const recentTo = now;
  const recentFrom = daysAgo(now, CHANGE_WINDOW_DAYS);
  const priorTo = recentFrom;
  const priorFrom = daysAgo(now, CHANGE_WINDOW_DAYS * 2);

  return [
    ...generateAttention(input, now),
    ...generateChange(input, recentFrom, recentTo, priorFrom, priorTo),
    ...generateTrends(input),
    ...generateDocumentationGaps(input),
    ...generateSummaries(input, daysAgo(now, SUMMARY_WINDOW_DAYS), now, daysAgo(now, SUMMARY_WINDOW_DAYS * 2), daysAgo(now, SUMMARY_WINDOW_DAYS)),
  ];
}
