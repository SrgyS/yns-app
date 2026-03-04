# Implementation Log: workout-equipment

## 2026-03-04

### Phase 1: Shared equipment allowlist
- Role: Lead
- Scope: `Phase 1` from `docs/ai/features/workout-equipment/30-plan.md`
- Brief: Expose a reusable allowlist derived from `equipmentItems` in `src/shared/lib/equipment.ts` without changing existing consumers.

- Role: Coder
- Changes:
- Added `equipmentItemIds` as a derived exported id allowlist in `src/shared/lib/equipment.ts`.
- Added `isEquipmentItemId(value: string)` backed by a local lookup set in `src/shared/lib/equipment.ts`.
- Fixes addressed:
- None.

- Role: Reviewer
- Verdict: Pass
- Notes:
- Scope is limited to Phase 1.
- Existing `equipmentItems` export remains intact.
- The new allowlist is derived from the catalog and avoids manual duplication.

- Role: Security
- Verdict: Pass
- Notes:
- No auth, storage, or input-surface expansion was introduced.
- The added helper only narrows future validation options and does not create a new attack surface.

- Role: Tester
- Verdict: Pass
- Commands run:
- `npm run lint -- src/shared/lib/equipment.ts`
- `npm run lint:types`
- Verification:
- Confirm the file compiles and exports remain importable.
- `npm run lint -- src/shared/lib/equipment.ts` completed with 1 pre-existing warning outside Phase 1 scope in `src/app/(site)/courses/_ui/blocks/testimonials-block.tsx`.
- `npm run lint:types` completed successfully.

### Phase 2: Server validation tightening
- Role: Lead
- Scope: `Phase 2` from `docs/ai/features/workout-equipment/30-plan.md`
- Brief: Restrict `workoutUpsertInputSchema.equipment` to values from the shared equipment catalog without changing the existing mutation shape or controller persistence.

- Role: Coder
- Changes:
- Imported `isEquipmentItemId` into `src/features/admin-panel/workouts/_schemas.ts`.
- Replaced the permissive `equipment` schema with per-item refinement that accepts only shared catalog ids.
- Kept `equipment` as `string[]` and preserved the `.default([])` behavior.
- Fixes addressed:
- None.

- Role: Reviewer
- Verdict: Pass
- Notes:
- Scope is limited to Phase 2.
- The mutation contract shape is unchanged.
- Validation is now sourced from the shared catalog helper rather than duplicated inline values.

- Role: Security
- Verdict: Pass
- Notes:
- The change narrows accepted input and reduces forged payload acceptance.
- No new route, permission branch, or persistence side effect was introduced.

- Role: Tester
- Verdict: Pass
- Commands run:
- `npm run lint -- src/features/admin-panel/workouts/_schemas.ts src/shared/lib/equipment.ts`
- `npm run lint:types`
- Verification:
- Confirm valid catalog ids typecheck and parse through the schema path.
- `npm run lint -- src/features/admin-panel/workouts/_schemas.ts src/shared/lib/equipment.ts` completed with 1 pre-existing warning outside Phase 2 scope in `src/app/(site)/courses/_ui/blocks/testimonials-block.tsx`.
- `npm run lint:types` completed successfully.

### Phase 3: Checkbox equipment field UI
- Role: Lead
- Scope: `Phase 3` from `docs/ai/features/workout-equipment/30-plan.md`
- Brief: Replace the text equipment input in `WorkoutEditDialog` with a catalog-driven checkbox field while keeping the existing save success/error flow and mutation contract.

- Role: Coder
- Changes:
- Added `src/features/admin-panel/workouts/_ui/workout-equipment-field.tsx` to render one checkbox per `equipmentItems` entry.
- Changed `EditState.equipment` in `WorkoutEditDialog` from `string` to `string[]`.
- Mapped `workout.equipment ?? []` directly into dialog state and now submit `editState.equipment` as-is.
- Removed the previous comma-separated equipment text field from the dialog and replaced it with `WorkoutEquipmentField`.
- Fixes addressed:
- None.

