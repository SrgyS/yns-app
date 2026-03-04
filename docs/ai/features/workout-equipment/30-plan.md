---
date: 2026-03-04
planner: Codex
branch: feat/react-compiler
commit: 19f4bc4
feature: workout-equipment
based_on: docs/ai/features/workout-equipment/20-design.md
---

# Plan: workout-equipment

## Summary
The implementation will update the existing admin workout edit dialog to use catalog-driven checkbox selection for workout equipment while keeping the current `adminWorkouts.workouts.upsert` mutation and Prisma storage unchanged. The work is split into small phases so validation and shared constants land before the UI wiring, and each phase can be linted and typechecked independently.

## Definition of Done
- Functional: the admin workout edit dialog renders equipment checkboxes from `equipmentItems`, allows multi-select, pre-checks stored catalog ids, and saves selected ids through the existing upsert flow.
- Technical: server-side validation accepts only `equipmentItems.id` values, no Prisma schema change is introduced, and existing `canManageCourses` authorization remains in place.
- Docs: `10-research.md`, `20-design.md`, and `30-plan.md` remain present and aligned; implementation progress can be logged in `40-impl-log.md` during coding.

## Phase 1: Shared equipment allowlist
Goal:
Create a reusable allowlist derived from `equipmentItems` so the same source can be consumed by UI and server validation.

Files to change:
- `src/shared/lib/equipment.ts`

Steps:
1. Add an exported derived collection for allowed equipment ids based on `equipmentItems`.
2. Keep `equipmentItems` as the primary source of truth and avoid duplicating ids manually.
3. Export any helper shape needed for efficient lookup in downstream schema/UI code without changing existing site consumers.

Local tests:
- `npm run lint -- src/shared/lib/equipment.ts`
- `npm run lint:types`

Acceptance criteria:
- `src/shared/lib/equipment.ts` exposes a stable reusable allowlist of ids derived from `equipmentItems`.
- Existing imports of `equipmentItems` continue to work without changes.

Commit message:
- `feat(workouts): expose equipment catalog allowlist`

## Phase 2: Server validation tightening
Goal:
Restrict admin workout upsert input so `equipment` accepts only ids from the shared equipment catalog.

Files to change:
- `src/features/admin-panel/workouts/_schemas.ts`
- `src/shared/lib/equipment.ts` (only if an additional export is needed after implementation)

Steps:
1. Import the shared equipment allowlist into `workoutUpsertInputSchema`.
2. Replace the current generic `z.array(z.string().trim()).default([])` with a schema that only accepts catalog ids.
3. Preserve the existing shape of the upsert payload so `AdminWorkoutsController` and Prisma persistence do not need structural changes.
4. Ensure the empty-array case remains valid.

Local tests:
- `npm run lint -- src/features/admin-panel/workouts/_schemas.ts src/shared/lib/equipment.ts`
- `npm run lint:types`

Acceptance criteria:
- `workoutUpsertInputSchema` rejects non-catalog equipment ids.
- `equipment: []` remains valid input.
- `AdminWorkoutsController.upsertWorkout` can continue writing `input.equipment` without additional contract changes.

Commit message:
- `feat(workouts): validate equipment against shared catalog`

## Phase 3: Checkbox equipment field UI
Goal:
Replace the free-text equipment entry in the admin workout edit dialog with a checkbox-based selector built from the shared catalog.

Files to change:
- `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx`
- `src/features/admin-panel/workouts/_ui/workout-equipment-field.tsx` (new)
- `src/shared/lib/equipment.ts` (read-only consumption unless a small helper export is still needed)

Steps:
1. Create a dedicated feature-level component for rendering the equipment checkbox group from `equipmentItems`.
2. Change dialog edit state so `equipment` is tracked as `string[]` instead of a comma-separated `string`.
3. Map `workout.equipment ?? []` directly into dialog state when loading workout details.
4. Replace the current text `Input` control with the checkbox component and wire multi-select state updates.
5. Submit the selected `string[]` directly in `handleSave`, preserving empty-array behavior when nothing is selected.
6. Keep the existing dialog success and error handling unchanged apart from the equipment field behavior.

Local tests:
- `npm run lint -- src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx src/features/admin-panel/workouts/_ui/workout-equipment-field.tsx`
- `npm run lint:types`

Acceptance criteria:
- The dialog renders one checkbox per `equipmentItems` entry.
- Multiple selections are possible.
- Existing workout equipment ids returned by `get` appear checked when they match catalog ids.
- Saving sends `equipment: string[]` directly, with `[]` when nothing is selected.
- The previous comma-separated text input is removed from the dialog.

Commit message:
- `feat(workouts): add checkbox equipment selector to admin dialog`

## Phase 4: End-to-end feature verification pass
Goal:
Verify the integrated feature path and capture implementation results for the next workflow artifact.

Files to change:
- `docs/ai/features/workout-equipment/40-impl-log.md` (new, if implementation is performed immediately after approval)
- No product code changes expected unless verification reveals defects

Steps:
1. Run lint and typecheck for the affected files and the broader project checks used by the repo.
2. Manually verify the admin edit flow: open dialog, confirm checkbox rendering, confirm preselected values, save, and re-open to confirm persisted values.
3. Verify that invalid ad hoc values are no longer accepted by the server contract.
4. Record actual implementation/test outcomes in `40-impl-log.md` during the implementation phase.

Local tests:
- `npm run lint`
- `npm run lint:types`
- Optional targeted tests if present for admin workouts UI/schema

Acceptance criteria:
- Lint and typecheck pass, or failures are documented with exact scope and cause.
- The edit dialog round-trip persists catalog ids correctly through `get` and `upsert`.
- Implementation log is ready to capture execution details without widening scope.

Commit message:
- `chore(workouts): verify equipment selector rollout`

## Test plan (consolidated)
- Unit: if practical, add or run focused tests for the schema validation path so invalid equipment ids are rejected and valid ids pass.
- Integration: manually exercise `adminWorkouts.workouts.get` -> dialog state -> `adminWorkouts.workouts.upsert` round-trip in the admin workouts UI.
- E2E: not required for the initial change unless the repo already has an admin workouts browser test that can be extended with the checkbox flow.

## Security checklist
- AuthZ: confirm `adminWorkouts.workouts.get` and `upsert` continue to use `checkAbilityProcedure` with `canManageCourses`.
- IDOR: confirm no new route or bypass path is added; all edits still go through the existing protected tRPC procedures.
- Validation: confirm server-side schema enforces the shared equipment allowlist even if a client sends a forged payload.
- Storage (if applicable): not applicable; this feature does not add storage access.
- Secrets: confirm no new environment variables or secrets are introduced.

## Rollout / migration steps
- Steps:
1. Merge shared allowlist and schema validation.
2. Merge the dialog UI update using the same mutation contract.
3. Run project lint/typecheck.
4. Deploy as a single application release because no database migration is needed.

- Rollback:
1. Revert the dialog from checkbox state back to the text input.
2. Restore the previous permissive `equipment` Zod schema.
3. Redeploy; no database rollback is required.

## Risks
- R1: Existing workouts with non-catalog `equipment` values may no longer round-trip cleanly through the edited dialog because legacy handling is intentionally out of scope.
- R2: Tightening Zod validation before the UI change is fully deployed could reject old client payloads if releases are split incorrectly.

## Out-of-scope follow-ups
- F1: Add automated UI coverage for the admin workout equipment selector if this admin area gains broader test coverage later.
- F2: Add explicit operator-facing diagnostics for pre-existing invalid `Workout.equipment` rows if legacy cleanup becomes necessary later.
