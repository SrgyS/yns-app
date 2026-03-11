---
date: 2026-03-10
planner: Codex
branch: feat/react-compiler
commit: ebcd6e8
feature: subscription-tariff-cards
based_on: docs/ai/features/subscription-tariff-cards/20-design.md
---

# Plan: subscription-tariff-cards

## Summary
The implementation will keep the existing flat `CourseTariff[]` persistence and checkout contract, but add a subscription-specific matrix workflow in admin and a grouped two-card renderer on the public course page. The work is split so mapping and validation land before UI rendering changes, and each phase can be reviewed and verified independently without widening the scope into the future discount feature.

## Definition of Done
- Functional:
  - `SUBSCRIPTION` courses are edited through exactly two tariff groups: `Без обратной связи` and `С обратной связью`.
  - Each group exposes exactly three tariff slots in admin.
  - Each slot stores `price` and `durationDays`.
  - Public subscription course pages render exactly two tariff cards and up to three purchase options inside each card.
  - Each public purchase option routes to the existing order flow with the concrete `tariffId`.
- Technical:
  - Prisma schema remains unchanged.
  - `adminCourses.course.upsert` keeps the existing flat `tariffs[]` contract.
  - Server validation for `SUBSCRIPTION` enforces the two-group three-slot shape without hardcoding month-only durations.
  - `FIXED_COURSE` behavior remains unchanged.
- Docs:
  - `10-research.md`, `20-design.md`, and `30-plan.md` remain aligned.
  - Implementation work can be logged later in `40-impl-log.md`.

## Phase 1: Add subscription tariff matrix mapping helpers
Goal:
Introduce explicit subscription-specific mapping helpers that convert between flat persisted tariffs and a two-group three-slot form/public view-model while preserving `durationDays`.

Files to change:
- `src/features/admin-panel/courses/_ui/model/use-course-form.tsx`
- `src/features/admin-panel/courses/_ui/model/schema.ts`
- `src/kernel/domain/course.ts` or a new feature-local helper file if a pure tariff utility is needed

Steps:
1. Add a feature-local subscription tariff matrix model for admin usage with two feedback groups and three slots per group.
2. Implement a read-path mapper from flat `courseData.tariffs` into the matrix model, preserving `id`, `price`, and `durationDays`.
3. Implement a submit-path mapper from the matrix model back to flat `CourseUpsertInput['tariffs']`.
4. Keep the existing flat tariff path for `FIXED_COURSE`.
5. If helper logic becomes non-trivial, extract it into a pure helper module instead of embedding all transformation logic into the hook.

Local tests:
- `npm run lint -- src/features/admin-panel/courses/_ui/model`
- `npm run lint:types`
- Optional targeted unit tests for pure mapper helpers if introduced

Acceptance criteria:
- Subscription tariff mapping is centralized and reusable.
- Mapping preserves explicit `durationDays` values rather than deriving them from fixed month presets.
- Fixed-course mapping remains unchanged.
- The codebase has a single clear path for `flat -> matrix -> flat` conversion for subscription tariffs.

Commit message:
- `feat(courses): add subscription tariff matrix mappers`

## Phase 2: Switch admin subscription tariff UI to two cards with three slots
Goal:
Replace the generic tariff row editor with a subscription-specific two-card matrix UI while leaving the fixed-course UI intact.

Files to change:
- `src/features/admin-panel/courses/_ui/form-parts/access-section.tsx`
- `src/features/admin-panel/courses/_ui/model/schema.ts`
- `src/features/admin-panel/courses/_ui/model/use-course-form.tsx`
- Optional new component:
  - `src/features/admin-panel/courses/_ui/form-parts/subscription-tariff-card.tsx`

Steps:
1. Branch `AccessSection` behavior by `contentType`.
2. Keep the current `useFieldArray`-based editor for `FIXED_COURSE`.
3. Add a subscription matrix UI with exactly two cards:
   - `Без обратной связи`
   - `С обратной связью`
4. Inside each card render exactly three editable slot rows.
5. Each slot row must expose:
   - `Цена`
   - `Длительность доступа (дни)`
6. Remove `feedback` checkbox editing and add/remove row actions in subscription mode.
7. Add client validation so all six prices and all six durations are required and positive before submit.
8. Preserve current submission lifecycle, toast behavior, and redirect behavior.

