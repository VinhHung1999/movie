# Sprint History

## Completed Sprints

## Sprint 1: Netflix Research
- All 4 research reports delivered and accepted (FE, TL, BE, QA)
- Reports in `docs/research/`: netflix-frontend.md, netflix-architecture.md, netflix-backend.md, netflix-qa-quality.md
- Key decisions: Full TypeScript, separate FE (Next.js) + BE (Express.js), JWT self-build, PostgreSQL + Prisma, HLS streaming
- Architecture: 2 separate repos (webphim-fe, webphim-be)
- Notable: Cloudflare R2 recommended for zero egress costs vs AWS S3

## Sprint 2: Project Setup & Authentication
- 66/66 points, 48/48 tests passing
- BE: Express.js + TypeScript + Prisma 7 + PostgreSQL. 5 auth endpoints (register, login, refresh, logout, me). JWT access(15min in-memory) + refresh(7d httpOnly cookie + DB rotation). Zod validation, ApiError pattern. Port 5001.
- FE: Next.js 14+ App Router + Tailwind + Framer Motion + Zustand. Auth UI (login/signup Netflix-style), Axios interceptor with auto-refresh, protected route middleware.
- TL: Architecture doc (docs/architecture/sprint2-architecture.md) - folder structure, JWT strategy, Prisma schema, error handling, API contract, coding standards.
- QA: 44 unit tests + 4 E2E tests all passing.
- Notable: Port changed 5000→5001 (macOS AirPlay conflict)
- **Retro lessons (full retro with all 5 members):**
  1. TL arch doc must come FIRST before FE/BE code (enforce gate)
  2. Pin exact dependency versions in arch doc (3 members hit version issues independently)
  3. API contracts (req/res format) in arch doc - enables QA+FE to start parallel with BE
  4. QA reads BE source first + separate test DB
  5. Commit-per-task for all devs (FE had single commit)
  6. Add FE unit testing (Jest+RTL) to DoD
  7. QA receives arch doc same time as FE/BE for early test planning
  8. All members check MEMORY.md for known gotchas before coding
  9. TL arch doc checklist: pinned versions, port, API contracts, test DB, component tree
- 12 action items (AI-001 to AI-012), 5x P0, 7x P1
- See retro: `docs/tmux/webphim-team/sm/RETROSPECTIVE_LOG.md`

## Sprint 3: Landing Page & Layout (FE) — Parallel with Sprint 4
- 34/34 points, 9/9 tasks, 23/23 FE unit tests (Vitest+RTL)
- FE: Netflix landing page (Hero, FeatureSection×4, FAQ accordion, Footer), GuestNavbar, AuthNavbar (scroll transition), MobileDrawer, MainLayout, dark theme config
- New packages: lucide-react, clsx
- All Sprint 2 retro action items verified: commit-per-task (AI-008), FE unit tests (AI-009), waited for TL doc (AI-001)
- Build clean, ESLint clean, TL review approved

## Sprint 4: DB Schema & Content API (BE+QA) — Parallel with Sprint 3
- 41/41 points, 11/11 tasks, 90 BE tests + 42 QA tests, 0 bugs
- BE: Content/Season/Episode/Genre/CastCrew/WatchHistory/Watchlist/Rating models. Full-text search (tsvector+GIN). Seed data (30+ movies, 5+ series, 12+ genres, 50+ cast). 4 API endpoints (content list/detail/featured, genres).
- QA: Exceeded planned coverage (35→42 tests), zero bugs found
- TL review: 16/16 checklist items pass, 3 minor non-blocking observations
- Architecture doc: docs/architecture/SPRINT_3_4_ARCHITECTURE.md
- All Sprint 2 retro action items verified: TL arch doc checklist (AI-011), commit-per-task (AI-008), QA early arch doc (AI-010), separate test DB (AI-006)
- **Retro lessons (full retro with all 5 members):**
  1. ROLE VIOLATION: PO edited cors.ts directly — unanimous rule: NO cross-role code edits, even 1-line urgent fixes go through code owner
  2. TL arch doc checklist (AI-011) credited as #1 improvement — keep and expand
  3. QA early involvement (AI-010) is a game changer — QA exceeded coverage 35→42 tests
  4. CORS multi-origin needs callback pattern, not array
  5. FE should write tests WITH components, not retrofit after
  6. BE keep dev server running throughout sprint
- 10 new action items (AI-013 to AI-022), 3x P0 (role boundaries), 5x P1, 2x P2
- See retro: `docs/tmux/webphim-team/sm/RETROSPECTIVE_LOG.md`
