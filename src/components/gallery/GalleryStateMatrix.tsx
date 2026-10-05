"use client";

import { GallerySection } from "./GallerySection";
import { t, type Locale } from "@/i18n/routing";
import AppFrame from "@/components/ui/AppFrame";
import NotchHeader from "@/components/ui/NotchHeader";
import PrimaryPillTabs, { type PrimaryPillTabItem } from "@/components/ui/PrimaryPillTabs";
import SecondaryPillRow, { type SecondaryPillItem } from "@/components/ui/SecondaryPillRow";
import CircularIconButton from "@/components/ui/CircularIconButton";
import Chip from "@/components/ui/Chip";
import ModuleSurface from "@/components/ui/ModuleSurface";
import StatusLabel from "@/components/ui/StatusLabel";
import DarkScrubber from "@/components/ui/DarkScrubber";
import AccentNode from "@/components/ui/AccentNode";
import {
  AllergyIcon,
  CalendarIcon,
  ChevronIcon,
  CloseIcon,
  DnaIcon,
  DocumentIcon,
  FlaskIcon,
  HeartIcon,
  LungsIcon,
  MinusIcon,
  PillIcon,
  PlusIcon,
  PulseIcon,
  SearchIcon,
  ThermometerIcon,
  type IconComponent,
} from "@/components/ui/icons";

/*
 * GalleryStateMatrix — every primitive in src/components/ui/ rendered in every state
 * (FND-07). This is a PRIMITIVE CATALOG, not a clinical screen: the cells carry type
 * specimens and neutral labels only. No patient name, no result value, no diagnosis —
 * clinical content arrives in Phase 4.
 *
 * WHY THIS FILE IS A CLIENT COMPONENT: PrimaryPillTabs, SecondaryPillRow,
 * CircularIconButton and NotchHeader are client primitives that take handlers, and a
 * Server Component cannot pass a function across the boundary. The gallery ROUTE
 * (src/app/[locale]/design-gallery/page.tsx) stays a Server Component; the client
 * boundary starts here.
 *
 * WHY EVERY CELL IS STATIC: the active pill, the pressed filter and the disabled button
 * are rendered as fixed props, never as React state. Interactivity would make the
 * Playwright baselines depend on interaction order, and nothing here is volatile — there
 * is no timer, no counter, and no date formatting anywhere in this file, because a single
 * changing character would invalidate every baseline on every run.
 */

const ICON_SET: readonly { name: string; Icon: IconComponent }[] = [
  { name: "CloseIcon", Icon: CloseIcon },
  { name: "SearchIcon", Icon: SearchIcon },
  { name: "PulseIcon", Icon: PulseIcon },
  { name: "DocumentIcon", Icon: DocumentIcon },
  { name: "PillIcon", Icon: PillIcon },
  { name: "FlaskIcon", Icon: FlaskIcon },
  { name: "AllergyIcon", Icon: AllergyIcon },
  { name: "DnaIcon", Icon: DnaIcon },
  { name: "HeartIcon", Icon: HeartIcon },
  { name: "LungsIcon", Icon: LungsIcon },
  { name: "ThermometerIcon", Icon: ThermometerIcon },
  { name: "CalendarIcon", Icon: CalendarIcon },
  { name: "ChevronIcon", Icon: ChevronIcon },
  { name: "PlusIcon", Icon: PlusIcon },
  { name: "MinusIcon", Icon: MinusIcon },
];

/**
 * A cell caption plus its primitive. The caption is neutral wording for the STATE, never
 * sample content — "disabled", "pressed", "inset".
 */
function Cell({ state, children }: { state: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-label text-ink-muted">{state}</span>
      {children}
    </div>
  );
}

