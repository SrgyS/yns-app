# Implementation Log: navigation-single-source

## Phase 1

### Lead brief

- Scope: only Phase 1 from `30-plan.md`.
- Deliver a shared public navigation source without wiring it into UI components yet.
- Keep current runtime behavior unchanged for header, footer, and mobile navigation.

### Coder

- Added `src/features/navigation/public-navigation-config.ts` as the single static source for public navigation labels, targets, footer titles, and the static link `Персональная работа`.
- Added `src/features/navigation/_services/get-public-navigation.ts` as a cached server-side builder that reads published courses from `GetCoursesListService` and returns a normalized `PublicNavigationModel`.
- Updated `src/features/navigation/nav-items.ts` so public navigation ownership now comes from `PUBLIC_STATIC_NAV_ITEMS` instead of a duplicated local array.
- Updated `src/features/navigation/index.ts` to export the new public navigation service, config, and types.
- Fixes addressed:
  - `R1`: replaced unsafe public navigation key casts with a narrowed static key type.
  - `R2`: added graceful degradation and logging when published courses cannot be loaded for public navigation.
  - `T1`: added explicit typing for the published courses list in `getPublicNavigation()`.
  - `T2`: excluded footer-only static links from `PUBLIC_NAV_ITEMS` typing and mapping.

### Reviewer

- Pass
- Notes:
  - `R1` closed: public navigation keys are now narrowed without unsafe casts.
  - `R2` closed: `getPublicNavigation()` now degrades safely when course loading fails.

### Security

- Pass
- Notes:
  - No new auth, CSRF, injection, or data exposure risk introduced in Phase 1.
  - Public navigation still reads published courses only through `GetCoursesListService`.

### Tester

- Pass
- Commands:
  - `npm run lint -- src/features/navigation`
  - `npm run lint:types`
- Notes:
  - `T1` closed: explicit typing added for the published course list.
  - `T2` closed: footer-only keys no longer leak into `PUBLIC_NAV_ITEMS` typing.
  - `npm run lint -- src/features/navigation` completed with one unrelated existing warning in `src/app/not-found.tsx`.

## Phase 2

### Lead brief

- Scope: only Phase 2 from `30-plan.md`.
- Switch desktop public navigation to the unified public navigation model.
- Add the desktop dropdown `Курсы` with dynamic course links and the static link `Персональная работа`.

### Coder

- Updated `src/features/navigation/desktop/main-nav.tsx` so the public variant now loads `getPublicNavigation()` on the server and passes normalized data into `MainNavClient`.
- Updated `src/features/navigation/desktop/main-nav-client.tsx` so the public variant no longer reads `PUBLIC_NAV_ITEMS` directly.
- Added desktop dropdown `Курсы` using existing dropdown primitives from `src/shared/ui/dropdown-menu.tsx`.
- Kept private desktop navigation behavior unchanged and preserved active-route handling for standard links.
- Fixes addressed:
  - `T3`: corrected the public navigation link type import used by the desktop client.

### Reviewer

- Pass
- Notes:
  - Public desktop navigation now consumes the shared server-built public navigation model.
  - Scope stayed within Phase 2: only desktop navigation files were updated.

### Security

- Pass
- Notes:
  - Dropdown links render plain text labels from `course.title`.
  - No new auth-sensitive branching or client-side data fetching was introduced.

### Tester

- Pass
- Commands:
  - `npm run lint -- src/features/navigation/desktop`
  - `npm run lint:types`
- Notes:
  - `T3` closed: corrected the public navigation link type import used by the desktop client.
  - `npm run lint -- src/features/navigation/desktop` completed with one unrelated existing warning in `src/app/not-found.tsx`.

## Phase 3

### Lead brief

- Scope: only Phase 3 from `30-plan.md`.
- Switch public mobile navigation to the unified public navigation model.
- Keep auth-dependent profile/login behavior unchanged.

### Coder

- Updated `src/features/navigation/mobile/mobile-bottom-nav.tsx` so the public variant now loads `getPublicNavigation()` instead of fetching courses directly.
- Updated `src/features/navigation/mobile/public-mobile-nav-client.tsx` so it now receives normalized `menuItems` and `courseItems` props.
- Removed direct dependence on `PUBLIC_NAV_ITEMS` and `Course` from the public mobile client.
- Kept the existing public mobile layout and auth-specific actions unchanged.

### Reviewer

- Pass
- Notes:
  - Public mobile navigation now consumes the shared server-built public navigation model.
  - Scope stayed within Phase 3: only mobile public navigation files were updated.

### Security

- Pass
- Notes:
  - Public mobile links still render plain text labels only.
  - Auth-dependent profile/login actions remain derived from `getNavigationContext()`.

### Tester

- Pass
- Commands:
  - `npm run lint -- src/features/navigation/mobile`
  - `npm run lint:types`
- Notes:
  - Public mobile menu and course sheet now receive normalized props from the server.
  - `npm run lint -- src/features/navigation/mobile` completed with one unrelated existing warning in `src/app/not-found.tsx`.

## Phase 4

### Lead brief

- Scope: only Phase 4 from `30-plan.md`.
- Switch footer to the unified public navigation model.
- Preserve the current footer layout and grouping.

### Coder

- Updated `src/app/(site)/_components/footer.tsx` so it now loads `getPublicNavigation()` on the server.
- Removed the local hardcoded `footerSections` constant.
- Mapped the shared footer navigation model into the existing footer rendering structure.
- Kept the current desktop/mobile footer layout unchanged.

### Reviewer

- Pass
- Notes:
  - Footer now consumes the shared server-built public navigation model.
  - Scope stayed within Phase 4: only the footer source of truth changed.

### Security

- Pass
- Notes:
  - Footer links still render plain text labels and trusted href values from the shared navigation model.
  - No new client-side fetching or auth-sensitive behavior was introduced in the footer.

### Tester

- Pass
- Commands:
  - `npm run lint -- src/app/'(site)'/_components/footer.tsx`
  - `npm run lint:types`
- Notes:
  - Footer renders correctly as an async server component consuming `getPublicNavigation()`.
  - `npm run lint -- src/app/'(site)'/_components/footer.tsx` completed with one unrelated existing warning in `src/app/not-found.tsx`.
