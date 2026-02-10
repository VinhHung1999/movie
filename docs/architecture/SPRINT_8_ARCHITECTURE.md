# Architecture Document: Sprint 8 — Content Detail & Preview Modal

**Author:** TL (Tech Lead)
**Date:** 2026-02-09
**Status:** PENDING PO REVIEW
**Sprint:** 8 (Content Detail & Preview Modal, 33pts: FE 24 + BE 3 + Infra 6)
**Depends on:** Sprint 7 (Video Player — CLOSED), Sprint 4 (Content APIs — CLOSED)

---

## 1. Pinned Dependency Versions

### Frontend (DO NOT UPGRADE)

| Package | Version | Notes |
|---------|---------|-------|
| next | 16.1.6 | App Router, Server/Client Components |
| react | 19.2.3 | React 19 |
| tailwindcss | ^4 | CSS-first config via globals.css |
| framer-motion | ^12.33.0 | Animations, AnimatePresence, drag |
| zustand | ^5.0.11 | Auth state |
| swr | ^2.4.0 | Client-side data fetching |
| axios | ^1.13.4 | HTTP client with interceptors |
| hls.js | ^1.6.15 | HLS video streaming |
| lucide-react | ^0.511.0 | Icons |
| clsx | ^2.1.1 | Conditional classes |
| vitest | ^4.0.18 | Testing framework |
| @testing-library/react | ^16.3.2 | React testing utilities |

### Backend (DO NOT UPGRADE)

| Package | Version | Notes |
|---------|---------|-------|
| express | ^5.2.1 | Express 5 (read-only req.query/params) |
| prisma | ^7.3.0 | Prisma 7 with PrismaPg adapter |
| @prisma/client | ^7.3.0 | |
| @prisma/adapter-pg | ^7.3.0 | |
| zod | ^4.3.6 | Validation (v4: `.issues` not `.errors`, no `AnyZodObject`) |
| cors | ^2.8.6 | Callback origin pattern |
| helmet | ^8.1.0 | Security headers |
| vitest | ^4.0.18 | Testing framework |

### No New Packages

Sprint 8 requires no new dependencies. All animation (Framer Motion), data fetching (SWR), and routing (Next.js App Router) needs are covered by existing packages.

---

## 2. Port Configuration

| Service | Port | URL |
|---------|------|-----|
| FE (Next.js dev) | 3000 | `http://localhost:3000` |
| BE (Express) | **5001** | `http://localhost:5001` |
| PostgreSQL | 5432 | `postgresql://localhost:5432/webphim` |
| Redis | 6379 | For BullMQ transcode queue |

**FE env:** `NEXT_PUBLIC_API_URL=http://localhost:5001/api`

**Reminder:** Port 5000 is blocked by macOS AirPlay (ControlCenter). BE uses 5001.

---

## 3. API Contracts

### 3.1 Existing Endpoints (No Changes)

#### GET /api/content/:id — Content Detail

Already implemented in Sprint 4. Returns full content with genres, cast, seasons/episodes.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "MOVIE" | "SERIES",
    "title": "string",
    "description": "string",
    "releaseYear": 2024,
    "maturityRating": "PG13",
    "duration": 120,
    "thumbnailUrl": "/images/content/...",
    "bannerUrl": "/images/content/...",
    "trailerUrl": "/videos/trailers/...",
    "viewCount": 1500,
    "genres": [
      { "id": "uuid", "name": "Action", "slug": "action" }
    ],
    "cast": [
      {
        "id": "uuid",
        "name": "Actor Name",
        "role": "ACTOR",
        "character": "Character Name",
        "photoUrl": "/images/cast/..."
      }
    ],
    "seasons": [
      {
        "id": "uuid",
        "seasonNumber": 1,
        "title": "Season 1",
        "episodes": [
          {
            "id": "uuid",
            "episodeNumber": 1,
            "title": "Pilot",
            "description": "First episode...",
            "duration": 45,
            "thumbnailUrl": "/images/episodes/..."
          }
        ]
      }
    ]
  }
}
```

**Error:** `404 { "success": false, "message": "Content not found" }`

### 3.2 NEW Endpoint: GET /api/content/:id/similar — Similar Content (Task 8.6)

**Purpose:** Return content that shares genres with the given content, excluding the content itself.

**Route:** `GET /api/content/:id/similar`

**Auth:** Not required (public endpoint, same as content list/detail)

**Path Params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Content ID to find similar items for |

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 12 | Max items to return (1-20) |

**Algorithm:**
1. Fetch the target content's genre IDs
2. Find content that shares at least one genre with the target
3. Exclude the target content itself
4. Order by number of shared genres DESC, then by viewCount DESC
5. Limit to `limit` items
6. Return `ContentSummary[]` format (same as content list)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "MOVIE",
      "title": "Similar Movie",
      "description": "...",
      "releaseYear": 2023,
      "maturityRating": "PG13",
      "duration": 110,
      "thumbnailUrl": "/images/content/...",
      "bannerUrl": "/images/content/...",
      "viewCount": 800,
      "genres": [
        { "id": "uuid", "name": "Action", "slug": "action" }
      ]
    }
  ]
}
```

