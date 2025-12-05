# Repository overview

## Tech stack

- Next.js 15 App Router with TypeScript.
- React Query for client-side caching; see `docs/caching-strategy.md` for the shared policy.
- NextAuth for authentication, wired through Inversify container modules under `src/kernel/lib/next-auth`.
- tRPC v11 for typed API calls (`src/kernel/lib/trpc`), exposed to the app through the shared Inversify container in `src/app/server.ts`.
- Prisma for the PostgreSQL data model (`prisma/schema.prisma`) plus seeds/migrations.
- Tailwind-based styling with shadcn-style UI primitives defined in `src/shared/ui`.

## Directory layout

- `src/app` – Next.js routing layer. Route groups `(public)`, `(private)`, `(auth)` share layout shells. `_providers/app-provider.tsx` composes React Query, Theme, NextAuth session, TRPC clients, and notifications. `server.ts` bootstraps the DI container that loads all domain/feature modules.
- `src/features` – Feature-sliced UI/logic units (e.g., courses list, enrollment, profile). Each feature folder usually exposes React components plus an Inversify `module.ts` for server wiring.
- `src/entities` – entities-level modules (course, user, workout, payment, etc.) containing domain-specific adapters, repositories, and shared TRPC controllers. These are registered in the server container via their respective `module.ts` files.
- `src/kernel` – Cross-cutting domain services, shared domain models, and integration points (NextAuth, tRPC base procedures, DI services). All container bindings start here.
- `src/shared` – Global utilities and primitives: configuration (`shared/config`), API clients (`shared/api`), caching helpers (`shared/lib/cache`), content tooling (MDX compilation, YAML parsers), state stores, and the reusable UI components built on Radix UI.
- `app-content` – YAML/MDX content bundle managed by `scripts/upload-content*` commands and consumed through `src/shared/api/content`.
- `prisma` – Database schema, migrations, and seeding logic.
- `tests` / `playwright` – Unit and e2e test setup; use `npm run test` for Jest and `npm run test:e2e` for Playwright after ensuring Prisma database is ready.

## Development tips

- Prefer building new UI pieces inside `src/shared/ui` (for primitives) or feature folders; keep feature dependencies pointing "down" the FSD layers (`shared` → `entities` → `features` → `app`).
- When adding server-side functionality, register bindings in the relevant `module.ts` so they are loaded by `createServer()` in `src/app/server.ts`.
- Follow the caching strategy described in `docs/caching-strategy.md` when introducing new React Query hooks.
- To validate types and formatting, run `npm run lint`, `npm run lint:types`, and `npm run prettier` as needed before committing.
- For entity repositories, imports from other entities are not allowed. If shared logic is needed, extract it into the corresponding _service at the feature level or higher.

## Coding Rule
- Avoid negated conditions when an else clause is present (typescript:S7735)
Use positive condition checks instead of negated ones if the statement contains an else block. This improves readability, reduces cognitive load, and prevents logical ambiguity.
- Do not nest ternary operators (typescript:S3358)
Avoid using nested ternary operators. If a condition requires more than one ternary, refactor into an explicit if/else structure or split the logic into multiple statements. Nested ternaries reduce readability, complicate reasoning about execution order, and make future changes error-prone.

Bad example:
job.isRunning() ? "Running" : job.hasErrors() ? "Failed" : "Succeeded"

Good example:
if (job.isRunning()) {
  return "Running";
}
return job.hasErrors() ? "Failed" : "Succeeded";

Exception:
This rule does not apply in JSX when ternary expressions are used for conditional rendering and are not nested inside a single expression block. Each condition must be placed in a separate JSX expression container.
