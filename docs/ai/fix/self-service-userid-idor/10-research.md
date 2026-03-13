---
date: 2026-03-13
researcher: Codex
branch: perf/3g
commit: 73627f1
feature: self-service-userid-idor
research_question: "Где self-service client/server flow доверяет userId, пришедшему с клиента, и какие маршруты позволяют читать или изменять чужие данные через spoofed userId или enrollmentId?"
---

# Research: self-service-userid-idor

## Summary
В текущем self-service flow `course-enrollment` и `daily-plan` клиентские хуки читают `session.user.id` в браузере и отправляют `userId` в tRPC input. На сервере ряд процедур использует `authorizedProcedure`, который проверяет только наличие сессии, а затем передает `input.userId` в domain services без сверки с `ctx.session.user.id`. Это создает IDOR-поверхность для чтения чужих enrollment/access/daily-plan данных и для записи workout completion при знании чужого `userId` и связанных идентификаторов.

Отдельно `course.updateWorkoutDays` уже не принимает `userId`, но проверяет только существование `enrollmentId`; ownership enrollment относительно `ctx.session.user.id` отсутствует. Это позволяет изменять чужие тренировочные дни при знании `enrollmentId`.

## Entry points (as-is)
- Next.js routes/pages:
  - `src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx:40-135` создает server-side hydrated query state для `checkAccessByCourseSlug`, `getEnrollmentByCourseSlug`, `getEnrollment`, `getAvailableWeeks`, `getUserDailyPlan`, включая `userId` в query input.
  - `src/app/platform/(app-shell)/(paid)/day/[courseSlug]/day-page-client.tsx:20-40` на клиенте повторно вызывает `useCheckAccessByCourseSlugQuery(session?.user?.id || '', courseSlug, ...)`.
- tRPC procedures/routers:
  - `src/features/course-enrollment/_controller.ts:138-346` содержит self-service процедуры `getEnrollment`, `getEnrollmentByCourseSlug`, `checkAccessByCourseSlug`, `getUserEnrollments`, `getActiveEnrollment`, `getUserWorkoutDays`, `updateWorkoutDays`, `getAvailableWeeks`.
  - `src/features/daily-plan/_controller.ts:63-130` содержит self-service процедуры `getUserDailyPlan`, `updateWorkoutCompletion`, `getWorkoutCompletionStatus`.
  - `src/kernel/lib/trpc/_procedure.ts:11-21` определяет `authorizedProcedure` только с session-presence check.
- UI components:
  - `src/features/course-enrollment/_vm/use-course-enrollment.ts:42-94` строит клиентские query hooks с `userId` в input.
  - `src/features/daily-plan/_vm/use-daily-plan.ts:12-27` отправляет `userId` в `getUserDailyPlan`.
  - `src/features/daily-plan/_vm/use-workout-completion-status.ts:22-46` отправляет `userId` в `getWorkoutCompletionStatus`.
  - `src/features/daily-plan/_ui/exercise-card.tsx:121-137` отправляет `userId` в mutation `updateWorkoutCompletion`.

## Detailed findings
### 1 Self-service course enrollment procedures trust client userId
- Location: `src/features/course-enrollment/_controller.ts:138-346`
- What it does: процедуры принимают `userId` в zod input и используют его для доступа к enrollment/access данным.
- Dependencies: `GetCourseEnrollmentService`, `GetEnrollmentByCourseSlugService`, `CheckCourseAccessService`, `GetUserEnrollmentsService`, `GetActiveEnrollmentService`, `GetUserWorkoutDaysService`, `GetAvailableWeeksService`, `UserAccessRepository`.
- Data flow:
  - `use-course-enrollment` hook -> tRPC query with `{ userId, ... }`
  - `authorizedProcedure` checks `ctx.session !== null`
  - controller calls service with `input.userId`
  - service/repository queries enrollment/access rows by supplied user id
  - response returns enrollment/access metadata to caller.