**Error Responses:**
- `404` — Content not found: `{ "success": false, "message": "Content not found" }`
- `400` — Invalid limit: `{ "success": false, "message": "Validation error", "errors": [...] }`

**Implementation Notes:**
- Reuse the same response mapping as `contentService.list()` for consistent ContentSummary format
- Use Prisma raw query or nested `contentGenres` filter for "shared genres" logic
- No auth middleware needed — follows same pattern as existing content routes

**Prisma Query Strategy:**
```typescript
// Step 1: Get target content's genre IDs
const target = await prisma.content.findUnique({
  where: { id },
  include: { contentGenres: { select: { genreId: true } } },
});
const genreIds = target.contentGenres.map(cg => cg.genreId);

// Step 2: Find content sharing those genres, ordered by overlap count
const similar = await prisma.content.findMany({
  where: {
    id: { not: id },
    contentGenres: { some: { genreId: { in: genreIds } } },
  },
  include: {
    contentGenres: {
      include: { genre: { select: { id: true, name: true, slug: true } } },
    },
  },
  take: limit * 2, // Over-fetch for sorting by overlap
});

// Step 3: Sort by genre overlap count, then viewCount
const sorted = similar
  .map(item => ({
    ...item,
    overlapCount: item.contentGenres.filter(cg => genreIds.includes(cg.genreId)).length,
  }))
  .sort((a, b) => b.overlapCount - a.overlapCount || b.viewCount - a.viewCount)
  .slice(0, limit);
```

**Validation Schema (Zod):**
```typescript
export const similarContentParams = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(20).default(12),
  }),
});
```

---

## 4. Test DB Configuration (AI-028 — Task 8.7)

### CURRENT STATE (PROBLEM)

**Tests run against the dev database `webphim` — there is no test DB isolation.**

- `webphim-be/.env` has `DATABASE_URL=postgresql://phuhung:@localhost:5432/webphim`
- No `.env.test` file exists
- No `webphim_test` database exists
- `tests/setup.ts` runs `deleteMany()` on all tables in `beforeAll` and `afterEach`
- **Result:** Running tests destroys all seed data. Devs must re-seed after every test run.

This has been a P0 issue for 2 sprints (AI-028). Task 8.7 fixes it.

### SOLUTION: Separate Test Database (Task 8.7 — BE)

**Step 1: Create test database**
```bash
createdb -U phuhung webphim_test
```

**Step 2: Create `.env.test` in `webphim-be/`**
```env
DATABASE_URL=postgresql://phuhung:@localhost:5432/webphim_test
PORT=5001
JWT_ACCESS_SECRET=test-access-secret
JWT_REFRESH_SECRET=test-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379
STORAGE_LOCAL_DIR=./uploads-test
```

**Step 3: Update `tests/setup.ts` to load `.env.test`**
```typescript
// At the very top of tests/setup.ts, BEFORE any other imports:
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.test', override: true });

// Rest of setup.ts remains the same...
```

**Step 4: Apply migrations to test DB**
```bash
DATABASE_URL=postgresql://phuhung:@localhost:5432/webphim_test npx prisma migrate deploy
```

**Step 5: Add npm script for convenience**
```json
{
  "scripts": {
    "test:db:setup": "createdb -U phuhung webphim_test 2>/dev/null; DATABASE_URL=postgresql://phuhung:@localhost:5432/webphim_test npx prisma migrate deploy",
    "test:db:reset": "dropdb -U phuhung webphim_test 2>/dev/null; npm run test:db:setup"
  }
}
```

**Step 6: Add `.env.test` to `.gitignore`** (if credentials differ per dev)

**Verification:** After setup, running `npx vitest run` should:
1. Connect to `webphim_test` (not `webphim`)
2. All 161 existing tests pass
3. `webphim` dev database and seed data remain untouched

### Frontend Tests (Vitest + RTL)

**Existing pattern — no changes:**
- Test config: `webphim-fe/vitest.config.ts`
- Mock API calls with `vi.mock()` or MSW
- SWR cache isolation: Wrap renders in `<SWRConfig value={{ provider: () => new Map() }}>`
- Framer Motion: Use `onPointerEnter`/`onPointerLeave` (not `onHoverStart`/`onHoverEnd`) for jsdom compatibility

### QA Unit Test Strategy for Sprint 8

**BE (Task 8.6 — Similar Content API):**
- Test with content that has overlapping genres (verify correct items returned)
- Test exclusion of the target content from results
- Test ordering (more shared genres ranked higher)
- Test limit parameter (default 12, custom values)
- Test with content that has no shared genres (empty array)
- Test with invalid/non-existent content ID (404)
- Test limit validation (min 1, max 20)

**FE (Tasks 8.1–8.5):**
- Modal open/close behavior (click card → modal opens, click backdrop/X → closes)
- Modal content rendering (title, synopsis, cast, genres, buttons)
- Scroll lock when modal is open
- Animation presence (enter/exit)
- Content detail page rendering at `/title/[id]`
- Episode list for series (season selector, episode cards)
- Similar titles section rendering
- Keyboard: Esc closes modal

---

## 4a. Pre-Existing Test Health (AI-035)

### Current Status: ALL 161 TESTS PASS

