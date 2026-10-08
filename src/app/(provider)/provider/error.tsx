'use client';

// src/app/(provider)/provider/error.tsx — the /provider error baseline
// (UX-01; D-20; 04-UI-SPEC §4.7).
//
// `'use client'` is required: a route `error.tsx` is a React error BOUNDARY
// and a boundary must live on the client. It renders the shared `StateVariant`
// (never per-page markup) so the copy is the §7 contract verbatim —
// "Couldn't load patients. Check your connection and try again." plus the
// "Try again" action — and the retry re-runs the server tree via
// `router.refresh()` and clears the boundary with the boundary's own `reset`.
// The `EmptyState STAYS rendered while a retry is in flight: never a blank
// swap between states (03-UI-SPEC §8.5).
import { useRouter } from 'next/navigation';
import { StateVariant } from '@/components/state/StateVariant';

export default function ProviderError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <StateVariant
      surface="patients"
      onRetry={() => {
        router.refresh();
        reset();
      }}
    />
  );
}
