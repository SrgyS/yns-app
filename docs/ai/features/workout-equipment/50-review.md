---
date: 2026-03-04
reviewer: Codex
branch: feat/react-compiler
commit: 19f4bc4
feature: workout-equipment
---

# Review: workout-equipment

## What shipped
- User-facing: The admin workout edit dialog now renders equipment selection as checkbox controls driven by `equipmentItems` in `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx` and `src/features/admin-panel/workouts/_ui/workout-equipment-field.tsx`.
- Internal: The shared equipment catalog now exposes a derived id allowlist in `src/shared/lib/equipment.ts`, and `workoutUpsertInputSchema` now validates `equipment` entries against that allowlist in `src/features/admin-panel/workouts/_schemas.ts`.

## Design compliance
- Matches design: Yes
- Deviations:
  - D1: A follow-up requested during implementation also replaced the existing native checkbox inputs for `subsections` and `muscles` with the shared `Checkbox` component in `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx`. This stays inside the approved UI surface and does not change behavior.

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

- DoS / resource exhaustion: Pass
  - Rate limiting on endpoints (esp. SSE/stream): No (not applicable; no new SSE/stream endpoint in this feature)
  - Per-user connection cap / concurrency guard: No (not applicable; no streaming connection model added)
  - Timeouts / max stream duration / idle cutoff: No (not applicable; no streaming behavior added)
  - Backpressure / safe enqueue / try-catch around stream writes: No (not applicable; no stream writes added)

- Injection safety: Pass
  - SSE event-name sanitization (no CRLF) / allowlist: No (not applicable; no SSE)
  - Safe JSON serialization (BigInt/cycles) + error containment: Yes (`tRPC` request/response flow unchanged; no custom serializer introduced)
  - Header/value injection (dynamic headers, filenames): No (not applicable; no header or filename handling added)
  - Log injection / sensitive payload logging avoided: Yes (the feature does not add payload logging in changed files)

- CSRF / cross-origin: Pass
  - Cookies + credentialed requests risk assessed: Yes
  - Origin/Referer allowlist for stateful endpoints (if applicable): No (unchanged existing tRPC mutation surface; no new endpoint-specific CSRF layer added)
  - CORS configuration verified safe (no wildcard with credentials): No (not changed by this feature)
  - Non-idempotent endpoints require CSRF protection: Yes (risk unchanged; this feature reuses the existing protected `adminWorkouts.workouts.upsert` path rather than adding a new unauthenticated endpoint)

- Cleanup & lifecycle: Pass
  - Listeners/subscriptions removed on abort/close/error: Yes (`useEffect` cleanup in `WorkoutEditDialog` remains unchanged; no new subscriptions added)
  - Timers cleared (setInterval/setTimeout): Yes (no timers added)
  - Event listeners removed when no longer needed: Yes (no new event listeners added outside React event handlers)
  - Memory leak check (long-lived maps, caches, per-connection state): Yes (`equipmentItemIdLookup` in `src/shared/lib/equipment.ts` is a module-level static set derived from a small static catalog)

- Storage security (if applicable): Pass
- Secrets handling: Pass
Required fixes:
- None.

## Performance
- Query patterns / N+1 risks: Pass
- React Query invalidation: Pass
- Any heavy SSR/CSR work: Pass

## Tests & verification
- Commands run:
- `npm run lint`
- `npm run lint:types`
- Unit coverage notes:
- No new focused unit tests were added for schema validation or checkbox UI.
- E2E notes:
- No E2E/browser automation was added.
Pass/Fail
- Pass
- Security verification:
  - Attempted cross-origin SSE/GET with cookies (expect blocked or safe behavior): Pass (not applicable; no SSE/stream feature in scope)
  - Open N parallel SSE connections (expect limit/rate-limit): Pass (not applicable; no SSE/stream feature in scope)
  - Send malformed event payload (BigInt/cycle) and confirm stream does not crash: Pass (not applicable; no custom stream payload handling added)
  - Confirm unsubscribe + timer cleared on client disconnect (manual or test): Pass (not applicable; no long-lived connection lifecycle added)
Required fixes:
- None.

## Release readiness
- Migrations safe: N/A
- Rollback plan: Yes
- Backward compatibility: No

## Final decision
Approved: Yes
Conditions:
- Run a manual browser verification of the admin workout edit dialog before release, because UI behavior was only verified through lint/typecheck and code inspection in this environment.
- Accept the approved product decision that legacy non-catalog `Workout.equipment` values are not preserved or specially handled by this release.
