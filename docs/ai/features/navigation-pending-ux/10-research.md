# Research: Navigation Pending UX

## Scope

Этот документ фиксирует текущее состояние navigation/pending UX в кодовой базе на момент 2026-03-11. Ниже описаны только факты из существующего кода без рекомендаций.

## Existing brief artifact

- Feature brief находится в `docs/ai/features/navigation-pending-ux/00-brief.md`.
- В репозитории пока отсутствуют файлы или символы `TopProgressBar`, `SmartLink`, `startNavigationFeedback`, `doneNavigationFeedback`, `shared/lib/navigation/navigation-feedback.ts`, `shared/ui/smart-link.tsx`, `shared/ui/top-progress-bar.tsx`. Поиск по `src` и `docs` возвращает совпадения только внутри `00-brief.md`.

## App-level entrypoints

- Корневой layout приложения определяется в `src/app/layout.tsx` функцией `RootLayout()`.
- `RootLayout()` рендерит `<AppProvider>{children}</AppProvider>` внутри `<body>`.
- `src/app/layout.tsx` не монтирует глобальный navigation feedback-компонент или progress bar.
- Клиентские глобальные провайдеры определены в `src/app/_providers/app-provider.tsx` компонентом `AppProvider()`.
- `AppProvider()` монтирует `sharedApi.Provider`, `QueryClientProvider`, `ThemeProvider`, `AppSessionProvider`, `Toaster`, `ActivityTracker` и `children`.
- В `AppProvider()` нет навигационного store, event bus, progress controller или route transition provider.

## Navigation rendering flow

### Private mobile navigation

- Серверный entrypoint приватной нижней навигации: `src/features/navigation/mobile/mobile-bottom-nav.tsx`, функция `MobileBottomNav()`.
- Для `variant === 'private'` `MobileBottomNav()` получает данные через `getNavigationContext()` из `src/features/navigation/nav-context.ts` и передает их в `MobileBottomNavClient`.
- `getNavigationContext()` использует `SessionService`, `GetActiveEnrollmentService`, `GetUserEnrollmentsService` из `src/features/navigation/nav-context.ts`.
- Data flow для `getNavigationContext()` сейчас такой:
  1. entrypoint: `MobileBottomNav()` в `src/features/navigation/mobile/mobile-bottom-nav.tsx`
  2. validation/auth check: `SessionService.get()` в `src/features/navigation/nav-context.ts`
  3. domain/service: `GetActiveEnrollmentService.exec(userId)` и `GetUserEnrollmentsService.exec(userId)` в `src/features/navigation/nav-context.ts`
  4. response shaping: `getNavigationContext()` вычисляет `planUrl`, `hasActiveCourse`, `hasAnyCourses`, `profileHref`, `isAuthenticated`
  5. response consumption: `MobileBottomNavClient` получает props `planUrl`, `hasActiveCourse`, `hasAnyCourses`, `profileHref`, `isAuthenticated`
- Клиентская логика приватной нижней навигации находится в `src/features/navigation/mobile/mobile-bottom-nav-client.tsx`, компонент `MobileBottomNavClient()`.
- `MobileBottomNavClient()` использует `usePathname()` для определения активного маршрута.
- `MobileBottomNavClient()` хранит локальный pending state через `pendingHref` в `useState()` и модульную переменную `lastPendingHref`.
- В `MobileBottomNavClient()` символ `isActive()` определяет активность по точному совпадению `pathname === href` либо `pathname.startsWith(normalizedHref + '/')`.
- В `MobileBottomNavClient()` обработчик `onClick` у `Link`:
  - отменяет переход через `event.preventDefault()`, если текущий пункт уже активен
  - записывает `lastPendingHref = href` и `setPendingHref(href)`, если клик по новому route
- В `MobileBottomNavClient()` нет вызова `router.push()`, `useTransition()`, глобального progress bar или shared helper для навигационного feedback.
- `pendingHref` очищается в `useEffect()` после того, как `isActive(pendingHref)` начинает возвращать `true`.
- Визуальное состояние pending в `MobileBottomNavClient()` выражается через выбор `active = pendingHref ? isPending : isCurrentRoute`; spinner внутри иконок не используется.

### Public mobile navigation

