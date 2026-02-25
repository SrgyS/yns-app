# Design Feature Command (C4 + DFD + Sequence)

You are an expert software architect designing a feature using the c4 model with human-in-the-loop approval.
**Core principle:** Design WHAT and WHY before HOW.

The output must be suitable for a real working system, not an MVP.

## Inputs
- feature-slug: `<feature-slug>`
- Research document: `docs/ai/features/<feature-slug>/10-research.md`

## Output
Always save/update:
- `docs/ai/features/<feature-slug>/20-design.md`

If it does not exist, create it.

Before designing:
Read research fully.

## Quality Gate #1
No implementation until:

- Design is complete
- No TODO sections remain
- Security and caching are fully specified
- Human review has been performed

## Constraints
- Respect FSD layering: `shared -> entities -> features -> app`
- No cross-entity repository imports
- Use existing DI pattern (Inversify modules)
- Use tRPC v11 for API contracts
- NextAuth remains auth system
- Follow caching strategy in `docs/caching-strategy.md`
- Storage: MinIO in dev, S3 in prod
- Prefer RSC for data loading; interactive parts are client components; mutations via tRPC client.
- Follow coding rules:
  - avoid negated conditions when an else clause is present (S7735)
  - do not nest ternary operators (S3358), except separate JSX conditional rendering

## Required contents
- Goals / Non-goals
- Constraints recap
- C4 (Context, Container, Component) in mermaid
- DFD in mermaid
- Sequence diagrams in mermaid:
  - happy path
  - error paths (auth failure, validation error, storage failure)
- API contract outline (tRPC v11 routers/procedures)
- Data model changes (if any)
- Caching decisions per docs/caching-strategy.md
- Security model (authN/authZ, XSS, CSRF, storage access)
- Open decisions

## Process
1) Read the research doc fully.
2) Identify primary scenarios (2-5 max).
3) Produce C4 (Component), Data Flow, and Sequence for main scenario.
4) Specify API contracts and persistence changes.
5) Include security threats and mitigations.
6) If something is unknown, add explicit Assumptions and Open questions.
7) Define caching and real-time update strategy.
8) Define rollout and rollback plan.

## Design document structure (must follow)

---
date: YYYY-MM-DD
designer: Codex
branch: <current-branch>
commit: <short-sha>
feature: <feature-slug>
based_on: docs/ai/features/<feature-slug>/10-research.md
---

# Design: <feature-slug>

## Summary
One paragraph describing the solution.

## Goals
- G1:
- G2:
- G3:

## Non-goals
- NG1:
- NG2:

## Assumptions
Only items not proven by research.
- A1:

## C4 (Component level)
List components and responsibilities with intended file locations:
- UI (features layer)
- API (tRPC routers/procedures)
- Services (use-cases)
- Repositories (entities)
- Integrations (kernel/shared)
- Background jobs (if any)

## Data Flow Diagram (to-be)
- UI -> tRPC client -> Router -> Procedure -> Service -> Repository -> Prisma -> External integrations (if any)

Include:
- Validation boundary
- Auth boundary
- Ownership boundary
- Integration boundary

## Sequence Diagram (main scenario)
Numbered steps for the main user journey.
Must include auth check, validation, persistence, side effects, and client update.

## API contracts (tRPC)
For each procedure:
- Name: `trpc.<router>.<procedure>`
- Type: query/mutation
- Auth: public/protected + role/ownership rules
- Input schema (zod): fields
- Output DTO: fields
- Errors: codes and cases
- Cache: query keys + invalidation plan

## Persistence (Prisma)
- Models to add/change
- Relations and constraints (unique/FK)
- Indexes
- Migration strategy (additive/backfill/cleanup if needed)

## Caching strategy (React Query)
- Query keys naming: Define full naming convention
- Invalidation matrix: mutation -> invalidated queries

## Error handling
- Domain errors vs TRPC errors
- Mapping policy

## Security
Threats + mitigations:
- AuthN (NextAuth session usage)
- AuthZ (role + ownership checks)
- IDOR prevention
- Input validation
- Storage security (signed URLs, private buckets, content-type/size limits)
- Secrets handling

## Observability
- Logging points (controller/service)
- Metrics/tracing if present, else "not in scope"

## Rollout & backward compatibility
- Feature flags (if needed)
- Migration rollout
- Rollback plan

## Alternatives considered
- Alt 1:
- Alt 2:

## Open questions
- Q1:
- Q2: