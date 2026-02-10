# Sprint 7 - Task 7.9: Player E2E Test Plan

**Task:** 7.9 Player E2E Test (P0, 5pts)
**Author:** QA
**Date:** 2026-02-08
**Framework:** Vitest 4.0.18 + Supertest 7.2.2

---

## Pre-Testing Checklist

- [x] Read TL architecture doc (SPRINT7_ARCH.md)
- [x] Check MEMORY.md for gotchas (carry-over from Sprint 6)
- [ ] Read BE source code when tasks 7.7 + 7.8 complete
- [x] Plan test cases from API contracts

---

## Test Infrastructure

### Reuse from Sprint 6
- Test fixture: `tests/fixtures/test-video.mp4` (5s, 78KB)
- Auth helper: `tests/helpers/auth.helper.ts` (getAuthTokens)
- Upload helper pattern from `tests/video.test.ts`
- BullMQ worker start/stop pattern

### New Test File
- `tests/watch-history.test.ts`

---

## Test Cases (Estimated: 15 tests)

### Section A: Watch Progress API - POST /api/watch-history (5 tests)

| # | Test Case | Expected | Status Code |
|---|-----------|----------|-------------|
| A.1 | Save watch progress for a content item | 200, upsert record with progress/duration | 200 |
| A.2 | Update existing watch progress (upsert) | 200, progress updated, same record | 200 |
| A.3 | Save with episodeId for series | 200, episodeId stored | 200 |
| A.4 | Missing/invalid contentId | 400, validation error | 400 |
| A.5 | Without authentication | 401 | 401 |

### Section B: Get Progress API - GET /api/watch-history/:contentId (3 tests)

| # | Test Case | Expected | Status Code |
|---|-----------|----------|-------------|
| B.1 | Get saved progress for watched content | 200, `{ data: { progress, duration } }` | 200 |
| B.2 | Get progress for never-watched content | 200, `{ data: null }` | 200 |
| B.3 | Without authentication | 401 | 401 |

### Section C: Continue Watching API - GET /api/watch-history/continue (4 tests)

| # | Test Case | Expected | Status Code |
|---|-----------|----------|-------------|
| C.1 | List in-progress content (5%-90% watched) | 200, includes content with progressPercent | 200 |
| C.2 | Excludes content watched < 5% | Not in results | 200 |
| C.3 | Excludes finished content (> 90% watched) | Not in results | 200 |
| C.4 | Ordered by most recently watched | First item has latest updatedAt | 200 |

### Section D: Full E2E Integration (3 tests)

| # | Test Case | Expected | Timeout |
|---|-----------|----------|---------|
| D.1 | Full pipeline: Upload → Transcode → Stream → Save progress → Get progress → Continue watching | All 7 steps pass | 120s |
| D.2 | Finished video (95% progress) NOT in continue watching list | Excluded from results | - |
| D.3 | Continue watching includes content details (title, type, thumbnailUrl) | Response shape correct | - |

---

## 7-Step E2E Strategy (from Section 10)

The D.1 integration test follows this exact flow:

```
Step 1: Upload test video (reuse test-video.mp4 fixture)
  → POST /api/videos/upload → 201

Step 2: Transcode → COMPLETED
  → POST /api/videos/:id/transcode → 202
  → Poll GET /api/videos/:id/status → COMPLETED

Step 3: Verify stream URL
  → GET /api/videos/:id/stream → 200, streamUrl contains master.m3u8

Step 4: Save watch progress
  → POST /api/watch-history { contentId, progress: 3600, duration: 7200 } → 200

Step 5: Get progress
  → GET /api/watch-history/:contentId → 200, progress=3600, duration=7200

Step 6: Continue watching list (5%-90% filter)
  → GET /api/watch-history/continue → includes this content (50% watched)

Step 7: Finish video, verify exclusion
  → POST /api/watch-history { contentId, progress: 6840, duration: 7200 } → 200 (95%)
  → GET /api/watch-history/continue → does NOT include this content
```

---

## Known Gotchas

| Issue | Mitigation |
|-------|------------|
| WatchHistory upsert on (userId, contentId, episodeId) | Test both create and update paths |
| Continue watching filter: 5% < progress/duration < 90% | Test boundary values (4%, 5%, 90%, 91%) |
| Express 5 read-only req.query | Not applicable to tests, verify API responses |
| Content must exist for contentId | Create test content via content.helper.ts |
| EPIPE on multipart auth test | Don't attach files for 401 auth tests (Sprint 6 lesson) |
| Transcode test timeout | 120s timeout for E2E integration test |
| DB cleanup between tests | Each test creates own auth + data (afterEach cleans DB) |

---

## Test File Structure

```
webphim-be/
├── tests/
│   ├── fixtures/
│   │   └── test-video.mp4          # Reuse from Sprint 6
│   ├── helpers/
│   │   ├── auth.helper.ts          # Existing
│   │   └── content.helper.ts       # Existing (createTestContent)
│   ├── setup.ts                    # Existing
│   ├── video.test.ts               # Sprint 6 (16 tests)
│   └── watch-history.test.ts       # NEW: Sprint 7 tests
```

---

## Execution Plan

1. Wait for BE to complete tasks 7.7 (Watch Progress API) + 7.8 (Continue Watching API)
2. Read final BE source code to verify implementation matches arch doc
3. Write `tests/watch-history.test.ts`
4. Run tests against webphim database
5. Run full regression suite (all test files)
6. Report results to PO

**Estimated test count:** 15 tests
**Estimated duration:** ~30s (mostly from transcode in E2E test, reuse pattern from Sprint 6)

---
