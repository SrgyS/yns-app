# Design: navigation-single-source

## Goal

Убрать ручное дублирование публичного меню и списка курсов в `Footer`, desktop navigation и mobile navigation, чтобы все публичные точки навигации использовали единый источник данных.

## Context

- Public shell: `src/app/(site)/layout.tsx`
- Public header: `src/features/headers/site-header.tsx`
- Desktop nav: `src/features/navigation/desktop/main-nav.tsx`
- Mobile nav: `src/features/navigation/mobile/mobile-bottom-nav.tsx`
- Footer: `src/app/(site)/_components/footer.tsx`
- Course source: `src/entities/course/_services/get-courses-list.ts`

## Component Diagram (C4 Level 3)

### People

- Visitor

### Components

- `SiteLayout`
  - File: `src/app/(site)/layout.tsx`
  - Responsibility: compose public page shell.
- `PublicNavigationService`
  - New server-side service in `src/features/navigation`
  - Responsibility: produce a normalized navigation model for public surfaces.
- `PublicNavigationConfig`
  - New shared config in `src/features/navigation`
  - Responsibility: store static public navigation definitions and footer grouping rules.
- `GetCoursesListService`
  - Existing service in `src/entities/course/_services/get-courses-list.ts`
  - Responsibility: return published courses from repository.
- `MainNav`
  - Existing desktop navigation entrypoint.
  - Responsibility: render public desktop menu from unified model, including a `Курсы` dropdown.
- `PublicMobileNavClient`
  - Existing mobile public navigation UI.
  - Responsibility: render public mobile menu and course sheet from unified model.
- `Footer`
  - Existing footer component.
  - Responsibility: render grouped footer sections from unified model.

### Relationships

- `SiteLayout` uses `MainNav`, `Footer`, `MobileBottomNav`.
- `MainNav`, `Footer`, and `MobileBottomNav` consume data from `PublicNavigationService`.
- `PublicNavigationService` reads:
  - static page items from `PublicNavigationConfig`
  - public courses from `GetCoursesListService`
- `GetCoursesListService` reads from `CoursesRepository`.

## To-be Data Model

### Static navigation item

```ts
type PublicStaticNavItem = {
  key: string
  label: string
  href: string
  targets: Array<'desktop' | 'mobile' | 'footer'>
  section?: 'main' | 'footer-secondary'
  order: number
}
```

### Public course navigation item

```ts
type PublicCourseNavItem = {
  key: string
  label: string
  href: string
  slug: string
  order: number
}
```

### Public navigation model

```ts
type PublicNavigationModel = {
  desktopItems: Array<{ key: string; label: string; href: string }>
  desktopCoursesMenu: {
    key: string
    label: string
    links: Array<{ key: string; label: string; href: string }>
  }
  mobileMenuItems: Array<{ key: string; label: string; href: string }>
  footerSections: Array<{
    key: string
    title: string
    links: Array<{ key: string; label: string; href: string }>
  }>
  courseItems: PublicCourseNavItem[]
}
```

## To-be Data Flow

Entrypoint -> validation -> domain/service -> repository -> response

- `Layout()` in `src/app/(site)/layout.tsx`
- `MainNav()`, `Footer()`, `MobileBottomNav()` request public navigation data
- `PublicNavigationService.getPublicNavigation()`
- normalize static config from `PublicNavigationConfig`
- call `GetCoursesListService.exec()`
- `CoursesRepository.coursesList({ includeDrafts: false })`
- map `Course[]` to navigation items `/courses/${course.slug}`
- build `PublicNavigationModel`
- return model to UI components
- render:
  - desktop header items
  - desktop `Курсы` dropdown
  - mobile menu items
  - mobile course list
  - footer sections

## Sequence Diagram

```text
Visitor -> SiteLayout: request page
SiteLayout -> MainNav: render public nav
MainNav -> PublicNavigationService: getPublicNavigation()
PublicNavigationService -> PublicNavigationConfig: read static items
PublicNavigationService -> GetCoursesListService: exec()
GetCoursesListService -> CoursesRepository: coursesList()
CoursesRepository -> DB: select published courses
DB -> CoursesRepository: courses
CoursesRepository -> GetCoursesListService: Course[]
GetCoursesListService -> PublicNavigationService: Course[]
PublicNavigationService -> MainNav: PublicNavigationModel
MainNav -> Visitor: desktop menu + courses dropdown

SiteLayout -> MobileBottomNav: render public mobile nav
MobileBottomNav -> PublicNavigationService: getPublicNavigation()
PublicNavigationService -> MobileBottomNav: PublicNavigationModel
MobileBottomNav -> Visitor: mobile menu + course sheet

SiteLayout -> Footer: render footer
Footer -> PublicNavigationService: getPublicNavigation()
PublicNavigationService -> Footer: PublicNavigationModel
Footer -> Visitor: grouped footer links
```

## Contracts

