---
date: 2026-03-10
reviewer: Codex
branch: feat/react-compiler
commit: ebcd6e8
feature: subscription-tariff-cards
---

# Review: subscription-tariff-cards

## Findings
- No open correctness bugs were identified in the final changed files during self-review after the post-implementation fix to default subscription slot durations.

## What shipped
- User-facing:
  - `SUBSCRIPTION` courses now use a two-card tariff editor in admin with three slots per group and explicit `durationDays` editing.
  - Public subscription course pages now group tariffs into two cards and render purchase options inside each card.
- Internal:
  - Flat `CourseTariff[]` persistence was preserved.
  - Subscription-specific mapping helpers were added for `flat -> matrix -> flat`.
  - `CoursesWriteService` now validates the grouped subscription shape server-side.

## Design compliance
- Matches design: Yes
- Deviations:
  - D1: Default subscription slot durations were initialized to `30/90/180` days to avoid immediate client-side duplicate-duration validation failures. This stays within the approved design because durations remain fully editable and are not server-hardcoded.

## Code quality
- Layering rules: Pass
- Cross-entity repository imports: Pass
- Readability rules (S7735, S3358): Pass
- DI wiring: Pass
- Error handling: Pass
- Caching strategy alignment: Pass

## Security
- AuthN (NextAuth session): Pass
- AuthZ + ownership checks (IDOR): Pass
- Input validation: Pass
  - Client validation now enforces positive `price` and `durationDays` for subscription slots.
  - Server validation now enforces exactly six subscription tariffs, split `3 + 3` by `feedback`, with unique `(feedback, durationDays)` combinations.
- Price integrity: Pass
  - Public grouping is display-only.
  - Checkout still charges the persisted `selectedTariff.price` from the chosen flat tariff row.
- Injection safety: Pass
- CSRF / cross-origin: Pass
- Storage security: Pass
- Secrets handling: Pass
Required fixes:
- None.

## Performance
- Query patterns / N+1 risks: Pass
- React Query invalidation: Pass
- Any heavy SSR/CSR work: Pass
  - The new admin and public mapping logic is local array processing over small tariff lists.

## Tests & verification
- Commands run:
  - `npm run lint -- src/features/admin-panel/courses/_ui/model/subscription-tariffs.ts src/features/admin-panel/courses/_ui/model/schema.ts src/features/admin-panel/courses/_ui/model/use-course-form.tsx src/features/admin-panel/courses/_ui/form-parts/access-section.tsx 'src/app/(site)/courses/_ui/blocks/tariffs-block.tsx' src/features/admin-panel/courses/_services/courses-write.ts`
  - `npm run lint:types`
- Results:
  - `npm run lint:types`: Pass
  - `npm run lint`: Pass with one pre-existing warning outside feature scope in `src/app/not-found.tsx`
- Unit coverage notes:
  - No dedicated unit tests were added for subscription mapping helpers or grouped validation.
- E2E notes:
  - No browser automation or Playwright flow was added.
- Manual verification:
  - Not run in this environment.
Required fixes:
- None.

## Residual risks
- R1: Legacy subscription courses with irregular tariff rows may prefill into the new matrix imperfectly because no explicit legacy migration or operator warning flow was implemented.
- R2: Public subscription cards currently display one active price line per option; the future personalized discount phase will still need explicit UI and server price-resolution work to show both regular and personal prices.
- R3: Manual browser validation is still required to confirm visual layout, admin prefill, and CTA behavior with real course data.

## Release readiness
- Migrations safe: Yes
- Rollback plan: Yes
- Backward compatibility: Partial
  - Fixed-course behavior is preserved.
  - Flat tariff storage and `tariffId` checkout contract are preserved.
  - Legacy irregular subscription tariffs are not normalized by migration.

## Final decision
Approved: Yes
Conditions:
- Run a manual browser verification for one existing subscription course and one fixed course before release.
- Confirm with real data that any legacy subscription course currently in admin either already fits the `2 groups × 3 slots` shape or can be safely edited without losing intended tariff rows.
