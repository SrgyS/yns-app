---
date: 2026-03-13
planner: Codex
branch: perf/3g
commit: 73627f1
feature: self-service-userid-idor
based_on: docs/ai/fix/self-service-userid-idor/20-design.md
---

# Plan: self-service-userid-idor

## Summary
План разбит на четыре фазы: сначала зафиксировать текущий security scope и affected contracts, затем изменить server-side self-service controllers, потом синхронизировать client hooks/SSR hydration, после чего добавить regression tests и выполнить verification. Каждая фаза атомарна и может быть проверена отдельно.

## Definition of Done
- Self-service tRPC endpoints `course-enrollment` и `daily-plan` не принимают `userId` от клиента.
- Контроллеры используют только `ctx.session.user.id`.
- `course.updateWorkoutDays` бросает `FORBIDDEN` для чужого enrollment.
- Client hooks/SSR hydration используют новые input shapes без cache mismatch.
- Typecheck, lint и targeted Jest tests проходят.

## Phase 1: Scope lock and documentation
Goal:
- Зафиксировать фактические уязвимые маршруты, зависимости и целевой контракт.

Files to change:
- `docs/ai/fix/self-service-userid-idor/10-research.md`
- `docs/ai/fix/self-service-userid-idor/20-design.md`
- `docs/ai/fix/self-service-userid-idor/30-plan.md`

Steps:
1. Задокументировать текущие self-service procedures и client hooks.
2. Зафиксировать to-be contract без `userId`.
3. Зафиксировать отдельный ownership check для `updateWorkoutDays`.

Local tests:
- None

Acceptance criteria:
- Артефакты `10/20/30` существуют и описывают текущий и целевой flow.

## Phase 2: Server-side contract hardening
Goal:
- Убрать доверие к `userId` из self-service tRPC процедур и добавить ownership guard для `updateWorkoutDays`.

Files to change:
- `src/features/course-enrollment/_controller.ts`
- `src/features/daily-plan/_controller.ts`

Steps:
1. Удалить `userId` из input DTO affected procedures.
2. Внутри процедур брать user id из `ctx.session.user.id`.
3. Для `updateWorkoutDays` загрузить enrollment и проверить `enrollment.userId === ctx.session.user.id`.
4. При несовпадении вернуть `TRPCError('FORBIDDEN')`.

Local tests:
- `npm run test -- src/features/course-enrollment/_controller.spec.ts`

Acceptance criteria:
- Self-service server procedures больше не используют `input.userId`.
- Чужой `enrollmentId` не может быть изменен через `updateWorkoutDays`.

## Phase 3: Client and hydration alignment
Goal:
- Привести client hooks, components и SSR hydration к новым input shapes.

Files to change:
- `src/features/course-enrollment/_vm/use-course-enrollment.ts`
- `src/features/course-enrollment/_vm/check-access-guard.tsx`
- `src/features/course-enrollment/_vm/check-access-guard.spec.tsx`
- `src/features/daily-plan/_vm/use-daily-plan.ts`
- `src/features/daily-plan/_vm/use-workout-completion-status.ts`
- `src/features/daily-plan/_vm/use-workout-completions.ts`
- `src/features/daily-plan/_ui/exercise-card.tsx`
- `src/features/daily-plan/_ui/calendar-tabs.tsx`
- `src/features/daily-plan/_ui/day-tabs.tsx`
- `src/features/daily-plan/_vm/use-worckout-calendar.ts`
- `src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx`
- `src/app/platform/(app-shell)/(paid)/day/[courseSlug]/day-page-client.tsx`

Steps:
1. Убрать `userId` из hook signatures и вызовов.
2. Обновить mutation/query invocations на новые input DTO.
3. Обновить SSR `queryOptions` для совпадения server/client query keys.
4. Убрать лишние session-derived args, сохранить остальной UX без изменений.

Local tests:
- `npm run lint:types`

Acceptance criteria:
- Client code не передает `userId` в affected self-service procedures.
- Day page hydration использует те же query keys, что и клиент.

## Phase 4: Regression tests and verification
Goal:
- Подтвердить security fix и отсутствие type/lint regressions.

Files to change:
- `src/features/course-enrollment/_controller.spec.ts`
- `docs/ai/fix/self-service-userid-idor/40-impl-log.md`
- `docs/ai/fix/self-service-userid-idor/50-review.md`

Steps:
1. Добавить regression test на `updateWorkoutDays` ownership.
2. При необходимости скорректировать существующий hook spec под новый signature.
3. Запустить targeted Jest, `npm run lint:types`, `npm run lint`.
4. Задокументировать фактический результат и residual risks.

Local tests:
- `npm run test -- src/features/course-enrollment/_controller.spec.ts src/features/course-enrollment/_vm/check-access-guard.spec.tsx`
- `npm run lint:types`
- `npm run lint`

Acceptance criteria:
- Regression tests проходят.
- Impl log и review заполнены по фактическому выполнению.

## Phase 5: Optimistic completion status UX
Goal:
- Убрать perceptible delay в `ExerciseCard` при переключении статуса выполнения, используя React Query optimistic update как единственный source of truth.

Files to change:
- `src/features/daily-plan/_vm/use-workout-completions.ts`
- `src/features/daily-plan/_ui/exercise-card.tsx`
- `docs/ai/fix/self-service-userid-idor/40-impl-log.md`
- `docs/ai/fix/self-service-userid-idor/50-review.md`

Steps:
1. Перевести `updateWorkoutCompletion` mutation на `onMutate/cancel/getData/setData/onError/onSettled`.
2. Убрать дублирование состояния completion в `ExerciseCard`.
3. Читать текущий completion из query cache с fallback на `initialCompleted`.
4. Проверить, что optimistic state откатывается при mutation error и пересинхронизируется через invalidate.

Local tests:
- `npm run lint:types`
- `npm run lint`

Acceptance criteria:
- UI обновляет статус completion сразу при клике, без ожидания network round-trip.
- Источник истины для completion status в карточке один: React Query cache.
