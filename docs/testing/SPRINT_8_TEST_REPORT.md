# Sprint 8 — QA Test Report: Content Detail & Preview Modal

**Author:** QA
**Date:** 2026-02-09
**Sprint:** 8 (33 pts)
**Result:** ALL PASS — 0 BUGS

---

## Test Summary

| Category | Tests | Passed | Failed | Status |
|----------|-------|--------|--------|--------|
| BE baseline (pre-existing) | 161 | 159 | 2* | PASS |
| BE dev tests (Sprint 8) | 10 | 10 | 0 | PASS |
| **QA BE tests (Similar API)** | **6** | **6** | **0** | **PASS** |
| FE baseline (pre-existing) | 118 | 118 | 0 | PASS |
| FE dev tests (Sprint 8) | 44 | 44 | 0 | PASS |
| **QA FE tests (new)** | **11** | **11** | **0** | **PASS** |
| **Total** | **350** | **348** | **2*** | **PASS** |

*2 BE timeouts are pre-existing infrastructure-dependent tests (queue.test.ts job progress + video.test.ts full integration). Both require BullMQ worker to complete within timeout — known fragility documented in arch doc Section 4a. NOT regressions.

---

## QA Tests Written (17 tests)

### BE: content-similar-qa.test.ts (6 tests)

| # | Test | Result |
|---|------|--------|
| 1 | ViewCount DESC tiebreaker within same overlap count | PASS |
| 2 | Mixed MOVIE + SERIES types in results | PASS |
| 3 | Limit=1 (minimum boundary) | PASS |
| 4 | Limit=20 (maximum boundary) | PASS |
| 5 | Content with all genres returns all genre-sharing content | PASS |
| 6 | Full genre list returned for similar content (not just overlapping) | PASS |

### FE: useBodyScrollLock.test.tsx (4 tests)

| # | Test | Result |
|---|------|--------|
| 1 | Sets body position:fixed when locked | PASS |
| 2 | Does not modify body when not locked | PASS |
| 3 | Restores body styles on unmount | PASS |
| 4 | Restores body styles when toggled locked → unlocked | PASS |

### FE: MovieCardPreview.test.tsx (4 tests)

| # | Test | Result |
|---|------|--------|
| 1 | Shows ChevronDown button on hover | PASS |
| 2 | Calls onOpenPreview when ChevronDown clicked | PASS |
| 3 | ChevronDown not visible in compact mode | PASS |
| 4 | ChevronDown click does not trigger navigation (stopPropagation) | PASS |

### FE: ContentRowModal.test.tsx (3 tests)

| # | Test | Result |
|---|------|--------|
| 1 | Opens PreviewModal when ChevronDown clicked in ContentRow | PASS |
| 2 | Closes PreviewModal on backdrop click | PASS |
| 3 | Closes PreviewModal on Escape key | PASS |

---

## Test DB Isolation (Task 8.7) Verification

| Check | Result |
|-------|--------|
| `webphim_test` database exists | PASS |
| `.env.test` loads correctly (13 env vars) | PASS |
| Tests connect to `webphim_test` (not `webphim`) | PASS |
| Dev DB `webphim` seed data preserved after test run | PASS (37 content items intact) |

---

## Seed Data Checklist (Section 10)

| Check | Result | Details |
|-------|--------|---------|
| 2+ content sharing same genre | PASS | Drama: 31, Thriller: 12, Action: 10 |
| 1+ SERIES with 2+ seasons, 3+ episodes | PASS | 4 series (Breaking Bad, Ozark, Stranger Things, The Witcher) |
| Content with ACTOR + DIRECTOR + WRITER | PARTIAL | ACTOR (50) + DIRECTOR (24) exist; no WRITER in seed |
| TrailerUrl values | NOTE | All 37 content have null trailerUrl — FE correctly falls back to banner |

**Seed data notes** (not bugs):
- No WRITER role in seed cast data → CastList full variant hides "Writer:" section (correct behavior)
- All trailerUrl are null → PreviewModal/ContentHero show banner image fallback (correct behavior)

---

## Bugs Found

**0 bugs.**

---

## Test File Locations

- `webphim-be/tests/content-similar-qa.test.ts` — 6 QA BE tests
- `webphim-fe/src/hooks/__tests__/useBodyScrollLock.test.tsx` — 4 hook tests
- `webphim-fe/src/components/home/__tests__/MovieCardPreview.test.tsx` — 4 integration tests
- `webphim-fe/src/components/home/__tests__/ContentRowModal.test.tsx` — 3 integration tests

---

## Test Counts vs Estimate

| Estimated | Actual | Delta |
|-----------|--------|-------|
| ~45 QA tests | 17 QA tests | -28 |

**Reason:** Dev tests (55 total) were more comprehensive than expected, covering most of the planned QA test cases. QA focused on gap areas: secondary sort verification, boundary limits, mixed types, scroll lock hook, ChevronDown integration, and ContentRow→Modal flow.

---

## Final Verdict

**Sprint 8 — PASS. 0 bugs. Ready for acceptance.**
