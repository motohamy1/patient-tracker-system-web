import type { ReactNode } from "react";

/*
 * GallerySection — the labeled grouping the design gallery (FND-07) is built from.
 *
 * `data-gallery-section` is the contract, not a debugging aid: the Playwright spec
 * (tests/visual/design-gallery.spec.ts) asserts every section id by value, and a section
 * can be captured in isolation from the same attribute. The `id` is mirrored onto the DOM
 * so `page.locator('#chip')` and the attribute selector address the same node.
 *
 * Server-safe: no state, no handlers, no locale logic. Direction comes from the
 * server-resolved `<html dir>` in src/app/[locale]/layout.tsx.
 */
export function GallerySection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-gallery-section={id}
      className="flex flex-col gap-3 rounded-module bg-surface p-[var(--space-4)] shadow-module"
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-heading font-semibold text-start text-ink-strong">{title}</h2>
        {description ? <p className="text-label text-start text-ink-muted">{description}</p> : null}
      </header>
      <div className="flex flex-wrap items-center gap-[var(--space-3)]">{children}</div>
    </section>
  );
}