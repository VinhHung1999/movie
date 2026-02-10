# Sprint 7 Architecture: Video Player

**Sprint:** 7 | **Points:** 41 | **Author:** TL | **Date:** 2026-02-08

---

## Table of Contents

1. [Pinned Dependencies](#1-pinned-dependencies)
2. [Migration Drift Check (AI-023)](#2-migration-drift-check-ai-023)
3. [DB Schema Notes](#3-db-schema-notes)
4. [File & Directory Structure](#4-file--directory-structure)
5. [API Contracts](#5-api-contracts)
6. [FE Component Tree](#6-fe-component-tree)
7. [Service Architecture](#7-service-architecture)
8. [Config & Environment](#8-config--environment)
9. [CORS Configuration](#9-cors-configuration)
10. [Test DB Config](#10-test-db-config)
11. [Known Gotchas](#11-known-gotchas)
12. [Task Breakdown](#12-task-breakdown)

---

## 1. Pinned Dependencies

### FE - New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `hls.js` | `^1.6.15` | HLS adaptive bitrate streaming player |

### FE - Existing (unchanged)

| Package | Version | Notes |
|---------|---------|-------|
| `next` | `16.1.6` | Next.js 16 App Router |
| `react` | `19.2.3` | React 19 |
| `framer-motion` | `^12.33.0` | Animations for controls, auto-hide |
| `lucide-react` | `^0.511.0` | Player control icons |
| `swr` | `^2.4.0` | For fetching content data |
| `axios` | `^1.13.4` | API calls |
| `zustand` | `^5.0.11` | State management |
| `vitest` | `^4.0.18` | Testing |

### BE - No New Dependencies

All required packages already installed from previous sprints.

| Package | Version | Notes |
|---------|---------|-------|
| `express` | `^5.2.1` | Express 5 - read-only req.query/params |
| `prisma` | `^7.3.0` | Prisma 7 - adapter-pg pattern |
| `zod` | `^4.3.6` | Zod 4 - `.issues` not `.errors` |

---

## 2. Migration Drift Check (AI-023)

### Issue: Orphaned Trigger from Sprint 6

Sprint 6 migration (`20260208093631_add_video_model`) dropped the `search_vector` column and `idx_content_search` GIN index from the `content` table. However, the **trigger function** `content_search_vector_update()` and the **trigger** `content_search_vector_trigger` (created in migration `20260206103436_add_fulltext_search`) still exist in the database.

**Impact:** INSERT/UPDATE on `content` table will fail because the trigger tries to write to a non-existent `search_vector` column.

**Required Fix (before Sprint 7 work):** BE must create a cleanup migration:

```sql
-- Drop orphaned trigger and function
DROP TRIGGER IF EXISTS content_search_vector_trigger ON content;
DROP FUNCTION IF EXISTS content_search_vector_update();
```

Run:
```bash
npx prisma migrate dev --name cleanup_orphaned_search_trigger
```

**No other drift detected.** All current Prisma schema fields match the database state.

---

## 3. DB Schema Notes

### No New Models Required

The `WatchHistory` model already exists (Sprint 4, task 4.5) with all fields needed:

```prisma
model WatchHistory {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  contentId  String   @map("content_id")
  episodeId  String?  @map("episode_id")
  progress   Int      @default(0)       // seconds watched
  duration   Int      @default(0)       // total duration in seconds
  watchedAt  DateTime @default(now())   @map("watched_at")
  updatedAt  DateTime @updatedAt        @map("updated_at")
  @@unique([userId, contentId, episodeId])
}
```

The `Video` model (Sprint 6) stores transcoded HLS paths. The `Content` model has `trailerUrl`.

**No schema migration needed for Sprint 7** (beyond the drift cleanup above).

---

## 4. File & Directory Structure

### FE New Files

```
webphim-fe/
└── src/
    ├── app/
    │   └── (main)/
    │       └── watch/
    │           └── [id]/
    │               └── page.tsx              # Watch Page (7.4) - cinema mode
    ├── components/
    │   └── player/
    │       ├── VideoPlayer.tsx               # HLS Player (7.1) - main component
    │       ├── PlayerControls.tsx            # Custom controls (7.2)
    │       ├── QualitySelector.tsx           # Quality picker (7.3)
    │       ├── ProgressBar.tsx               # Seekable progress bar
    │       ├── VolumeControl.tsx             # Volume slider
    │       └── __tests__/
    │           ├── VideoPlayer.test.tsx
    │           ├── PlayerControls.test.tsx
    │           └── QualitySelector.test.tsx
    ├── hooks/
    │   ├── useVideoPlayer.ts                # Player state + HLS logic (7.1)
    │   ├── useKeyboardShortcuts.ts          # Keyboard bindings (7.5)
    │   └── useWatchProgress.ts              # Save/restore progress (7.7 FE)
    └── lib/
        └── api.ts                           # Add watch-history API helpers
```

### BE New Files

```
webphim-be/
└── src/
    ├── controllers/
    │   └── watch-history.controller.ts      # NEW (7.7 + 7.8)
    ├── routes/
    │   ├── index.ts                         # Add watch-history routes
    │   └── watch-history.routes.ts          # NEW
    ├── services/
    │   └── watch-history.service.ts         # NEW
    └── validations/
        └── watch-history.validation.ts      # NEW
```

---

## 5. API Contracts

### 5.1 POST `/api/watch-history` (Task 7.7)

Save or update watch progress for a content item.

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "contentId": "uuid",
  "episodeId": "uuid | null",
  "progress": 120,
  "duration": 7200
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `contentId` | string (uuid) | Yes | Must exist in `content` table |
| `episodeId` | string (uuid) | No | For series episodes |
| `progress` | integer | Yes | >= 0, seconds watched |
| `duration` | integer | Yes | > 0, total duration in seconds |

**Response 200 (upsert):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "contentId": "uuid",
    "episodeId": null,
    "progress": 120,
    "duration": 7200,
    "updatedAt": "2026-02-08T20:00:00.000Z"
  }
}
```

**Behavior:** Upsert on `(userId, contentId, episodeId)` unique constraint. If record exists, update `progress`, `duration`, and `watchedAt`.

---

### 5.2 GET `/api/watch-history/:contentId` (Task 7.7)

Get saved watch position for a specific content item.

**Auth:** Required (Bearer token)

**Params:** `contentId` — Content UUID

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `episodeId` | string (uuid) | No | For series episodes |

**Response 200 (found):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "contentId": "uuid",
    "episodeId": null,
    "progress": 120,
    "duration": 7200,
    "updatedAt": "2026-02-08T20:00:00.000Z"
  }
}
```

**Response 200 (not found — never watched):**
```json
{
  "success": true,
  "data": null
}
```

---

### 5.3 GET `/api/watch-history/continue` (Task 7.8)

Get list of in-progress content for "Continue Watching" row.

**Auth:** Required (Bearer token)

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 20 | Max items (max 50) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "watch-history-uuid",
      "contentId": "uuid",
      "episodeId": null,
      "progress": 3600,
      "duration": 7200,
      "progressPercent": 50,
      "updatedAt": "2026-02-08T20:00:00.000Z",
      "content": {
        "id": "uuid",
        "title": "Movie Title",
        "type": "MOVIE",
        "thumbnailUrl": "/path/to/thumb.jpg",
        "maturityRating": "PG13"
      }
    }
  ]
}
```

**Filtering logic:**
- Only entries where `progress / duration > 0.05` (watched > 5%)
- AND `progress / duration < 0.90` (not finished > 90%)
- Ordered by `updatedAt DESC` (most recently watched first)
- Include content details for display

---

## 6. FE Component Tree

### Watch Page Layout

The watch page (`/watch/[id]`) must use **cinema mode** — no navbar, no footer. It should be placed inside the `(main)` route group but render a custom layout that hides the MainLayout chrome.

```
app/(main)/watch/[id]/page.tsx     ← "use client", full cinema mode
└── WatchPageClient
    ├── VideoPlayer                ← Core HLS player (7.1)
    │   ├── <video> element        (ref-based)
    │   ├── LoadingSpinner         (7.6 - shown during buffering)
    │   └── ErrorOverlay           (7.6 - network error + retry button)
    ├── PlayerControls             ← Auto-hide overlay (7.2)
    │   ├── TopBar
    │   │   ├── BackButton         (← arrow, navigates back)
    │   │   └── TitleOverlay       (content title)
    │   └── BottomBar
    │       ├── ProgressBar        (seekable, buffered range shown)
    │       ├── PlayPauseButton
    │       ├── VolumeControl      (icon + slider)
    │       ├── TimeDisplay        (current / total)
    │       ├── QualitySelector    (7.3 - dropdown)
    │       └── FullscreenButton
    └── KeyboardShortcuts          (7.5 - invisible handler)
```

### Auto-Hide Controls Behavior

- Controls visible on mouse move or touch
- Hide after 3 seconds of inactivity
- Always visible when paused
- Cursor hidden when controls hidden (cinema mode)
- Smooth fade in/out with Framer Motion (`opacity` + pointer-events)

### VideoPlayer Props Interface

```typescript
interface VideoPlayerProps {
  streamUrl: string;          // master.m3u8 URL
  contentId: string;          // for watch-history save
  episodeId?: string;         // for series
  title: string;              // displayed in title overlay
  initialProgress?: number;   // resume position in seconds
  thumbnailUrl?: string;      // poster image
  onBack?: () => void;        // back button handler
}
```

### useVideoPlayer Hook

```typescript
interface UseVideoPlayerReturn {
  // Refs
  videoRef: RefObject<HTMLVideoElement>;
  containerRef: RefObject<HTMLDivElement>;

  // State
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isBuffering: boolean;
  error: string | null;
  buffered: { start: number; end: number }[];

  // HLS
  qualities: { height: number; bitrate: number; label: string }[];
  currentQuality: number;     // -1 = auto
  setQuality: (index: number) => void;

  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  retry: () => void;
}
```

### useWatchProgress Hook

```typescript
// Saves progress every 10 seconds during playback
// Restores position on mount
function useWatchProgress(params: {
  contentId: string;
  episodeId?: string;
  videoRef: RefObject<HTMLVideoElement>;
  isPlaying: boolean;
}): {
  initialProgress: number | null;
  isSaving: boolean;
}
```

---

## 7. Service Architecture

### 7.1 HLS Integration (FE)

```typescript
// Inside useVideoPlayer hook
import Hls from 'hls.js';

// Setup pattern:
if (Hls.isSupported()) {
  const hls = new Hls({
    startLevel: -1,           // auto quality
    capLevelToPlayerSize: true, // don't load 1080p on small viewport
    maxBufferLength: 30,      // seconds
    maxMaxBufferLength: 60,
  });
  hls.loadSource(streamUrl);
  hls.attachMedia(videoElement);

  // Quality levels
  hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
    setQualities(data.levels.map(l => ({
      height: l.height,
      bitrate: l.bitrate,
      label: `${l.height}p`,
    })));
  });

  // Error handling
  hls.on(Hls.Events.ERROR, (_, data) => {
    if (data.fatal) {
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          hls.startLoad(); // auto-retry
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          hls.recoverMediaError();
          break;
        default:
          setError('Playback error');
          break;
      }
    }
  });
} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
  // Safari native HLS
  videoElement.src = streamUrl;
}
```

### 7.2 Watch Progress Save Strategy (FE→BE)

- Save every **10 seconds** while playing (debounced POST)
- Save on **pause**
- Save on **page unload** (`beforeunload` event)
- Save on **seek** (after seek completes)
- **Do NOT save** if progress < 5 seconds (accidental clicks)
- On mount: GET saved position → seek to it

### 7.3 BE Watch History Service

```typescript
// src/services/watch-history.service.ts

export const watchHistoryService = {
  // Upsert watch progress
  async saveProgress(userId: string, data: {
    contentId: string;
    episodeId?: string;
    progress: number;
    duration: number;
  }): Promise<WatchHistory>;

  // Get progress for specific content
  async getProgress(userId: string, contentId: string, episodeId?: string): Promise<WatchHistory | null>;

  // Get "continue watching" list
  async getContinueWatching(userId: string, limit: number): Promise<ContinueWatchingItem[]>;
};
```

The `getContinueWatching` query:
```sql
-- Prisma equivalent
findMany({
  where: {
    userId,
    // progress > 5% of duration AND progress < 90% of duration
    // Since Prisma doesn't support computed column filters easily,
    // use raw query or fetch + filter in JS
  },
  orderBy: { updatedAt: 'desc' },
  take: limit,
  include: { content: { select: ... } },
});
```

**Note:** For the 5%/90% filter, use `prisma.$queryRaw` or fetch all user's history and filter in service layer (small dataset per user, acceptable for MVP).

---

## 8. Config & Environment

### No New Environment Variables

Sprint 7 uses existing config:
- **BE port:** 5001 (already set)
- **FE API URL:** `NEXT_PUBLIC_API_URL=http://localhost:5001/api`
- HLS files served from `/uploads/hls/` (Sprint 6 static middleware)

---

## 9. CORS Configuration

No CORS changes needed. Existing config handles:
- `http://localhost:3000` (FE dev)
- `http://localhost:3001` (FE alternate)
- `http://localhost:1999` (FE test)
- HLS static files already have `Access-Control-Allow-Origin: *` via `setHeaders` (Sprint 6)

---

## 10. Test DB Config

### Test Database

```
DATABASE_URL=postgresql://phuhung:@localhost:5432/webphim_test
```

### QA Test Strategy (Task 7.9)

**E2E test flow:**
1. Upload a test video (reuse Sprint 6 test fixture `tests/fixtures/test-video.mp4`)
2. Trigger transcode → wait for COMPLETED
3. Get stream URL → verify master.m3u8 is valid
4. Simulate watch progress save (POST watch-history) → verify save
5. Get watch-history → verify progress restored
6. Get continue-watching → verify appears in list (progress between 5%-90%)
7. Simulate finishing (progress=95%) → verify NOT in continue-watching

**FE unit tests:**
- `VideoPlayer.test.tsx`: Mock hls.js, test mount/unmount, quality change
- `PlayerControls.test.tsx`: Play/pause toggle, volume slider, fullscreen click, time display format
- `QualitySelector.test.tsx`: Dropdown renders levels, selection callback

**Note on hls.js mocking:** hls.js needs to be mocked in tests since jsdom has no MediaSource API. Mock pattern:

```typescript
vi.mock('hls.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    loadSource: vi.fn(),
    attachMedia: vi.fn(),
    on: vi.fn(),
    destroy: vi.fn(),
    currentLevel: -1,
    levels: [],
  })),
  Events: { MANIFEST_PARSED: 'hlsManifestParsed', ERROR: 'hlsError' },
  ErrorTypes: { NETWORK_ERROR: 'networkError', MEDIA_ERROR: 'mediaError' },
}));
```

### Test uploads dir
Reuse `uploads_test/` from Sprint 6 (cleaned after tests).

---

## 11. Known Gotchas

### From MEMORY.md

| Issue | Impact | Mitigation |
|-------|--------|------------|
| **Prisma 7**: Must run `npx prisma generate` after schema changes | Watch-history uses existing model, no generate needed | N/A |
| **Express 5**: `req.query` read-only | Watch-history query params | Parse inline in controller |
| **Zod 4**: `.issues` not `.errors` | Validation | Existing pattern correct |
| **Port 5001** | Config | Already set |

### Sprint 7 Specific

| Issue | Impact | Mitigation |
|-------|--------|------------|
| **hls.js + React 19 StrictMode**: hls.js instance created twice in dev due to double-mount | Double network requests | Destroy hls instance in cleanup function of `useEffect`. Use ref to track instance. |
| **hls.js + SSR**: hls.js references `window`/`document` at import time | Next.js SSR crash | Dynamic import: `const Hls = (await import('hls.js')).default` or use `next/dynamic` with `ssr: false` |
| **Safari native HLS**: Safari supports HLS natively without hls.js | Different code path | Check `Hls.isSupported()` first, fall back to native `<video src>` |
| **Fullscreen API**: Different vendor prefixes across browsers | Fullscreen toggle | Use `document.fullscreenEnabled` with `requestFullscreen()` / `exitFullscreen()`. FE should use the containerRef (not videoRef) for fullscreen to include controls overlay. |
| **`beforeunload` in Next.js**: Save progress on tab close | Data loss | Use `window.addEventListener('beforeunload', save)`. Note: `sendBeacon` is more reliable for async saves on unload. |
| **Watch progress save flood**: Saving every second is too frequent | API overload | Save every 10s with debounce. Use `setInterval` + clear on unmount. |
| **BigInt in WatchHistory**: `progress` and `duration` are `Int` (not BigInt) | No issue | Plain number conversion works fine. |
| **Video poster**: Show thumbnail while loading | UX | Set `poster` attribute on `<video>` element with `thumbnailUrl`. |
| **Cinema mode layout**: Watch page should hide navbar/footer | Layout mismatch | The watch page is inside `(main)` group which wraps with `MainLayout` (navbar + footer). Use a flag or separate layout. **Recommended:** Create watch route outside `(main)` group OR add a `hideChrome` prop to MainLayout. See section 6 note below. |

### Cinema Mode Layout Solution

**Option A (recommended):** Move watch page outside `(main)` group:

```
app/
├── (auth)/         # login, signup
├── (main)/         # has MainLayout (navbar + footer)
│   ├── home/
│   ├── browse/
│   └── admin/
└── watch/          # NO MainLayout wrapper, cinema mode
    └── [id]/
        └── page.tsx
```

This requires the watch page to handle its own auth check (call `/auth/me` or use the existing auth store). The page still needs the SWRProvider.

**Option B:** Keep inside `(main)` but add a conditional to MainLayout:

```typescript
// Less clean - would need pathname detection
```

**Go with Option A** — cleaner separation, no layout hacks.

### Migration Drift — Orphaned Trigger Fix

As detailed in section 2: BE **must** create a cleanup migration to drop the orphaned `content_search_vector_trigger` and `content_search_vector_update()` function **before** any Sprint 7 work that touches the `content` table (which the watch-history endpoints do indirectly via includes).

---

## 12. Task Breakdown

### FE Tasks

| # | Task | Points | Priority | Files |
|---|------|--------|----------|-------|
| 7.1 | HLS Player Component | 8 | P0 | `components/player/VideoPlayer.tsx`, `hooks/useVideoPlayer.ts` |
| 7.2 | Custom Player Controls | 8 | P0 | `components/player/PlayerControls.tsx`, `components/player/ProgressBar.tsx`, `components/player/VolumeControl.tsx` |
| 7.3 | Quality Selector | 3 | P1 | `components/player/QualitySelector.tsx` |
| 7.4 | Watch Page | 5 | P0 | `app/watch/[id]/page.tsx` (outside `(main)` group) |
| 7.5 | Keyboard Shortcuts | 3 | P1 | `hooks/useKeyboardShortcuts.ts` |
| 7.6 | Error Handling | 3 | P1 | Integrated into `useVideoPlayer.ts` + `VideoPlayer.tsx` |

**Suggested FE order:** 7.1 → 7.2 → 7.3 → 7.5 → 7.6 → 7.4

**Rationale:** Build player core (7.1) first, then controls (7.2), then progressive enhancements (7.3, 7.5, 7.6), then assemble on watch page (7.4) last.

### BE Tasks

| # | Task | Points | Priority | Files |
|---|------|--------|----------|-------|
| 7.7 | Watch Progress API | 3 | P0 | `controllers/watch-history.controller.ts`, `routes/watch-history.routes.ts`, `services/watch-history.service.ts`, `validations/watch-history.validation.ts` |
| 7.8 | Continue Watching API | 3 | P0 | Extends `watch-history.service.ts` + controller |

**Suggested BE order:** Cleanup migration → 7.7 → 7.8

### QA Tasks

| # | Task | Points | Priority | Files |
|---|------|--------|----------|-------|
| 7.9 | Player E2E Test | 5 | P0 | `tests/watch-history.test.ts` |

### Keyboard Shortcuts (7.5)

| Key | Action |
|-----|--------|
| `Space` | Toggle play/pause |
| `F` | Toggle fullscreen |
| `Esc` | Exit fullscreen |
| `←` (Left arrow) | Seek -10s |
| `→` (Right arrow) | Seek +10s |
| `↑` (Up arrow) | Volume +10% |
| `↓` (Down arrow) | Volume -10% |
| `M` | Toggle mute |

**Implementation:** `useKeyboardShortcuts` hook with `useEffect` + `keydown` listener. Only active when player is mounted. Prevent default on all bound keys to avoid page scroll on arrow/space.

---

## Seed Data Review (AI-021)

No seed data changes needed. Watch history is populated by user interaction, not seed. Existing content seed data is sufficient for testing.

---

## Validated Query Middleware Pattern (AI-020)

For `GET /api/watch-history/continue` query params (`limit`):

```typescript
const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
```

For `GET /api/watch-history/:contentId` query params (`episodeId`):

```typescript
const episodeId = req.query.episodeId as string | undefined;
```

Do NOT attempt to reassign `req.query`. Parse in controller, validate inline.

---

**End of Architecture Document**
