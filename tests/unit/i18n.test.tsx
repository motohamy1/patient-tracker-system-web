import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import { defaultLocale, directionOf, isLocale, locales, t, type Locale } from "@/i18n/routing";

/**
 * Minimal primitive-shaped component: it takes a locale and renders the localized
 * label plus the server-resolved direction, exactly as src/app/[locale]/layout.tsx
 * will in Plan 01-03. This proves Arabic text and RTL direction travel together.
 */
function LocaleLabel({ locale }: { locale: Locale }) {
  return (
    <span lang={locale} dir={directionOf(locale)}>
      {t(locale, 'Design gallery', 'معرض التصميم')}
    </span>
  );
}

function renderToDom(node: React.ReactElement): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  const element = container.firstElementChild as HTMLElement;
  act(() => {
    root.unmount();
  });
  container.remove();
  return element;
}

describe("locale foundation (locked decision D1)", () => {
  it("supports exactly English and Arabic", () => {
    expect(locales).toEqual(['en', 'ar']);
  });

  it("defaults to English", () => {
    expect(defaultLocale).toBe('en');
  });

  it("maps Arabic to rtl and English to ltr", () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('en')).toBe('ltr');
  });

  it("narrows only the two supported locales", () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('')).toBe(false);
  });

  it("selects the inline label pair by locale", () => {
    expect(t('ar', 'Design gallery', 'معرض التصميم')).toBe('معرض التصميم');
    expect(t('en', 'Design gallery', 'معرض التصميم')).toBe('Design gallery');
  });

  it("renders the Arabic label and an rtl direction together (FND-06)", () => {
    const element = renderToDom(<LocaleLabel locale="ar" />);

    expect(element.textContent).toBe('معرض التصميم');
    expect(element.getAttribute('dir')).toBe('rtl');
    expect(element.getAttribute('lang')).toBe('ar');
  });

  it("renders the English label and an ltr direction together", () => {
    const element = renderToDom(<LocaleLabel locale="en" />);

    expect(element.textContent).toBe('Design gallery');
    expect(element.getAttribute('dir')).toBe('ltr');
    expect(element.getAttribute('lang')).toBe('en');
  });
});