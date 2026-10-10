# 16-01: Channel endpoints, adapters and the delivery record

**What to build:** The channel layer under the unified conversation: a patient's reachable channels (WhatsApp number, Telegram handle), a pluggable adapter interface, and an append-only record of every out-of-band delivery attempt. Each adapter is honest about being unconfigured — no fake delivery, ever.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `channel_endpoints` table: org/patient FKs, `channel` (`whatsapp` | `telegram`), the external handle (phone number / chat id), `status` (`active` | `inactive`), timestamps; a unique (patient, channel, handle) index; RLS staff-managed (provider_doctor + nurse write, all staff read), no patient write
- [x] A `ChannelAdapter` interface + registry (the 0014 seam's implementation half): `deliver({ handle, body }) → { delivered: boolean; reference?: string; reason?: string }` — a real API call lives behind it
- [x] The no-credentials adapter returns delivered=false with an explicit reason — never a simulated success (§27, the Phase-12 no-provider precedent)
- [x] `notification_deliveries` table (append-only): conversation + message FKs, channel, handle, status (`delivered` | `not_configured` | `failed`), provider reference, reason, timestamps — the CHAN-03 audit trail proving which patient/org each send belonged to
- [x] The adapter path is server-side only (secrets never reach the client; the capability check runs before any deliver call); guards re-derive org/patient from the session
- [x] `database.types.ts` gains both tables (hand-maintained until CLI regeneration)

**Gate evidence at close:** CHAN-01/02 (the adapter architecture for both channels) · CHAN-03 (attribution) · §15 · §12

## Notes

- Adapters are per-channel and interchangeable: Telegram and WhatsApp implement the same interface, and a provider swap is a registry change, not a schema change.
- The endpoint is the patient's own contact handle, recorded by staff — the adapter never guesses a destination.
