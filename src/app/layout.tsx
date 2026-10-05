import "./globals.css";

/**
 * Root layout is a `{children}` PASSTHROUGH. It deliberately emits no document element:
 * the locale layout (`src/app/[locale]/layout.tsx`) owns the document element with its
 * `lang` and `dir` attributes, because direction and language are per-locale and must be
 * resolved on the server. Next still requires an ancestor layout chain for every route —
 * including the `/` redirect — so this file stays, it simply renders nothing but children.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}