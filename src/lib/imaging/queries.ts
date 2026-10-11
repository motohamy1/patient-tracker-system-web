// src/lib/imaging/queries.ts — the Phase-9 imaging read layer (org-scoped).
// The Neon connection is single-owner, so the ported RLS policies are inert
// and the explicit `org_id` predicate on every read is the org boundary.
import { getSql } from '@/lib/db/neon';
import type { ImagingOrderStatus, ImagingSource } from '@/lib/imaging/status';

export type ImagingOrderRecord = {
  id: string;
  patientId: string;
  modality: string;
  bodySite: string | null;
  orderedAt: string;
  status: ImagingOrderStatus;
  notes: string | null;
  source: ImagingSource;
};

export type ImagingResultRecord = {
  id: string;
  orderId: string;
  orderModality: string | null;
  impression: string;
  resultedAt: string;
  source: ImagingSource;
  /** The linked media's filename, when a document is attached (LAB-02). */
  documentName: string | null;
};

type ImagingOrderRow = {
  id: string;
  patient_id: string;
  modality: string;
  body_site: string | null;
  ordered_at: string;
  status: ImagingOrderStatus;
  notes: string | null;
  source: ImagingSource;
};

type ImagingResultRow = {
  id: string;
  order_id: string;
  impression: string;
  resulted_at: string;
  source: ImagingSource;
  order_modality: string | null;
  document_filename: string | null;
};

export async function listImagingOrders(
  orgId: string,
  patientId: string,
): Promise<ImagingOrderRecord[]> {
  const sql = getSql();
  try {
    const rows = (await sql`
      select id, patient_id, modality, body_site, ordered_at, status, notes, source
      from public.imaging_orders
      where org_id = ${orgId} and patient_id = ${patientId}
      order by ordered_at desc, id desc
    `) as unknown as ImagingOrderRow[];

    return rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      modality: row.modality,
      bodySite: row.body_site,
      orderedAt: row.ordered_at,
      status: row.status,
      notes: row.notes,
      source: row.source,
    }));
  } catch (error) {
    throw new Error(
      `listImagingOrders failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}

export async function listImagingResults(
  orgId: string,
  patientId: string,
): Promise<ImagingResultRecord[]> {
  const sql = getSql();
  try {
    const rows = (await sql`
      select r.id, r.order_id, r.impression, r.resulted_at, r.source,
             o.modality as order_modality, d.filename as document_filename
      from public.imaging_results r
      left join public.imaging_orders o on o.id = r.order_id and o.org_id = ${orgId}
      left join public.documents d on d.id = r.document_id and d.org_id = ${orgId}
      where r.org_id = ${orgId} and r.patient_id = ${patientId}
      order by r.resulted_at desc, r.id desc
    `) as unknown as ImagingResultRow[];

    return rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      orderModality: row.order_modality ?? null,
      impression: row.impression,
      resultedAt: row.resulted_at,
      source: row.source,
      documentName: row.document_filename ?? null,
    }));
  } catch (error) {
    throw new Error(
      `listImagingResults failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}
