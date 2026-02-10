# Sprint 9 — Search Tests (Task 9.7, QA, 3pts)

**Author:** QA
**Date:** 2026-02-09
**Status:** PLANNED — Awaiting FE+BE completion
**Arch Doc:** docs/architecture/SPRINT_9_ARCHITECTURE.md (Sections 4, 5, 17)

---

## Prerequisites

1. BE has restored `search_vector` column + GIN index + trigger (Task 9.0/9.1)
2. Migration applied to `webphim_test` DB
3. BE search API (9.1 + 9.2 + 9.3) implemented and passing BE tests
4. FE search UI (9.4 + 9.5 + 9.6) implemented and passing FE tests
5. Both servers running: BE on :5001, FE on :1999

---

## Part A: Search API Tests (`tests/search-qa.test.ts`)

### A1. Search Accuracy (5 tests)

| # | Test Case | Seed Data | Expected |
|---|-----------|-----------|----------|
| 1 | Exact title match | Content "Inception" | Returns Inception |
| 2 | Partial match | Content "The Dark Knight" | Query "dark" finds it |
| 3 | Multi-word query | Content "The Dark Knight" | Query "dark knight" finds it |
| 4 | Description match | Content with "heist" only in description | Query "heist" finds it |
| 5 | No match | — | Query "xyznonexistent" → empty array, meta.total=0 |

### A2. Weighted Ranking (2 tests)

| # | Test Case | Seed Data | Expected |
|---|-----------|-----------|----------|
| 6 | Title > description | Content A: title="Knight", Content B: description has "knight" | A ranks higher |
| 7 | Stemming works | Content "The Dark Knights" | Query "knight" (singular) finds it |

### A3. Filter Combinations (6 tests)

| # | Test Case | Query Params | Expected |
|---|-----------|-------------|----------|
| 8 | Type filter MOVIE | `?q=test&type=MOVIE` | Only MOVIE results |
| 9 | Type filter SERIES | `?q=test&type=SERIES` | Only SERIES results |
| 10 | Genre filter | `?q=test&genre=action` | Only action genre results |
| 11 | Year range | `?q=test&yearFrom=2000&yearTo=2010` | Only 2000-2010 results |
| 12 | Combined: type+genre | `?q=test&type=MOVIE&genre=action` | Only action movies |
| 13 | Combined: type+genre+year | `?q=test&type=MOVIE&genre=action&yearFrom=2000&yearTo=2020` | Intersection of all |

### A4. Sort Options (4 tests)

| # | Test Case | Query Params | Expected |
|---|-----------|-------------|----------|
| 14 | Default relevance sort | `?q=test` | Sorted by ts_rank DESC |
| 15 | Newest sort | `?q=test&sort=newest` | Sorted by releaseYear DESC |
| 16 | Views sort | `?q=test&sort=views` | Sorted by viewCount DESC |
| 17 | Title sort | `?q=test&sort=title` | Sorted alphabetically |

### A5. Pagination (3 tests)

| # | Test Case | Query Params | Expected |
|---|-----------|-------------|----------|
| 18 | Default pagination | `?q=test` | page=1, limit=20 |
| 19 | Custom page+limit | `?q=test&page=2&limit=5` | Correct offset, meta correct |
| 20 | Beyond last page | `?q=test&page=999` | Empty data, meta.total correct |

### A6. Special Characters (3 tests)

| # | Test Case | Query | Expected |
|---|-----------|-------|----------|
| 21 | Apostrophe | `?q=it's` | No error, graceful handling |
| 22 | Quotes | `?q="dark knight"` | No error, returns results |
| 23 | Unicode | `?q=café` | No error, graceful handling |

### A7. Validation Errors (4 tests)

| # | Test Case | Query | Expected |
|---|-----------|-------|----------|
| 24 | Missing q | `GET /api/search` | 400, validation error |
| 25 | q too long (>200) | `?q=a{201}` | 400, validation error |
| 26 | Invalid type | `?q=test&type=INVALID` | 400, validation error |
| 27 | Invalid sort | `?q=test&sort=invalid` | 400, validation error |

---

## Part B: Suggestions API Tests (`tests/search-suggestions-qa.test.ts`)

### B1. Suggestions Accuracy (5 tests)

| # | Test Case | Query | Expected |
|---|-----------|-------|----------|
| 28 | Partial title match | `?q=dar` | Returns "The Dark Knight" |
| 29 | Case insensitive | `?q=DARK` | Returns "The Dark Knight" |
| 30 | Max 5 results | Create 8 matching items | Returns exactly 5 |
| 31 | Ordered by viewCount | Create items with different viewCount | Highest viewCount first |
| 32 | Minimal data shape | `?q=test` | Only id, title, type, thumbnailUrl, releaseYear |

### B2. Suggestions Validation (2 tests)

| # | Test Case | Query | Expected |
|---|-----------|-------|----------|
| 33 | Missing q | `GET /api/search/suggestions` | 400 |
| 34 | q too long (>100) | `?q=a{101}` | 400 |

---

## Part C: Browser Walkthrough (AI-056) — Checklist

**URL:** http://localhost:1999
**Requirement:** Real browser verification, not just unit tests

### C1. Search Bar (AuthNavbar)
- [ ] Search icon visible in navbar
- [ ] Click icon → input expands with animation
- [ ] Input auto-focuses on expand
- [ ] Placeholder shows "Titles, people, genres"
- [ ] Esc key collapses search bar
- [ ] Click outside collapses search bar

### C2. Suggestions Dropdown
- [ ] Type 1+ chars → suggestions appear after ~300ms debounce
- [ ] Suggestions show thumbnail, title, type badge, year
- [ ] Max 5 suggestions displayed
- [ ] "View all results" link at bottom
- [ ] Click suggestion → navigates to /title/:id
- [ ] Arrow keys navigate suggestions

### C3. Search Results Page
- [ ] Enter in search bar → navigates to /search?q=...
- [ ] Shows "X results for 'query'" header
- [ ] Content grid displays results with MovieCard
- [ ] Filter sidebar visible (type, genre, year, sort)
- [ ] Changing filter updates URL and results
- [ ] Pagination works (if enough results)

### C4. Empty State
- [ ] Search for "xyznonexistent" → empty state displayed
- [ ] Shows "No results found for 'xyznonexistent'"
- [ ] Shows suggestion tips (different keywords, check spelling, etc.)

### C5. Cross-Feature Regression
- [ ] Auth still works (login/logout)
- [ ] Homepage loads correctly
- [ ] Content detail page accessible from search results
- [ ] Video player loads from search result → detail → play

---

## Test Seed Strategy

Create controlled test data per describe block:
- 3-5 movies with specific titles/descriptions for search accuracy
- 2 series for type filtering
- Link to known genres (action, drama) for genre filtering
- Vary releaseYear (1990, 2005, 2015, 2023) for year filtering
- Vary viewCount for sort testing
- Use `createTestContent()` + `linkContentToGenres()` helpers

**Critical:** After seeding, verify `search_vector` is populated (trigger should auto-fill on INSERT).

---

## Estimated Test Count

| Section | Tests |
|---------|-------|
| A. Search API | 27 |
| B. Suggestions API | 7 |
| C. Browser Walkthrough | Manual checklist |
| **Total automated** | **~34** |

---

## Execution Order

1. Read BE search source code when available (AI-004)
2. Write `tests/search-qa.test.ts` (Parts A)
3. Write `tests/search-suggestions-qa.test.ts` (Part B)
4. Run automated tests → fix if needed
5. Start FE+BE servers (port 1999 + 5001)
6. Browser walkthrough (Part C) at localhost:1999
7. Document results + report to PO
