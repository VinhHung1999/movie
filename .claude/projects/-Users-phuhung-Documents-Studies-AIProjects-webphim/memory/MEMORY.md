# WebPhim Project Memory

## Team Workflow
- Sprint Retrospective is MANDATORY at end of every sprint (Step 11)
- SM facilitates retro, PO collects feedback from all members
- Retro outputs: updated RETROSPECTIVE_LOG.md, ACTION_ITEMS.md, prompt updates, memory updates
- See `docs/tmux/webphim-team/workflow.md` for full 11-step workflow

## Sprint History
- **Sprint 1 (Research):** All 4 reports complete. Summary in `docs/research/SUMMARY_REPORT.md`
- **Sprint 2 (Auth):** 66/66 pts, 48/48 tests. JWT auth (access+refresh), FE+BE setup complete
- **Sprint 3+4 (Landing+DB/API):** 75/75 pts, 155 tests, 0 bugs. Parallel sprints worked great
- **Sprint 5 (Homepage/Browse):** 40/40 pts, 56 FE tests. Server Components + SWR hybrid fetching
- **Sprint 6 (Video Upload & Transcode):** 45/45 pts, 73 tests (36 BE + 21 FE + 16 QA), 0 bugs. FFmpeg HLS, BullMQ, multer 2.x
- **Sprint 7 (Video Player):** 41/41 pts, 59 tests (40 FE + 14 BE + 5 QA), 0 bugs. hls.js, cinema mode, watch progress
- **Sprint 8 (Content Detail & Preview Modal):** 33/33 pts, 159 new tests (350 total), 0 bugs. Preview modal, detail page, episodes, similar content API. Test DB isolation (AI-028) finally delivered.
- Cumulative: 300/300 pts, 550 tests, 0 bugs (5 consecutive 0-bug sprints)

## Lessons Learned
- Sprint 1 had no formal retro → added mandatory retro step to workflow and all prompts
- All communication goes through PO (hub model) - this worked well
- PO must NEVER edit code directly - delegate to FE/BE (Sprint 3+4 violation)
- PO must respond to Boss immediately - slow responses frustrate Boss (Sprint 5)
- Visual verify (AI-022) catches real bugs - login redirect bug found during Boss demo
- Always kill stale dev servers before starting new ones on different ports
- E2E smoke test (login→home flow) needed before declaring sprint done
- TL arch doc checklist (AI-011) is the #1 process improvement - enforce every sprint
- QA receiving arch doc early (AI-010) enables parallel test planning
- For multi-origin CORS, use callback function approach (array origin unreliable)
- FE port standardized to 1999, BE port 5001
- refreshToken cookie Path=/api/auth limits visibility - should be '/' for server-side auth

## Sprint 6 Gotchas (Video Upload & Transcode)
- **Prisma migration drift**: `prisma migrate dev` drops manually-added columns/indexes not in schema. Use `Unsupported` type for manual columns (e.g., search_vector)
- **SWR test caching**: SWR cache persists between tests → wrap with `SWRConfig` using `provider:()=>new Map()` for isolation
- **vi.fn() typing**: Vitest `vi.fn()` needs generic: `vi.fn<(args) => ReturnType>()` to avoid TS errors
- **Supertest EPIPE on multipart+auth**: Do NOT attach file when testing auth rejection on upload endpoints. EPIPE occurs because supertest streams file after server rejects 401. Test auth separately, then upload with valid auth
- **Orphaned PG triggers**: Old manual triggers cause cryptic migration errors. Check `SELECT * FROM pg_trigger` before `prisma migrate dev`
- **Multer 2.x required for Express 5**: Multer 1.x is NOT compatible with Express 5
- **BullMQ requires ioredis**: Install `ioredis` alongside `bullmq`, do NOT use `redis` package
- **BigInt JSON serialization**: PostgreSQL BigInt (file size) won't serialize to JSON. Convert to `Number` or `String` in controller

## Sprint 7 Gotchas (Video Player)
- **React 19 lint strictness**: `refs-in-render` (no direct ref props → use forwardRef/useImperativeHandle) and `setState-in-effect` (use useMemo for derived state, not useEffect+setState)
- **hls.js + React 19 StrictMode**: Double-mount creates two HLS instances → destroy in useEffect cleanup, use ref to track instance
- **hls.js + Next.js SSR**: hls.js references `window`/`document` at import → use dynamic import `(await import('hls.js')).default`
- **Zod uuid() rejects all-zero UUIDs**: `z.string().uuid()` in Zod 4 rejects `00000000-...`. Use real UUIDs in test fixtures
- **BullMQ worker race condition**: Worker may not shut down cleanly in tests → explicit `worker.close()` + `queue.close()` in afterAll, with timeout
- **Fullscreen API**: Use containerRef (not videoRef) for fullscreen to include controls overlay

## Sprint 8 Gotchas (Content Detail & Preview Modal)
- **SM review gate value**: SM arch doc verification caught 3 issues before coding (test DB assumption, missing test health baseline, missing E2E strategy). Always run SM checklist before PO approves.
- **Portal + scroll lock**: Use `position: fixed` approach for body scroll lock (not `overflow: hidden` — fails on mobile Safari). Restore scroll position on unlock.
- **AnimatePresence requires key**: `motion.div` inside `AnimatePresence` must have `key` prop for exit animations to fire
- **Trailer auto-play**: Browsers block auto-play with audio → MUST use `muted autoPlay playsInline` attributes
- **SWR deduplication**: Modal and detail page fetching same content ID will deduplicate requests (feature, not bug)
- **Modal z-index**: Backdrop `z-[100]`, modal content `z-[101]`. Navbar is `z-50` — no conflict
- **stopPropagation on ChevronDown**: MovieCard ChevronDown needs `event.stopPropagation()` to prevent card click navigation
- **Accessibility gap**: No a11y requirements in arch docs. TL found 2 HIGH issues: modal needs `role="dialog"` + focus trap, icons need `aria-label`. Added AI-049 for Sprint 9.
- **P0 debt must be pre-planned**: AI-028 was 2 sprints overdue, caused mid-planning scope growth. PO should check open action items before kickoff (AI-052)

## CRITICAL: Boss Approval Gate (Sprint 8 Lesson)
- **"0 bugs from QA" is MEANINGLESS without real browser testing.** Sprint 8 had 350 passing tests, "0 QA bugs", but Boss found 5 real bugs in browser demo.
- **Unit tests test CODE, not USER EXPERIENCE.** Mocked API tests don't catch wrong URLs, cache issues, overflow-hidden bugs, or session UX problems.
- **Boss must approve BEFORE sprint close.** New flow: FE/BE done → QA test (incl. browser) → TL review → BOSS APPROVE → close.
- **QA browser walkthrough is MANDATORY** — not optional, not "nice to have." Open the app, click everything, with real data.
- **Boss account must survive everything**: boss@webphim.com / Boss@123456 — in seed script, test isolation verified end-to-end