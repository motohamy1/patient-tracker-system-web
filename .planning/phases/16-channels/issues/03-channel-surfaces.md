# 16-03: Channel surfaces — endpoints, badges and delivery state

**What to build:** The channel layer made visible without adding tabs: a patient's reachable channels appear in their context (staff-managed), every out-of-band message carries its channel badge, and the delivery state is shown where a clinician would ask "did it arrive?" — with `not_configured` stated plainly rather than disguised.

**Blocked by:** 16-02 (the workflows)

**Status:** resolved

- [x] A patient-context channel control (in the provider workspace's context surface, not a tab): list the patient's endpoints, add/remove one, mark inactive — staff-only, Zod-validated, capability-checked
- [x] The thread renders each message's channel when it is not `in_app` (the badge is the label, never a guess) alongside the sender and time
- [x] A message's delivery rows render under it: delivered (with reference), not configured (with the plain explanation), failed (with the reason) — attributable and quiet, no animation, no color noise
- [x] The patient's side is unchanged: patients read their thread; channel configuration is a staff responsibility (the endpoint is contact data, not a patient write surface)
- [x] Empty/error states per region (§24); mobile keeps the same controls (§26)

**Gate evidence at close:** CHAN-01/02/03 (the visible proof of both channels) · §15 · §24/§26

## Notes

- The "not configured" state is the honest default of this phase: the adapters ship ready, the credentials are the owner's to supply (the §8 gate brief asks).
