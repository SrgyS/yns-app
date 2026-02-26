# Refactor Task — Sonar Rules Compliance (S3776 / S7744 / S1874) + JSX Branch Control

## Goal
Refactor the target TypeScript/React file to comply with these Sonar rules while keeping behavior unchanged.

## Rules to enforce

### 1) Cognitive Complexity (typescript:S3776)
- Keep **Cognitive Complexity ≤ 15 per function**.
- Avoid deep nesting and complex condition chains.
- Prefer extracting smaller, well-named helper functions over adding branches/nesting.
- Early returns are preferred to reduce nesting.
- Keep functions focused: one responsibility per function.

### 2) Useless fallback in object spread (typescript:S7744)
- Do **not** use fallback objects when spreading in object literals:
  - Forbidden: `{ ...(foo || {}) }`, `{ ...(foo ?? {}) }`
  - Required: `{ ...foo }`
- Object spread safely ignores `null` / `undefined` without throwing.
- Note: This applies to **object literals**, not array spreads.

### 3) Deprecated APIs/types (typescript:S1874)
- Do **not** introduce deprecated APIs/types.
- If you encounter `@deprecated`, replace with the recommended alternative.
- Avoid creating new usages of deprecated symbols.

### 4) Conditional branches in JSX (local project rule)
- In a single React component render function, keep JSX conditional branches to **max 3**.
- Count ternaries, logical `&&` conditions, and early JSX condition blocks.
- If the limit is exceeded, extract parts into small local subcomponents/helpers.
- Preserve behavior while splitting: no UI/logic side-effect changes.

## Scope fence
- Refactor only the specified file (and at most: tiny local helpers in the same file if needed).
- **No behavior changes** (UI, business logic, side effects) beyond refactor.
- No unrelated code style or formatting changes.
- No dependency upgrades.
- No API contract changes.
- No moving modules across FSD layers.

## Deliverables
1) Updated file with refactor applied.
2) A short summary of changes:
   - Which functions were split to reduce S3776
   - Which spreads were fixed for S7744
   - Which deprecated usages were replaced for S1874
   - Which JSX-heavy blocks were extracted to satisfy branch limit
3) Commands to run locally to validate (lint/typecheck/tests as available).

## Refactor checklist (agent must follow)
- [ ] Identify functions over complexity threshold and split them into helpers.
- [ ] Replace deep nesting with early-return guards where reasonable.
- [ ] Replace any `{ ...(x || {}) }` / `{ ...(x ?? {}) }` with `{ ...x }`.
- [ ] Search for `@deprecated` and TypeScript warnings; replace with recommended alternatives.
- [ ] Reduce JSX conditional branches to max 3 per render function via extraction.
- [ ] Ensure no new deprecated symbols are introduced.
- [ ] Ensure refactor preserves behavior (no logic changes, no removed edge handling).
- [ ] Ensure code compiles and lint passes.

## Output format (agent response)
- **Files changed:** `<path>`
- **S3776 fixes:** (list functions refactored + new helpers created)
- **S7744 fixes:** (list locations changed)
- **S1874 fixes:** (list deprecated symbols replaced + what used instead)
- **JSX branch fixes:** (list components/blocks extracted)
- **Verification commands:** (list)
- **Notes:** (any risks/edge cases checked)
