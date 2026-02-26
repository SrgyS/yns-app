---
date: 2026-02-26
reviewer: Codex
branch: feat/react-compiler
commit: cca0789
feature: chat-enhancements
---

# Review: chat-enhancements

## What shipped
- User-facing:
- Unanswered badges in admin sidebar and profile support-chat entry.
- Unresolved dot in dialog lists.
- Edit/delete own unread messages with soft-delete rendering and edited marker.
- Responsive admin inbox with mobile back and scroll-driven pagination.
- Internal:
- New tRPC procedures for unanswered count and message edit/delete.
- Additive `ChatMessage` lifecycle columns and `message.updated` SSE event.

## Design compliance
- Matches design: Yes
- Deviations:
- D1: `react-doctor` skill command could not be completed in this environment.

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
- Rate limiting on endpoints (esp. SSE/stream): Yes (`src/app/api/support-chat/events/route.ts:185`).
- Per-user connection cap / concurrency guard: Yes (`src/app/api/support-chat/events/route.ts:194`, `:197`).
- Timeouts / max stream duration / idle cutoff: Yes (`src/app/api/support-chat/events/route.ts:14`, `:15`, `:16`, `:310`).
- Backpressure / safe enqueue / try-catch around stream writes: Yes (`src/app/api/support-chat/events/route.ts:258`, `:273`).

- Injection safety: Pass
- SSE event-name sanitization allowlist: Yes (`src/app/api/support-chat/events/route.ts:23`, `:36`).
- Safe JSON serialization + error containment: Yes (`src/app/api/support-chat/events/route.ts:44`, `:53`).
- Header/value injection protections: Yes (attachment filename encoded in route: `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:65`).
- Log injection / sensitive payload logging avoided: Yes (structured logging in notifier/SSE).

- CSRF / cross-origin: Pass
- Cookies + credentialed requests risk assessed: Yes.
- Origin/Referer allowlist for stateful endpoints: N/A (tRPC protected session + no new cross-origin write surface introduced).
- CORS configuration safe: Yes (no wildcard credential config added).
- Non-idempotent endpoints require CSRF protection: unchanged project pattern.

- Cleanup & lifecycle: Pass
- Listeners/subscriptions removed on abort/close/error: Yes (`events/route.ts:217`, `:237`, `:315`; client hooks cleanup in `use-support-chat.ts`).
- Timers cleared: Yes (`events/route.ts:225`, `:229`, `:233`).
- Event listeners removed: Yes (`use-support-chat.ts:111`, `:186`).
- Memory leak check for long-lived maps: Existing guarded cleanup used.

- Storage security (if applicable): Pass
- Secrets handling: Pass

Required fixes:
- None.

## Performance
- Query patterns / N+1 risks: Pass (existing style retained, scope-limited additions).
- React Query invalidation: Pass (targeted invalidations and SSE event mapping updated).
- Any heavy SSR/CSR work: Pass (changes are in existing client pages/hooks).

## Tests & verification
- Commands run:
- `npx prisma generate`
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat-service`
- `npm run test -- support-chat`
- Unit coverage notes:
- Added edit/delete guard tests in `support-chat-service.spec.ts`.
- E2E notes:
- Not added in this change.
- Pass/Fail:
- Pass
- Security verification:
- Cross-origin SSE/manual abuse scenarios: covered by existing route limits/guards.
- N parallel SSE connections limits: guarded in route.
- Malformed event payload handling: guarded by safe serialization.
- Unsubscribe/timer cleanup on disconnect: present in route + client cleanup.

Required fixes:
- None.

## Release readiness
- Migrations safe: Yes
- Rollback plan: Yes
- Backward compatibility: Yes

## Final decision
Approved: Yes
Conditions:
- Optional manual QA on mobile/tablet admin inbox interactions.
