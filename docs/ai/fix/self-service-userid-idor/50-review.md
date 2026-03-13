---
date: 2026-03-13
reviewer: Codex
branch: perf/3g
commit: 73627f1
feature: self-service-userid-idor
---

# Review: self-service-userid-idor

## What shipped
- Self-service `course-enrollment` procedures no longer accept `userId` from the client.
- Self-service `daily-plan` procedures no longer accept `userId` from the client.
- `course.updateWorkoutDays` now rejects attempts to modify another user's enrollment.
- Client hooks and day-page hydration were aligned to the new server contracts.
- `ExerciseCard` completion status now uses optimistic React Query cache updates instead of waiting for mutation completion.
- Obsolete Zustand workout completion store was removed; completion flow now relies on server persistence plus React Query only.
- Regression coverage was added for the new ownership check and existing access-guard spec was updated.

## Design compliance
- Matches design: Yes
- Deviations:
  - None

## Code quality
- Layering rules: Pass
- Cross-entity repository imports: Pass
- Readability rules (S7735, S3358): Pass
- DI wiring: Pass
- Error handling: Pass
- Caching strategy alignment: Pass
- Client state ownership: Pass
  - `ExerciseCard` no longer duplicates server-owned completion state in local component state
  - optimistic update is handled at the query-cache layer with rollback/revalidation
  - redundant Zustand store for completion status has been removed

## Security
- AuthN (session via `authorizedProcedure`): Pass
- AuthZ / ownership:
  - Self-service identity now comes from `ctx.session.user.id` in:
    - `src/features/course-enrollment/_controller.ts`
    - `src/features/daily-plan/_controller.ts`
  - `updateWorkoutDays` enforces ownership before mutation in:
    - `src/features/course-enrollment/_controller.ts`
- IDOR risk from spoofed `userId`: Mitigated for the affected self-service routes
- Residual risk:
  - Admin/profile routes intentionally still accept `userId`; they rely on ability middleware and were not changed in this fix.

## Tests & verification
- Commands run:
  - `npm run test -- src/features/course-enrollment/_controller.spec.ts src/features/course-enrollment/_vm/check-access-guard.spec.tsx`
  - `npm run lint:types`
  - `npm run lint`
- Results:
  - Pass

## Release readiness
- Migrations safe: Yes
- Rollback plan: revert the touched controller/hook/spec/docs changeset
- Backward compatibility:
  - Breaking only at internal client-to-server contract level inside the same repo; all known call sites were updated in the same change

## Final decision
- Approved: Yes
- Conditions:
  - None
