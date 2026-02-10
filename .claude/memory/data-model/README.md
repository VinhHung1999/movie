# Data Model

Database schema, ORM patterns, and migrations. Read this before changing the schema.

## Prisma 7 Migration

- `prisma.config.ts` required at project root for datasource URL (no longer in schema.prisma)
- Client needs `@prisma/adapter-pg` with `PrismaPg({ connectionString })` adapter
- `PrismaClientKnownRequestError` not directly importable from `@prisma/client` in v7; use `err.name === 'PrismaClientKnownRequestError'` check instead
- Seed config goes in `prisma.config.ts` under `migrations.seed` (NOT `package.json` prisma.seed)
- Must run `npx prisma generate` after schema changes before using new models
- Compound unique with nullable field: `upsert` where clause rejects `null` → use `findFirst` + manual `create`/`update`

## Prisma Migration Drift (AI-023)

- Raw SQL migrations (tsvector, triggers, functions) NOT in schema.prisma will be DROPPED by next `prisma migrate dev`
- Always check for orphaned triggers/functions after column drops — they crash on INSERT/UPDATE
- Sprint 9 debt: `search_vector` column + `idx_content_search` index were dropped by Prisma drift — need to restore

## Test DB

- Test DB: `webphim_test` (created Sprint 8, task 8.7)
- Connection: `postgresql://phuhung:@localhost:5432/webphim_test`
- `.env.test` loads via `env-setup.ts` as first vitest setupFile
- Tests MUST use webphim_test only — NEVER touch dev DB

## Indexing Strategy

- `idx_content_search` (GIN on search_vector) — dropped by Prisma drift, needs restore for Sprint 9
- Consider adding genreId index on ContentGenre table (TL Sprint 8 review)
