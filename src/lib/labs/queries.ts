// src/lib/labs/queries.ts — the Phase-9 lab read layer (org-scoped; bound
// predicates only). Results ride their order's name via the FK so the tab and
// the timeline label read truthfully without a second query. The Neon
// connection is single-owner, so the ported RLS policies are inert and the
// explicit `org_id` predicate on every read is the org boundary.
import { getSql } from '@/lib/db/neon';
import type { LabFlag, LabOrderStatus, LabSource } from '@/lib/labs/status';

export type LabOrderRecord = {
  id: string;
  patientId: string;
  name: string;
  orderedAt: string;
  status: LabOrderStatus;
  notes: string | null;
  source: LabSource;
};

export type LabResultRecord = {
  id: string;
  orderId: string;
  orderName: string | null;
  analyte: string;
  value: number | null;
  unit: string | null;
  referenceRange: string | null;
  flag: LabFlag | null;
  resultedAt: string;
  source: LabSource;
  documentName: string | null;
};

type LabOrderRow = {
  id: string;
  patient_id: string;
  name: string;
  ordered_at: string;
  status: LabOrderStatus;
  notes: string | null;
  source: LabSource;
};

type LabResultRow = {
  id: string;
  order_id: string;
  analyte: string;
  value: number | null;
  unit: string | null;
  reference_range: string | null;
  flag: LabFlag | null;
  resulted_at: string;
  source: LabSource;
  order_name: string | null;
  document_filename: string | null;
};

export async function listLabOrders(orgId: string, patientId: string): Promise<LabOrderRecord[]> {
  const sql = getSql();
  try {
    const rows = (await sql`
      select id, patient_id, name, ordered_at, status, notes, source
      from public.lab_orders
      where org_id = ${orgId} and patient_id = ${patientId}
      order by ordered_at desc, id desc
    `) as unknown as LabOrderRow[];

    return rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      name: row.name,
      orderedAt: row.ordered_at,
      status: row.status,
      notes: row.notes,
      source: row.source,
    }));
  } catch (error) {
    throw new Error(
      `listLabOrders failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}

export async function listLabResults(
  orgId: string,
  patientId: string,
): Promise<LabResultRecord[]> {
  const sql = getSql();
  try {
    const rows = (await sql`
      select r.id, r.order_id, r.analyte, r.value, r.unit, r.reference_range, r.flag,
             r.resulted_at, r.source,
             o.name as order_name, d.filename as document_filename
      from public.lab_results r
      left join public.lab_orders o on o.id = r.order_id and o.org_id = ${orgId}
      left join public.documents d on d.id = r.document_id and d.org_id = ${orgId}
      where r.org_id = ${orgId} and r.patient_id = ${patientId}
      order by r.resulted_at desc, r.id desc
    `) as unknown as LabResultRow[];

    return rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      orderName: row.order_name ?? null,
      analyte: row.analyte,
      value: row.value,
      unit: row.unit,
      referenceRange: row.reference_range,
      flag: row.flag,
      resultedAt: row.resulted_at,
      source: row.source,
      documentName: row.document_filename ?? null,
    }));
  } catch (error) {
    throw new Error(
      `listLabResults failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}
