# Research: navigation-single-source

## Scope

Исследование охватывает публичную навигацию сайта и список публичных курсов, которые сейчас отображаются в хедере, мобильной навигации и футере.

## Current entrypoints

### Site shell

- Публичная оболочка сайта определяется в [src/app/(site)/layout.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/(site)/layout.tsx).
- Компонент `Layout()` рендерит `SiteHeader`, `Footer` и `MobileBottomNav` для варианта `public`.

### Header navigation

- [src/features/headers/site-header.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/headers/site-header.tsx) экспортирует `SiteHeader()`, который возвращает `TopBar` с `variant="public"`.
- [src/features/headers/top-bar/top-bar.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/headers/top-bar/top-bar.tsx) в `TopBar()` рендерит `MainNav` при `variant !== 'auth'`.
- [src/features/navigation/desktop/main-nav.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/navigation/desktop/main-nav.tsx) в `MainNav()` для публичного варианта передаёт `variant="public"` в `MainNavClient`.
- [src/features/navigation/desktop/main-nav-client.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/navigation/desktop/main-nav-client.tsx) в `MainNavClient()` читает `PUBLIC_NAV_ITEMS` из `src/features/navigation/nav-items.ts`, фильтрует `targets.includes('desktop')` и создаёт `Link` по `item.href`.

### Mobile public navigation

- [src/features/navigation/mobile/mobile-bottom-nav.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/navigation/mobile/mobile-bottom-nav.tsx) в `MobileBottomNav()` при `variant === 'public'` получает `GetCoursesListService` из `server`, запрашивает `coursesService.exec()` и также получает `navigationContext` через `getNavigationContext()`.
- Затем `MobileBottomNav()` рендерит `PublicMobileNavClient` с `courses`, `profileHref`, `isAuthenticated`.
- [src/features/navigation/mobile/public-mobile-nav-client.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/navigation/mobile/public-mobile-nav-client.tsx) в `PublicMobileNavClient()`:
  - строит список `menuItems` из `PUBLIC_NAV_ITEMS`, фильтруя `targets.includes('mobile')` и исключая `item.href === '/'`;
  - строит список курсов из входного массива `courses`, создавая `Link` на `/courses/${course.slug}`.

### Footer navigation

- [src/app/(site)/_components/footer.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/(site)/_components/footer.tsx) содержит локальную константу `footerSections`.
- `footerSections` содержит два раздела:
  - `'Курсы и предложения'` с вручную прописанными `title` и `href`;
  - `'Другие страницы'` с вручную прописанными `title` и `href`.
- `Footer()` дважды итерирует `footerSections`: один раз для desktop-разметки и один раз для mobile-разметки.

## Current navigation sources

### Shared public navigation items

- [src/features/navigation/nav-items.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/navigation/nav-items.ts) определяет типы `NavigationItemKey`, `NavigationTarget`, `NavigationItem`.
- Там же определён массив `PUBLIC_NAV_ITEMS`.
- `PUBLIC_NAV_ITEMS` сейчас содержит пункты:
  - `Главная` (`/`)
  - `Результаты участниц` (`/results`)
  - `Оборудование` (`/equipment`)

### Footer-only navigation items

- [src/app/(site)/_components/footer.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/(site)/_components/footer.tsx) содержит ссылки, которые не берутся из `PUBLIC_NAV_ITEMS`.
- Курсы в футере задаются вручную через строки:
  - `/courses/reload/`
  - `/courses/noedema/`
  - `/courses/antikorka/`
  - `/courses/club/`
- Эти значения не читаются из `GetCoursesListService`, `COURSE_LAYOUTS` или другого общего источника.

### Mobile-only public courses source

- [src/features/navigation/mobile/mobile-bottom-nav.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/navigation/mobile/mobile-bottom-nav.tsx) получает список курсов через `GetCoursesListService.exec()`.
- [src/entities/course/_services/get-courses-list.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/entities/course/_services/get-courses-list.ts) в `GetCoursesListService.exec()` делегирует в `CoursesRepository.coursesList(options)`.
- [src/entities/course/_repositories/course.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/entities/course/_repositories/course.ts) в `CoursesRepository.coursesList()` вызывает `dbClient.course.findMany({ where: includeDrafts ? undefined : { draft: false }, include: { dependencies: true, tariffs: true } })`.
- `PublicMobileNavClient()` использует результат как список курсов для sheet `'Наши курсы'`.

## Course page routing facts

