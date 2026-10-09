// src/lib/labs/queries.ts — the Phase-9 lab read layer (RLS-scoped; bound
// predicates only). Results ride their order's name via the FK so the tab and
// the timeline label read truthfully without a second query.
import { createClient } from '@/lib/supabase/server';
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

export async function listLabOrders(orgId: string, patientId: string): Promise<LabOrderRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lab_orders')
    .select('id, patient_id, name, ordered_at, status, notes, source')
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('ordered_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listLabOrders failed: ${error.message}`);
  return (
    (data ?? []) as Array<{
      id: string;
      patient_id: string;
      name: string;
      ordered_at: string;
      status: LabOrderStatus;
      notes: string | null;
      source: LabSource;
    }>
  ).map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    orderedAt: row.ordered_at,
    status: row.status,
    notes: row.notes,
    source: row.source,
  }));
}

export async function listLabResults(
  orgId: string,
  patientId: string,
): Promise<LabResultRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lab_results')
    .select(
      'id, order_id, analyte, value, unit, reference_range, flag, resulted_at, source, lab_orders(name), documents(filename)',
    )
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('resulted_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listLabResults failed: ${error.message}`);
  return (
    (data ?? []) as Array<{
      id: string;
      order_id: string;
      analyte: string;
      value: number | null;
      unit: string | null;
      reference_range: string | null;
      flag: LabFlag | null;
      resulted_at: string;
      source: LabSource;
      lab_orders: { name: string } | null;
      documents: { filename: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    orderName: row.lab_orders?.name ?? null,
    analyte: row.analyte,
    value: row.value,
    unit: row.unit,
    referenceRange: row.reference_range,
    flag: row.flag,
    resultedAt: row.resulted_at,
    source: row.source,
    documentName: row.documents?.filename ?? null,
  }));
}
