# Sprint 8 — QA Test Plan: Content Detail & Preview Modal

**Author:** QA
**Date:** 2026-02-09
**Sprint:** 8 (33 pts: FE 24 + BE 3 + Infra 6)
**Estimated Tests:** ~45 tests (BE: ~10, FE: ~35)

---

## Pre-Testing Checklist

- [ ] Read TL architecture doc (SPRINT_8_ARCHITECTURE.md) — DONE
- [ ] Check MEMORY.md for known gotchas — DONE
- [ ] Read BE source code (content.service, controller, routes, validation) — DONE
- [ ] Read FE source code (MovieCard, ContentRow, types, test patterns) — DONE
- [ ] Verify `webphim_test` DB exists (after Task 8.7)
- [ ] Verify all 161 pre-existing tests pass (baseline)
- [ ] Verify seed data checklist (Section 10 of arch doc)

---

## 1. BE Tests — Similar Content API (Task 8.6)

**File:** `webphim-be/tests/content-similar.test.ts`
**Pattern:** Follow existing `content.test.ts` — supertest + real DB (webphim_test)

### Test Cases (10 tests)

| # | Test Case | Priority |
|---|-----------|----------|
| 1 | Returns similar content sharing genres with target | P0 |
| 2 | Excludes the target content itself from results | P0 |
| 3 | Orders by genre overlap count DESC (more shared genres first) | P0 |
| 4 | Orders by viewCount DESC as secondary sort | P1 |
| 5 | Default limit is 12 | P0 |
| 6 | Custom limit query param works (e.g. limit=5) | P1 |
| 7 | Returns empty array when no similar content exists | P0 |
| 8 | Returns 404 for non-existent content ID | P0 |
| 9 | Returns 400 for invalid UUID format | P1 |
| 10 | Limit validation: rejects limit < 1 or limit > 20 | P1 |

### Test Data Setup

```
Genres: Action, Comedy, Drama, Sci-Fi
Movie A (target): Action + Comedy         (viewCount: 100)
Movie B: Action + Comedy + Drama           (viewCount: 200) → 2 overlaps
Movie C: Action                            (viewCount: 300) → 1 overlap
Movie D: Comedy                            (viewCount: 50)  → 1 overlap
Movie E: Sci-Fi (no overlap)               (viewCount: 500) → excluded
```

Expected order for Movie A's similar: B (2 overlaps), C (1 overlap, 300 views), D (1 overlap, 50 views)

### Dependencies
- Uses existing `seedTestData()` helper + additional genre/content fixtures
- Real DB queries against `webphim_test`
- Cleanup via `cleanDatabase()` in afterEach

---

## 2. BE Tests — Test DB Isolation (Task 8.7)

**Verification (not a test file — manual + automated check):**

| # | Verification | Method |
|---|-------------|--------|
| 1 | `webphim_test` database exists | `psql -l \| grep webphim_test` |
| 2 | `.env.test` exists with correct DB URL | File check |
| 3 | All migrations applied to `webphim_test` | `prisma migrate status` |
| 4 | Tests connect to `webphim_test` not `webphim` | Check DB during test run |
| 5 | Dev DB `webphim` seed data preserved after test run | Query seed content count |
| 6 | `npm run test:db:setup` script works | Run script |
| 7 | `npm run test:db:reset` script works | Run script |

---

## 3. BE Tests — Pre-Existing Test Health (Task 8.8)

| # | Verification | Expected |
|---|-------------|----------|
| 1 | Run full `npx vitest run` | All 161 tests pass |
| 2 | No FK constraint violations in content.test.ts | PASS |
| 3 | No BullMQ race conditions in queue.test.ts | PASS |
| 4 | New tests (content-similar) don't break existing | PASS |

---

## 4. FE Tests — Preview Modal (Task 8.1)

**File:** `webphim-fe/src/components/detail/__tests__/PreviewModal.test.tsx`
**Pattern:** Vitest + RTL, mock SWR, SWRConfig isolation

### Test Cases (~12 tests)

| # | Test Case | Priority |
|---|-----------|----------|
| 1 | Renders nothing when isOpen=false | P0 |
| 2 | Renders modal content when isOpen=true | P0 |
| 3 | Displays loading skeleton while SWR is fetching | P1 |
| 4 | Displays content title, synopsis, genres, maturity | P0 |
| 5 | Displays cast list | P1 |
| 6 | Close button (X) calls onClose | P0 |
| 7 | Backdrop click calls onClose | P0 |
| 8 | Esc key press calls onClose | P0 |
| 9 | Play button renders with correct link to /watch/:id | P0 |
| 10 | Shows banner image when trailerUrl is null | P1 |
| 11 | Renders EpisodeList when content type is SERIES | P1 |
| 12 | Does not render EpisodeList for MOVIE type | P1 |

### Mock Strategy

```typescript
// Mock SWR to return test data
vi.mock('swr', async () => {
  const actual = await vi.importActual('swr');
  return { ...actual, default: vi.fn() };
});

// Mock useBodyScrollLock
vi.mock('@/hooks/useBodyScrollLock', () => ({
  useBodyScrollLock: vi.fn(),
}));

// Wrap renders in SWRConfig for cache isolation
<SWRConfig value={{ provider: () => new Map() }}>
  <PreviewModal contentId="test-id" isOpen={true} onClose={mockOnClose} />
</SWRConfig>
```

---

## 5. FE Tests — Content Detail Page (Task 8.2)

**File:** `webphim-fe/src/app/(main)/title/[id]/__tests__/page.test.tsx`

### Test Cases (~6 tests)