- Concrete procedures:
  - `getEnrollment`: `src/features/course-enrollment/_controller.ts:138-152`
  - `getEnrollmentByCourseSlug`: `src/features/course-enrollment/_controller.ts:154-170`
  - `checkAccessByCourseSlug`: `src/features/course-enrollment/_controller.ts:172-248`
  - `getUserEnrollments`: `src/features/course-enrollment/_controller.ts:250-260`
  - `getActiveEnrollment`: `src/features/course-enrollment/_controller.ts:263-273`
  - `getUserWorkoutDays`: `src/features/course-enrollment/_controller.ts:275-287`
  - `getAvailableWeeks`: `src/features/course-enrollment/_controller.ts:316-346`

### 2 Daily plan procedures trust client userId for read/write
- Location: `src/features/daily-plan/_controller.ts:63-130`
- What it does: процедуры daily-plan принимают `userId` и передают его в сервисы чтения/записи прогресса.
- Dependencies: `GetUserDailyPlanService`, `UpdateWorkoutCompletionService`, `GetWorkoutCompletionStatusService`.
- Data flow:
  - `useDailyPlanQuery` / `useWorkoutCompletionStatusQuery` / `ExerciseCard.toggleCompleted`
  - tRPC client sends `{ userId, enrollmentId, ... }`
  - `authorizedProcedure` validates only session presence
  - controller uses `input.userId`
  - service/repository reads or writes `UserDailyPlan`/`UserWorkoutCompletion`.
- Concrete procedures:
  - `getUserDailyPlan`: `src/features/daily-plan/_controller.ts:64-83`
  - `updateWorkoutCompletion`: `src/features/daily-plan/_controller.ts:95-109`
  - `getWorkoutCompletionStatus`: `src/features/daily-plan/_controller.ts:111-130`

### 3 Client code propagates userId into query keys and mutation variables
- Location: `src/features/course-enrollment/_vm/use-course-enrollment.ts:42-94`, `src/features/daily-plan/_vm/use-daily-plan.ts:12-27`, `src/features/daily-plan/_vm/use-workout-completion-status.ts:22-46`, `src/features/daily-plan/_ui/exercise-card.tsx:121-137`, `src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx:84-132`
- What it does: браузерный код использует `session.user.id` как часть self-service request payload и query key.
- Dependencies: `useAppSession`, React Query/tRPC hooks, `createControllerHelpers`.
- Data flow:
  - NextAuth session on client/server -> hook/page reads `session.user.id`
  - `userId` included in tRPC input/query key
  - hydrated state is keyed by client-supplied `userId`
  - later requests can be replayed with a modified `userId`.

### 4 Profile flow already uses server-side ability checks
- Location: `src/features/update-profile/_controller.ts:28-53`, `src/features/update-profile/_domain/ability.ts:3-8`
- What it does: `updateProfile.get/update` accept `userId`, but access is enforced by `checkAbilityInputProcedure`, comparing input `userId` with `session.user.id` or admin role.
- Dependencies: `checkAbilityInputProcedure`, `createProfileAbility`.
- Data flow:
  - client sends `{ userId }`
  - `authorizedProcedure` + ability middleware run
  - middleware checks `session.user.id === userId || ADMIN`
  - only then service executes.

### 5 updateWorkoutDays lacks ownership verification
- Location: `src/features/course-enrollment/_controller.ts:290-314`
- What it does: mutation loads enrollment by `enrollmentId`, checks only existence, then updates selected days.
- Dependencies: `GetEnrollmentByIdService`, `UpdateWorkoutDaysService`.
- Data flow:
  - client sends `{ enrollmentId, selectedWorkoutDays, keepProgress }`
  - controller loads enrollment
  - if enrollment exists, controller updates it without comparing `enrollment.userId` to current session user.

## Data flow map (as-is)
Client hook/component -> tRPC client with `userId` from browser session -> `authorizedProcedure` -> controller -> service -> repository -> Prisma -> response/mutation result

Concrete vulnerable paths:
- `useCheckAccessByCourseSlugQuery` -> `course.checkAccessByCourseSlug` -> `CheckCourseAccessService.exec`
- `useEnrollmentByCourseSlugQuery` -> `course.getEnrollmentByCourseSlug` -> `GetEnrollmentByCourseSlugService.exec`
- `useDailyPlanQuery` -> `getUserDailyPlan` -> `GetUserDailyPlanService.exec`
- `ExerciseCard.toggleCompleted` -> `updateWorkoutCompletion` -> `UpdateWorkoutCompletionService.exec`

