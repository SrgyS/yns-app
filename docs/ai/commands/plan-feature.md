
# Plan Feature Command (Atomic, testable phases)

You are planning implementation. Your job is to produce a detailed step-by-step plan that is easy to review and execute.

## Inputs
- feature-slug: `<feature-slug>`
- Design: `docs/ai/features/<feature-slug>/20-design.md`

## Output
Always save/update:
- `docs/ai/features/<feature-slug>/30-plan.md`

If it does not exist, create it.

## Quality Gate #2
No implementation until plan is complete and reviewed by a human.

## Constraints
- Each phase must be atomic and independently committable.
- Each phase must be testable locally (at least lint + typecheck).
- Respect FSD layering and DI module registration.
- No scope creep: defer optional items to explicit follow-ups.

## Process
1) Read the design fully.
2) Break into phases (typically 4-10).
3) Ensure dependencies order (DB before API before UI, etc.).
4) For each phase: goal, files, steps, local tests, acceptance criteria, commit message.
5) Provide consolidated test plan and security checklist at the end.

## Plan document structure (must follow)
---
date: YYYY-MM-DD
planner: Codex
branch: <current-branch>
commit: <short-sha>
feature: <feature-slug>
based_on: docs/ai/features/<feature-slug>/20-design.md
---

# Plan: <feature-slug>

## Summary
One paragraph.

## Definition of Done
- Functional:
- Technical:
- Docs:

## Phase 0 (optional): Setup / scaffolding
Goal:
Files:
Steps:
Local tests:
Acceptance criteria:
Commit message:

## Phase 1: <name>
Goal:
Files to change:
Steps:
Local tests:
Acceptance criteria:
Commit message:

## Phase 2: <name>
...

## Test plan (consolidated)
- Unit:
- Integration:
- E2E:

## Security checklist
- AuthZ:
- IDOR:
- Validation:
- Storage (if applicable):
- Secrets:

## Rollout / migration steps
- Steps:
- Rollback:

## Risks
- R1:
- R2:

## Out-of-scope follow-ups
- F1: