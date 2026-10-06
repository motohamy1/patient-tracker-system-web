// The single enumeration of the eight patient-workspace tabs (D-01,
// PRODUCT-MASTER-SPEC.md §6). This file is the ONLY place the eight slugs,
// labels and icons are enumerated: `WorkspaceTopBar` renders its tab group from
// `WORKSPACE_TAB_ROUTES`, and the eight route folders under `[patientId]/` match
// these slugs by name, so a later phase fills a body without inventing a path.
//
// The `Vital Signs` and `Communication` entries visible in the reference image
// are sample content only: they never become route names, slugs or tab labels
// here. Vitals live inside Overview and Communication is a provider/profile
// surface, not a primary clinical tab (AGENTS.md §Navigation, Phase 001 D-13).
//
// `tabHref` is the one place the `[patientId]` route parameter is consumed, and
// it is used only to build a relative href — never a query, a filesystem path, a
// template, a log line or any interpreter (ASVS V5, T-02-52). The value is
// percent-encoded so it can never break out of the path segment.
import {
  CalendarDays,
  ChartLine,
  Dna,
  FlaskConical,
  LayoutDashboard,
  Pill,
  ScanLine,
  TriangleAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const WORKSPACE_TAB_ROUTES = [
  'overview',
  'ai-analytics',
  'visits',
  'medications',
  'labs',
  'imaging',
  'allergies',
  'genetics',
] as const;

export type WorkspaceTabSlug = (typeof WORKSPACE_TAB_ROUTES)[number];

/** The tab the bare workspace URL redirects to, so its active item is always defined. */
export const DEFAULT_TAB_SLUG: WorkspaceTabSlug = 'overview';

export const WORKSPACE_TAB_LABELS: Record<WorkspaceTabSlug, string> = {
  overview: 'Overview',
  'ai-analytics': 'AI Analytics',
  visits: 'Visits',
  medications: 'Medications',
  labs: 'Labs',
  imaging: 'Imaging',
  allergies: 'Allergies',
  genetics: 'Genetics',
};

export const WORKSPACE_TAB_ICONS: Record<WorkspaceTabSlug, LucideIcon> = {
  overview: LayoutDashboard,
  'ai-analytics': ChartLine,
  visits: CalendarDays,
  medications: Pill,
  labs: FlaskConical,
  imaging: ScanLine,
  allergies: TriangleAlert,
  genetics: Dna,
};

/** Build the href for one workspace tab from the route parameter. */
export function tabHref(patientId: string, slug: WorkspaceTabSlug = DEFAULT_TAB_SLUG): string {
  return `/provider/patients/${encodeURIComponent(patientId)}/${slug}`;
}
