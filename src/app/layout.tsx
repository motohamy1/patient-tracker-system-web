// The ONLY root layout (D-02). It owns the html element, the body element, the Inter font variable
// and globals.css, and carries no role chrome: the (provider), (patient) and
// (auth) route-group layouts nest beneath it. A second top-level layout.tsx
// would make a /provider to /patient role switch a full document reload
// (02-RESEARCH.md Pattern 3, Pitfall 8).
import type { ReactNode } from 'react';
import { Familjen_Grotesk, IBM_Plex_Mono, IBM_Plex_Sans, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600'], // the two frozen weights only (tokens.json font.weight, D-20)
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', 'sans-serif'],
});

// The patient-detail reference (Paper "Xanthic honey" → Patient Overview) sets
// display type in Familjen Grotesk and the timeline's prose/figures in the two
// IBM Plex cuts. They load as CSS variables only — no element adopts a family
// implicitly — so every other surface keeps the Inter stack unchanged and a
// failed webfont falls back per-family instead of dropping the whole page.
const familjenGrotesk = Familjen_Grotesk({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-familjen',
  fallback: ['system-ui', 'sans-serif'],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-plex-sans',
  fallback: ['system-ui', 'sans-serif'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-plex-mono',
  fallback: ['ui-monospace', 'monospace'],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${familjenGrotesk.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      {/*
        suppressHydrationWarning on <body> is deliberate and load-bearing:
        browser extensions (Grammarly injects data-gr-ext-installed /
        data-new-gr-c-s-check-loaded, zoom extensions inject a body style) mutate
        <body> BEFORE React hydrates. React only reports that element's attribute
        diff, and it applies one level deep — child mismatches still surface.
      */}
      <body suppressHydrationWarning className="bg-canvas text-text-primary">
        {children}
      </body>
    </html>
  );
}