As of Sprint 8 start, running `npx vitest run` in `webphim-be/`:

| Test File | Tests | Status | Notes |
|-----------|-------|--------|-------|
| `auth.test.ts` | passing | GREEN | Register, login, refresh, logout, /me |
| `auth-e2e.test.ts` | passing | GREEN | Full auth lifecycle |
| `content.test.ts` | passing | GREEN | List, filter, sort, detail, featured, genres |
| `video.test.ts` | passing | GREEN | Upload, transcode, stream, status |
| `video-upload.test.ts` | passing | GREEN | Upload-specific tests |
| `stream.test.ts` | passing | GREEN | Streaming endpoint |
| `ffmpeg.test.ts` | passing | GREEN | FFmpeg integration |
| `queue.test.ts` | passing | GREEN | BullMQ enqueue, process, progress |
| `storage.test.ts` | passing | GREEN | Local storage provider |
| `watch-history.test.ts` | passing | GREEN | Watch history CRUD |
| `watch-history-e2e.test.ts` | passing | GREEN | Watch history E2E |
| **Total** | **161** | **ALL PASS** | **Duration: ~42s** |

### Previously Reported Issues — Now Resolved

| Issue | File | Status | Resolution |
|-------|------|--------|------------|
| FK constraint violation | `content.test.ts` | FIXED | `cleanDatabase()` now deletes in correct FK dependency order (children → parents) |
| BullMQ race condition | `queue.test.ts` | FIXED | `fileParallelism: false` prevents concurrent test files. Worker starts fresh in `beforeAll`. |

### Known Fragilities (Not Failing, But Worth Noting)

1. **No test DB isolation** (AI-028): Tests wipe dev DB. Task 8.7 addresses this.
2. **queue.test.ts polling**: Uses `setInterval(500ms)` polling to wait for async worker. Has 60s timeout but no explicit guard — if BullMQ worker hangs, test waits for vitest `testTimeout` (10s on non-transcode tests).
3. **Seed data destroyed**: After test run, dev DB is empty. Must re-seed with `npx prisma db seed`.

### Baseline for Sprint 8

**Any new test failure during Sprint 8 is a regression**, not pre-existing. All 161 tests pass at sprint start. New tests for tasks 8.6/8.7/8.8 should be additive.

---

## 4b. E2E / QA Test Strategy (AI-036)

### Testing Approach by Layer

| Layer | Strategy | Tooling |
|-------|----------|---------|
| BE unit/integration | Real DB (webphim_test) | Vitest + supertest + Prisma |
| FE unit | Mocked API | Vitest + RTL + vi.mock() |
| FE integration | Mocked API (SWR) | Vitest + RTL + SWR cache isolation |
| QA E2E (API) | Real DB (webphim_test) | Vitest + supertest |
| QA E2E (UI) | Not in Sprint 8 scope | Future: Playwright |

### BE Tests: Real DB, Real Prisma

- **Fixtures:** Use test helper factories (`tests/helpers/content.helper.ts`) to create test data per suite
- **Cleanup:** `cleanDatabase()` in `afterEach` ensures isolation between tests
- **No mocks for Prisma:** Tests exercise real queries against `webphim_test`
- **Redis/BullMQ:** Queue tests use real Redis. Ensure Redis is running locally.
- **FFmpeg:** `ffmpeg.test.ts` and transcode tests require FFmpeg installed locally

**Pattern for new Similar Content tests:**
```typescript
// tests/content-similar.test.ts
import { seedTestData, createTestContent } from './helpers/content.helper';

describe('GET /api/content/:id/similar', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeEach(async () => {
    testData = await seedTestData(); // Creates genres + linked content
  });

  it('returns content sharing genres', async () => {
    const res = await request(app).get(`/api/content/${testData.movieId}/similar`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    // Verify results share at least one genre with the movie
  });
});
```

### FE Tests: Mocked API, Real Components

- **API mocking:** Mock the SWR fetcher or axios at module level with `vi.mock('@/lib/api')`
- **SWR isolation:** Every test render wrapped in `<SWRConfig value={{ provider: () => new Map() }}>`
- **Framer Motion:** Use `onPointerEnter`/`onPointerLeave` events (jsdom compatible)
- **Portal (modal):** createPortal renders to `document.body` in jsdom — works with RTL's `screen.getByRole()`
- **No real API calls in FE tests**

**Pattern for modal tests:**
```typescript
// Mock API response
vi.mock('@/lib/api', () => ({
  default: { get: vi.fn() },
}));

// Mock SWR to return test data
vi.mock('swr', async () => {
  const actual = await vi.importActual('swr');
  return { ...actual, default: vi.fn() };
});

describe('PreviewModal', () => {
  it('renders content when open', () => {
    // Provide mock content data via SWR mock
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PreviewModal contentId="test-id" isOpen={true} onClose={vi.fn()} />
      </SWRConfig>
    );
    expect(screen.getByText('Test Movie Title')).toBeInTheDocument();
  });
});
```

### QA Testing Checklist

**Before testing Sprint 8:**
1. Ensure `webphim_test` DB exists and has migrations applied (Task 8.7)
2. Verify all 161 pre-existing tests pass (baseline)
3. Run new Sprint 8 tests in isolation