| # | Test Case | Priority |
|---|-----------|----------|
| 1 | Renders loading state initially | P1 |
| 2 | Renders content hero with title and banner | P0 |
| 3 | Renders full synopsis and all cast grouped by role | P0 |
| 4 | Renders Play button linking to /watch/:id | P0 |
| 5 | Renders SimilarTitles section | P1 |
| 6 | Shows error state for non-existent content | P1 |

---

## 6. FE Tests — Episode List (Task 8.3)

**File:** `webphim-fe/src/components/detail/__tests__/EpisodeList.test.tsx`

### Test Cases (~7 tests)

| # | Test Case | Priority |
|---|-----------|----------|
| 1 | Renders "Episodes" section title | P0 |
| 2 | Season dropdown shows all seasons | P0 |
| 3 | Default selection is Season 1 | P0 |
| 4 | Switching season shows correct episodes | P0 |
| 5 | Episode card shows number, title, duration, description | P0 |
| 6 | Episode card click navigates to /watch/:contentId?episode=:id | P1 |
| 7 | Renders nothing for empty seasons array | P1 |

### Mock Data

```typescript
const mockSeasons: SeasonDetail[] = [
  {
    id: 's1', seasonNumber: 1, title: 'Season 1',
    episodes: [
      { id: 'e1', episodeNumber: 1, title: 'Pilot', duration: 45, description: 'First...', thumbnailUrl: null },
      { id: 'e2', episodeNumber: 2, title: 'Episode 2', duration: 42, description: 'Second...', thumbnailUrl: null },
    ],
  },
  {
    id: 's2', seasonNumber: 2, title: 'Season 2',
    episodes: [
      { id: 'e3', episodeNumber: 1, title: 'Return', duration: 50, description: 'Returning...', thumbnailUrl: null },
    ],
  },
];
```

---

## 7. FE Tests — Modal Animations & Scroll Lock (Task 8.4)

**File:** `webphim-fe/src/hooks/__tests__/useBodyScrollLock.test.tsx`

### Test Cases (~4 tests)

| # | Test Case | Priority |
|---|-----------|----------|
| 1 | Sets body position:fixed when locked | P0 |
| 2 | Restores body position when unlocked | P0 |
| 3 | Restores scroll position on unlock | P1 |
| 4 | No-op when isLocked=false | P1 |

**Note:** Framer Motion AnimatePresence animations are visual — tested via integration (modal open/close renders correctly), not unit-tested for spring physics.

---

## 8. FE Tests — Similar Titles Section (Task 8.5)

**File:** `webphim-fe/src/components/detail/__tests__/SimilarTitles.test.tsx`

### Test Cases (~6 tests)

| # | Test Case | Priority |
|---|-----------|----------|
| 1 | Renders "More Like This" title | P0 |
| 2 | Renders grid of MovieCard components | P0 |
| 3 | Shows loading skeletons while fetching | P1 |
| 4 | Hides section entirely when data is empty | P0 |
| 5 | MovieCards use compact mode (no hover expand) | P1 |
| 6 | Shows max 12 items | P1 |

### Mock Strategy

```typescript
// Mock SWR for similar content
vi.mock('swr', async () => {
  const actual = await vi.importActual('swr');
  return {
    ...actual,
    default: vi.fn().mockReturnValue({
      data: { success: true, data: mockSimilarItems },
      error: null,
      isLoading: false,
    }),
  };
});
```

---

## 9. Seed Data Verification Checklist (Section 10)

| # | Check | Method |
|---|-------|--------|
| 1 | At least 2 content items share the same genre | SQL query on contentGenres |
| 2 | At least 1 SERIES has 2+ seasons with 3+ episodes each | SQL query on seasons/episodes |
| 3 | At least 1 content has cast with ACTOR, DIRECTOR, WRITER | SQL query on contentCastCrew |
| 4 | Verify trailerUrl values (null handling in FE) | SQL query on content |

---

## 10. Test Execution Order

1. **Wait for BE to complete Tasks 8.7 + 8.8** (test DB setup + health check)
2. **Verify baseline:** Run pre-existing 161 tests pass
3. **Write + run BE tests** for Task 8.6 (Similar Content API)
4. **Wait for FE to complete Tasks 8.1–8.5**
5. **Write + run FE tests** for all FE tasks
6. **Seed data verification** against dev DB
7. **Report results to PO**

---

## 11. Known Gotchas (from MEMORY.md + arch doc)

- SWR cache isolation: Always wrap renders in `<SWRConfig value={{ provider: () => new Map() }}>`
- Framer Motion: Use `onPointerEnter`/`onPointerLeave` (not `onHoverStart`/`onHoverEnd`)
- Express 5: `req.query`/`req.params` are read-only
- Portal rendering: createPortal to `document.body` works in jsdom with RTL
- Vitest 4 typing: Use `vi.fn<(args) => ret>()` for typed mocks
- `fetchFromAPI` returns `json.data` (pre-unwrapped) vs SWR fetcher returns full response
- AnimatePresence requires `key` prop on children for exit animations

---

## Estimated Summary

| Area | Tests | Priority |
|------|-------|----------|
| BE Similar Content API | 10 | P0 |
| FE Preview Modal | 12 | P0 |
| FE Content Detail Page | 6 | P0 |
| FE Episode List | 7 | P0 |
| FE Scroll Lock Hook | 4 | P1 |
| FE Similar Titles | 6 | P0 |
| **Total** | **~45** | |

**Note:** Actual count may vary slightly during implementation (Sprint 3+4 lesson: 35 planned vs 42 actual).