- Role: Reviewer
- Verdict: Pass
- Notes:
- Scope is limited to Phase 3.
- The UI now matches the approved checkbox interaction model.
- Existing mutation flow and success/error handlers remain unchanged.

- Role: Security
- Verdict: Pass
- Notes:
- The UI no longer encourages arbitrary free-text input for equipment values.
- No new route, permission change, or storage behavior was introduced.

- Role: Tester
- Verdict: Pass
- Commands run:
- `npm run lint -- src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx src/features/admin-panel/workouts/_ui/workout-equipment-field.tsx`
- `npm run lint:types`
- Verification:
- Confirm the dialog can represent multi-select equipment as `string[]` and still compile.
- `npm run lint -- src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx src/features/admin-panel/workouts/_ui/workout-equipment-field.tsx` completed with 1 pre-existing warning outside Phase 3 scope in `src/app/(site)/courses/_ui/blocks/testimonials-block.tsx`.
- `npm run lint:types` completed successfully.

### Phase 3 follow-up: shadcn checkbox alignment
- Role: Lead
- Scope: User-requested UI consistency follow-up inside the completed Phase 3 surface.
- Brief: Replace native checkbox inputs in `WorkoutEquipmentField`, `subsections`, and `muscles` with the shared `Checkbox` component from `src/shared/ui/checkbox.tsx` while preserving state behavior.

- Role: Coder
- Changes:
- Replaced the native checkbox in `src/features/admin-panel/workouts/_ui/workout-equipment-field.tsx` with `Checkbox`.
- Replaced the native checkbox controls for `subsections` and `muscles` in `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx` with `Checkbox`.
- Preserved the existing selection logic by switching from `onChange` to `onCheckedChange`.
- Fixes addressed:
- None.

- Role: Reviewer
- Verdict: Pass
- Notes:
- The change is limited to presentation-layer checkbox primitives.
- Selection behavior remains unchanged.

- Role: Security
- Verdict: Pass
- Notes:
- No new input surface or permission path was introduced.
- The follow-up is UI-only and preserves the stricter server validation already in place.

- Role: Tester
- Verdict: Pass
- Commands run:
- `npm run lint -- src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx src/features/admin-panel/workouts/_ui/workout-equipment-field.tsx`
- `npm run lint:types`
- Verification:
- Confirm the updated checkbox controls compile with `onCheckedChange`.
- `npm run lint -- src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx src/features/admin-panel/workouts/_ui/workout-equipment-field.tsx` completed with 1 pre-existing warning outside this follow-up scope in `src/app/(site)/courses/_ui/blocks/testimonials-block.tsx`.
- `npm run lint:types` completed successfully.

### Phase 4: End-to-end feature verification pass
- Role: Lead
- Scope: `Phase 4` from `docs/ai/features/workout-equipment/30-plan.md`
- Brief: Run the planned verification commands, review the integrated change set, and record the verification outcome for the completed feature.

- Role: Coder
- Changes:
- No product code changes were required during the verification pass.
- Reviewed the integrated diff for `equipment.ts`, `_schemas.ts`, `workout-edit-dialog.tsx`, and `workout-equipment-field.tsx` against the approved plan.
- Fixes addressed:
- None.

- Role: Reviewer
- Verdict: Pass
- Notes:
- The delivered code matches the approved scope: shared allowlist, server-side validation, checkbox UI, and the shadcn checkbox alignment follow-up.
- No extra API, Prisma, or architecture changes were introduced.

- Role: Security
- Verdict: Pass
- Notes:
- Authorization remains on the existing protected tRPC procedures.
- Server-side validation continues to enforce catalog-only ids even if the UI payload is forged.
- No storage or secret handling changes were introduced.

- Role: Tester
- Verdict: Pass
- Commands run:
- `npm run lint`
- `npm run lint:types`
- Verification:
- `npm run lint` completed with 1 pre-existing warning outside feature scope in `src/app/(site)/courses/_ui/blocks/testimonials-block.tsx`.
- `npm run lint:types` completed successfully.
- Code-level verification confirms the flow `get` -> dialog state `string[]` -> `upsert` remains wired.
- Manual browser verification of the admin dialog was not executed in this environment.