**Sprint 8 QA test coverage targets:**
- Task 8.6 (Similar API): 7+ test cases (see Section 4 QA strategy)
- Task 8.7 (Test DB): Verify isolation — run tests, then check dev DB still has seed data
- Task 8.8 (Fix pre-existing): All 161 tests pass with new test DB config

---

## 5. Component Tree

### 5.1 File Structure — New & Modified Files

```
webphim-fe/src/
├── app/
│   ├── (main)/
│   │   └── title/
│   │       └── [id]/
│   │           └── page.tsx          # NEW: Content Detail Page (Task 8.2)
│   └── ... (existing, no changes)
│
├── components/
│   ├── home/
│   │   └── MovieCard.tsx             # MODIFY: ChevronDown → opens PreviewModal (Task 8.1)
│   │
│   ├── detail/                       # NEW DIRECTORY
│   │   ├── PreviewModal.tsx          # Task 8.1: Modal overlay component
│   │   ├── ModalContent.tsx          # Task 8.1: Modal inner content (reused in detail page)
│   │   ├── ContentHero.tsx           # Task 8.2: Hero section for detail page
│   │   ├── ContentMeta.tsx           # Shared: Maturity badge, year, duration, genres
│   │   ├── CastList.tsx              # Shared: Cast & crew list
│   │   ├── EpisodeList.tsx           # Task 8.3: Season selector + episode cards
│   │   ├── EpisodeCard.tsx           # Task 8.3: Individual episode card
│   │   └── SimilarTitles.tsx         # Task 8.5: Row of similar content
│   │
│   └── ... (existing, no changes)
│
├── hooks/
│   └── useBodyScrollLock.ts          # NEW: Lock/unlock body scroll for modal (Task 8.4)
│
└── types/
    └── index.ts                      # UPDATE: Add SimilarContentResponse type
```

### 5.2 Component Tree Diagram

```
App Root
│
├── HomePage (/home) — existing
│   └── ContentRow
│       └── MovieCard
│           ├── (hover overlay — existing)
│           │   └── ChevronDown button → onClick: openPreviewModal(item.id) ★ MODIFIED
│           │
│           └── PreviewModal (portal to body, conditional) ★ NEW
│               ├── Backdrop (black/60, blur-sm, onClick: close)
│               └── ModalContent (centered, max-w-3xl)
│                   ├── CloseButton (X, top-right)
│                   ├── TrailerPlayer (auto-play muted, or banner fallback)
│                   │   ├── <video> or HeroBanner image
│                   │   └── GradientOverlay (bottom fade)
│                   ├── ActionBar
│                   │   ├── PlayButton (white bg, routes to /watch/:id)
│                   │   ├── AddToListButton (circle, +)
│                   │   ├── LikeButton (circle, thumbs-up)
│                   │   └── MuteToggle (for trailer audio, right-aligned)
│                   ├── ContentMeta
│                   │   ├── MaturityBadge
│                   │   ├── Year · Duration · HD badge
│                   │   └── GenreTags
│                   ├── Synopsis (description text)
│                   ├── CastList (cast names, "Starring: ..., Director: ...")
│                   ├── EpisodeList (if SERIES) ★ Task 8.3
│                   │   ├── SeasonSelector (dropdown)
│                   │   └── EpisodeCard[] (per season)
│                   │       ├── EpisodeNumber
│                   │       ├── Thumbnail
│                   │       ├── Title + Duration
│                   │       └── Description
│                   └── SimilarTitles ★ Task 8.5
│                       └── MovieCard[] (compact mode, no hover expand)
│
├── ContentDetailPage (/title/[id]) ★ NEW — Task 8.2
│   ├── ContentHero
│   │   ├── BannerImage (full width, 60vh)
│   │   ├── GradientOverlay
│   │   ├── TrailerAutoPlay (if trailerUrl, muted)
│   │   └── ContentInfo overlay
│   │       ├── Title (text-4xl)
│   │       ├── ContentMeta (shared component)
│   │       ├── PlayButton → /watch/:id
│   │       └── AddToListButton
│   ├── ContentMeta (expanded — full info section)
│   │   ├── Synopsis (full description)
│   │   ├── CastList (full cast & crew)
│   │   └── GenreTags
│   ├── EpisodeList (if SERIES) — reuses same component
│   └── SimilarTitles — reuses same component
│
└── GenreBrowsePage (/browse/[genre]) — existing
    └── ContentGrid
        └── MovieCard → ChevronDown → PreviewModal (same behavior)
```

### 5.3 Component Specifications

#### PreviewModal (Task 8.1) — `'use client'`

**Props:**
```typescript
interface PreviewModalProps {
  contentId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**Behavior:**
- Renders via React `createPortal` to `document.body`
- Fetches `ContentDetail` via SWR: `useSWR<{ success: true; data: ContentDetail }>(`/content/${contentId}`)`
- Shows loading skeleton while fetching
- Backdrop: `fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm`
- Modal container: `relative mx-auto mt-8 max-w-3xl overflow-hidden rounded-lg bg-netflix-dark shadow-2xl`
- Max height: `max-h-[90vh]` with `overflow-y-auto`
- Close triggers: click backdrop, click X button, press Esc key
- Body scroll locked while open (useBodyScrollLock hook)
- **Trailer auto-play:** If `data.trailerUrl` exists, render a small `<video>` that auto-plays muted at the top of the modal. If not, show `bannerUrl` as static image.

**Animation (Task 8.4):**
```typescript
// AnimatePresence wraps conditional rendering
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed inset-0 z-[101] flex items-start justify-center overflow-y-auto pt-8 pb-8"
      >
        {/* Modal content... */}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

