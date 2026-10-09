# 07-02: Visit scheduling — receptionist-permitted, clinically blind

**What to build:** Front-desk scheduling and registration without clinical authoring: a receptionist (or any scheduler) can create a visit for a patient, set its schedule/type/location, and see the visit — but cannot write clinical documentation, reason or follow-up. The limit is enforced in the database (a role-aware trigger), re-checked in the server action, and reflected in the UI by hiding fields the role cannot write.

**Blocked by:** 07-01

**Status:** ready-for-agent

- [ ] `createVisitAction` parses with Zod, requires the `CAN_SCHEDULE` capability server-side, inserts only scheduling fields, and returns a typed result (never throws for expected failures)
- [ ] A DB trigger rejects a clinical-field write by a role without `CAN_AUTHOR_CLINICAL` (raise `visit_clinical_forbidden`) — the §3.1/§12 server-side enforcement, not a UI-only guard
- [ ] A receptionist creating a visit leaves `reason`/`documentation`/`follow_up*` null; the UI does not render those fields for them
- [ ] A receptionist cannot advance a visit into/through documentation stages in a way that writes clinical content — the stage move that captures documentation is gated on `CAN_AUTHOR_CLINICAL`
- [ ] The patient must belong to the actor's org: an org-scoped guard on insert (definer trigger raising on mismatch, 0005's invite-link pattern)
- [ ] UI entry point: "New visit" control on the patient's Visits tab, visible only to schedulers (no dead control for a non-scheduler)

**Gate evidence at close:** VIS-03 · §3.2 (authorization-aware entry) · AUTH-05 capability gate · §24 states
