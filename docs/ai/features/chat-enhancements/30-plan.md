---
date: 2026-02-26
planner: Codex
branch: feat/react-compiler
commit: cca0789
feature: chat-enhancements
based_on: docs/ai/features/chat-enhancements/20-design.md
---

# Plan: chat-enhancements

## Summary
Реализация разбита на атомарные шаги: сначала additive БД изменения, затем серверные use-cases и контракты, затем client cache/SSE wiring, затем UI и тесты. Каждый шаг может быть проверен отдельно через lint/typecheck и unit tests.

## Definition of Done
- Functional:
- Unanswered badge count виден в admin sidebar и user profile.
- В списках диалогов есть orange unresolved indicator.
- Автор может edit/delete только если сообщение не прочитано другой стороной.
- Admin inbox адаптивный: на узких экранах открывает чат с кнопкой back; dialogs грузятся по scroll.
- Technical:
- Новые tRPC процедуры protected + ownership/read-state guards.
- Prisma migration additive и обратносуместимая.
- Targeted invalidation и SSE события покрывают новые данные.
- Docs:
- Обновлены `10/20/30/40` (и review при необходимости).

## Phase 1: Persistence
Goal:
- Добавить поля lifecycle в `ChatMessage`.
Files to change:
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_chat_message_edit_delete/migration.sql`
- entity types/repositories.
Steps:
1. Add nullable fields `editedAt/deletedAt/deletedBy`.
2. Update repository/entity mapping.
Local tests:
- `npx prisma generate`
- `npm run lint:types`
Acceptance criteria:
- Типы Prisma/TS проходят; migration additive.
Commit message:
- `feat(chat-enhancements): add message edit-delete lifecycle fields`

## Phase 2: Server contracts and service rules
Goal:
- Реализовать unanswered-count и edit/delete процедуры с security rules.
Files to change:
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_domain/errors.ts`
- `src/features/support-chat/_domain/error-mapping.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_integrations/support-chat-events.ts`
- `src/app/api/support-chat/events/route.ts`
Steps:
1. Add procedures: `getUnansweredDialogsCount`, `editMessage`, `deleteMessage`.
2. Implement ownership/read-state guards in service.
3. Add `message.updated` SSE event.
4. Extend list/messages DTO with unresolved and canEdit/canDelete flags.
Local tests:
- `npm run lint:types`
- `npm run test -- support-chat-service`
Acceptance criteria:
- Unauthorized edit/delete denied; already-read denied; successful soft-delete/edit publish realtime updates.
Commit message:
- `feat(chat-enhancements): add unanswered count and message edit-delete api`

## Phase 3: Client cache and realtime wiring
Goal:
- Подключить новые процедуры в hooks + invalidation.
Files to change:
- `src/features/support-chat/_vm/use-support-chat.ts`
Steps:
1. Add `useSupportChatUnansweredCount` query hook.
2. Add edit/delete mutations and invalidation matrix.
3. Handle `message.updated` in SSE hooks.
Local tests:
- `npm run lint:types`
Acceptance criteria:
- Badge count и message updates приходят без full reload.
Commit message:
- `feat(chat-enhancements): wire client invalidation for unanswered and message updates`

## Phase 4: UI delivery (admin + user + navigation)
Goal:
- Показать бейджи и реализовать новый inbox UX + message action menus.
Files to change:
- `src/features/sidebar/constants.ts`
- `src/features/sidebar/_ui/nav-main.tsx`
- `src/features/sidebar/admin-panel-sidebar.tsx`
- `src/features/support-chat/_ui/support-chat-profile-link.tsx`
- `src/app/platform/(profile)/profile/page.tsx`
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
Steps:
1. Add admin sidebar badge with count.
2. Add profile orange dot badge for support chat button.
3. Add unresolved indicators in dialog lists.
4. Add edit/delete dropdown + inline edit UI + deleted message rendering.
5. Add admin infinite scroll and mobile back flow.
Local tests:
- `npm run lint`
- `npm run lint:types`
Acceptance criteria:
- All brief UX requirements reflected in UI behavior.
Commit message:
- `feat(chat-enhancements): implement badges message actions and responsive admin inbox`

## Phase 5: Verification and docs
Goal:
- Закрыть тесты/документацию и impl log.
Files to change:
- `src/features/support-chat/_services/support-chat-service.spec.ts`
- `docs/ai/features/chat-enhancements/40-impl-log.md`
Steps:
1. Add/adjust unit tests for edit/delete guards.
2. Run lint/types/tests.
3. Record execution results in impl log.
Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test -- support-chat`
Acceptance criteria:
- Green checks and reproducible logs.
Commit message:
- `test(chat-enhancements): cover message edit-delete rules and finalize docs`

## Test plan (consolidated)
- Unit:
- `support-chat-service.spec.ts` for ownership/read-state/edit/delete.
- Existing support-chat domain/read-service tests.
- Integration:
- tRPC + SSE invalidation verified via hook wiring and event names.
- E2E:
- Manual flows: admin/user unread badges, edit/delete before/after read, admin mobile back.

## Security checklist
- AuthZ:
- edit/delete only author + dialog access.
- IDOR:
- message mutation uses dialog+message + ownership check.
- Validation:
- zod schemas for new mutation inputs.
- Storage:
- unchanged attachment access rules.
- Secrets:
- unchanged.

## Rollout / migration steps
- Steps:
1. Apply migration.
2. Deploy app.
3. Smoke test support-chat flows.
- Rollback:
- Rollback app code; additive columns remain harmless.

## Risks
- R1: Unanswered semantics for STAFF are actor-specific read-state.
- R2: Admin mobile flow depends on viewport behavior and needs manual QA on real devices.

## Out-of-scope follow-ups
- F1: Dedicated e2e scenarios for chat-enhancements.
- F2: Metrics dashboard for unanswered count trends.