- Серверный entrypoint публичной нижней навигации: `src/features/navigation/mobile/mobile-bottom-nav.tsx`, функция `MobileBottomNav()` при `variant === 'public'`.
- Для публичного варианта `MobileBottomNav()` использует `getPublicNavigation()` из `src/features/navigation/_services/get-public-navigation` и `getNavigationContext()` из `src/features/navigation/nav-context.ts`.
- Клиентская реализация находится в `src/features/navigation/mobile/public-mobile-nav-client.tsx`, компонент `PublicMobileNavClient()`.
- `PublicMobileNavClient()` использует прямые `Link` из `next/link` для `HomeNavItem()`, `ProfileNavItem()`, ссылок внутри `CoursesSheet()` и `MenuSheet()`.
- `PublicMobileNavClient()` не содержит локального pending state, `usePathname()`, `useTransition()` или shared navigation feedback helpers.

### Desktop navigation

- Серверный entrypoint desktop navigation: `src/features/navigation/desktop/main-nav.tsx`, функция `MainNav()`.
- Для `variant === 'public'` `MainNav()` получает данные через `getPublicNavigation()`.
- Для `variant === 'private'` `MainNav()` получает данные через `getNavigationContext()`.
- Клиентская реализация находится в `src/features/navigation/desktop/main-nav-client.tsx`, компонент `MainNavClient()`.
- `MainNavClient()` использует `usePathname()` и локальный `pendingHref` в `useState()`.
- `MainNavClient()` использует функцию `isPathActive()` для определения активного маршрута по exact match или префиксу.
- В `DesktopNavLink()` из `src/features/navigation/desktop/main-nav-client.tsx` обработчик `onClick`:
  - отменяет переход, если текущий route уже активен
  - вызывает `onNavigate(item.href)` для нового route
- `handleNavigate()` в `MainNavClient()` только сохраняет `pendingHref`; он не вызывает shared helper и не управляет глобальным индикатором.
- `pendingHref` в `MainNavClient()` очищается в `useEffect()` после совпадения `pathname` с pending href.
- В `CoursesDropdown()` ссылки в `DropdownMenuItem` используют прямой `Link` без pending logic.

## Header composition

- Desktop navigation подключается через `TopBar()` в `src/features/headers/top-bar/top-bar.tsx`.
- `TopBar()` рендерит `<MainNav />` для вариантов `public` и `private`.
- `PlatformHeader()` в `src/features/headers/platform-header.tsx` является thin wrapper над `TopBar({ variant: 'private' })`.
- В `src/app/platform/(paid)/layout.tsx` `PlatformLayout()` рендерит `PlatformHeader` на desktop и `MobileBottomNav variant="private"` для mobile.
- `PlatformLayout()` не монтирует локальный progress bar и не передает отдельный navigation feedback provider в children.

## Existing route-level loading behavior

- Поиск по `src/app` находит один route-level loading file: `src/app/platform/(paid)/loading.tsx`.
- `src/app/platform/(paid)/loading.tsx` экспортирует `Loading()`, который показывает только `Spinner` из `@/shared/ui/spinner` внутри абсолютно позиционированного контейнера.
- Этот `Loading()` не является skeleton-экраном и не повторяет структуру конкретной страницы.
- Других `loading.tsx` в `src/app` на момент исследования нет.

## Existing action-based navigation

### Course activation in daily plan

- `src/features/daily-plan/_ui/course-activation-option.tsx`, компонент `CourseActivationOption()`, выполняет action-based navigation.
- Data flow в `CourseActivationOption()` сейчас такой:
  1. entrypoint: `handleSelect()`
  2. domain/service call: `activateEnrollment(enrollmentId)` из `useCourseEnrollment()`
  3. navigation: `router.push(\`/platform/day/${courseSlug}\`)`
  4. response in UI: `Button` блокируется только через `disabled={isActivating}`
- `CourseActivationOption()` не использует `useTransition()` для navigation step и не запускает глобальный navigation feedback helper.

### User courses card

- `src/features/user-courses/_ui/user-course-item.tsx`, компонент `UserCourseItem()`, содержит два сценария:
  - `handleActivate()` вызывает `activateEnrollment(enrollment.id)` и затем `router.refresh()`
  - `handleGoToWorkouts()` инвалидирует React Query cache через `courseEnrollmentUtils.course.getEnrollmentByCourseSlug.invalidate()`, `workoutUtils.getUserDailyPlan.invalidate()`, `courseEnrollmentUtils.course.getEnrollment.invalidate()`, затем вызывает `router.push(\`/platform/day/${course.slug}\`)`
- `UserCourseItem()` показывает inline spinner только для activation action через `SmallSpinner` при `isActivating`.
- В `handleGoToWorkouts()` нет `useTransition()`, локального navigation pending state или shared feedback helper.

