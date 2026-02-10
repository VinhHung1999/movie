# Bugs & Lessons Learned

## Resolved Bugs

_(Add bugs as they are fixed)_

```markdown
### Bug title (Sprint/Context)
- **Cause:** What caused it
- **Fix:** How it was resolved
```

## Lessons Learned

### Always include Sprint Retrospective (Sprint 1)
- Sprint 1 completed without formal retro, missed chance to improve process early
- Key takeaway: Made retro mandatory (Step 11) and updated all role prompts. Retro should also update prompts and memory for continuous improvement.

### Architecture doc must come BEFORE implementation (Sprint 2)
- FE started coding before TL architecture doc → had to refactor localStorage to in-memory tokens
- Key takeaway: Enforce workflow gate - TL doc approved first, then FE/BE start

### Pin dependency versions in specs (Sprint 2)
- BE hit 3 version compat issues: Prisma 7, Zod v4, Express 5 (~45min lost)
- QA also hit wrong Prisma import for v7
- Key takeaway: TL must specify exact major versions in architecture docs

### QA should read BE source before writing tests (Sprint 2)
- QA had wrong Prisma import + needed fileParallelism:false in vitest
- Key takeaway: QA reads BE source/config first, uses separate test DB

### fetchFromAPI double-unwrapping bug
- **Cause:** When `fetchFromAPI` already returns `json.data` (unwrapped response), page-level code calling `result?.data` again receives `undefined`. Pattern mismatch: server-side fetchers auto-unwrap API responses but page code expects raw API shape.
- **Fix:** Check fetcher implementation to understand if it returns raw API shape or pre-unwrapped data. Avoid double-unwrapping by matching the data structure expectation with what the fetcher actually returns.

### Playwright auth for Next.js middleware
- **Cause:** Next.js middleware checks cookies server-side. When BE sets httpOnly cookie on different port (5001) with specific Path, FE middleware (port 3000) won't see it because cookies are domain+port bound and Path must match.
- **Fix:** For testing with Playwright, manually set cookies on FE domain using `context.add_cookies()` to inject the auth token into the test context, bypassing the cross-port cookie issue.

### Orphaned PostgreSQL trigger after Prisma migration (Sprint 6)
- **Cause:** Prisma migration dropped `search_vector` column but left `content_search_vector_trigger` alive. INSERT on `content` table failed with cryptic "column `new` does not exist" error (PostgreSQL `NEW` row reference in trigger).
- **Fix:** `DROP TRIGGER IF EXISTS content_search_vector_trigger ON content; DROP FUNCTION IF EXISTS content_search_vector_update();`
- **Key takeaway:** When Prisma auto-detects schema drift and drops columns, manually check for orphaned triggers/functions.

### Multer 2.x + supertest EPIPE on auth rejection (Sprint 6)
- **Cause:** Supertest streams file via pipe. Auth middleware rejects (401) before multer finishes reading → broken pipe → EPIPE error fails the test.
- **Fix:** Don't `.attach('video', file)` in 401 auth tests — just send form fields. Auth is checked before multer processes file anyway.

### SWR test cache isolation (Sprint 6)
- **Cause:** SWR caches responses by key. Tests sharing the same key get stale data from previous tests, causing 6 false failures.
- **Fix:** Wrap test renders with `<SWRConfig value={{ provider: () => new Map() }}>` to isolate cache per test. Also use unique video IDs per test.

### Vitest 4 mock typing for typed props (Sprint 6)
- **Cause:** `vi.fn()` returns a generic mock type that doesn't satisfy typed callback props like `(file: File) => void`, causing TS2322 errors.
- **Fix:** Use explicit generics: `vi.fn<(file: File) => void>()` and type the variable accordingly.

### Next.js dev server caching wrong project
- **Cause:** When `.next` build cache exists from a different project that previously ran on same port, `next dev` may serve stale cached content, confusing it with a code change.
- **Fix:** Delete the `.next` directory completely and restart the dev server. Cache is per-project but shared namespace on same port can cause conflicts.
- **Preventive:** Consider adding `.next` to `.gitignore` with clear documentation that local dev cache should not be committed.

### React 19 lint: no refs in render, no setState in useEffect body
- `react-hooks/refs` rule: destructure hook returns that contain refs before using in JSX (e.g., `const { videoRef, containerRef, error } = useVideoPlayer()` not `player.videoRef`)
- `react-hooks/set-state-in-effect` rule: don't call setState synchronously in useEffect body. Instead derive visibility: `const visible = !isPlaying || interacted` where `interacted` is set only via callbacks/timers.

### Helmet blocks cross-origin static files (Sprint 7)
- **Cause:** Helmet sets `Content-Security-Policy: img-src 'self'` and `Cross-Origin-Resource-Policy: same-origin` on ALL responses. Even overriding CORP in `setHeaders` doesn't help because CSP still blocks the browser.
- **Fix:** Move `express.static()` BEFORE `app.use(helmet())` so helmet headers don't apply to static assets.
- **Key takeaway:** Any static files served cross-origin (images, HLS segments) must bypass helmet entirely.

### vitest 4 vi.fn() type inference: const vs let
- `const onSelect = vi.fn<(index: number) => void>()` works for type inference
- `let onSelect: ReturnType<typeof vi.fn>` then `onSelect = vi.fn<...>()` loses the generic type — use const declaration instead

