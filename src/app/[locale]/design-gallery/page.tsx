import { notFound } from "next/navigation";
import { isLocale, locales, t } from "@/i18n/routing";
import { Fade } from "@/components/motion/motion-primitives";
import { GalleryStateMatrix } from "@/components/gallery/GalleryStateMatrix";
import AppFrame from "@/components/ui/AppFrame";
import NotchHeader from "@/components/ui/NotchHeader";

/*
 * Design gallery route (FND-07) — the artifact the owner visually approves against ref-A.
 *
 * A PRIMITIVE CATALOG, deliberately not a clinical screen. Cells carry type specimens and
 * neutral labels only; clinical content arrives in Phase 4, when there is real data to show.
 *
 * SERVER COMPONENT on purpose, with NO client-side direction toggle: `dir` is resolved on
 * the server in src/app/[locale]/layout.tsx from the `[locale]` segment. A toggle would make
 * each direction non-deterministic for the Playwright visual suite.
 *
 * ZERO backend calls — no auth, no Supabase, no data fetching — so the visual suite stays
 * deterministic and this route renders in a fully static build.
 *
 * AppFrame is not decoration here: "olive frame on the lime field with a notch header" is
 * the composition under test (FND-03), so the gallery must be viewed inside the real frame.
 */

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** An unknown locale 404s at build time instead of rendering an unstyled page. */
export const dynamicParams = false;

export default async function DesignGalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <AppFrame>
      <div className="flex flex-col gap-3">
        <NotchHeader title={t(locale, "Design gallery", "معرض التصميم")} />
        {/* Fade demonstrates the sanctioned motion layer. No autoplay and no looping
            animation: Playwright captures infinite animations at their initial frame. */}
        <Fade>
          <main className="flex flex-col gap-8 rounded-module bg-canvas p-4">
            <GalleryStateMatrix locale={locale} />
          </main>
        </Fade>
      </div>
    </AppFrame>
  );
}