- [src/app/(site)/courses/[courseSlug]/page.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/(site)/courses/[courseSlug]/page.tsx) в `CoursePage()` получает `courseSlug` из `params`.
- `CoursePage()` вызывает `GetCourseService.exec({ slug: courseSlug })`.
- [src/entities/course/_services/get-course.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/entities/course/_services/get-course.ts) в `GetCourseService.exec()` при наличии `slug` вызывает `CoursesRepository.courseBySlug(query.slug)`.
- [src/entities/course/_repositories/course.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/entities/course/_repositories/course.ts) в `CoursesRepository.courseBySlug()` делает `dbClient.course.findUnique({ where: { slug: courseSlug }, include: { dependencies: true, tariffs: true } })`.
- Если курс не найден, `CoursePage()` вызывает `notFound()`.
- Если курс найден, `CoursePage()` читает `COURSE_LAYOUTS[courseSlug]` из [src/app/(site)/courses/_content/layout-config.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/(site)/courses/_content/layout-config.ts).
- Если layout найден, страница рендерит `BlockRenderer`.
- Если layout не найден, `CoursePage()` рендерит fallback-разметку с `MdxCode`, `EquipmentBlockComponent`, `TariffsBlockComponent`, `CourseCtaBlock`.

## Data flow: public navigation and courses

### Desktop public menu

Entrypoint -> validation/filtering -> rendering -> response

- `Layout()` in `src/app/(site)/layout.tsx`
- `SiteHeader()` in `src/features/headers/site-header.tsx`
- `TopBar()` in `src/features/headers/top-bar/top-bar.tsx`
- `MainNav()` in `src/features/navigation/desktop/main-nav.tsx`
- `MainNavClient()` in `src/features/navigation/desktop/main-nav-client.tsx`
- filter `PUBLIC_NAV_ITEMS` by `targets.includes('desktop')`
- render `Link` for each `item.href`

### Mobile public menu

Entrypoint -> validation/filtering -> domain/service -> repository -> response

- `Layout()` in `src/app/(site)/layout.tsx`
- `MobileBottomNav()` in `src/features/navigation/mobile/mobile-bottom-nav.tsx`
- `GetCoursesListService.exec()` in `src/entities/course/_services/get-courses-list.ts`
- `CoursesRepository.coursesList()` in `src/entities/course/_repositories/course.ts`
- `dbClient.course.findMany(...)`
- `PublicMobileNavClient()` in `src/features/navigation/mobile/public-mobile-nav-client.tsx`
- filter `PUBLIC_NAV_ITEMS` by `targets.includes('mobile')` and `item.href !== '/'`
- render:
  - `Link` for each `item.href`
  - `Link` for each course as `/courses/${course.slug}`

### Footer menu

Entrypoint -> validation/filtering -> response

- `Layout()` in `src/app/(site)/layout.tsx`
- `Footer()` in `src/app/(site)/_components/footer.tsx`
- iterate local constant `footerSections`
- render `Link` for each hardcoded `href`

## Constraints observed in code

- Публичная навигация уже частично централизована в `src/features/navigation/nav-items.ts`, но футер её не использует.
- Список публичных курсов уже читается из базы данных для `PublicMobileNavClient()`, но футер его не использует.
- Названия курсов в футере независимы от `course.title` и могут расходиться с данными базы.
- Публичная мобильная навигация и футер используют разные источники данных для списка курсов:
  - mobile: `GetCoursesListService.exec()`
  - footer: локальный массив `footerSections`
- `COURSE_LAYOUTS` в `src/app/(site)/courses/_content/layout-config.ts` является конфигурацией блоков страниц и не используется как источник данных для меню.
- Тип `CourseSlug` в [src/kernel/domain/course.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/domain/course.ts) объявлен как `string`; compile-time ограничения на набор допустимых slug отсутствуют.
- Публичная навигация desktop/mobile сейчас зависит от поля `targets` в `NavigationItem`.
- `Footer()` дублирует один и тот же рендеринг `footerSections` для desktop и mobile внутри одного файла.

## Dependencies

- Публичная оболочка: `src/app/(site)/layout.tsx`
- Хедер: `src/features/headers/site-header.tsx`, `src/features/headers/top-bar/top-bar.tsx`
- Навигационные константы: `src/features/navigation/nav-items.ts`
- Desktop navigation: `src/features/navigation/desktop/main-nav.tsx`, `src/features/navigation/desktop/main-nav-client.tsx`
- Mobile public navigation: `src/features/navigation/mobile/mobile-bottom-nav.tsx`, `src/features/navigation/mobile/public-mobile-nav-client.tsx`
- Footer: `src/app/(site)/_components/footer.tsx`
- Course reads: `src/entities/course/_services/get-courses-list.ts`, `src/entities/course/_services/get-course.ts`, `src/entities/course/_repositories/course.ts`
- Route rendering for courses: `src/app/(site)/courses/[courseSlug]/page.tsx`, `src/app/(site)/courses/_content/layout-config.ts`

## Open questions

- Должен ли единый источник данных для меню включать только статические страницы, или также публичные курсы из базы данных.
- Должны ли названия курсов в навигации всегда совпадать с `course.title`, или для меню нужен отдельный display label.
- Должен ли футер повторять полный набор пунктов из хедера, или оставаться отдельной группировкой с собственными секциями.
