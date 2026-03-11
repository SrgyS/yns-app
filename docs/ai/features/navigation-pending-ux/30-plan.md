# Plan: Navigation Pending UX

## Planning principles

- Каждая фаза должна быть реализуема и проверяема отдельно.
- Без расширения scope на public-site и admin area.
- Без массовой миграции всех `Link`.
- Сначала shared infrastructure, затем интеграции, затем skeleton screens.

## Phase 1. App-level navigation feedback infrastructure

### Goal

Добавить shared client-side infrastructure для global top progress bar и централизованного completion navigation feedback.

### Files to change

- `src/app/_providers/app-provider.tsx`
- `src/shared/lib/navigation/navigation-feedback.ts`
- `src/shared/ui/top-progress-bar.tsx`
- возможно `src/app/layout.tsx`, если потребуется app-level mount adjustment

### Steps

1. Создать `navigation-feedback.ts` с API `startNavigationFeedback()`, `doneNavigationFeedback()` и внутренним subscription механизмом.
2. Реализовать `TopProgressBar` с delayed start, pseudo-progress до 90% и завершающей анимацией.
3. Подключить `TopProgressBar` в общем client tree через `AppProvider()`.
4. Добавить app-level pathname-aware completion listener, который завершает активный feedback cycle после route commit.
5. Проверить, что progress bar не влияет на layout и не перехватывает pointer events.

### Local tests

- `npm run lint`
- `npm run lint:types`
- ручная проверка в private platform:
  - быстрый переход не показывает bar
  - медленный переход показывает bar
  - после завершения перехода bar скрывается

### Acceptance criteria

- В приложении появляется единый global top progress bar.
- Быстрые переходы короче порога не вызывают мигание.
- Progress bar корректно завершается после фактического route change.
- Infrastructure не требует прямого обращения к `window` из feature-кода.

## Phase 2. Critical private navigation entrypoints

### Goal

Подключить shared navigation feedback к критичным private navigation entrypoints без массовой миграции всех ссылок.

### Files to change

- `src/shared/ui/smart-link.tsx`
- `src/features/navigation/desktop/main-nav-client.tsx`
- `src/features/navigation/mobile/mobile-bottom-nav-client.tsx`
- `src/features/headers/top-bar/_ui/profile.tsx`
- `src/shared/ui/back-button.tsx`
- возможно `src/features/headers/top-bar/_ui/logo.tsx`

### Steps

1. Реализовать `SmartLink` как wrapper над `next/link` для internal navigation feedback.
2. Перевести private desktop navigation на `SmartLink`.
3. Обновить private mobile bottom nav:
   - сохранить отдельную active/pending logic
   - исключить feedback на already-active tab
   - запускать global feedback только для реального route transition
4. Перевести `Profile` link и `BackButton` с `href` на `SmartLink`, где это относится к private flow.
5. Проверить, что logo/profile/back navigation не ломают стандартное поведение Next.js links.

### Local tests

- `npm run lint`
- `npm run lint:types`
- ручная проверка:
  - desktop private nav
  - mobile bottom nav
  - profile avatar navigation
  - back navigation через `BackButton`

### Acceptance criteria

- Private desktop navigation запускает global feedback при переходе на новый route.
- Private mobile bottom nav не делает повторную навигацию на активную вкладку.
- Active tab в mobile bottom nav не запускает progress bar.
- Navigation-critical private links используют shared feedback pattern.

## Phase 3. Action-based private navigation

### Goal

Добавить единый pending UX для action-triggered transitions внутри private platform.

### Files to change

- `src/features/daily-plan/_ui/course-activation-option.tsx`
- `src/features/user-courses/_ui/user-course-item.tsx`
- возможно дополнительные private action entrypoints, если они подтверждены в рамках этой же фазы без расширения scope

### Steps

