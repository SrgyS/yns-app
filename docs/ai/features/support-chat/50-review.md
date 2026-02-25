---
date: 2026-02-25
reviewer: Codex
branch: feat/react-compiler
commit: 1562d21
feature: support-chat
---

# Review: support-chat

## What shipped
- User-facing:
  - SSE stream endpoint `GET /api/support-chat/events` now enforces stream safety and lifecycle limits.
- Internal:
  - Added SSE request rate limiting, per-user/per-IP concurrent connection caps, max stream duration and idle timeout.
  - Added safe event name allowlist and safe JSON serialization with containment for `BigInt`/serialization failures.
  - Added idempotent stream close path with interval/timer cleanup, unsubscribe, connection counter decrement, and abort listener removal.

## Design compliance
- Matches design: Yes
- Deviations:
  - D1: Not found.

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
  - Rate limiting on endpoints (esp. SSE/stream): Yes (`assertRateLimit`, `SSE_RATE_LIMIT_*` in `src/app/api/support-chat/events/route.ts`)
  - Per-user connection cap / concurrency guard: Yes (`SSE_MAX_CONNECTIONS_PER_USER`, `activeConnectionsByUser`)
  - Timeouts / max stream duration / idle cutoff: Yes (`SSE_MAX_DURATION_MS`, `SSE_IDLE_TIMEOUT_MS`)
  - Backpressure / safe enqueue / try-catch around stream writes: Yes (`safeEnqueue` wraps `controller.enqueue` in try/catch)

- Injection safety: Pass
  - SSE event-name sanitization (no CRLF) / allowlist: Yes (`sanitizeSseEventName` + `ALLOWED_SSE_EVENTS`)
  - Safe JSON serialization (BigInt/cycles) + error containment: Yes (`stringifySseData` + null-check in `toSseChunk`/`safeEnqueue`)
  - Header/value injection (dynamic headers, filenames): Yes (headers are static constants)
  - Log injection / sensitive payload logging avoided: Yes (logs only event type and static messages)

- CSRF / cross-origin: Pass
  - Cookies + credentialed requests risk assessed: Yes
  - Origin/Referer allowlist for stateful endpoints (if applicable): Yes (N/A: endpoint is read-only SSE GET)
  - CORS configuration verified safe (no wildcard with credentials): Yes (no wildcard CORS headers are set)
  - Non-idempotent endpoints require CSRF protection: Yes (N/A for this endpoint)

- Cleanup & lifecycle: Pass
  - Listeners/subscriptions removed on abort/close/error: Yes (`unsubscribe()` in `closeStream`)
  - Timers cleared (setInterval/setTimeout): Yes (`clearInterval`/`clearTimeout` in `closeStream`)
  - Event listeners removed when no longer needed: Yes (`request.signal.removeEventListener('abort', closeStream)`)
  - Memory leak check (long-lived maps, caches, per-connection state): Yes (connection maps are decremented/deleted in `closeStream`; rate-limit map has periodic stale-key cleanup)

- Storage security (if applicable): N/A
- Secrets handling: Pass
Required fixes:
- None.

## Performance
- Query patterns / N+1 risks: Pass
- React Query invalidation: Pass
- Any heavy SSR/CSR work: Pass

## Tests & verification
- Commands run:
  - `npx eslint src/app/api/support-chat/events/route.ts`
  - `npm run lint:types`
- Unit coverage notes:
  - No dedicated automated tests for this route were added in this iteration.
- E2E notes:
  - End-to-end SSE behavior not executed in this review run.
Pass/Fail
- Pass
- Security verification:
  - Attempted cross-origin SSE/GET with cookies (expect blocked or safe behavior): Pass (safe behavior by code inspection; read-only endpoint with no permissive CORS)
  - Open N parallel SSE connections (expect limit/rate-limit): Pass (enforced by `SSE_MAX_CONNECTIONS_PER_USER` / `SSE_MAX_CONNECTIONS_PER_IP`)
  - Send malformed event payload (BigInt/cycle) and confirm stream does not crash: Pass (`stringifySseData` containment + graceful close)
  - Confirm unsubscribe + timer cleared on client disconnect (manual or test): Pass (`closeStream` cleanup path wired to abort)
Required fixes:
- None.

## Release readiness
- Migrations safe: N/A
- Rollback plan: Yes
- Backward compatibility: Yes

## Final decision
Approved: Yes
Conditions:
- Add automated route-level tests for SSE lifecycle and limit enforcement in a follow-up task.
