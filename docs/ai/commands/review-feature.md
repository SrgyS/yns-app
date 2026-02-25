# Review Feature Command (Quality, Security, Tests)

You are performing final review of the feature implementation.

## Inputs
- feature-slug: `<feature-slug>`
- Research: `docs/ai/features/<feature-slug>/10-research.md`
- Design: `docs/ai/features/<feature-slug>/20-design.md`
- Plan: `docs/ai/features/<feature-slug>/30-plan.md`
- Impl log: `docs/ai/features/<feature-slug>/40-impl-log.md`
- Code diff (current branch vs base)

## Output
Always save/update:
- `docs/ai/features/<feature-slug>/50-review.md`

If it does not exist, create it.

## Review constraints
- Be concrete. Reference specific files/symbols.
- Mark Pass/Fail per section.
- If failing, list required fixes.

## Review document structure (must follow)
```md
---
date: YYYY-MM-DD
reviewer: Codex
branch: <current-branch>
commit: <short-sha>
feature: <feature-slug>
---

# Review: <feature-slug>

## What shipped
- User-facing:
- Internal:

## Design compliance
- Matches design: Yes/No
- Deviations:
  - D1:

## Code quality
- Layering rules: Pass/Fail
- Cross-entity repository imports: Pass/Fail
- Readability rules (S7735, S3358): Pass/Fail
- DI wiring: Pass/Fail
- Error handling: Pass/Fail
- Caching strategy alignment: Pass/Fail

## Security
- AuthN (NextAuth session): Pass/Fail
- AuthZ + ownership checks (IDOR): Pass/Fail
- Input validation: Pass/Fail

- DoS / resource exhaustion: Pass/Fail
  - Rate limiting on endpoints (esp. SSE/stream): Yes/No (where?)
  - Per-user connection cap / concurrency guard: Yes/No (where?)
  - Timeouts / max stream duration / idle cutoff: Yes/No (where?)
  - Backpressure / safe enqueue / try-catch around stream writes: Yes/No (where?)

- Injection safety: Pass/Fail
  - SSE event-name sanitization (no CRLF) / allowlist: Yes/No (where?)
  - Safe JSON serialization (BigInt/cycles) + error containment: Yes/No (where?)
  - Header/value injection (dynamic headers, filenames): Yes/No (where?)
  - Log injection / sensitive payload logging avoided: Yes/No (where?)

- CSRF / cross-origin: Pass/Fail
  - Cookies + credentialed requests risk assessed: Yes/No
  - Origin/Referer allowlist for stateful endpoints (if applicable): Yes/No (where?)
  - CORS configuration verified safe (no wildcard with credentials): Yes/No (where?)
  - Non-idempotent endpoints require CSRF protection: Yes/No (where?)

- Cleanup & lifecycle: Pass/Fail
  - Listeners/subscriptions removed on abort/close/error: Yes/No (where?)
  - Timers cleared (setInterval/setTimeout): Yes/No (where?)
  - Event listeners removed when no longer needed: Yes/No (where?)
  - Memory leak check (long-lived maps, caches, per-connection state): Yes/No (where?)

- Storage security (if applicable): Pass/Fail
- Secrets handling: Pass/Fail
Required fixes:

## Performance
- Query patterns / N+1 risks: Pass/Fail
- React Query invalidation: Pass/Fail
- Any heavy SSR/CSR work: Pass/Fail

## Tests & verification
- Commands run:
- Unit coverage notes:
- E2E notes:
Pass/Fail
- Security verification:
  - Attempted cross-origin SSE/GET with cookies (expect blocked or safe behavior): Pass/Fail
  - Open N parallel SSE connections (expect limit/rate-limit): Pass/Fail
  - Send malformed event payload (BigInt/cycle) and confirm stream does not crash: Pass/Fail
  - Confirm unsubscribe + timer cleared on client disconnect (manual or test): Pass/Fail
Required fixes:

- If the feature includes SSE/streaming, Security section MUST include the "DoS / Injection / CSRF / Cleanup" subsections above and cannot be marked Pass without pointing to the exact mitigation code.

## Release readiness
- Migrations safe: Yes/No/N/A
- Rollback plan: Yes/No
- Backward compatibility: Yes/No

## Final decision
Approved: Yes/No
Conditions: