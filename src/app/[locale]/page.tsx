"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { isLocale, t, type Locale } from "@/i18n/routing";
import AppFrame from "@/components/ui/AppFrame";
import NotchHeader from "@/components/ui/NotchHeader";
import PrimaryPillTabs, { type PrimaryPillTabItem } from "@/components/ui/PrimaryPillTabs";
import SecondaryPillRow from "@/components/ui/SecondaryPillRow";
import ModuleSurface from "@/components/ui/ModuleSurface";
import Chip from "@/components/ui/Chip";
import AccentNode from "@/components/ui/AccentNode";
import DarkScrubber from "@/components/ui/DarkScrubber";
import StatusLabel from "@/components/ui/StatusLabel";
import {
  CalendarIcon,
  DocumentIcon,
  FlaskIcon,
  PulseIcon,
  type IconComponent,
} from "@/components/ui/icons";

/*
 * Locale shell — a COMPOSITION DEMO for the primitives, not a clinical screen.
 *
 * No patient data, no auth, no data access, no product copy. Plan 01-05 replaces this with
 * the full design gallery; this route exists so the primitives are exercised in a real route
 * tree and the locale-driven markup is verifiable end to end.
 *
 * It is a Client Component because PrimaryPillTabs and SecondaryPillRow take handlers, and a
 * Server Component cannot pass a function — or an icon component — across that boundary.
 * Direction is NOT derived here: `src/app/[locale]/layout.tsx` stays a Server Component and
 * resolves `lang`/`dir` on the server, so first paint is correct in Arabic.
 *
 * Labels resolve through the `t(locale, en, ar)` helper from Plan 01-02 rather than a
 * message-catalog library: Phase 1 has no real strings, and inline pairs are correct until
 * Phase 4 ships product copy.
 */

const SECTIONS: readonly { id: string; en: string; ar: string; icon: IconComponent }[] = [
  { id: "dynamics", en: "Treatment Dynamics", ar: "ديناميكية العلاج", icon: PulseIcon },
  { id: "visits", en: "Visits", ar: "الزيارات", icon: DocumentIcon },
  { id: "labs", en: "Labs", ar: "التحاليل", icon: FlaskIcon },
];

const FILTERS: readonly { id: string; en: string; ar: string }[] = [
  { id: "office", en: "Office Visits", ar: "زيارات المكتب" },
  { id: "medications", en: "Medications", ar: "الأدوية" },
  { id: "labs", en: "Labs", ar: "التحاليل" },
];

export default function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = use(params);
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const sections: PrimaryPillTabItem[] = SECTIONS.map(({ id, en, ar, icon }) => ({
    id,
    label: t(locale, en, ar),
    icon,
  }));

  return (
    <AppFrame>
      <div className="flex flex-col gap-3">
        <NotchHeader title={t(locale, "Cardiology", "أمراض القلب")} />

        <h1 className="sr-only">{t(locale, "Clinical Patient Workspace", "مساحة المريض السريرية")}</h1>

        <div className="rounded-module bg-canvas p-4">
          <div className="flex flex-col gap-4">
            <PrimaryPillTabs items={sections} activeId="dynamics" onChange={() => {}} />
            <SecondaryPillRow
              items={FILTERS.map(({ id, en, ar }) => ({ id, label: t(locale, en, ar) }))}
              activeId="office"
              onChange={() => {}}
              filter={{ label: t(locale, "Filter", "تصفية"), pressed: false, onToggle: () => {} }}
            />
          </div>
        </div>

        <ModuleSurface title={t(locale, "Blood Pressure", "ضغط الدم")}>
          <div className="flex flex-wrap items-center gap-3">
            <Chip icon={CalendarIcon} label={t(locale, "Visit", "زيارة")} meta="—" />
            <StatusLabel>{t(locale, "No data recorded", "لا توجد بيانات مسجلة")}</StatusLabel>
            <AccentNode />
            <DarkScrubber windowStart={20} windowWidth={40} />
          </div>
        </ModuleSurface>
      </div>
    </AppFrame>
  );
}