### PublicNavigationService contract

```ts
type GetPublicNavigationResult = PublicNavigationModel

interface PublicNavigationService {
  getPublicNavigation(): Promise<GetPublicNavigationResult>
}
```

### UI input contracts

`MainNavClient` for public variant:

```ts
type PublicMainNavItem = {
  key: string
  label: string
  href: string
}
```

`MainNavClient` public courses dropdown:

```ts
type PublicCoursesDropdown = {
  key: string
  label: string
  links: Array<{
    key: string
    label: string
    href: string
  }>
}
```

`PublicMobileNavClient`:

```ts
type PublicMobileNavData = {
  menuItems: PublicMainNavItem[]
  courseItems: PublicCourseNavItem[]
  profileHref: string
  isAuthenticated: boolean
}
```

`Footer`:

```ts
type FooterSection = {
  key: string
  title: string
  links: Array<{
    key: string
    label: string
    href: string
  }>
}
```

### Errors

- `GetCoursesListService` failure:
  - service returns an empty `courseItems` list and logs the error in server layer.
  - static navigation remains renderable.
- Empty course catalog:
  - public navigation still renders static items and footer sections.
- Invalid static config:
  - TypeScript compilation must fail if a required field is missing.

## File-level Design

### New files

- `src/features/navigation/public-navigation-config.ts`
  - stores static public navigation definitions and footer grouping rules.
- `src/features/navigation/_services/get-public-navigation.ts`
  - server-side builder of `PublicNavigationModel`.

### Changed files

- `src/features/navigation/nav-items.ts`
  - keep platform-only navigation here.
  - remove public-only ownership from this file or re-export from the new config module.
- `src/features/navigation/desktop/main-nav.tsx`
  - for public variant, fetch normalized items from `PublicNavigationService`.
- `src/features/navigation/desktop/main-nav-client.tsx`
  - accept public items via props instead of reading `PUBLIC_NAV_ITEMS` directly.
  - render the desktop `Курсы` dropdown from normalized props.
- `src/features/navigation/mobile/mobile-bottom-nav.tsx`
  - for public variant, fetch `PublicNavigationModel` once and pass normalized data down.
- `src/features/navigation/mobile/public-mobile-nav-client.tsx`
  - accept `menuItems` and `courseItems` props instead of importing `PUBLIC_NAV_ITEMS` and building hrefs inline.
- `src/app/(site)/_components/footer.tsx`
  - replace local `footerSections` constant with data from `PublicNavigationService`.
- `src/features/navigation/index.ts`
  - export the new service and related types if needed.

## Rendering Strategy

- Server components remain the place where navigation data is assembled.
- Client components receive plain props and do not know where data came from.
- `MobileBottomNav()` should make one server-side call for public navigation and reuse `getNavigationContext()` only for auth-specific fields.
- Footer and header should consume the same normalized labels and href values.
- Desktop dropdown `Курсы` should use the same course navigation items as the footer course section.

## Caching Strategy

- `PublicNavigationService.getPublicNavigation()` should use `cache()` from React for request-scope deduplication.
- It should delegate to the existing `GetCoursesListService`, which already filters out draft courses by default.
- No React Query is needed because public navigation is assembled on the server during render.

## Prisma / Storage Changes

- No Prisma schema changes.
- No migrations.
- No storage changes.

## tRPC Contracts

- No new tRPC procedures.
- No input/output DTO changes in tRPC.
- No API route changes.

## Security

### Threats

- Draft or non-public courses could leak into navigation if the service reads all courses.
- Navigation labels derived from course titles could render untrusted content if titles are not treated as plain text.
- Divergent authorization behavior could appear if private-only links are mixed into public navigation config.

### Mitigations

- `PublicNavigationService` must call `GetCoursesListService.exec()` without `includeDrafts`, preserving current published-only behavior.
- Course titles must be rendered as plain text in links, with no HTML injection path.
- Static public navigation config must be separated from platform/private navigation config.
- Auth-dependent links such as profile/login remain derived from `getNavigationContext()` and are not merged into public static config.

## Acceptance Shape

- Adding a new public static page link should require editing one navigation config file.
- Adding a new public course in the database should make it appear automatically in:
  - the desktop dropdown `Курсы`
  - public mobile course lists
  - the footer course section
- Header, footer, and mobile public navigation should display consistent labels and hrefs for shared static pages.
- Static link `Персональная работа` should be present in:
  - the desktop dropdown `Курсы`
  - the footer section `Курсы и предложения`

## Reviewed decisions

- Footer section `'Курсы и предложения'` must include:
  - dynamic course links from the published course list;
  - one static link `'Персональная работа'`.
- Desktop public header must include a dropdown `'Курсы'`.
- Dropdown `'Курсы'` must include:
  - dynamic course links from the published course list;
  - one static link `'Персональная работа'`.
- Course link labels in public navigation must come directly from `course.title`.