1. Перевести `CourseActivationOption` на паттерн `useTransition()` + disabled state + inline pending feedback + `startNavigationFeedback()` перед `router.push()`.
2. Обновить `UserCourseItem`:
   - для перехода к тренировкам добавить navigation feedback перед `router.push()`
   - не ухудшить текущую cache invalidation logic
3. Проверить, что локальный pending state не конфликтует с глобальным top progress bar.
4. Подтвердить, что завершение progress bar остается централизованным через route commit, а не локальный button callback.

### Local tests

- `npm run lint`
- `npm run lint:types`
- ручная проверка:
  - активация курса с переходом на `platform/day/[courseSlug]`
  - переход к тренировкам из профиля/списка курсов

### Acceptance criteria

- Кнопки показывают мгновенный pending state и блокируются.
- При action-based navigation запускается global top progress bar.
- Повторные клики во время pending state исключены.
- Existing mutation/cache invalidation logic остается рабочей.

## Phase 4. Route-level skeleton screens for private platform

### Goal

Добавить route-specific skeleton screens для наиболее заметных private routes.

### Files to change

- `src/app/platform/(paid)/day/[courseSlug]/loading.tsx`
- `src/app/platform/(paid)/knowledge/loading.tsx`
- `src/app/platform/(paid)/practices/loading.tsx`
- `src/app/platform/(paid)/recipes/loading.tsx`
- `src/app/platform/(profile)/profile/loading.tsx`
- возможно `src/app/platform/(paid)/loading.tsx`, если понадобится привести fallback в соответствие с новой схемой

### Steps

1. Реализовать skeleton для `day/[courseSlug]`, повторяющий структуру основного контента дня.
2. Реализовать skeleton для `knowledge`, повторяющий layout списка курсов/категорий.
3. Реализовать skeleton для `practices`, повторяющий layout списка карточек.
4. Реализовать skeleton для `recipes`, повторяющий экран списка рецептов.
5. Реализовать skeleton для `profile`, повторяющий header/profile cards/user courses composition.
6. Проверить, что existing segment fallback `src/app/platform/(paid)/loading.tsx` не конфликтует с route-level loading files.

### Local tests

- `npm run lint`
- `npm run lint:types`
- ручная проверка route transitions на:
  - `/platform/day/[courseSlug]`
  - `/platform/knowledge`
  - `/platform/practices`
  - `/platform/recipes`
  - `/platform/profile`

### Acceptance criteria

- На целевых private routes нет blank state во время ожидания данных.
- Skeleton визуально соответствует реальной структуре страницы.
- Skeleton корректно работает в light/dark theme.
- Route-level loading files не ломают текущий App Router behavior.

## Phase 5. Verification and rollout hardening

### Goal

Провести финальную верификацию сквозного UX pending navigation и зафиксировать результаты implementation phase.

### Files to change

- `docs/ai/features/navigation-pending-ux/40-impl-log.md`
- возможно точечные fixes в файлах предыдущих фаз

### Steps

1. Прогнать lint/typecheck после всех фаз.
2. Провести ручную smoke-проверку private platform navigation на desktop и mobile.
3. Проверить сценарии:
   - быстрый route change
   - медленный route change
   - already-active mobile tab
   - action-based navigation
   - route-level skeleton rendering
4. Зафиксировать результаты, отклонения и финальный scope в `40-impl-log.md`.

### Local tests

- `npm run lint`
- `npm run lint:types`
- при наличии релевантных сценариев: точечный `npm run test`

### Acceptance criteria

- Pending UX работает единообразно в private platform.
- Нет регрессий в critical private navigation.
- Implementation log отражает выполненные фазы и результаты проверок.

## Suggested implementation order

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5

## Risks to watch during implementation

- Двойное завершение feedback cycle из app-level listener и локальных nav effects.
- Конфликт между `pendingHref` в private nav и глобальным navigation state.
- Избыточный запуск feedback для hash links, modified clicks или внешних ссылок.
- Неполное соответствие skeleton layout реальной странице, особенно для `day` и `profile`.