Local tests:
- `npm run lint -- src/features/admin-panel/courses/_ui/form-parts src/features/admin-panel/courses/_ui/model`
- `npm run lint:types`

Acceptance criteria:
- Admin editing for `SUBSCRIPTION` no longer exposes arbitrary add/remove tariff rows.
- Admin editing for `SUBSCRIPTION` shows exactly two cards and exactly three slots per card.
- Each subscription slot captures both `price` and `durationDays`.
- `FIXED_COURSE` still uses the existing generic tariff editor.
- Existing admin save flow still posts a flat `tariffs[]` payload.

Commit message:
- `feat(courses): add subscription tariff matrix editor`

## Phase 3: Tighten server-side validation for subscription tariff shape
Goal:
Enforce the approved subscription tariff constraints in the write service without changing the external tRPC contract.

Files to change:
- `src/features/admin-panel/courses/_services/courses-write.ts`
- `src/features/admin-panel/courses/_schemas.ts` only if a small schema-level refinement is needed while keeping the flat payload

Steps:
1. Add a subscription-specific validation branch inside `CoursesWriteService.validateTariffs`.
2. Require exactly six paid tariffs when `contentType === 'SUBSCRIPTION'`.
3. Require exactly three `feedback=false` tariffs and exactly three `feedback=true` tariffs.
4. Require each subscription tariff to have integer `price >= 1` and integer `durationDays >= 1`.
5. Reject duplicate `(feedback, durationDays)` combinations within the same course payload.
6. Preserve the current validation path for `FIXED_COURSE`.
7. Keep the save path flat and compatible with the existing `deleteMany/create` persistence logic.

Local tests:
- `npm run lint -- src/features/admin-panel/courses/_services/courses-write.ts src/features/admin-panel/courses/_schemas.ts`
- `npm run lint:types`
- Optional focused unit tests for subscription validation helper if extracted

Acceptance criteria:
- Invalid subscription shapes are rejected server-side even if the client payload is forged.
- The server does not hardcode only `30/90/180`; arbitrary positive day durations remain valid.
- Fixed-course validation behavior does not regress.
- The Prisma write path and returned DTO shape remain unchanged.

Commit message:
- `feat(courses): validate subscription tariff grouped shape`

## Phase 4: Render grouped subscription tariff cards on the public course page
Goal:
Update the public tariffs block so subscription courses render two cards with internal purchase options while fixed courses keep the current card-per-tariff behavior.

Files to change:
- `src/app/(site)/courses/_ui/blocks/tariffs-block.tsx`
- `src/kernel/domain/course-page.ts` only if a small presentational extension is required
- `src/app/(site)/courses/_content/layout-config.ts` only if copy or helper text needs adjustment for the new option layout

Steps:
1. Add a subscription-specific grouped view-model in `TariffsBlockComponent`.
2. Group tariffs by `feedback`.
3. Sort each group by `durationDays`.
4. Render exactly two outer cards for subscription courses when matching tariffs exist.
5. Inside each card render up to three purchase options using the concrete flat tariff rows.
6. Reuse the existing duration label behavior:
   - month label when `durationDays % 30 === 0`
   - day label otherwise
7. Keep each CTA linked to the existing order path with the selected `tariffId`.
8. Preserve the current fixed-course rendering path.
9. Leave visual room in the option layout for a future second price line so the later discount phase can show regular price plus personal price without restructuring the component.

Local tests:
- `npm run lint -- 'src/app/(site)/courses/_ui/blocks/tariffs-block.tsx' 'src/kernel/domain/course-page.ts' 'src/app/(site)/courses/_content/layout-config.ts'`
- `npm run lint:types`

Acceptance criteria:
- Subscription public pages show two tariff cards instead of one card per tariff row.
- Each subscription card shows up to three purchase options sorted by `durationDays`.
- Each option uses the exact persisted `tariffId`.
- Duration labels still work for both month-like and arbitrary-day durations.
- Fixed-course tariff rendering remains unchanged.

Commit message:
- `feat(courses): group subscription tariffs into two public cards`

## Phase 5: Verification and implementation log preparation
Goal:
Verify the end-to-end subscription tariff flow and record results for the implementation phase artifact.

