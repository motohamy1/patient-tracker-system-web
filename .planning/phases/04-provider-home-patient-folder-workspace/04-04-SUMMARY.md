---
phase: 04-provider-home-patient-folder-workspace
plan: 04
subsystem: patient-entry-and-quick-actions
tags: [new-patient-modal, quick-actions, overlay, invite, topbar-cta]
requires:
  - 04-02 (createPatientAction, changePatientStatusAction, sendPatientInviteAction)
  - 04-03 (FolderCard slot + FolderGrid emptyAction + page body control row)
provides:
  - NewPatientControl (accentSoft CTA + Overlay form: 5 fields, Zod field errors, MRN helper line, success -> close + refresh, no navigation)
  - QuickActionsOverlay (three-dot iconOnly button outside the card link: Change status pill rows with aria-current, Send invite only when unlinked && canInvite with invite-confirm copy + link + short code, Schedule appointment aria-disabled + "Available with scheduling")
  - ProviderTopBar CTA enabled (D-16; the 02-UI-SPEC "Phase 004 owns its destination" comment fulfilled)
  - FolderGrid emptyAction (All-empty state carries "Add new patient" wired to the same modal)
  - mobile `md:hidden` NewPatientControl in the /provider body control row (UI-SPEC §4.5)
affects:
  - 04-05 (provider-home-new-patient visual surface opens this modal; schedule-placeholder honesty checked at the QA gate)
tech-stack:
  added: []
  patterns: ["Overlay primitive only — no popover primitive invented (02-CONTEXT D-22)", "invite-creator.tsx link+shortcode+copy grammar reused", "client-side zod pre-validation + server RESULT kinds"]
key-files:
  created:
    - src/components/patients/NewPatientControl.tsx
    - src/components/patients/QuickActionsOverlay.tsx
    - tests/unit/patient-entry.test.tsx
    - tests/unit/patient-quick-actions.test.tsx
  modified:
    - src/components/shell/ProviderTopBar.tsx (disabled CTA -> NewPatientControl; D-16 citation replaces the Phase-2 obligation comment)
    - src/components/patients/FolderCard.tsx (quick-actions button slot, outside the anchor)
    - src/components/patients/FolderGrid.tsx (emptyAction slot)
    - src/app/(provider)/provider/page.tsx (mobile body CTA + emptyAction wiring)
decisions:
  - "Send invite" is HIDDEN (not disabled) without CAN_MANAGE_MEMBERSHIP and for linked patients — the action re-checks server-side; never a dead control (04-RESEARCH Open Q4, adopted).
  - "Schedule appointment" renders aria-disabled with the honest note "Available with scheduling" — a disabled future affordance, never a dead enabled button (04-CONTEXT discretion).
  - All five "use client" files start with the directive first (build blocker found by hermes verify and fixed by steer: missing directives on RetrievalControls/ProviderSearchControl).
verification:
  - npx vitest run (patient-entry + patient-quick-actions): 25 passed
  - npm run lint: exit 0; npx tsc --noEmit: 0 errors (project-wide)
  - npm run build: exit 0
---

# 04-04 Summary — entry + quick actions

Provider Home is feature-complete for the phase: the accentSoft "Add new
patient" CTA opens the D-05 modal (D-06: card appears, no navigation), card
kebab drives status change and the D-04 patient-linked invite (hidden without
capability), and the schedule placeholder is honestly disabled. 25 unit tests
green; integration build/tsc/lint clean.
