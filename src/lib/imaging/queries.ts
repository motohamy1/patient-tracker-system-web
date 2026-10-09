// src/lib/imaging/queries.ts — the Phase-9 imaging read layer (RLS-scoped).
import { createClient } from '@/lib/supabase/server';
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

export async function listImagingOrders(
  orgId: string,
  patientId: string,
): Promise<ImagingOrderRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('imaging_orders')
    .select('id, patient_id, modality, body_site, ordered_at, status, notes, source')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('ordered_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listImagingOrders failed: ${error.message}`);
  return (
    (data ?? []) as Array<{
      id: string;
      patient_id: string;
      modality: string;
      body_site: string | null;
      ordered_at: string;
      status: ImagingOrderStatus;
      notes: string | null;
      source: ImagingSource;
    }>
  ).map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    modality: row.modality,
    bodySite: row.body_site,
    orderedAt: row.ordered_at,
    status: row.status,
    notes: row.notes,
    source: row.source,
  }));
}

export async function listImagingResults(
  orgId: string,
  patientId: string,
): Promise<ImagingResultRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('imaging_results')
    .select('id, order_id, impression, resulted_at, source, imaging_orders(modality), documents(filename)')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('resulted_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listImagingResults failed: ${error.message}`);
  return (
    (data ?? []) as Array<{
      id: string;
      order_id: string;
      impression: string;
      resulted_at: string;
      source: ImagingSource;
      imaging_orders: { modality: string } | null;
      documents: { filename: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    orderModality: row.imaging_orders?.modality ?? null,
    impression: row.impression,
    resultedAt: row.resulted_at,
    source: row.source,
    documentName: row.documents?.filename ?? null,
  }));
}
