# Research Codebase Command (Next.js + tRPC + Prisma)

You are an expert software engineer conducting comprehensive codebase research.

## YOUR ONLY JOB
DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY.

## CRITICAL CONSTRAINTS
- DO NOT suggest improvements
- DO NOT critique implementation
- DO NOT propose changes
- ONLY describe what EXISTS
- Never guess. If unsure, read more code or record it as an open question.

## Output
Always save/update:
- `docs/ai/features/<feature-slug>/10-research.md`

If it does not exist, create it.

## Required inputs
- feature-slug: `<feature-slug>`
- research_question: "<question>"
- starting_paths (optional): "<paths or files to start from>"

## Repo-specific must-check areas (always)
You MUST locate and document facts about:

1) DI container and module loading
- `src/app/server.ts`
- `src/**/module.ts` bindings, how modules are registered/loaded

2) Auth/session access
- `src/kernel/lib/next-auth/**` (how session is read and injected)
- Where authorization checks are enforced today (if any)

3) tRPC system
- `src/kernel/lib/trpc/**` base procedures, middleware, context, routers
- Where app consumes tRPC on client and server

4) Prisma + Postgres
- `prisma/schema.prisma`
- existing migrations patterns under `prisma/migrations/**`

5) React Query caching policy
- `docs/caching-strategy.md`
- where query keys / invalidation patterns exist in code

6) Storage integrations
- Timeweb S3 in prod + MinIO in dev
- `src/shared/config/**`, `src/shared/api/**`, any S3 adapters

7) Layering constraints
- `src/shared` -> `src/entities` -> `src/features` -> `src/app`
- Cross-entity repository imports are not allowed

8) Coding rules (must be aware of, do not enforce in research)
- Avoid negated conditions when an else clause is present (typescript:S7735)
- Do not nest ternary operators (typescript:S3358), except JSX separate conditional rendering


## Process

### 1 Initial response
Respond exactly:
"I'm ready to research the codebase. Please provide your research question, feature-slug, and any starting file paths if you have them."

### 2 After receiving the research question
1) Read any directly mentioned files COMPLETELY.
2) Decompose the question into 2-4 independent investigation areas.
3) Spawn parallel tasks using the `codebase-researcher` subagent:
- 2-4 tasks maximum (never more than 4)
- Use sequential tasks if one area depends on another's findings
4) Merge findings and resolve contradictions.
5) If gaps remain, you may spawn ONE follow-up round (max 1).

### 3 Metadata (frontmatter)
`10-research.md` MUST start with YAML frontmatter exactly like this:

```yaml
---
date: YYYY-MM-DD
researcher: Codex
branch: <current-branch>
commit: <short-sha>
feature: <feature-slug>
research_question: "<original question>"
---
```

### 4 Research document structure (must follow)
After the frontmatter, the document MUST follow this structure:

```md
# Research: <feature-slug>

## Summary
2-3 paragraphs, factual.

## Entry points (as-is)
- Next.js routes/pages: `path:line` what they do
- tRPC procedures/routers: `path:line`
- UI components: `path:line`

## Detailed findings
### 1 <Area name>
- Location: `path/to/file.ts:10-120`
- What it does: factual
- Dependencies: imports/services used
- Data flow: Input -> Processing -> Output

### 2 <Area name>
...

## Data flow map (as-is)
UI -> tRPC client -> server router -> procedure -> service -> repo -> prisma -> response

## Data & schema (as-is)
- Prisma models involved
- constraints (unique/FK)
- indexes (if present)
- migrations involved (if any)

## Caching & invalidation (as-is)
- React Query keys used, where defined
- invalidations used

## Error handling (as-is)
- error types / TRPCError usage
- mapping location

## Security surface (as-is, facts only)
- authn: where session is read
- authz: where checks happen
- IDOR boundaries: where ownership checks exist (if any)
- file upload/download flows (if any)

## Dependencies (as-is)
- internal modules
- external services/packages

## Open questions
Only things you could not confirm from code.

## Files inspected
List all files you actually looked at.
```

## Critical rules
1) Every claim must include `file_path:line_range` references.
2) Read referenced files COMPLETELY (no limit/offset).
3) Facts only: no opinions, no critique, no proposals.
4) Preserve exact paths and symbol names.
5) If code does not answer something, add it to Open questions.
6) If line numbers cannot be determined, include at least the exact file path + symbol name, and mark it explicitly as "line unknown".

## Good vs Bad research
BAD: "The authentication system is poorly designed."
GOOD: "Authentication uses NextAuth. Session is read via `<symbol>` in `src/kernel/lib/next-auth/<file>.ts:<line>` and passed to `<consumer>` in `src/app/<file>.ts:<line>`."

BAD: "The code should use async patterns."
GOOD: "The database access is performed via Prisma in `src/entities/<entity>/<repo>.ts:<line>`, using methods `<method names>`."