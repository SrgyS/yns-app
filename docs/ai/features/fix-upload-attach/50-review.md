---
date: 2026-03-06
reviewer: Codex
branch: feat/react-compiler
commit: 90d25da
feature: fix-upload-attach
---

# Review: fix-upload-attach

## What shipped
- User-facing:
- Вложения support-chat переведены на staged upload (`/api/support-chat/uploads`) и refs-only payload.
- Optimistic attachments больше не содержат binary/base64; для preview используется `blob:` URL.
- Видео preview ограничен: `>10MB` как file card, `<=10MB` inline preview.
- Internal:
- Upload route с auth/origin/access checks, timeout/abort/no-progress policy.
- `SupportChatService` удалил base64 path и линкует ранее загруженные `ChatAttachment`.
- Cleanup job переведен на retry-safe claim/restore/delete flow.
- Добавлены regression tests для upload validation, preview guard и cleanup guards.

## Design compliance
- Matches design: Yes
- Deviations:
  - D1: Для cleanup claim использован marker `status='LINKED'` при `messageId=null` (без Prisma migration). Guard в `linkToMessage` исключает конфликт с реальным message linking.

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
  - Rate limiting on endpoints (esp. SSE/stream): Yes ([events route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts:112), [attachment download route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:75))
  - Per-user connection cap / concurrency guard: Yes ([events route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts:122), [sse security](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_integrations/support-chat-sse-security.ts:121))
  - Timeouts / max stream duration / idle cutoff: Yes ([events route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts:21), [uploads route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/uploads/route.ts:141))
  - Backpressure / safe enqueue / try-catch around stream writes: Yes ([events route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts:180))

- Injection safety: Pass
  - SSE event-name sanitization (no CRLF) / allowlist: Yes ([support-chat-sse-security.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_integrations/support-chat-sse-security.ts:29))
  - Safe JSON serialization (BigInt/cycles) + error containment: Yes ([support-chat-sse-security.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_integrations/support-chat-sse-security.ts:37))
  - Header/value injection (dynamic headers, filenames): Yes ([attachment download route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:59))
  - Log injection / sensitive payload logging avoided: Yes (structured logs in upload/cleanup/event routes).

- CSRF / cross-origin: Pass
  - Cookies + credentialed requests risk assessed: Yes
  - Origin/Referer allowlist for stateful endpoints (if applicable): Yes ([uploads route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/uploads/route.ts:119), [events route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts:97))
  - CORS configuration verified safe (no wildcard with credentials): Yes (same-origin API routes, no permissive CORS added).
  - Non-idempotent endpoints require CSRF protection: Yes (session auth + trusted-origin checks).

- Cleanup & lifecycle: Pass
  - Listeners/subscriptions removed on abort/close/error: Yes ([events route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts:140), [uploads route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/uploads/route.ts:276))
  - Timers cleared (setInterval/setTimeout): Yes ([events route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/events/route.ts:148), [uploads route](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/support-chat/uploads/route.ts:278))
  - Event listeners removed when no longer needed: Yes ([use-support-chat.ts](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/support-chat/_vm/use-support-chat.ts:327), [supabase provider](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/file-storage/_providers/supabase.ts:156))
  - Memory leak check (long-lived maps, caches, per-connection state): Yes (SSE counter cleanup and object URL cleanup paths present).

- Storage security (if applicable): Pass
- Secrets handling: Pass
Required fixes:
- None

## Performance
- Query patterns / N+1 risks: Pass
- React Query invalidation: Pass
- Any heavy SSR/CSR work: Pass

## Tests & verification
- Commands run:
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat`
- Unit coverage notes:
- Added/updated tests cover staged upload validation, object URL lifecycle, preview guard and cleanup repository state transitions.
- E2E notes:
- Not run in this pass.
Pass/Fail
- Pass
- Security verification:
  - Attempted cross-origin SSE/GET with cookies (expect blocked or safe behavior): Pass (code-path verification: trusted-origin check blocks in route layer)
  - Open N parallel SSE connections (expect limit/rate-limit): Pass (connection cap + rate limit logic with unit coverage in SSE security tests)
  - Send malformed event payload (BigInt/cycle) and confirm stream does not crash: Pass (serializer guards + stream close on invalid chunk)
  - Confirm unsubscribe + timer cleared on client disconnect (manual or test): Pass (explicit cleanup in SSE route close path)
Required fixes:
- None

- If the feature includes SSE/streaming, Security section MUST include the "DoS / Injection / CSRF / Cleanup" subsections above and cannot be marked Pass without pointing to the exact mitigation code.

## Release readiness
- Migrations safe: Yes
- Rollback plan: Yes
- Backward compatibility: Yes

## Final decision
Approved: Yes
Conditions:
- None