#### ModalContent — `'use client'`

**Props:**
```typescript
interface ModalContentProps {
  content: ContentDetail;
  onClose?: () => void;       // Only in modal context
  onPlay: () => void;
}
```

Shared layout used by both PreviewModal and ContentDetailPage. Contains:
- Trailer/banner area
- Action buttons
- Synopsis, cast, meta
- Episode list (if series)
- Similar titles section

#### ContentHero (Task 8.2) — `'use client'`

**Props:**
```typescript
interface ContentHeroProps {
  content: ContentDetail;
}
```

**Behavior:**
- Full-width banner image: `h-[60vh] relative`
- Gradient overlay: bottom-to-top `from-netflix-black via-netflix-black/60 to-transparent`
- If `trailerUrl` exists: auto-play muted `<video>` behind content info
- Content info positioned bottom-left over gradient:
  - Title: `text-4xl md:text-5xl font-bold`
  - ContentMeta component
  - Play + Add to List buttons

#### ContentMeta — `'use client'`

**Props:**
```typescript
interface ContentMetaProps {
  content: ContentDetail | ContentSummary;
  variant?: 'compact' | 'full';  // compact for modal, full for detail page
}
```

**Renders:**
- Maturity rating badge: `border px-1.5 py-0.5 text-xs`
- Release year
- Duration (formatted `Xh Ym`)
- "HD" badge (always shown)
- Genre tags (compact: first 3, full: all)

#### CastList — `'use client'`

**Props:**
```typescript
interface CastListProps {
  cast: CastMember[];
  variant?: 'compact' | 'full';
}
```

**Renders:**
- Compact (modal): `Cast: Name1, Name2, Name3...` (single line, truncated)
- Full (detail page): Grouped by role — "Starring: ...", "Director: ...", "Writer: ..."
- Text color: `text-netflix-light-gray` for labels, `text-white` for names

#### EpisodeList (Task 8.3) — `'use client'`

**Props:**
```typescript
interface EpisodeListProps {
  seasons: SeasonDetail[];
  contentId: string;
}
```

**Behavior:**
- Season selector: `<select>` dropdown styled as Netflix dark dropdown
  - Default: Season 1 selected
  - Options: `Season 1`, `Season 2`, etc. (or custom season titles if available)
  - State: `const [selectedSeason, setSelectedSeason] = useState(0)` (index)
- Episode cards: Vertical list for selected season
- Section title: "Episodes" with season selector inline

#### EpisodeCard (Task 8.3) — `'use client'`

**Props:**
```typescript
interface EpisodeCardProps {
  episode: EpisodeSummary;
  episodeIndex: number;
  contentId: string;
  onClick: () => void;
}
```

**Layout (horizontal):**
```
┌──────┬───────────────────────────────────────┐
│  1   │  Episode Title               45m      │
│ thumb│  Episode description text that can     │
│      │  span up to 2 lines max...            │
└──────┴───────────────────────────────────────┘
```

- Left: Episode number + thumbnail (120×68px)
- Right: Title + duration on first line, description (line-clamp-2) below
- Hover: `bg-netflix-gray/30` highlight
- Click: Navigate to `/watch/${contentId}?episode=${episode.id}`
- Border bottom: `border-b border-netflix-border`

#### SimilarTitles (Task 8.5) — `'use client'`

**Props:**
```typescript
interface SimilarTitlesProps {
  contentId: string;
}
```

**Behavior:**
- Fetches from new API: `useSWR<{ success: true; data: ContentSummary[] }>(`/content/${contentId}/similar`)`
- Section title: "More Like This"
- Grid layout: `grid grid-cols-2 sm:grid-cols-3 gap-3`
- Renders `MovieCard` in **compact mode** (no hover expand — already inside modal/detail page)
- Shows max 12 items (API default)
- Loading: Show 6 skeleton cards while fetching
- Empty state: Hide section entirely if no similar content

#### useBodyScrollLock Hook (Task 8.4)

```typescript
// src/hooks/useBodyScrollLock.ts
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (isLocked) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
}
```

---

## 6. Routing

### New Route

| Route | Component | Type | Description |
|-------|-----------|------|-------------|
| `/title/[id]` | `app/(main)/title/[id]/page.tsx` | Client | Full content detail page |

### Existing Routes (No Changes)

| Route | Notes |
|-------|-------|
| `/home` | Hero + content rows. MovieCard ChevronDown now opens PreviewModal. |
| `/browse/[genre]` | ContentGrid. MovieCard ChevronDown also opens PreviewModal. |
| `/watch/[id]` | Video player page (cinema mode, outside main layout). |

### Navigation Flow

