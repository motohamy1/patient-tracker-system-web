# 09-03: Imaging lifecycle actions + media relationship

**What to build:** A clinician can order imaging (modality + body site), then record its impression; an imaging result may reference the document that carries the media, preserving the record↔media relationship.

**Blocked by:** 09-01

**Status:** resolved

- [ ] `orderImagingAction` (CAN_AUTHOR_CLINICAL) creates an imaging order
- [ ] `recordImagingResultAction` inserts the impression and flips the order to resulted; it may link `document_id` when a report/scan document exists
- [ ] The document link is integrity-checked to the SAME patient/org (definer guard), never a cross-patient reference
- [ ] Illegal moves rejected server-side with typed results
- [ ] No image viewer or media pipeline is built here — only the relationship (§19/§27: no scope creep)

**Gate evidence at close:** LAB-02 · §13 media relationship · AUTH-05