export function GalleryStateMatrix({ locale }: { locale: Locale }) {
  const primaryTabs: PrimaryPillTabItem[] = [
    { id: "one", label: t(locale, "Label", "تسمية") },
    { id: "two", label: t(locale, "Label", "تسمية"), icon: CalendarIcon },
    { id: "three", label: t(locale, "Label", "تسمية"), icon: DocumentIcon },
  ];

  const secondaryPills: SecondaryPillItem[] = [
    { id: "one", label: t(locale, "Label", "تسمية") },
    { id: "two", label: t(locale, "Label", "تسمية") },
    { id: "three", label: t(locale, "Label", "تسمية") },
  ];

  return (
    <div className="flex flex-col gap-[var(--space-8)]">
      <GallerySection
        id="frame"
        title={t(locale, "AppFrame", "إطار التطبيق")}
        description={t(
          locale,
          "The accent outer field with the olive rounded frame inset inside it.",
          "الحقل الخارجي المميز مع الإطار الزيتي المستدير داخله.",
        )}
      >
        {/* WHY `fill={false}`: the specimen embeds AppFrame INSIDE this section, which
            already sits in a flex-wrap row. With the page-level `min-h-dvh` inherited,
            the accent field became a full-viewport-tall element squeezed to its content
            width — a narrow lime stripe, not a frame. The specimen opts out of the fill and
            takes its height from the content stack below instead.
            WHY `w-full` ON THE ROW ITEM ITSELF: the section's children row is `flex-wrap`,
            so an item without an explicit width shrinks to its content. `w-full` is set on
            the row item, not on a wrapper inside `Cell` — a percentage width inside a
            shrink-to-fit cell resolves to `auto` and stays narrow.
            WHY A FIXED HEIGHT: `h-72` is Tailwind's spacing scale (--spacing = 0.25rem), not
            a new pixel literal, and keeps the specimen deterministic for the baselines.
            WHY NOT `Cell`: `Cell` is a shrink-to-fit caption column; the frame specimen has
            to own the full section width, so it repeats the caption markup at row-item
            level instead of nesting inside a narrow cell. */}
        <div className="flex w-full flex-col items-start gap-2">
          <span className="text-label text-ink-muted">
            {t(locale, "bounded size", "بحجم محدود")}
          </span>
          <div className="w-full">
            <AppFrame fill={false}>
              <div className="flex h-72 flex-col gap-[var(--space-3)]">
                <NotchHeader title={t(locale, "Aa", "أب")} />
                <ModuleSurface title={t(locale, "Aa", "أب")}>
                  <p className="text-body text-start text-ink">{t(locale, "Aa", "أب")}</p>
                </ModuleSurface>
              </div>
            </AppFrame>
          </div>
        </div>
      </GallerySection>

      <GallerySection
        id="notch-header"
        title={t(locale, "NotchHeader", "رأس الفتحة")}
        description={t(
          locale,
          "Title tab breaking out of the olive bar, with the circular close control.",
          "علامة العنوان البارزة من الشريط الزيتية مع زر الإغلاق الدائري.",
        )}
      >
        <Cell state={t(locale, "default", "افتراضي")}>
          <div className="w-full overflow-hidden rounded-module">
            <NotchHeader title={t(locale, "Aa", "أب")} onClose={() => {}} />
          </div>
        </Cell>
        <Cell state={t(locale, "without close handler", "بدون معالج إغلاق")}>
          <div className="w-full overflow-hidden rounded-module">
            <NotchHeader title={t(locale, "Aa", "أب")} />
          </div>
        </Cell>
      </GallerySection>

      <GallerySection
        id="primary-tabs"
        title={t(locale, "PrimaryPillTabs", "التبويبات الأولية")}
        description={t(
          locale,
          "Capsule tab group; the active pill is raised, never accent-filled.",
          "مجموعة تبويبات كبسولية؛ التبويب النشط مرفوع وليس معبأ باللون المميز.",
        )}
      >
        <Cell state={t(locale, "default (first active)", "افتراضي (الأول نشط)")}>
          <PrimaryPillTabs items={primaryTabs} activeId="one" onChange={() => {}} />
        </Cell>
        <Cell state={t(locale, "second item active", "العنصر الثاني نشط")}>
          <PrimaryPillTabs items={primaryTabs} activeId="two" onChange={() => {}} />
        </Cell>
      </GallerySection>

      <GallerySection
        id="secondary-pills"
        title={t(locale, "SecondaryPillRow", "الصف الثانوي")}
        description={t(
          locale,
          "Smaller capsule row plus the filter toggle at the inline end.",
          "صف كبسولات أصغر مع زر التصفية في نهاية السطر.",
        )}
      >
        <Cell state={t(locale, "default", "افتراضي")}>
          <SecondaryPillRow
            items={secondaryPills}
            activeId="one"
            onChange={() => {}}
            filter={{ label: t(locale, "Filter", "تصفية"), pressed: false, onToggle: () => {} }}
          />
        </Cell>
        <Cell state={t(locale, "filter toggle pressed", "زر التصفية مضغوط")}>
          <SecondaryPillRow
            items={secondaryPills}
            activeId="one"
            onChange={() => {}}
            filter={{ label: t(locale, "Filter", "تصفية"), pressed: true, onToggle: () => {} }}
          />
        </Cell>
      </GallerySection>

      <GallerySection
        id="icon-button"
        title={t(locale, "CircularIconButton", "زر الأيقونة الدائري")}
        description={t(
          locale,
          "Round icon-only control; `label` supplies the accessible name.",
          "زر دائري بالأيقونة فقط؛ يوفّر `label` الاسم الذي يقرأه قارئ الشاشة.",
        )}
      >
        <Cell state={t(locale, "default", "افتراضي")}>
          <CircularIconButton icon={CloseIcon} label={t(locale, "Label", "تسمية")} onClick={() => {}} />
        </Cell>
        <Cell state={t(locale, "disabled", "معطّل")}>
          <CircularIconButton
            icon={CloseIcon}
            label={t(locale, "Label", "تسمية")}
            onClick={() => {}}
            disabled
          />
        </Cell>
      </GallerySection>

      <GallerySection
        id="chip"
        title={t(locale, "Chip", "شارة")}
        description={t(
          locale,
          "Capsule with an optional line icon and optional meta text.",
          "كبسولة مع أيقونة خط اختيارية ونص وصف اختياري.",
        )}
      >
        <Cell state={t(locale, "label only", "تسمية فقط")}>
          <Chip icon={CalendarIcon} label={t(locale, "Label", "تسمية")} />
        </Cell>
        <Cell state={t(locale, "label + meta", "تسمية + وصف")}>
          <Chip icon={CalendarIcon} label={t(locale, "Label", "تسمية")} meta="—" />
        </Cell>
      </GallerySection>

      <GallerySection
        id="module"
        title={t(locale, "ModuleSurface", "سطح الوحدة")}
        description={t(
          locale,
          "Raised rounded card and its inset well; the shadow stays restrained.",
          "بطاقة مستديرة مرفوعة وبئرها الداخلية؛الظل يبقى خافتاً.",
        )}
      >
        <Cell state='tone="default"'>
          <div className="w-full">
            <ModuleSurface title={t(locale, "Aa", "أب")}>
              <p className="text-body text-start text-ink">{t(locale, "Aa", "أب")}</p>
            </ModuleSurface>
          </div>
        </Cell>
        <Cell state='tone="inset"'>
          <div className="w-full">
            <ModuleSurface tone="inset" title={t(locale, "Aa", "أب")}>
              <p className="text-body text-start text-ink">{t(locale, "Aa", "أب")}</p>
            </ModuleSurface>
          </div>
        </Cell>
      </GallerySection>

      <GallerySection
        id="status-label"
        title={t(locale, "StatusLabel", "وسم الحالة")}
        description={t(
          locale,
          "Neutral ink only. ref-A has no status colour; the critical variant stays an OWNER DECISION.",
          "حبر محايد فقط. لا يوجد لون حالة في المرجع؛تبقى النسخة الحرجة قراراً للمالك.",
        )}
      >
        <Cell state={t(locale, "neutral", "محايد")}>
          <StatusLabel>{t(locale, "Label", "تسمية")}</StatusLabel>
        </Cell>
        <Cell state={t(locale, "critical marker (text only)", "علامة حرجة (نص فقط)")}>
          <StatusLabel tone="critical">{t(locale, "Label", "تسمية")}</StatusLabel>
        </Cell>
      </GallerySection>

      <GallerySection
        id="dark-scrubber"
        title={t(locale, "DarkScrubber", "شريط التمرير الداكن")}
        description={t(
          locale,
          "Near-black band with a lighter visible window, positioned on the inline axis.",
          "شريط أسود مع نافذة أفتح، موضعة على المحور الأفقي.",
        )}
      >
        <Cell state={t(locale, "without window", "بدون نافذة")}>
          <div className="w-full">
            <DarkScrubber windowStart={0} windowWidth={0} />
          </div>
        </Cell>
        <Cell state={t(locale, "with visible window band", "مع نافذة ظاهرة")}>
          <div className="w-full">
            <DarkScrubber windowStart={20} windowWidth={40} />
          </div>
        </Cell>
      </GallerySection>

      <GallerySection
        id="accent-node"
        title={t(locale, "AccentNode", "عقدة التمييز")}
        description={t(
          locale,
          "The single lime circle; size is the only variable.",
          "الدائرة اللونية الوحيدة؛الحجم هو المتغير الوحيد.",
        )}
      >
        <Cell state={t(locale, "default size", "الحجم الافتراضي")}>
          <AccentNode />
        </Cell>
        <Cell state={t(locale, "small", "صغير")}>
          <AccentNode size={10} />
        </Cell>
      </GallerySection>

      <GallerySection
        id="icons"
        title={t(locale, "Line icons", "أيقونات الخط")}
        description={t(
          locale,
          "The single-stroke icon set at its default size.",
          "مجموعة الأيقونات أحادية الخط بالحجم الافتراضي.",
        )}
      >
        {ICON_SET.map(({ name, Icon }) => (
          <Cell key={name} state={name}>
            <span className="text-ink-strong">
              <Icon />
            </span>
          </Cell>
        ))}
      </GallerySection>
    </div>
  );
}

export default GalleryStateMatrix;