```
MovieCard (hover) → ChevronDown button → PreviewModal
MovieCard (hover) → Play button → /watch/:id
PreviewModal → Play button → /watch/:id
PreviewModal → "More Details" link → /title/:id
ContentDetailPage → Play button → /watch/:id
EpisodeCard → Click → /watch/:id?episode=:episodeId
```

### ContentDetailPage (/title/[id]) — `'use client'`

This page fetches content detail via SWR (same endpoint as modal). Client component because it needs SWR and interactivity.

```typescript
// src/app/(main)/title/[id]/page.tsx
'use client';

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = params.id as string;

  const { data, error } = useSWR<{ success: true; data: ContentDetail }>(
    `/content/${contentId}`
  );

  // Loading, error, and content rendering...
}
```

---

## 7. State Management

### Modal State

Modal state is **local** to the component that opens it. No global store needed.

```typescript
// In MovieCard or parent component
const [previewModalId, setPreviewModalId] = useState<string | null>(null);

// Open: setPreviewModalId(item.id)
// Close: setPreviewModalId(null)
```

**Where to manage state:**
- Option A: Each MovieCard manages its own modal state (simpler, isolated)
- Option B: Parent component (ContentRow or page) manages single modal state (prevents multiple modals)

**Decision: Option B** — Parent manages state. Only one modal can be open at a time. Pass `onOpenPreview` callback down to MovieCard.

**Implementation in ContentRow:**
```typescript
// ContentRow.tsx
const [previewId, setPreviewId] = useState<string | null>(null);

return (
  <>
    <div className="...">
      {items.map(item => (
        <MovieCard
          key={item.id}
          item={item}
          onOpenPreview={() => setPreviewId(item.id)}
        />
      ))}
    </div>
    <PreviewModal
      contentId={previewId!}
      isOpen={!!previewId}
      onClose={() => setPreviewId(null)}
    />
  </>
);
```

**For ContentGrid (browse page):** Same pattern — parent grid manages single modal ID.

### Episode Season Selection

Local `useState` in EpisodeList component. No store needed.

### No New Zustand Stores

Sprint 8 does not require new global state. All state is component-local or fetched via SWR.

---

## 8. CORS Configuration (AI-016)

### No Changes Needed

The existing CORS config in `webphim-be/src/config/cors.ts` already supports:
- `http://localhost:3000` (FE dev)
- `http://localhost:3001` (FE alternate)
- Callback pattern for multi-origin
- `credentials: true` for cookies

The new `/api/content/:id/similar` endpoint is public (no auth) and follows the same CORS policy as existing content routes.

---

## 9. Validated Query Middleware Pattern (AI-020)

### For the Similar Content API

Express 5 makes `req.query` and `req.params` read-only. The validation middleware already handles this by only modifying `req.body`.

For the similar endpoint, the `limit` query param is accessed directly after Zod validation:
```typescript
// In controller:
const { limit } = req.query as unknown as { limit: number };
// OR use validated body if middleware coerces to body:
const limit = Number(req.query.limit) || 12;
```

**Pattern:** Follow existing `content.controller.ts` — read query params directly from `req.query` after Zod validation ensures they are valid. Use `z.coerce.number()` in the validation schema for type coercion.

---

## 10. Seed Data Review (AI-021)

### Current Seed Data Status

Sprint 4 seed includes 30+ movies, 5+ series, 12+ genres, 50+ cast members. This is sufficient for Sprint 8:
- **Similar Content:** Multiple items share genres → `/similar` will return results
- **Series:** At least 5 series with seasons/episodes → Episode List can be tested
- **Cast:** ContentCastCrew entries exist → CastList will render
- **Trailer URLs:** `trailerUrl` may be null for most seed content → Modal/Detail page should handle null gracefully (show banner image fallback)

### Verification Checklist for QA
- [ ] At least 2 content items share the same genre (for similar content testing)
- [ ] At least 1 SERIES has 2+ seasons with 3+ episodes each
- [ ] At least 1 content has cast members with all 3 roles (ACTOR, DIRECTOR, WRITER)
- [ ] Verify trailerUrl values in seed — if null, FE falls back to bannerUrl

---

## 11. Known Gotchas

### From MEMORY.md (Still Relevant)

| Issue | Impact on Sprint 8 |
|-------|-------------------|
| Port 5000 blocked by macOS AirPlay | BE on 5001. FE env points to 5001. |
| Express 5 read-only req.query/params | BE: `limit` query param must be read from req.query directly, not reassigned |
| Prisma 7 PrismaPg adapter | BE: No schema changes needed, but if adding to content.service.ts, follow existing pattern |
| Prisma migration drift (AI-023) | BE: `search_vector` column + trigger already dropped. No impact on Sprint 8. |
| SWR cache isolation in tests | FE: Wrap test renders in `<SWRConfig value={{ provider: () => new Map() }}>` |
| Framer Motion onHoverStart/onHoverEnd in jsdom | FE: Use `onPointerEnter`/`onPointerLeave` for test compatibility |
| Helmet blocks cross-origin static | BE: Static files already serve before helmet. No changes needed. |
| `fetchFromAPI` double-unwrap | FE: `fetchFromAPI` returns `json.data` (pre-unwrapped). SWR fetcher returns full response. Know which you're using. |
| React 19 lint: refs in render | FE: Don't read `ref.current` in render body. Use callback refs or useEffect. |
| Vitest 4 vi.fn() typing | FE: Use `vi.fn<(args) => ret>()` with const declaration for type inference. |

