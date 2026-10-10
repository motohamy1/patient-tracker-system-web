# 17-02: The consultation workflow

**What to build:** Start, complete and cancel a consultation as server actions over the session record: starting moves the visit to During Visit, completing writes the visit documentation and moves it to After Visit, cancelling keeps the appointment with a recorded reason.

**Blocked by:** 17-01 (the session table)

**Status:** resolved

- [x] `startConsultationAction`: doctor-only, visit org-checked, creates the ACTIVE session and advances the visit to `during_visit`; a visit that already has an active session resumes it (returns the existing session, never a duplicate)
- [x] `completeConsultationAction`: doctor-only; closes the session (status `completed`) AND writes the visit's clinical block (reason/documentation/follow-up) through the same visit row a completed in-person visit uses — one encounter model, two rooms (TH-03)
- [x] `cancelConsultationAction`: doctor-only; cancels with a required reason; the appointment stays in the visit record with its history
- [x] Every action re-derives org/patient from the session (never the payload), parses with Zod first, returns typed results, revalidates the visit + consultation surfaces
- [x] Pure status helpers (`nextStatus`, transitions) in `status.ts` mirroring the SQL check byte-for-byte

**Gate evidence at close:** TH-01 · TH-03 · §3.1/§12

## Notes

- The visit stage transition reuses `advanceVisitStageAction`'s discipline: the server owns the sequence, the client never sends a stage.
