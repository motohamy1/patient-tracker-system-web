// src/lib/ocr/provider.ts — the OCR/vision provider adapter (Phase 12,
// OCR-04; the STACK.md `OcrProvider` pattern).
//
// The pipeline never talks to a vision API directly: it asks the registry for
// a provider and calls `extract`. A later Google Document AI / Azure adapter
// implements this one interface and registers itself; the pipeline, the table
// and the verification surface do not change.
//
// THE DEFAULT PROVIDER IS HONEST: with no provider configured it returns ZERO
// fields and says why. It never simulates recognition — a fabricated "OCR
// result" would be worse than no result, because the clinician would be
// verifying fiction (§11, §27). The clinician transcribes from the original
// image, which the surface always shows beside the fields.
import type { ExtractedField, ExtractionPayload } from '@/lib/ocr/status';

export type ExtractionRequest = {
  documentId: string;
  storagePath: string;
  mimeType: string | null;
};

export type ExtractionResult = {
  provider: string;
  fields: readonly ExtractedField[];
  /** Why no fields were produced, when none were (shown verbatim to the user). */
  reason?: string;
};

export interface OcrProvider {
  /** A stable, human-readable identifier stored on the extraction row. */
  readonly id: string;
  extract(request: ExtractionRequest): Promise<ExtractionResult>;
}

/**
 * The no-provider-configured implementation: zero fields, an explicit reason.
 * The extraction row still moves through the pipeline and the clinician still
 * verifies against the original image — nothing is skipped, nothing is faked.
 */
export const noProvider: OcrProvider = {
  id: 'none',
  async extract() {
    return {
      provider: 'none',
      fields: [],
      reason:
        'No extraction provider is configured for this workspace, so nothing was read from the image. Transcribe the prescription from the original on the left; every field you confirm is your own.',
    };
  },
};

/**
 * The provider registry. A configured provider is selected by id (from server
 * configuration when one exists); absent that, the honest no-provider result.
 */
const PROVIDERS: Map<string, OcrProvider> = new Map([[noProvider.id, noProvider]]);

export function getProvider(id?: string | null): OcrProvider {
  if (id !== undefined && id !== null && PROVIDERS.has(id)) {
    return PROVIDERS.get(id) as OcrProvider;
  }
  return noProvider;
}

/** Register an adapter (a later integration point, OCR-04). */
export function registerProvider(provider: OcrProvider): void {
  PROVIDERS.set(provider.id, provider);
}

/** Shape guard for a stored payload (the 0011 envelope check, typed). */
export function isExtractionPayload(value: unknown): value is ExtractionPayload {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as { provider?: unknown; fields?: unknown };
  return typeof payload.provider === 'string' && Array.isArray(payload.fields);
}
