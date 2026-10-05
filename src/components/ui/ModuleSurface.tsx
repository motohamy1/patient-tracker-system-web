import type { ReactNode } from "react";

/**
 * ModuleSurface — ref-A's raised rounded card (Blood Pressure / Symptoms / ECG cards).
 *
 * The shadow is `--shadow-module`, which is an OWNER DECISION value: ref-A's shadow depth
 * cannot be sampled from a raster. It starts deliberately restrained and must be tuned
 * DOWN, never up, during visual approval. Neumorphism and glassmorphism stay banned.
 */
export default function ModuleSurface({
  title,
  children,
  tone = "default",
}: {
  title?: string;
  children: ReactNode;
  tone?: "default" | "inset";
}) {
  return (
    <section
      className={[
        "rounded-module p-6 shadow-module",
        tone === "default" ? "bg-surface" : "bg-surface-muted",
      ].join(" ")}
    >
      {title ? <h2 className="mb-4 text-heading font-semibold text-ink-strong">{title}</h2> : null}
      {children}
    </section>
  );
}