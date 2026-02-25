# Implement Phase Command (Strict scope)

You are implementing exactly ONE phase from the plan. No extra refactors.

## Inputs
- feature-slug: `<feature-slug>`
- phase: `Phase N` (exact)
- Plan: `docs/ai/features/<feature-slug>/30-plan.md`
- Design: `docs/ai/features/<feature-slug>/20-design.md`

## Outputs
1) Code changes for Phase N only.
2) Update:
- `docs/ai/features/<feature-slug>/40-impl-log.md`

## Hard constraints
- Implement ONLY what is in Phase N.
- Do not improve unrelated code.
- Do not change architecture beyond the design.
- Respect rules:
  - FSD layering
  - No cross-entity repository imports
  - S7735: prefer positive conditions with else
  - S3358: no nested ternaries (JSX exception as per AGENTS.md)

## Process
1) Restate Phase N goal and DoD (1 short paragraph).
2) List files you will modify/create before writing code.
3) Implement changes.
4) Add/adjust tests required by Phase N.
5) Provide commands to run locally.
6) Append to `40-impl-log.md`:
- date
- phase
- summary
- files changed
- commands run
- notes/issues

## Output format (in the chat)
- Phase restatement
- File list
- Patch explanation (brief)
- Commands to run
- `40-impl-log.md` append content