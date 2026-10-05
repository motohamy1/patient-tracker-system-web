import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clinical Patient Workspace",
  description: "Foundation shell — design-system and i18n base.",
};

/**
 * Placeholder root layout. Plan 01-03 Task 3 replaces this with the
 * `src/app/[locale]/` structure that resolves `lang`/`dir` per locale.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}