## Data & schema (as-is)
- Prisma models involved:
  - `UserCourseEnrollment` with `userId`, `courseId`, `active`, `selectedWorkoutDays`: `prisma/schema.prisma:319-339`
  - `UserWorkoutCompletion` with `userId`, `enrollmentId`, `contentType`, `workoutId`, `stepIndex`: `prisma/schema.prisma:387-398`
  - `UserAccess` and related user access records queried by `UserAccessRepository`: `prisma/schema.prisma:662-686`
  - `UserDailyPlan`: `prisma/schema.prisma:243-259`
- Constraints/indexes:
  - `UserWorkoutCompletion @@unique([userId, enrollmentId, contentType, workoutId, stepIndex])`: `prisma/schema.prisma:397`
  - `UserDailyPlan @@index([userId, startDate])`: `prisma/schema.prisma:259`
  - `UserCourseEnrollment @@index([userId, date])` equivalent access paths are implemented in repositories/services.
- Migrations involved:
  - daily plan and workout completion initial migrations under `prisma/migrations/20250718120959_daily_plan/` and `prisma/migrations/20250812190256_init_with_workout_completion/`.

## Caching & invalidation (as-is)
- Query keys are derived from tRPC input shapes in:
  - `src/features/course-enrollment/_vm/use-course-enrollment.ts:42-94`
  - `src/features/daily-plan/_vm/use-daily-plan.ts:16-27`
  - `src/features/daily-plan/_vm/use-workout-completion-status.ts:30-46`
- Invalidations:
  - `useCourseEnrollment` invalidates enrollment/access queries after create/update/activate: `src/features/course-enrollment/_vm/use-course-enrollment.ts:114-153`
  - `useWorkoutCompletions` invalidates `getWorkoutCompletionStatus`: `src/features/daily-plan/_vm/use-workout-completions.ts:14-69`
  - `EditWorkoutDaysClient` invalidates enrollment and daily-plan queries after mutation: `src/features/select-training-days/_ui/edit-workout-days-client.tsx:76-94`

## Error handling (as-is)
- `authorizedProcedure` throws `TRPCError({ code: 'UNAUTHORIZED' })` only when session is missing: `src/kernel/lib/trpc/_procedure.ts:11-21`
- `checkAbilityInputProcedure` can enforce ownership/ability checks when explicitly used: `src/kernel/lib/trpc/_procedure.ts:45-67`
- vulnerable self-service procedures currently do not add `FORBIDDEN` checks for mismatched `userId`
- `updateWorkoutDays` currently throws generic `Error('Enrollment not found')` only when enrollment is missing: `src/features/course-enrollment/_controller.ts:303-305` in current state before fix.

## Security surface (as-is, facts only)
- Authentication:
  - self-service procedures require an authenticated session through `authorizedProcedure`
- Authorization:
  - profile endpoints use explicit ability checks
  - course-enrollment and daily-plan self-service endpoints do not compare `input.userId` with `ctx.session.user.id`
- IDOR boundaries:
  - not enforced for self-service `userId` inputs in the procedures listed above
  - not enforced for `updateWorkoutDays` ownership by `enrollmentId`

## Dependencies (as-is)
- Internal:
  - `src/kernel/lib/trpc/_procedure.ts`
  - `src/features/course-enrollment/_controller.ts`
  - `src/features/daily-plan/_controller.ts`
  - `src/features/course-enrollment/_services/*`
  - `src/features/daily-plan/_services/*`
  - `src/entities/course/_repositories/user-course-enrollment.ts`
  - `src/entities/workout/_repositories/user-workout-completion.ts`
- External:
  - `@trpc/server`
  - `@tanstack/react-query`
  - `next-auth`
  - `@prisma/client`

## Open questions
- В текущем scope не найдено отдельных e2e/security tests, которые симулируют spoofed `userId` в self-service tRPC flow; проверка присутствует только на уровне общих auth procedure tests (`src/kernel/lib/trpc/_procedure.spec.ts`).