### MovieCard hover overlay clipped by parent overflow-hidden (Sprint 8)
- **Cause:** ContentRow carousel uses `overflow-hidden` which clips MovieCard's hover overlay (`top-full` position) vertically. Playwright `bounding_box()` still reports the element as having size (DOM exists), but it's visually invisible to users.
- **Fix:** (1) Change carousel to `overflow-x-clip overflow-y-visible` — CSS `clip` only clips one axis, unlike `hidden` which forces both. (2) Reposition overlay from `top-full` (below card) to `bottom-0` inside poster with gradient — Netflix-style, keeps buttons in viewport for tall 2:3 cards.
- **Key takeaway:** Always visually verify hover interactions with Playwright screenshots, not just DOM existence checks.

### Express 5 read-only req.query/params
- `req.query` and `req.params` are READ-ONLY getters in Express 5 — cannot reassign them
- Zod validation middleware must only set `req.body = parsed.body`, not query/params

### macOS Port 5000 conflict
- Port 5000 is used by AirPlay (ControlCenter) on macOS — use 5001 for backend

### Zod v4 breaking changes
- No `AnyZodObject` export — use `z.ZodType` instead
- Error array is `.issues` not `.errors`
- `z.ZodError` for instanceof checks

### JWT expiresIn type mismatch (@types/jsonwebtoken)
- `expiresIn` expects `StringValue` from `ms` package, not plain `string`
- Cast with `as unknown as jwt.SignOptions['expiresIn']`

### QA must do live browser testing before reporting PASS (Sprint 8)
- **Problem:** QA ran only unit tests (17 QA + 55 dev tests all pass) and reported "0 bugs". Boss then found real issues on localhost:1999: thumbnail URLs broken, session expired, content not rendering.
- **Root cause:** Unit tests mock APIs and DOM — they don't catch real integration issues (CORS, auth cookies, image URLs, session expiry).
- **Fix:** QA workflow must include Playwright E2E testing on localhost:1999 with login flow BEFORE reporting PASS. Must capture screenshots as evidence.
- **Key takeaway:** Unit tests ≠ app works. Always verify on real browser with real data.

### Prisma Unsupported() prevents tsvector drift (Sprint 9)
- **Problem:** Raw SQL columns (tsvector) not in schema.prisma get silently dropped by `prisma migrate dev` drift detection.
- **Fix:** Add `searchVector Unsupported("tsvector")? @map("search_vector")` to schema.prisma. Prisma sees the column as managed and won't drop it.
- **Key takeaway:** Any raw SQL column MUST be declared as `Unsupported("type")?` in schema.prisma to survive future migrations.

### Shell env vars override .env for Prisma CLI (Sprint 9)
- **Problem:** `DATABASE_URL` from another project in shell env overrode `.env` file, causing `prisma migrate dev` to fail with "scheme not recognized" (`postgresql+asyncpg://`).
- **Fix:** Explicitly pass `DATABASE_URL=postgresql://... npx prisma migrate dev`.
- **Key takeaway:** Always check shell env vars before running Prisma CLI. Use explicit `DATABASE_URL=` prefix when env might be polluted.

### Controllers must use schema.parse() not manual as-casts (Sprint 9)
- **Problem:** Controller manually reconstructed query with `as` casts, bypassing Zod transforms (coerce, defaults, empty string → undefined).
- **Fix:** Use `searchSchema.parse({ query: req.query }).query` to get fully transformed values.
- **Key takeaway:** Always re-parse through Zod schema in controller to apply transforms. Never manually cast `req.query` fields.

### Async UI handlers must use try/catch/finally, never try/finally (Sprint 10)
- **Problem:** ProfileManagePage used `try/finally` without `catch` on api.post/put/delete. Any API error propagated uncaught, crashing the page via React error boundary.
- **Fix:** Always use `try/catch/finally` in async UI handlers. `catch` keeps user on current view for retry.
- **Key takeaway:** `try/finally` without `catch` is ALWAYS wrong for async UI operations (AI-070).

### Multi-table writes must be wrapped in prisma.$transaction (Sprint 10)
- **Problem:** Auth register created User then Profile as separate calls. If profile creation failed, user existed with 0 profiles = broken state.
- **Fix:** Wrap in `prisma.$transaction(async (tx) => { ... })` for atomic multi-table writes.
- **Key takeaway:** Any operation writing to 2+ tables must use a transaction (AI-069).

### React key prop required on dynamic route components (Sprint 9)
- **Problem:** VideoPlayer at `/watch/[id]` showed stale video when navigating between different IDs. React reused the component instance — HLS player, refs, state all persisted.
- **Fix:** Add `key={contentId}` to force full remount on ID change.
- **Key takeaway:** Any component that initializes expensive resources (video players, WebSocket, canvas) in a dynamic route `[id]` page MUST have `key={id}` to force clean remount on navigation.

### cleanDatabase() must include all models (Sprint 10)
- **Problem:** Added Profile model but forgot to add `prisma.profile.deleteMany()` to `tests/setup.ts` cleanDatabase(). Caused 2 test failures in combined run — profiles leaked between test files via foreign key to users.
- **Fix:** Add new model's deleteMany() before its parent table in cleanup order.
- **Key takeaway:** Every new Prisma model MUST be added to cleanDatabase() in dependency order (children before parents).
