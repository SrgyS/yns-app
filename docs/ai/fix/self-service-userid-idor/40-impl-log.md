---
date: 2026-03-13
implementer: Codex
branch: perf/3g
commit: 73627f1
feature: self-service-userid-idor
based_on: docs/ai/fix/self-service-userid-idor/30-plan.md
---

# Implementation Log: self-service-userid-idor

## 2026-03-13 - Phase 1

### Lead
- Scope: Phase 1 only.
- Goal: capture the vulnerable self-service contract and the target contract without `userId`.
- DoD:
  - `10-research.md`, `20-design.md`, `30-plan.md` created under `docs/ai/fix/self-service-userid-idor/`
  - affected routes, hooks, and services enumerated with exact file references

### Coder
- Added:
  - `docs/ai/fix/self-service-userid-idor/10-research.md`
  - `docs/ai/fix/self-service-userid-idor/20-design.md`
  - `docs/ai/fix/self-service-userid-idor/30-plan.md`

### Reviewer
- Verdict: Pass
- Notes:
  - Scope stayed factual for research and explicit for to-be contract.

### Security
- Verdict: Pass
- Notes:
  - Threat model captures both spoofed `userId` and foreign `enrollmentId` update paths.

### Tester
- Not applicable in this phase.

## 2026-03-13 - Phase 2

### Lead
- Scope: Phase 2 only.
- Goal: harden self-service controllers so they derive identity from session and reject foreign enrollments on `updateWorkoutDays`.
- DoD:
  - self-service procedures no longer accept `userId`
  - `ctx.session.user.id` is the only user source in affected routes
  - `updateWorkoutDays` throws `FORBIDDEN` for foreign enrollment

### Coder
- Updated `src/features/course-enrollment/_controller.ts`:
  - removed `userId` from self-service inputs for `getEnrollment`, `getEnrollmentByCourseSlug`, `checkAccessByCourseSlug`, `getUserEnrollments`, `getActiveEnrollment`, `getUserWorkoutDays`, `getAvailableWeeks`
  - switched those procedures to `ctx.session.user.id`
  - added `TRPCError` import and foreign-enrollment check in `updateWorkoutDays`
- Updated `src/features/daily-plan/_controller.ts`:
  - removed `userId` from `getUserDailyPlan`, `updateWorkoutCompletion`, `getWorkoutCompletionStatus`
  - switched service calls to `ctx.session.user.id`

### Reviewer
- Verdict: Pass
- Notes:
  - Scope remained limited to self-service controller contract hardening.
  - Admin/profile contracts were not altered.

### Security
- Verdict: Pass
- Notes:
  - IDOR by spoofed `userId` is removed from affected self-service procedures.
  - Foreign `enrollmentId` mutation is blocked by explicit ownership check.

### Tester
- Initial `npm run lint:types` caught missing `TRPCError` import in `src/features/course-enrollment/_controller.ts`.
- Fix applied immediately; no design deviation.

## 2026-03-13 - Phase 3

### Lead
- Scope: Phase 3 only.
- Goal: align client hooks, components, and day-page hydration with the new self-service input shapes.
- DoD:
  - client code no longer sends `userId` for affected self-service calls
  - server/client query keys match after hydration

### Coder
- Updated client hooks:
  - `src/features/course-enrollment/_vm/use-course-enrollment.ts`
  - `src/features/daily-plan/_vm/use-daily-plan.ts`
  - `src/features/daily-plan/_vm/use-workout-completion-status.ts`
  - `src/features/daily-plan/_vm/use-workout-completions.ts`
- Updated UI call sites:
  - `src/features/daily-plan/_ui/exercise-card.tsx`
  - `src/features/daily-plan/_ui/calendar-tabs.tsx`
  - `src/features/daily-plan/_ui/day-tabs.tsx`
  - `src/features/course-enrollment/_vm/check-access-guard.tsx`
  - `src/app/platform/(app-shell)/(paid)/day/[courseSlug]/day-page-client.tsx`
  - `src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx`
  - `src/features/daily-plan/_vm/use-worckout-calendar.ts`
- Updated existing spec:
  - `src/features/course-enrollment/_vm/check-access-guard.spec.tsx`

### Reviewer
- Verdict: Pass
- Notes:
  - Hook signatures and hydration keys were updated consistently.
  - No unrelated caching refactor was introduced.

### Security
- Verdict: Pass
- Notes:
  - Browser-visible `session.user.id` remains acceptable as display/session data, but it is no longer trusted in affected self-service server contracts.

### Tester
- `npm run lint` passed after client alignment changes.

## 2026-03-13 - Phase 4

