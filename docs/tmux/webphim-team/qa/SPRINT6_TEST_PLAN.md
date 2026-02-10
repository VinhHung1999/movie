# Sprint 6 - Task 6.9: Upload + Transcode Test Plan

**Task:** 6.9 Upload + Transcode Test (P0, 5pts)
**Author:** QA
**Date:** 2026-02-08
**Framework:** Vitest 4.0.18 + Supertest 7.2.2

---

## Pre-Testing Checklist

- [x] Read TL architecture doc (SPRINT6_ARCH.md)
- [x] Check MEMORY.md for gotchas (Prisma 7, Express 5, Zod 4, BigInt)
- [x] Read BE source code (app.ts, config, middleware, existing tests, helpers)
- [x] Check coder-memory (upload duplicate protection pattern)
- [x] Plan test cases from API contracts

---

## Test Infrastructure

### Test Database
```
DATABASE_URL=postgresql://phuhung:@localhost:5432/webphim_test
```

### Test Fixture
```bash
# 5s, 640x360, ~1MB test video
ffmpeg -f lavfi -i testsrc=duration=5:size=640x360:rate=30 \
  -f lavfi -i sine=frequency=440:duration=5 \
  -c:v libx264 -c:a aac -shortest \
  tests/fixtures/test-video.mp4
```

### Test Uploads Directory
- `uploads_test/` (separate from dev `uploads/`)
- Cleaned after each test run in afterAll

### Auth Setup
- Reuse existing `auth.helper.ts` pattern: `getAuthTokens()` for Bearer token
- All video endpoints require auth (admin-only)

---

## Test Cases (Estimated: 13-15 tests)

### 1. Upload Tests (POST /api/videos/upload)

| # | Test Case | Expected | Status Code |
|---|-----------|----------|-------------|
| 1.1 | Upload valid MP4 with title | 201, DB record created, status=UPLOADED, file on disk | 201 |
| 1.2 | Upload with optional contentId | 201, contentId linked in DB | 201 |
| 1.3 | Upload with optional description | 201, metadata stored | 201 |
| 1.4 | Response shape validation | `{ success, data: { id, originalName, mimeType, fileSize, status, contentId, createdAt } }` | 201 |

### 2. Transcode Tests (POST /api/videos/:id/transcode + GET /api/videos/:id/status)

| # | Test Case | Expected | Status Code |
|---|-----------|----------|-------------|
| 2.1 | Trigger transcode on uploaded video | 202, `{ videoId, jobId, status: "QUEUED" }` | 202 |
| 2.2 | Poll status until COMPLETED | Status transitions: QUEUED -> PROCESSING -> COMPLETED, hlsPath set | 200 |
| 2.3 | DB record updated after transcode | duration, hlsPath, status=COMPLETED | - |

### 3. Stream Tests (GET /api/videos/:id/stream)

| # | Test Case | Expected | Status Code |
|---|-----------|----------|-------------|
| 3.1 | Get stream URL after transcode complete | 200, `{ streamUrl, thumbnails, duration, status: "COMPLETED" }` | 200 |
| 3.2 | master.m3u8 file is valid HLS | Contains #EXTM3U, #EXT-X-STREAM-INF entries | - |

### 4. Error Tests

| # | Test Case | Expected | Status Code |
|---|-----------|----------|-------------|
| 4.1 | Upload invalid file type (.txt) | 400, error message about accepted types | 400 |
| 4.2 | Upload with missing file field | 400, validation error | 400 |
| 4.3 | Upload without title | 400, validation error | 400 |
| 4.4 | Upload without auth token | 401, unauthorized | 401 |
| 4.5 | Transcode non-existent video | 404, "Video not found" | 404 |
| 4.6 | Transcode already-processing video | 409, "already being transcoded" | 409 |
| 4.7 | Stream non-existent video | 404 | 404 |
| 4.8 | Stream video not yet transcoded | 409, "not yet complete" | 409 |

---

## Known Gotchas to Watch

| Issue | Mitigation |
|-------|------------|
| BigInt fileSize won't serialize to JSON | Assert as Number or String in response |
| Prisma 7 adapter-pg pattern | Import from existing `src/config/database` |
| Express 5 read-only req.query | Not applicable to tests, but verify error responses |
| Multer 2.x error handling | Test multer errors (file type, size) go through error middleware |
| BullMQ requires Redis running | Verify Redis is up before tests; skip transcode tests if Redis down |
| Transcode test is slow (~10-30s for 5s video) | Set higher timeout for transcode describe block |
| Upload duplicate protection | Test uploading same file twice (from coder-memory lesson) |

---

## Test File Structure

```
webphim-be/
├── tests/
│   ├── fixtures/
│   │   └── test-video.mp4          # 5s test video (generated)
│   ├── helpers/
│   │   ├── auth.helper.ts          # Existing
│   │   ├── content.helper.ts       # Existing
│   │   └── video.helper.ts         # NEW: upload + transcode helpers
│   ├── setup.ts                    # Existing (add Video cleanup + Redis teardown)
│   └── video.test.ts               # NEW: All video tests
└── uploads_test/                   # Test upload dir (cleaned after tests)
```

---

## Execution Strategy

1. Generate test fixture video (ffmpeg)
2. Wait for BE to complete tasks 6.1-6.6 (upload, transcode, stream APIs)
3. Read final BE source code to verify API implementation matches arch doc
4. Write `tests/video.test.ts` following existing patterns
5. Run tests against test database
6. Document any bugs found
7. Report results to PO

**Estimated test count:** 15 tests
**Estimated duration:** ~60s (transcode test needs polling timeout)

---
