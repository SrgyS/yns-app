---
date: 2026-03-05
reviewer: Codex
branch: feat/react-compiler
commit: b1a0ac7
feature: chat-optimistic-update
---

# Review: chat-optimistic-update

## What shipped
- User-facing:
  - Optimistic send lifecycle in support chat UI (`sending` -> `sent`/`failed`) with retry/cancel controls in [support-chat-conversation-card.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_ui/support-chat-conversation-card.tsx).
  - Retry on failed message uses same `clientMessageId`; cancel removes failed optimistic message from cache/UI in [use-support-chat.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_vm/use-support-chat.ts).
  - Optimistic attachment preview for `data:` paths in [support-chat-message-attachments.tsx](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_ui/support-chat-message-attachments.tsx).
- Internal:
  - Additive DB support for message correlation: `ChatMessage.clientMessageId` + unique `(dialogId, clientMessageId)` in [schema.prisma](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma).
  - `sendMessage` accepts optional `clientMessageId`, performs idempotent lookup/create in [support-chat-service.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_services/support-chat-service.ts) via [chat-message-repository.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/entities/support-chat/_repositories/chat-message-repository.ts).
  - `message.created` SSE payload includes message correlation fields in [support-chat-events.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_integrations/support-chat-events.ts), consumed by reconcile path in [use-support-chat.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_vm/use-support-chat.ts).

## Design compliance
- Matches design: Yes
- Deviations:
  - D1: Explicit automated E2E coverage for race/retry/cancel scenarios (listed in plan phase 5) is not present in this implementation diff; verification currently relies on unit/service tests + lint/typecheck.

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
  - Rate limiting on endpoints (esp. SSE/stream): Yes (SSE `assertRateLimit` in [events/route.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).
  - Per-user connection cap / concurrency guard: Yes (`SSE_MAX_CONNECTIONS_PER_USER`, `SSE_MAX_CONNECTIONS_PER_IP` in [events/route.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).
  - Timeouts / max stream duration / idle cutoff: Yes (`SSE_MAX_DURATION_MS`, `SSE_IDLE_TIMEOUT_MS` in [events/route.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).
  - Backpressure / safe enqueue / try-catch around stream writes: Yes (`safeEnqueue` + guarded `controller.enqueue` in [events/route.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).

- Injection safety: Pass
  - SSE event-name sanitization (no CRLF) / allowlist: Yes (`ALLOWED_SSE_EVENTS`, `sanitizeSseEventName` in [events/route.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).
  - Safe JSON serialization (BigInt/cycles) + error containment: Yes (`stringifySseData` + catch/close path in [events/route.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).
  - Header/value injection (dynamic headers, filenames): Yes (`encodeURIComponent` filename encoding in [attachments route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts)).
  - Log injection / sensitive payload logging avoided: Yes (logs include event name/message only; no raw payload dump in [events/route.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).

- CSRF / cross-origin: Pass
  - Cookies + credentialed requests risk assessed: Yes
  - Origin/Referer allowlist for stateful endpoints (if applicable): Yes (`assertTrustedMutationRequest` in [support-chat controller](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_controller.ts) backed by [trusted-origin util](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/security/trusted-origin.ts)).
  - CORS configuration verified safe (no wildcard with credentials): Yes (same-origin enforcement by origin guard for support-chat mutations + SSE route in [events route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).
  - Non-idempotent endpoints require CSRF protection: Yes (mutation-level origin/referer validation in [support-chat controller](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_controller.ts)).

- Cleanup & lifecycle: Pass
  - Listeners/subscriptions removed on abort/close/error: Yes (`unsubscribe` + abort listener cleanup in [events/route.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).
  - Timers cleared (setInterval/setTimeout): Yes (`clearInterval`, `clearTimeout` in `closeStream` in [events/route.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).
  - Event listeners removed when no longer needed: Yes (server and client cleanup paths in [events/route.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts), [use-support-chat.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_vm/use-support-chat.ts)).
  - Memory leak check (long-lived maps, caches, per-connection state): Yes (connection counters decremented on close; rate-limit map periodically pruned in [events/route.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).

- Storage security (if applicable): Pass
- Secrets handling: Pass
Required fixes:
- none

## Performance
- Query patterns / N+1 risks: Pass
- React Query invalidation: Pass
- Any heavy SSR/CSR work: Pass

## Tests & verification
- Commands run:
  - `npm run lint:types`
  - `npm run lint`
  - `npm run test -- support-chat`
  - `npm run test -- src/shared/lib/security/trusted-origin.spec.ts src/features/support-chat/_integrations/support-chat-sse-security.spec.ts src/kernel/lib/trpc/_procedure.spec.ts`
- Unit coverage notes:
  - Service/domain suites for support-chat pass; includes idempotent send behavior and schema/attachment/read-service checks.
- E2E notes:
  - No dedicated E2E run for optimistic race/retry/cancel scenarios in this review step.
Pass/Fail
- Pass (for implemented code quality + unit/service validation scope).
- Security verification:
  - Attempted cross-origin SSE/GET with cookies (expect blocked or safe behavior): Pass (automated by origin-guard tests in [trusted-origin.spec.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/security/trusted-origin.spec.ts)).
  - Open N parallel SSE connections (expect limit/rate-limit): Pass (automated by connection/rate-limit tests in [support-chat-sse-security.spec.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_integrations/support-chat-sse-security.spec.ts)).
  - Send malformed event payload (BigInt/cycle) and confirm stream does not crash: Pass (automated by `toSseChunk` serialization failure test in [support-chat-sse-security.spec.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_integrations/support-chat-sse-security.spec.ts)).
  - Confirm unsubscribe + timer cleared on client disconnect (manual or test): Pass (cleanup counters and lifecycle paths covered by `decrementSseConnectionCounters` tests + route cleanup code in [events route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts)).
Required fixes:
- none

## Release readiness
- Migrations safe: Yes
- Rollback plan: Yes
- Backward compatibility: Yes

## Final decision
Approved: Yes
Conditions:
- none
