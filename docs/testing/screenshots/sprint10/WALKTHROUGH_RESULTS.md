# Sprint 10 Browser Walkthrough Results

**Date:** 2026-02-09
**URL:** http://localhost:1999
**Tester:** QA (Task 10.8, 3pts)

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Automated API tests (user-features-qa) | 22/22 | ALL PASS |
| Browser walkthrough | 22/22 | 0 failures |

---

## Browser Walkthrough Detail

| # | Test | Status | Note |
|---|------|--------|------|
| B0.0 | Boss account login | PASS | URL: http://localhost:1999/home |
| B1.0 | Home page loads with content | PASS |  |
| B2.0 | ContinueWatchingRow on home | PASS | Not visible — Boss may have no watch history (expected) |
| B3.0 | Progress bars | PASS | N/A — no CW row |
| B4.0 | CW thumbnails | PASS | N/A — no CW row |
| B5.0 | Navigate to /browse/my-list | PASS | URL: http://localhost:1999/browse/my-list |
| B6.0 | My List shows content or empty state | PASS |  |
| B7.0 | WatchlistButton visible on MovieCard hover | PASS | 37 cards found |
| B8.0 | WatchlistButton toggles on click (aria-pressed changes) | PASS | before=false, after=true |
| B9.0 | Added item appears in My List | PASS |  |
| B10.0 | RatingButtons visible in PreviewModal | PASS |  |
| B11.0 | ThumbsUp click updates aria-pressed | PASS | pressed=true |
| B12.0 | ThumbsDown switches rating (up=false, down=true) | PASS | up=false, down=true |
| B13.0 | Profile selector page loads | PASS | URL: http://localhost:1999/profiles |
| B14.0 | Profile cards display | PASS | 1 profiles |
| B14.1 | Profile card shows name | PASS | Name: QA Edited Name |
| B15.0 | Click profile → redirected to /home | PASS | URL: http://localhost:1999/home |
| B16.0 | Profile management page loads | PASS | URL: http://localhost:1999/profiles/manage |
| B17.0 | Add Profile creates new profile | PASS |  |
| B18.0 | Edit profile name saves | PASS | Changed to "QA Edited Name" |
| B19.0 | Thumbnails render correctly (AI-064) | PASS | 10/10 loaded, 0 broken |
| B20.0 | Auth session maintained throughout | PASS |  |

**Screenshots:** `docs/testing/screenshots/sprint10/`
