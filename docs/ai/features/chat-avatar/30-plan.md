---
date: 2026-02-27
planner: Codex
branch: feat/react-compiler
commit: 64a3fe3
feature: chat-avatar
based_on: docs/ai/features/chat-avatar/20-design.md
---

# Plan: chat-avatar

## Summary
Реализация разбивается на независимые коммиты: сначала расширение server DTO для профиля пользователя/сотрудника, затем адаптация общего chat-header API, затем обновление admin UI (список + header + переход в профиль), затем user UI для отображения сотрудника-ответившего и финальная валидация. План сохраняет текущие auth/ACL, кэш-инвалидации и SSE-потоки без изменения бизнес-логики чата.

## Definition of Done
- Functional:
- В admin support-chat в списке диалогов и в header отображаются `ProfileAvatar + ФИО`.
- В admin support-chat клик по имени/аватару открывает `/admin/users/:id`.
- В user support-chat в header отображаются `ProfileAvatar + ФИО` сотрудника, который ответил.
- При отсутствии имени/аватара отображается fallback, верстка не ломается.
- Technical:
- tRPC DTO `staffListDialogs` включает `user.image`.
- tRPC DTO `userListDialogs` включает `counterparty` профиля сотрудника (или `null`).
- Не меняются Prisma schema/migrations, auth middleware, SSE contracts и invalidation matrix.
- `npm run lint:types` проходит.
- Docs:
- Актуализированы `40-impl-log.md` и при необходимости `50-review.md` после реализации.

## Phase 1: Expand support-chat list DTOs for avatar/fullName
Goal:
- Добавить данные профиля в server responses, не меняя входные контракты процедур.

Files to change:
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_controller.ts` (только если потребуется уточнение inferred types)

Steps:
1. В `staffListDialogs` расширить select пользователя полем `image`.
2. В `staffListDialogs` вернуть `user.image` в mapped DTO.
3. В `userListDialogs` добавить вычисление `counterparty` как последнего STAFF автора диалога (`id/name/image`) или `null`.
4. Проверить, что существующие правила доступа (`ensureUserRole/ensureStaffAccess/assertDialogAccess`) не изменились.

Local tests:
- `npm run lint:types`

Acceptance criteria:
- `supportChat.staffListDialogs` возвращает `items[].user.image`.
- `supportChat.userListDialogs` возвращает `items[].counterparty`.
- Ошибки и коды TRPC не изменены.

Commit message:
- `feat(support-chat): extend dialogs DTOs with avatar profile data`

## Phase 2: Update shared conversation header API for rich title content
Goal:
- Поддержать в `SupportChatConversationCard` передачу кликабельного header-контента (avatar + name + link).

Files to change:
- `src/features/support-chat/_ui/support-chat-conversation-card.tsx`

Steps:
1. Изменить тип пропа `title` с `string` на `ReactNode`.
2. Сохранить текущий layout header и совместимость для строкового `title`.
3. Убедиться, что mobile/desktop верстка header не регрессирует.

Local tests:
- `npm run lint:types`

Acceptance criteria:
- Компонент принимает как строку, так и JSX в `title` без type errors.
- Текущие экраны, использующие строку, продолжают работать без изменений поведения.

Commit message:
- `refactor(support-chat): allow rich header content in conversation card`

## Phase 3: Admin UI avatar/name + link to admin user profile
Goal:
- В админском inbox показать `ProfileAvatar + name` и добавить переход в профиль пользователя.

Files to change:
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`

Steps:
1. В списке диалогов отрисовать `ProfileAvatar` рядом с именем из `dialog.user`.
2. Обернуть имя и аватар в `Link` на `/admin/users/${dialog.user.id}`.
3. В header выбранного диалога заменить plain text title на `ProfileAvatar + name` с тем же `Link`.
4. Сохранить выбор диалога при клике по карточке и исключить конфликт интерактивных элементов (клик по `Link` не должен триггерить выбор через родителя).
5. Проверить keyboard accessibility для элемента выбора диалога.

Local tests:
- `npm run lint:types`