Files to change:
- `docs/ai/features/subscription-tariff-cards/40-impl-log.md` when implementation starts
- No product code changes expected unless verification reveals defects

Steps:
1. Run lint and typecheck for changed files and the project-level checks used by the repo.
2. Manually verify admin subscription editing:
   - prefill from existing flat tariffs
   - edit six prices
   - edit six durations in days
   - save successfully
   - re-open and confirm round-trip persistence
3. Manually verify public subscription rendering:
   - exactly two cards
   - up to three options per card
   - duration labels derived from `durationDays`
4. Verify each public CTA reaches the current order path with a concrete `tariffId`.
5. Verify `FIXED_COURSE` screens remain unchanged.
6. Record actual execution details and results in `40-impl-log.md`.

Local tests:
- `npm run lint`
- `npm run lint:types`
- Optional focused test runs if helpers/components gain dedicated tests during implementation

Acceptance criteria:
- Lint and typecheck pass, or any failure is documented with exact scope and cause.
- Subscription admin edit flow round-trips flat tariff data through the new matrix UI.
- Public subscription cards route purchases through the existing checkout contract.
- Fixed-course tariff behavior does not regress.

Commit message:
- `chore(courses): verify subscription tariff card rollout`

## Test plan (consolidated)
- Unit:
  - Add or run focused tests for pure helper functions if matrix mapping or grouped validation is extracted into isolated modules.
  - Validate `flat -> matrix -> flat` round-trip behavior for subscription tariffs.
  - Validate subscription write rules reject malformed grouped shapes and accept arbitrary positive `durationDays`.
- Integration:
  - Exercise `adminCourses.course.get` -> form prefill -> `adminCourses.course.upsert` round-trip for a subscription course.
  - Exercise public `TariffsBlockComponent` rendering against subscription tariff fixtures.
- Manual:
  - Confirm exactly two admin cards and exactly two public cards for subscription courses.
  - Confirm arbitrary positive `durationDays` values render correctly.
  - Confirm each CTA preserves the selected flat `tariffId`.
- E2E:
  - Not required initially unless the repo already has coverage for admin course editing or public course purchase flow that can be extended cheaply.

## Security checklist
- AuthZ:
  - Confirm `adminCourses.course.get` and `upsert` remain behind `checkAbilityProcedure` with `canManageCourses`.
- Input validation:
  - Confirm server-side `SUBSCRIPTION` validation rejects malformed flat payloads even when the client is bypassed.
- Price integrity:
  - Confirm public grouping logic is display-only and checkout still charges the persisted `selectedTariff.price`.
- IDOR:
  - Confirm no new unprotected route or bypass path is added for tariff editing or purchase.
- XSS:
  - Confirm any new duration helper text or card labels remain plain text and do not introduce HTML rendering.
- Future discount compatibility:
  - Confirm the public option layout can later display both regular price and personal price without changing the purchase contract in this phase.

## Rollout / migration steps
- Steps:
1. Merge mapping helpers and admin UI changes.
2. Merge server-side subscription validation.
3. Merge public grouped rendering.
4. Run lint and typecheck.
5. Deploy as a single application release because no Prisma migration is required.

- Rollback:
1. Revert the subscription-specific admin matrix UI to the current flat tariff editor.
2. Revert public subscription rendering to one-card-per-tariff behavior.
3. Revert subscription-specific validation tightening.
4. Redeploy; no database rollback is required because storage stays flat.

## Risks
- R1: Legacy subscription courses with irregular flat tariffs may not map cleanly into the new `2 groups × 3 slots` admin editor without explicit fallback behavior.
- R2: Tightening subscription validation before the new admin UI is fully deployed could reject old client payloads if releases are split incorrectly.
- R3: Public layout changes may accidentally alter fixed-course rendering if subscription/fixed branching is not kept explicit.
- R4: Arbitrary `durationDays` values could create awkward labels if public formatting logic is not kept consistent for both month-like and day-based values.

## Out-of-scope follow-ups
- F1: Implement personalized discounts based on historical `UserAccess`.
- F2: Add time-since-expiry discount rules for historical access.
- F3: Persist and display both regular price and personalized price in checkout/order reporting paths.
