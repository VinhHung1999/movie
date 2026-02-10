# Sprint 10 QA Test Plan — Task 10.8 (3pts)

**Feature:** User Features (Watchlist, Ratings, Profiles, Continue Watching)
**Arch Doc:** docs/architecture/SPRINT_10_ARCHITECTURE.md (Sections 4, 8, 12)
**Approach:** Edge cases + cross-endpoint consistency (complement BE tests, don't duplicate)

---

## Part A: Automated API Tests (~22 tests)

### A1: Watchlist Edge Cases (6 tests)

| # | Test | Expected |
|---|------|----------|
| 1 | Idempotent add — POST same contentId twice | 2nd returns 200 with existing addedAt, no duplicate |
| 2 | Idempotent remove — DELETE when not in watchlist | Returns 200 with removed:true |
| 3 | Add with non-existent contentId | Returns 404 |
| 4 | Check for non-existent contentId | Returns 200 with inWatchlist:false |
| 5 | Watchlist list includes correct content shape (genres, thumbnailUrl) | Content nested object has all ContentSummary fields |
| 6 | Pagination — page beyond total returns empty data | Returns 200, data:[], meta.total correct |

### A2: Rating Edge Cases (6 tests)

| # | Test | Expected |
|---|------|----------|
| 1 | Change rating (1→2, thumbs up to down) | Upsert returns score:2 |
| 2 | Remove non-existent rating | Returns 200 with removed:true |
| 3 | Invalid score (0) | Returns 400 |
| 4 | Invalid score (3) | Returns 400 |
| 5 | Get rating when none set | Returns 200 with data:null |
| 6 | Rate non-existent content | Returns 404 |

### A3: Profile Edge Cases (7 tests)

| # | Test | Expected |
|---|------|----------|
| 1 | Create 5th profile (at limit) | Returns 201 |
| 2 | Create 6th profile (exceed limit) | Returns 409 |
| 3 | Delete last remaining profile | Returns 400 |
| 4 | Update with name > 30 chars | Returns 400 |
| 5 | Update with empty name | Returns 400 |
| 6 | Auto-create profile on register | New user has exactly 1 profile |
| 7 | Delete profile then create new one (back under limit) | Returns 201 |

### A4: Cross-Endpoint Consistency (3 tests)

| # | Test | Expected |
|---|------|----------|
| 1 | Watchlist content ID matches content detail endpoint | Same title, type returned |
| 2 | Rating persists after watchlist toggle | Rate → add to watchlist → rating still exists |
| 3 | Profile name appears in GET /profiles after create | Verify data round-trip |

---

## Part B: Browser Walkthrough (AI-056 + AI-064)

### Pre-flight
- Query dev DB for actual content IDs before writing walkthrough
- Use data-testid selectors from FE source code
- Login as Boss (boss@webphim.com / Boss@123456)

### Walkthrough Checklist

| # | Test | Verifies |
|---|------|----------|
| B1 | Login → redirected to /home | Auth works |
| B2 | Home page has ContinueWatchingRow (if watch history exists) | Task 10.5 |
| B3 | ContinueWatchingRow shows progress bar on cards | Visual rendering |
| B4 | ContinueWatchingRow thumbnails load from correct URL (SERVER_BASE) | AI-064 |
| B5 | Navigate to /browse/my-list | My List page loads |
| B6 | My List empty state message visible (if empty) | Task 10.4 |
| B7 | MovieCard hover shows Plus/Check button (WatchlistButton) | Task 10.4 |
| B8 | Click WatchlistButton toggles icon (Plus↔Check) | Optimistic update |
| B9 | Navigate to /browse/my-list → added item appears | Data persists |
| B10 | RatingButtons visible in PreviewModal | Task 10.4 |
| B11 | Click ThumbsUp → icon fills | Rating UI |
| B12 | Click ThumbsDown → switches rating | Rating change |
| B13 | Navigate to /profiles | Profile selector page |
| B14 | Profile cards display with name + avatar | Task 10.6 |
| B15 | Click profile → redirected to /home | Profile selection |
| B16 | Navigate to /profiles/manage | Profile management |
| B17 | "Add Profile" creates new profile | Task 10.7 |
| B18 | Edit profile name → saves | Task 10.7 |
| B19 | Thumbnails load correctly throughout (AI-064) | Content rendering |
| B20 | Auth session maintained throughout | Regression |

---

## Execution Order

1. Read BE source code when BE completes (services, controllers, validations)
2. Write automated QA tests (~22 tests)
3. Run automated tests
4. Browser walkthrough with Playwright
5. Report results to PO

---

**Estimated:** ~22 automated tests + 20-point browser walkthrough
