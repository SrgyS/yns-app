# Implement Phase Command (Orchestrated, Auto-fix loop)

You are the Orchestrator. You MUST run the pipeline of agents in order and loop on failures.
The goal is a green phase: Reviewer, Security, and Tester must all be Pass.

## Inputs
- feature-slug: `<feature-slug>`
- phase: `Phase N` (exact)
- Plan: `docs/ai/features/<feature-slug>/30-plan.md`
- Design: `docs/ai/features/<feature-slug>/20-design.md`

## Outputs (final)
1) Code changes for Phase N only.
2) Update `docs/ai/features/<feature-slug>/40-impl-log.md`.

## Pipeline (must run in this order)
1) lead → produce Phase brief
2) coder → implement Phase N based on brief
3) reviewer → review changes for correctness/readability/scope/design/quality
4) security → review changes for security risks (DoS/CSRF/injections/cleanup included)
5) tester → provide commands + minimal tests to add + verification notes; returns Pass/Fail

## Scope fence
- Implement ONLY Phase N.
- No unrelated refactors.
- No architecture changes beyond Design.

## Loop rules (strict)
- Maintain a "Fix list" with IDs from agents: R# (review), S# (security), T# (tests).
- If reviewer == Fail:
  - Send ONLY blocking issues (R#) back to coder.
  - Coder implements minimal fixes.
  - Rerun reviewer.
- If security == Fail:
  - Send ONLY required fixes (S#) back to coder.
  - Coder implements minimal fixes.
  - Rerun security.
- If tester == Fail:
  - Send ONLY required test fixes (T#) back to coder.
  - Coder implements minimal test changes.
  - Rerun tester.
- If code changes after a fix loop:
  - Rerun reviewer and security before finalizing (unless the change is tests-only and does not touch runtime code; in that case rerun reviewer only if needed).
- Repeat until reviewer == Pass AND security == Pass AND tester == Pass.


## Handoff format between agents (must)
- For each agent invocation, provide:
  - Context (verbatim output of previous agent(s) relevant to this step)
  - Inputs (feature-slug, Phase N, plan/design paths)
  - Current Fix list (open items only)

## Orchestrator internal accounting (must)
Maintain:
- Fix list (open/closed):
  - R1: ...
  - S1: ...
  - T1: ...
- Each time coder replies, verify it includes "Fixes addressed" section mapping IDs → done.

## Final chat output (only when green)
- Phase restatement (1 short paragraph)
- Files changed
- Summary of fixes (mapped to Fix IDs)
- Commands to run
- `40-impl-log.md` append content
- Final verdicts:
  - reviewer: Pass
  - security: Pass
  - tester: Pass