# Plan: navigation-single-source

## Phase 1. Extract shared public navigation source

### Goal

Создать единый серверный источник публичной навигации, который собирает:

- статические публичные ссылки;
- динамические ссылки на опубликованные курсы;
- структуру для footer и desktop dropdown `Курсы`.

### Files to change

- `src/features/navigation/public-navigation-config.ts`
- `src/features/navigation/_services/get-public-navigation.ts`
- `src/features/navigation/index.ts`
- `src/features/navigation/nav-items.ts`

### Steps

1. Создать `public-navigation-config.ts` для хранения статических публичных ссылок и статической ссылки `Персональная работа`.
2. Создать `get-public-navigation.ts`, который:
   - использует `GetCoursesListService`;
   - маппит `course.title` и `course.slug` в навигационные ссылки;
   - строит нормализованный `PublicNavigationModel`;
   - формирует `desktopItems`, `desktopCoursesMenu`, `mobileMenuItems`, `footerSections`, `courseItems`.
3. Использовать `cache()` для request-scope дедупликации получения навигации.
4. Обновить `index.ts`, чтобы экспортировать новый сервис и типы.
5. Привести `nav-items.ts` к новой ответственности:
   - оставить platform navigation;
   - убрать прямую ownership public navigation из этого файла или перевести на re-export без дублирования данных.

### Local tests

- `npm run lint -- src/features/navigation`
- `npm run lint:types`

### Acceptance criteria

- В кодовой базе существует один серверный builder публичной навигации.
- Статические публичные ссылки и статическая ссылка `Персональная работа` объявлены в одном конфиге.
- Динамические курсы собираются из `GetCoursesListService`.
- Public navigation model можно передать и в footer, и в desktop dropdown, и в mobile navigation без дополнительной сборки в UI.

## Phase 2. Switch desktop public navigation to unified model

### Goal

Перевести desktop public header на единый источник данных и реализовать dropdown `Курсы`.

### Files to change

- `src/features/navigation/desktop/main-nav.tsx`
- `src/features/navigation/desktop/main-nav-client.tsx`
- при необходимости `src/shared/ui/dropdown-menu.tsx` только для интеграции существующих примитивов без изменения их API

### Steps

1. Обновить `MainNav()`:
   - для `variant === 'public'` получать данные из `PublicNavigationService`;
   - передавать в client component `desktopItems` и `desktopCoursesMenu`.
2. Обновить `MainNavClient()`:
   - перестать читать `PUBLIC_NAV_ITEMS` напрямую;
   - принимать готовые публичные items через props;
   - отрисовать dropdown `Курсы` на desktop;
   - сохранить текущую логику active/pending state для обычных ссылок.
3. В dropdown вывести:
   - опубликованные курсы;
   - статическую ссылку `Персональная работа`.
4. Убедиться, что private variant продолжает работать через существующие platform items.

### Local tests

- `npm run lint -- src/features/navigation/desktop`
- `npm run lint:types`

### Acceptance criteria

- Desktop public header больше не зависит от `PUBLIC_NAV_ITEMS`.
- В desktop header появился dropdown `Курсы`.
- Dropdown показывает динамические курсы и ссылку `Персональная работа`.
- Private navigation не регрессирует.

## Phase 3. Switch mobile public navigation to unified model

### Goal

Перевести mobile public navigation на единый источник данных без локальной сборки меню в client component.

### Files to change

- `src/features/navigation/mobile/mobile-bottom-nav.tsx`
- `src/features/navigation/mobile/public-mobile-nav-client.tsx`

### Steps

1. Обновить `MobileBottomNav()` для `variant === 'public'`:
   - получать `PublicNavigationModel`;
   - передавать в `PublicMobileNavClient` готовые `menuItems` и `courseItems`;
   - отдельно сохранить использование `getNavigationContext()` для auth-полей.
2. Обновить `PublicMobileNavClient()`:
   - убрать импорт `PUBLIC_NAV_ITEMS`;
   - перестать строить ссылки на курсы самостоятельно;
   - рендерить меню и список курсов только из props.
3. Убедиться, что публичная мобильная навигация использует те же label/href, что и desktop/footer.

### Local tests

- `npm run lint -- src/features/navigation/mobile`
- `npm run lint:types`

### Acceptance criteria

- Public mobile navigation не содержит локального источника меню.
- Курсы и статические ссылки приходят в client component уже нормализованными.
- Публичный mobile menu и список курсов согласованы с общей моделью навигации.

## Phase 4. Switch footer to unified model

### Goal

Убрать ручной список ссылок из футера и перевести его на единый источник данных.

### Files to change

- `src/app/(site)/_components/footer.tsx`

### Steps

1. Удалить локальную константу `footerSections`.
2. Получать `footerSections` из `PublicNavigationService`.
3. Сохранить текущую группировку:
   - `Курсы и предложения`
   - `Другие страницы`
4. Для раздела `Курсы и предложения` использовать:
   - динамические курсы;
   - статическую ссылку `Персональная работа`.
5. Сохранить существующую desktop/mobile разметку футера, меняя только источник данных.

### Local tests

- `npm run lint -- src/app/'(site)'/_components/footer.tsx`
- `npm run lint:types`

### Acceptance criteria

- В футере нет вручную прописанных course links.
- Футер использует единый navigation model.
- Названия курсов в футере берутся из `course.title`.
- Секция `Курсы и предложения` включает `Персональная работа`.

## Phase 5. Verification and cleanup

### Goal

Проверить согласованность реализации и убрать остаточные дубли public navigation.

### Files to change

- затронутые файлы из фаз 1-4
- `docs/ai/features/navigation-single-source/40-impl-log.md`

### Steps

1. Проверить, не осталось ли прямых импортов старого public navigation source в публичных UI-компонентах.
2. Удалить неиспользуемые типы/экспорты, если они стали лишними после миграции.
3. Подготовить `40-impl-log.md` с фиксацией выполненных фаз и результатов проверок.
4. Прогнать итоговые проверки.

### Local tests

- `npm run lint`
- `npm run lint:types`

### Acceptance criteria

- Public navigation использует единый источник данных во всех целевых точках:
  - desktop header
  - desktop dropdown `Курсы`
  - mobile public navigation
  - footer
- Нет оставшегося ручного дублирования публичных course links в этих точках.
- `40-impl-log.md` отражает фактические изменения и результаты проверок.