### Sprint 8 Specific Gotchas

1. **Portal and scroll lock interaction.** When modal renders via `createPortal`, the scroll lock must target `document.body`. Use `position: fixed` approach (see useBodyScrollLock) — `overflow: hidden` alone doesn't prevent scroll on mobile Safari.

2. **AnimatePresence requires key.** When using `AnimatePresence` with conditional rendering, the child `motion.div` must have a `key` prop. Otherwise exit animations won't fire.

3. **Trailer auto-play policy.** Browsers block auto-play with audio. The modal trailer MUST be muted by default (`muted autoPlay playsInline`). Add a mute toggle button for users to unmute.

4. **SWR deduplication for modal and detail page.** If user opens modal for content X, then navigates to `/title/X`, SWR deduplicates the `/content/X` request (same key). This is a feature, not a bug — data is reused from cache.

5. **Modal z-index stacking.** The modal backdrop is `z-[100]`, modal content `z-[101]`. Ensure no other elements (e.g., AuthNavbar with `z-50`) overlap. Current navbar is `z-50` — no conflict.

6. **MovieCard onOpenPreview callback.** The ChevronDown button in MovieCard's hover overlay needs to call `onOpenPreview` AND `event.stopPropagation()` to prevent the card click from navigating away.

7. **Episode click with query params.** When clicking an episode, navigate to `/watch/:contentId?episode=:episodeId`. The watch page currently doesn't handle episode-specific playback — this is a forward reference. For Sprint 8, just navigate with the query param; the watch page will ignore it until a future sprint adds episode-aware playback.

---

## 12. FE Type Updates

Add to `webphim-fe/src/types/index.ts`:

```typescript
// ============================================
// Similar Content Types (Sprint 8)
// ============================================

export interface SimilarContentResponse {
  success: true;
  data: ContentSummary[];
}
```

No new types needed for modal/detail — they use existing `ContentDetail`, `ContentSummary`, `SeasonDetail`, `EpisodeSummary`, `CastMember`.

---

## 13. BE Implementation Guide (Tasks 8.6, 8.7, 8.8)

### Files to Create/Modify

**Task 8.6 — Similar Content API:**

| File | Action | Description |
|------|--------|-------------|
| `src/services/content.service.ts` | MODIFY | Add `getSimilar(id, limit)` method |
| `src/controllers/content.controller.ts` | MODIFY | Add `getSimilar` handler |
| `src/routes/content.routes.ts` | MODIFY | Add `GET /:id/similar` route |
| `src/validations/content.validation.ts` | MODIFY | Add `similarContentSchema` |
| `tests/content-similar.test.ts` | CREATE | Tests for similar content endpoint |

**Task 8.7 — Test DB Setup (AI-028):**

| File | Action | Description |
|------|--------|-------------|
| `.env.test` | CREATE | Test environment variables with `webphim_test` DB |
| `tests/setup.ts` | MODIFY | Add `dotenv` config loading `.env.test` at top |
| `package.json` | MODIFY | Add `test:db:setup` and `test:db:reset` scripts |
| `.gitignore` | MODIFY | Add `.env.test` |

**Task 8.8 — Verify Test Health (AI-033/AI-035):**

| File | Action | Description |
|------|--------|-------------|
| No file changes | — | Run full suite, verify all 161 pass against webphim_test, verify dev DB intact |

### Task Execution Order (BE)

```
8.7 (Test DB setup) → 8.8 (Verify test health) → 8.6 (Similar API)
```

Task 8.7 must be done FIRST so that 8.8 can verify against the new test DB, and 8.6 tests run against `webphim_test` from the start.

### Service Method

```typescript
// In contentService object
async getSimilar(id: string, limit: number = 12) {
  // 1. Get target content's genres
  const target = await prisma.content.findUnique({
    where: { id },
    include: { contentGenres: { select: { genreId: true } } },
  });

  if (!target) {
    throw ApiError.notFound('Content not found');
  }

  const genreIds = target.contentGenres.map(cg => cg.genreId);

  if (genreIds.length === 0) {
    return [];
  }

  // 2. Find content sharing those genres
  const candidates = await prisma.content.findMany({
    where: {
      id: { not: id },
      contentGenres: { some: { genreId: { in: genreIds } } },
    },
    include: {
      contentGenres: {
        include: { genre: { select: { id: true, name: true, slug: true } } },
      },
    },
    take: limit * 3, // Over-fetch for in-memory ranking
  });

  // 3. Rank by shared genre count, then viewCount
  const ranked = candidates
    .map(item => ({
      item,
      overlap: item.contentGenres.filter(cg => genreIds.includes(cg.genreId)).length,
    }))
    .sort((a, b) => b.overlap - a.overlap || b.item.viewCount - a.item.viewCount)
    .slice(0, limit);

  // 4. Map to ContentSummary format
  return ranked.map(({ item }) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    releaseYear: item.releaseYear,
    maturityRating: item.maturityRating,
    duration: item.duration,
    thumbnailUrl: item.thumbnailUrl,
    bannerUrl: item.bannerUrl,
    viewCount: item.viewCount,
    genres: item.contentGenres.map(cg => cg.genre),
  }));
}
```

