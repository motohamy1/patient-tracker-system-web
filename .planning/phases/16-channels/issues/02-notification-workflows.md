# 16-02: Notification workflows through the unified model

**What to build:** Real events notify the patient through the unified conversation: a message from the care team, an assigned care task and a scheduled appointment each produce an out-of-band notification to the patient's active channels, recorded as a delivery row against the exact message that triggered it. Nothing arrives out of nowhere — every notification is traceable to a message in the thread.

**Blocked by:** 16-01 (the channel layer)

**Status:** resolved

- [x] A pure `composeNotification(message, patient)` that renders the short channel-safe text from an EXISTING conversation message (no clinical prose leaks into a channel; the message body is the source of truth)
- [x] A `notifyChannels` step invoked after a conversation message is sent (and when a care task is assigned, composing the task's message into the thread first) — it resolves the patient's ACTIVE endpoints for the channel, calls the adapter, and writes one `notification_deliveries` row per attempt with its status
- [x] Delivery states are honest end to end: `not_configured` when no credentials exist (the surface says so, no phantom), `delivered` with the provider reference, `failed` with the reason
- [x] Permissions ride the unified model: the workflow never crosses the org boundary (guards re-derive), a patient cannot trigger a notification, and a channel send is impossible without a message in a real conversation (CHAN-03)
- [x] Failures are non-blocking for the in-app message (the thread still records the message) but are recorded and visible — the delivery log is the truth, not a silent drop

**Gate evidence at close:** CHAN-01/02 (both channels deliver) · CHAN-03 · §15

## Notes

- The notification content is derived from the message, so the channel can never say something the thread does not — one story, two transports.