Acceptance criteria:
- Клик по аватару/имени в списке и в header переводит на `/admin/users/:id`.
- Клик по остальной области карточки диалога по-прежнему выбирает диалог.
- Нет вложенных интерактивных anti-patterns, вызывающих warnings/ошибки.

Commit message:
- `feat(admin-support-chat): add profile links for dialog users`

## Phase 4: User UI header with responder profile + fallbacks
Goal:
- Отобразить в user chat header аватар/имя сотрудника-ответившего, используя новый DTO `counterparty`.

Files to change:
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/features/support-chat/_vm/use-support-chat.ts` (если потребуется явное уточнение типов/селекторов)

Steps:
1. Определить selected dialog модель в user page на основе `dialogs`.
2. Пробросить в `SupportChatConversationCard` header JSX с `ProfileAvatar + fullName` для `counterparty`.
3. Добавить fallback текст (`Пользователь`) при `counterparty === null` или `name === null`.
4. Проверить поведение до первого ответа сотрудника (пустой counterparty).

Local tests:
- `npm run lint:types`

Acceptance criteria:
- В user header отображается сотрудник-ответивший при наличии ответа.
- Без ответа сотрудника UI показывает fallback и не ломает layout.
- Поведение отправки/редактирования/удаления/прочтения не изменилось.

Commit message:
- `feat(user-support-chat): show responder avatar and full name in header`

## Phase 5: Final verification and docs sync
Goal:
- Зафиксировать результат и закрыть фазу реализации.

Files to change:
- `docs/ai/features/chat-avatar/40-impl-log.md`
- `docs/ai/features/chat-avatar/50-review.md` (если ведется в текущем процессе)

Steps:
1. Прогнать итоговый набор проверок (types + релевантный lint).
2. Ручная smoke-проверка admin/user chat на desktop/mobile breakpoints.
3. Записать в impl-log: что сделано, какие тесты запускались, результаты.

Local tests:
- `npm run lint:types`
- `npm run lint` (рекомендуется)

Acceptance criteria:
- Все фазы закрыты, проверка типов проходит.
- Документированы фактические изменения и результаты проверок.

Commit message:
- `docs(chat-avatar): add implementation log and verification results`

## Test plan (consolidated)
- Unit:
- При наличии тестов DTO/mapper: обновить snapshots/expectations для `staffListDialogs` и `userListDialogs`.
- Integration:
- Проверить запросы `supportChat.staffListDialogs` и `supportChat.userListDialogs` через существующий tRPC flow.
- Проверить переходы `Link` в admin chat на `/admin/users/:id`.
- E2E: не реализовывать
- Admin: открыть `/admin/support-chat` -> клик по аватару/имени -> переход на `/admin/users/:id`.
- User: открыть `/platform/support-chat` -> убедиться, что header показывает сотрудника после ответа.

## Security checklist
- AuthZ:
- Проверить, что новые поля профиля возвращаются только в рамках уже разрешенных диалогов.
- IDOR:
- Не ослаблять `assertDialogAccess` и `ensureStaffAccess`; не использовать `dialogId` напрямую без ownership checks.
- Validation:
- Входные zod-схемы без изменений; не добавлять невалидируемые пользовательские input.
- Storage (if applicable):
- Изменения только в рендере avatar URL; загрузка/выдача вложений не меняется.
- Secrets:
- Новые env/secrets не добавляются.

## Rollout / migration steps
- Steps:
1. Смержить изменения без миграций БД.
2. Проверить admin/user support-chat в staging.
3. Включить релиз в обычном frontend rollout.
- Rollback:
1. Откатить коммиты по UI/DTO изменениям.
2. Поскольку schema/API inputs не менялись, rollback не требует DB действий.

## Risks
- R1: У user диалогов `counterparty` может быть `null` до первого ответа staff, что требует стабильного fallback в header.
- R2: Неправильная композиция интерактивных элементов в списке admin dialogs может сломать UX выбора диалога или accessibility.

## Out-of-scope follow-ups
- F1: Отдельная метка “кто именно последний ответил” в списке user dialogs (не только header).
- F2: Унификация формата fallback-имени и i18n для profile placeholders по всему приложению.