---

## 14. Acceptance Criteria

### Task 8.1 — Preview Modal (8 pts)
- [ ] Clicking ChevronDown on MovieCard hover opens a centered modal
- [ ] Modal shows trailer auto-play (muted) or banner image fallback
- [ ] Modal displays: title, synopsis, cast, genres, maturity rating, year, duration
- [ ] Play button navigates to `/watch/:id`
- [ ] Add to List and Like buttons render (functionality placeholder)
- [ ] Similar titles row renders at bottom of modal (Task 8.5 dependency)
- [ ] Modal closes on: backdrop click, X button, Esc key
- [ ] Body scroll is locked while modal is open
- [ ] Loading skeleton while content is fetching

### Task 8.2 — Content Detail Page (5 pts)
- [ ] Page renders at `/title/[id]` within MainLayout
- [ ] Hero section with banner image and gradient overlay
- [ ] Trailer auto-play if available
- [ ] Full content info: title, synopsis, all cast grouped by role, all genres
- [ ] Play button navigates to `/watch/:id`
- [ ] Similar titles section at bottom

### Task 8.3 — Episode List for Series (5 pts)
- [ ] Only renders for content type SERIES
- [ ] Season dropdown with all seasons listed
- [ ] Default selection: Season 1
- [ ] Episode cards show: number, thumbnail, title, duration, description
- [ ] Click episode navigates to `/watch/:contentId?episode=:episodeId`
- [ ] Renders in both PreviewModal and ContentDetailPage

### Task 8.4 — Modal Animations (3 pts)
- [ ] Modal entry: scale 0.9→1 + opacity 0→1 (spring animation)
- [ ] Modal exit: scale 1→0.9 + opacity 1→0 (fade out)
- [ ] Backdrop: opacity fade in/out with blur
- [ ] Body scroll lock prevents background scrolling
- [ ] Smooth transitions on all interactive elements

### Task 8.5 — Similar Titles Section (3 pts)
- [ ] Fetches from `GET /api/content/:id/similar`
- [ ] Renders as grid (2×3 on mobile, 3×N on desktop)
- [ ] Uses MovieCard in compact mode (no hover expand)
- [ ] Section hidden if no similar content
- [ ] Loading skeleton while fetching

### Task 8.6 — Similar Content API (3 pts, BE)
- [ ] `GET /api/content/:id/similar` returns ContentSummary[]
- [ ] Results share at least one genre with target content
- [ ] Target content is excluded from results
- [ ] Results ordered by genre overlap count DESC, then viewCount DESC
- [ ] Default limit 12, configurable 1-20 via query param
- [ ] Returns 404 for non-existent content
- [ ] Returns empty array for content with no similar items
- [ ] All tests passing

### Task 8.7 — Test DB Setup (3 pts, BE — AI-028, P0)
- [ ] `webphim_test` database created
- [ ] `.env.test` created with test DB connection string
- [ ] `tests/setup.ts` loads `.env.test` before any imports
- [ ] All migrations applied to `webphim_test` via `prisma migrate deploy`
- [ ] `npm run test:db:setup` and `test:db:reset` scripts added to package.json
- [ ] All 161 existing tests pass against `webphim_test`
- [ ] Dev database `webphim` remains untouched after test run (seed data preserved)
- [ ] `.env.test` added to `.gitignore`

### Task 8.8 — Verify Pre-Existing Test Health (3 pts, BE — AI-033/AI-035, P0)
- [ ] Run full test suite (`npx vitest run`) — confirm all 161 tests pass
- [ ] Run tests against new `webphim_test` DB (after Task 8.7)
- [ ] Verify `content.test.ts` — no FK violations (cleanup order correct)
- [ ] Verify `queue.test.ts` — no BullMQ race conditions (sequential execution)
- [ ] Verify dev DB `webphim` still has seed data after test run
- [ ] Document any flaky tests found during verification
- [ ] All tests green — baseline established for Sprint 8

---

## Architecture Doc Checklist (AI-011)

- [x] **Pinned dependency versions** (AI-002) — Section 1
- [x] **API contracts** (AI-007) — Section 3 (existing + new similar endpoint)
- [x] **Port standard** (AI-003) — Section 2 (BE: 5001)
- [x] **Test DB config** (AI-006/AI-028) — Section 4 (concrete setup instructions + Task 8.7)
- [x] **Component tree** (AI-005) — Section 5 (full hierarchy with props)
- [x] **Known gotchas** — Section 11 (MEMORY.md + Sprint 8 specific)
- [x] **CORS configuration** (AI-016) — Section 8
- [x] **Validated query middleware pattern** (AI-020) — Section 9
- [x] **Seed data review** (AI-021) — Section 10
- [x] **Pre-existing test health** (AI-035) — Section 4a (all 161 pass, baseline documented)
- [x] **E2E test strategy** (AI-036) — Section 4b (fixtures/mocking guidance per layer)
- [x] **Tasks 8.7 + 8.8** — Section 14 (test DB setup + verify test health, 6pts added)