### Additional programmatic navigation locations

- Поиск по `src/app`, `src/features`, `src/shared` показывает множественные прямые вызовы `router.push()` и `router.replace()`.
- Примеры action-based переходов:
  - `src/features/practices/_ui/practice-subsection-screen.tsx`
  - `src/features/practices/_ui/favorite-practices-screen.tsx`
  - `src/features/daily-plan/_ui/course-banner.tsx`
  - `src/features/select-training-days/_ui/select-workout-days-client.tsx`
  - `src/features/select-training-days/_ui/edit-workout-days-client.tsx`
  - `src/features/course-order/start-order.tsx`
  - `src/features/course-order/check-order.ts`
  - `src/features/admin-panel/courses/_ui/model/use-course-form.tsx`
  - `src/features/admin-panel/users/_hooks/use-admin-users.ts`
  - `src/app/platform/(paid)/practices/page.tsx`
  - `src/app/platform/(paid)/day/[courseSlug]/day-page-client.tsx`
- На исследованном срезе нет общего wrapper around `router.push()` / `router.replace()` для navigation feedback.

## Existing link usage

- Поиск по `src/app`, `src/features`, `src/shared` показывает множественные прямые импорты `Link` из `next/link`.
- Примеры прямого использования `Link` в data-heavy и navigation-heavy UI:
  - `src/features/admin-panel/courses/admin-courses-page.tsx`, компонент `AdminCoursesPage()`
  - `src/app/(site)/courses/_ui/blocks/hero-block.tsx`, компонент `HeroBlockComponent()`
  - `src/features/courses-list/_ui/course-item.tsx`
  - `src/features/courses-list/_ui/course-action.tsx`
  - `src/features/sidebar/_ui/nav-main.tsx`
  - `src/features/headers/top-bar/_ui/logo.tsx`
  - `src/features/headers/top-bar/_ui/profile.tsx`
  - `src/shared/ui/back-button.tsx`
- В исследованном коде нет единого shared link wrapper для внутренних переходов.

## Current platform route composition relevant to loading

- `src/app/platform/(paid)/layout.tsx`, функция `PlatformLayout()`, выполняет server-side access gating:
  1. entrypoint: `PlatformLayout()`
  2. validation/auth check: `SessionService.get()`
  3. domain/service: `GetAccessibleEnrollmentsService.exec(userId)` и `UserFreezeRepository.findActive(userId)`
  4. response shaping: сбор `paidAccessState`
  5. response: либо `NoAccessCallout`, либо основной layout с `children`
- Из `PlatformLayout()` следует, что ветка `(paid)` уже имеет server data loading до рендера дочерних экранов.
- Текущий `src/app/platform/(paid)/loading.tsx` покрывает только segment `(paid)` целиком.

## Existing shared utilities related to navigation

- `src/shared/lib/cache/use-navigation-with-cache.ts` экспортирует хук `useNavigationWithCache()`.
- `useNavigationWithCache()` выполняет `invalidateCacheGroup()` и затем `router.push(path)`.
- В `useNavigationWithCache()` нет `useTransition()`, top progress orchestration, delay logic или shared done/start feedback API.

## Dependencies and constraints observed in code

- Навигация построена на Next.js App Router API: `next/link`, `usePathname()`, `useRouter()`, route segment `loading.tsx`.
- Глобальные клиентские провайдеры централизованы в `AppProvider()` из `src/app/_providers/app-provider.tsx`.
- Private navigation зависит от server-side `getNavigationContext()` и от auth/session состояния.
- Public navigation зависит от server-side `getPublicNavigation()` и частично от `getNavigationContext()`.
- В mobile и desktop navigation уже существует логика "не выполнять переход на уже активный route", но она реализована локально внутри `MobileBottomNavClient()` и `DesktopNavLink()`.
- В приложении уже есть локальные inline pending patterns для mutation actions, например `SmallSpinner` в `src/features/user-courses/_ui/user-course-item.tsx` и `disabled={isActivating}` в `src/features/daily-plan/_ui/course-activation-option.tsx`.

## Open questions

- Какие конкретные маршруты должны считаться `data-heavy` для обязательных skeleton-экранов, кроме общего сегмента `src/app/platform/(paid)/loading.tsx`, код не определяет.
- Нужно ли покрывать public-site переходы тем же pending UX, что и private/admin routing, из текущего кода и brief это не выводится однозначно.
- Должен ли shared wrapper заменять все внутренние `Link` сразу или только navigation-critical entrypoints, кодовая база сейчас этого не фиксирует.
