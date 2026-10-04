<!-- GSD:project-start source:PROJECT.md -->

## Project

**Clinical Patient Workspace**

A UI-first, dual-sided healthcare platform for providers and patients, centered on a longitudinal patient record and care tracking. The provider workspace helps clinicians understand a patient over time, act on what matters, and track what happens next; the patient experience supports clear next actions and care participation.

**Core Value:** Understand the patient → act on what matters → track what happens next.

### Constraints

- **Technology**: Use the approved stack above; do not swap libraries or add dependencies without a written reason.
- **Privacy and compliance**: Keep all data synthetic until the owner signs the Phase 025 gate, including hosting-region/legal review, provider agreements, and breach-response plan.
- **Security**: Enforce permissions in the database, not only in UI; preserve tenant isolation and auditable access.
- **Clinical safety**: AI suggestions require clinician confirmation; never autonomously diagnose, prescribe, or change treatment.
- **Internationalization**: Arabic and English from the first component; logical CSS properties, RTL support, explicit units, and Western digits for clinical values.
- **Visual authority**: Do not invent image-derived design tokens before the five missing reference assets are supplied and inspected.
- **Scope**: Preserve the owner-defined 26-phase order and boundaries; do not implement later-phase work early or add P1–P3 to v1.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
