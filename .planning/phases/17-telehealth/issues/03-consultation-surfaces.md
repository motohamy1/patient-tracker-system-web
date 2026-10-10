# 17-03: The consultation surfaces

**What to build:** The clinician's consultation surface and the patient's join surface, both integrated with what exists: the clinical workspace stays reachable during the call, and nothing invents a video product.

**Blocked by:** 17-02 (the workflow)

**Status:** resolved

- [x] `/provider/consultations` — today's telehealth appointments with their session state and a Start/Continue entry per row (a doctor without clinical authoring sees them read-only, no dead controls)
- [x] `/provider/consultations/[visitId]` — the consultation workspace: the session state, the honest transport panel (not connected — what it takes to connect), the patient context beside it, and direct links into the patient's clinical workspace tabs so the record stays usable during the call (TH-01)
- [x] The visit detail surface gains its telehealth entry (status + the consultation link) without becoming a second workflow
- [x] `/patient/consultation` — the patient's own active consultation with its join reference; the patient never sees staff surfaces or ids beyond their own session
- [x] The patient Home's Appointments region marks a consultation that is in progress with a link to join (no new region, no clinical data added)
- [x] Empty/loading/error/denied states per surface (§24); mobile keeps the same controls (§26)

**Gate evidence at close:** TH-01 (the workspace stays visible) · TH-02 (no Zoom clone: the surface is a consultation, not a video product) · §26

## Notes

- "Not a generic Zoom clone" is honoured structurally: the center of the surface is the patient and the record, and the transport is one honest panel.
