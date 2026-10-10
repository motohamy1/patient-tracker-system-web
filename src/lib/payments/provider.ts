// src/lib/payments/provider.ts — the payment provider interface and registry
// (Phase 18, PAY-03; the Phase-16 channel-adapter precedent).
//
// A provider is a capture transport: given an amount and a reference, it
// captures and reports what happened. The DEFAULT implementation is honest —
// with no credentials configured it returns captured=false with an explicit
// reason, and the workflow records a `not_configured` payment row. A
// simulated settlement is forbidden (§27, the Phase-12 no-provider
// precedent). A real PSP (Stripe and peers) drops in behind the same
// interface; nothing else in the product changes.
import type { PaymentStatus } from '@/lib/payments/status';

export type CaptureRequest = {
  amountMinor: number;
  currency: string;
  /** The invoice id the capture belongs to (the provider's idempotency key). */
  invoiceId: string;
};

export type CaptureResult = {
  captured: boolean;
  providerReference?: string;
  reason?: string;
  /** When not captured, WHY — so the payment row can be honest. */
  failure?: PaymentStatus;
};

export interface PaymentProvider {
  readonly id: string;
  capture(request: CaptureRequest): Promise<CaptureResult>;
}

function unconfiguredProvider(): PaymentProvider {
  return {
    id: 'none',
    async capture() {
      return {
        captured: false,
        failure: 'not_configured' as const,
        reason:
          'No payment provider is connected to this workspace, so nothing was captured and the invoice is still awaiting payment.',
      };
    },
  };
}

let provider: PaymentProvider = unconfiguredProvider();

export function getPaymentProvider(): PaymentProvider {
  return provider;
}

/** Register a configured provider (a later integration point, PAY-03). */
export function registerPaymentProvider(next: PaymentProvider): void {
  provider = next;
}