### Lead
- Scope: Phase 4 only.
- Goal: add regression coverage and run verification.
- DoD:
  - ownership regression test exists
  - targeted Jest, `lint:types`, and `lint` pass

### Coder
- Added `src/features/course-enrollment/_controller.spec.ts` with two router-level tests:
  - rejects foreign enrollment update with `FORBIDDEN`
  - allows owner update and forwards expected payload to `UpdateWorkoutDaysService`
- To isolate the controller spec from unrelated NextAuth/MDX import chains, mocked:
  - `@/kernel/lib/trpc/module`
  - heavy course/user-access service modules
  - logger and API mapper helpers

### Reviewer
- Verdict: Pass
- Notes:
  - Test scope is focused on the newly introduced ownership boundary.
  - Existing `check-access-guard` spec was updated only for signature changes.

### Security
- Verdict: Pass
- Notes:
  - Added regression coverage for the one remaining non-`userId` self-service authorization boundary (`enrollmentId` ownership).

### Tester
- Commands run:
```bash
npm run test -- src/features/course-enrollment/_controller.spec.ts src/features/course-enrollment/_vm/check-access-guard.spec.tsx
npm run lint:types
npm run lint
```
- Results:
  - Jest: pass, 2 suites / 6 tests
  - `tsc --noEmit`: pass
  - `eslint .`: pass
- Intermediate issues encountered:
  - Controller spec initially pulled real NextAuth/MDX/esbuild dependency chains and failed before hitting the tested logic.
  - Resolved by mocking `@/kernel/lib/trpc/module` and heavy imported modules in the spec; no production code change was needed for that issue.

## 2026-03-13 - Phase 5

### Lead
- Scope: Phase 5 only.
- Goal: remove noticeable completion-status delay in `ExerciseCard` using React Query optimistic update as the only UI source of truth.
- DoD:
  - `ExerciseCard` no longer waits for network round-trip to show completion toggle
  - completion state is derived from `getWorkoutCompletionStatus` query cache
  - mutation supports rollback on error and background revalidation on settle

### Coder
- Updated `src/features/daily-plan/_vm/use-workout-completions.ts`:
  - removed write path to Zustand store for this flow
  - added optimistic mutation lifecycle:
    - `onMutate` -> cancel current status query, snapshot previous value, `setData` optimistic value
    - `onError` -> rollback previous query value or invalidate when no snapshot exists
    - `onSettled` -> invalidate specific status query for server reconciliation
- Updated `src/features/daily-plan/_ui/exercise-card.tsx`:
  - removed duplicated local `isCompleted` state
  - now derives `isCompleted` from `completionStatusQuery.data ?? initialCompleted`
  - keeps only local UI state unrelated to server data (`isVideoPlaying`)
  - toggle handler no longer waits to set local completion state after mutation

### Reviewer
- Verdict: Pass
- Notes:
  - Pattern now matches existing optimistic-query usage in `use-workout-favorites`.
  - Source of truth is simpler and more predictable than local state plus cache invalidation.

### Security
- Verdict: Pass
- Notes:
  - No auth/authz surface changed in this phase.
  - Change is limited to client-side cache update behavior for an already protected mutation.

### Tester
- Commands run:
```bash
npm run lint:types
npm run lint
```
- Results:
  - `tsc --noEmit`: pass
  - `eslint .`: pass

## 2026-03-13 - Phase 6

### Lead
- Scope: Phase 6 only.
- Goal: remove obsolete Zustand workout completion store after confirming runtime flow no longer depends on it.
- DoD:
  - no remaining imports/usages of `useWorkoutCompletionStore` or `createCompletionKey`
  - `edit-workout-days-client` relies on query invalidation only
  - `keepProgress` behavior remains server-side

### Coder
- Removed `src/shared/store/workout-completion-store.ts`
- Cleared re-export from `src/shared/store/index.ts`
- Updated `src/features/select-training-days/_ui/edit-workout-days-client.tsx`:
  - removed `useWorkoutCompletionStore` import
  - removed store reset after successful `updateWorkoutDays`
  - retained React Query invalidation for `getWorkoutCompletionStatus` and `getUserDailyPlan`

### Reviewer
- Verdict: Pass
- Notes:
  - Cleanup is safe because the only remaining runtime usage was a redundant reset after query invalidation.
  - Server-side `keepProgress`/`deleteAllForEnrollment` logic remains the real source of truth.

### Security
- Verdict: Pass
- Notes:
  - No auth/authz behavior changed.
  - Removing redundant client store reduces state divergence risk.

### Tester
- Commands run:
```bash
npm run lint:types
npm run lint
```
- Results:
  - `tsc --noEmit`: pass
  - `eslint .`: pass
