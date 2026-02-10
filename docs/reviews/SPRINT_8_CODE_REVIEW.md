# Sprint 8 — Code Review Report

**Reviewer:** TL (Tech Lead)
**Date:** 2026-02-09
**Sprint:** 8 — Content Detail & Preview Modal (33 pts)
**Verdict:** APPROVED with observations (no blockers)

---

## Review Scope

### BE (2 commits)
- `33046d9` feat(test): add webphim_test DB isolation (Task 8.7)
- `4ee60b5` feat(api): add GET /api/content/:id/similar (Task 8.6)

### FE (5 commits)
- `9724037` feat(fe): useBodyScrollLock hook (8.4)
- `71e7665` feat(fe): EpisodeList + EpisodeCard (8.3)
- `47f05e6` feat(fe): SimilarTitles section (8.5)
- `eed4cba` feat(fe): PreviewModal with shared components (8.1)
- `79d14fe` feat(fe): Content Detail Page at /title/[id] (8.2)

### QA Tests
- `content-similar-qa.test.ts` (6 tests)
- `useBodyScrollLock.test.tsx` (4 tests)
- `MovieCardPreview.test.tsx` (4 tests)
- `ContentRowModal.test.tsx` (3 tests)

---

## Architecture Adherence: STRONG

Both BE and FE follow the architecture doc faithfully:
- **BE:** Layered Route → Validation → Controller → Service → Prisma. New endpoint follows existing patterns exactly. Route ordering correct (`/:id/similar` before `/:id`).
- **FE:** Component tree matches Section 5.2. Props interfaces match spec. Modal state managed by parent (Option B). File structure matches Section 5.1. Routing adds `/title/[id]` as specified.
- **Test DB isolation** (Task 8.7): `.env.test` loads correctly, `webphim_test` DB created, dev DB preserved.

---

## Findings by Severity

### HIGH — Should Fix Soon (Non-Blocking)

| # | Category | File | Issue |
|---|----------|------|-------|
| H1 | A11Y | `PreviewModal.tsx` | Modal lacks `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. No focus trap — Tab key can reach elements behind modal. |
| H2 | A11Y | Multiple components | Icon-only buttons (Add to List, Like, Mute) lack `aria-label` in ModalContent, ContentHero, EpisodeCard. Screen readers announce them as unlabeled. |

### MEDIUM — Improve When Convenient

| # | Category | File | Issue |
|---|----------|------|-------|
| M1 | Performance | `content.service.ts:172` | `getSimilar` fetches `take: limit * 3` candidates without `orderBy`. Candidate pool is in arbitrary order before in-memory re-ranking. **Fix:** Add `orderBy: { viewCount: 'desc' }` to bias toward popular content (1-line change). |
| M2 | Performance | `prisma/schema.prisma` | `ContentGenre` has composite PK `(contentId, genreId)` but no `@@index([genreId])`. The similar query filters by `genreId IN (...)` which can't use the composite PK efficiently. Fine for current catalog size, needed for growth. |
| M3 | Test | `hooks/__tests__/` | Duplicate test files: `useBodyScrollLock.test.ts` AND `.test.tsx` both exist (8 tests total for same hook). Consolidate into one file. |
| M4 | Performance | Multiple FE files | Sprint 8 uses raw `<img>` instead of Next.js `<Image>`. Loses lazy loading, WebP/AVIF optimization, layout shift prevention. All images load eagerly. |

### LOW — Noted for Future

| # | Category | File | Issue |
|---|----------|------|-------|
| L1 | Type safety | `ContentRow.tsx:115` | `contentId={previewId!}` non-null assertion on nullable value. Safe because PreviewModal guards with `isOpen && contentId`, but misleading. Better: `contentId={previewId ?? ''}` or conditionally render. |
| L2 | DRY | 3 FE files | `formatDuration()` duplicated in ContentMeta, EpisodeCard, MovieCard. Extract to shared utility. |
| L3 | DRY | 5 FE files | `SERVER_BASE` constant duplicated in ContentHero, ModalContent, EpisodeCard, MovieCard, HeroBanner. Extract to shared constant. |
| L4 | DRY | `content.service.ts` | Content-to-summary mapping duplicated in `list()` and `getSimilar()`. Extract `toContentSummary()` helper. |
| L5 | Logic | `ContentMeta.tsx:11` | `formatDuration(0)` returns empty string (falsy check `!minutes`). Should be `minutes == null`. Edge case unlikely for real data. |
| L6 | A11Y | `EpisodeList.tsx:25` | Season `<select>` lacks `<label>` or `aria-label`. |
| L7 | Test | `PreviewModal.test.tsx` | Unused imports (`afterEach`, `act`). Minor cleanup. |
| L8 | Test | `SimilarTitles.test.tsx` | `act()` warning in "renders nothing when no similar content" test. SWR state update timing. |

---

## Security: CLEAN

- No XSS vectors (no `dangerouslySetInnerHTML`, all content JSX-escaped)
- UUID validation via Zod prevents injection on BE
- Limit bounded `[1, 20]` via validation schema
- No user-supplied strings interpolated into queries
- Endpoint is read-only, public (consistent with existing content routes)
- Image/video URLs safely constructed (no `javascript:` URI risk with `<img>`/`<video>`)

---

## Error Handling: GOOD

**BE:**
- 404 for non-existent content ID
- 400 for invalid UUID (Zod validation)
- 400 for out-of-range limit (Zod validation)
- Empty array for content with no genres / no similar items
- Controller wraps with try/catch + `next(error)`

**FE:**
- Loading states with skeletons/spinners while SWR fetches
- Error states with fallback UI in ContentDetailPage and PreviewModal
- Null `trailerUrl` → banner image fallback (confirmed all seed data has null trailerUrl)
- Null `thumbnailUrl` → gray placeholder with title text

---

## Test Coverage: EXCELLENT

| Area | Dev Tests | QA Tests | Total | Verdict |
|------|-----------|----------|-------|---------|
| BE Similar API | 10 | 6 | 16 | Strong — covers happy path, ranking, limits, edge cases, validation |
| FE PreviewModal | 16 | 7 | 23 | Strong — open/close, escape, backdrop, content render, series |
| FE ContentDetailPage | 10 | 0 | 10 | Good — loading, render, hero, cast, genres, episodes |
| FE EpisodeList | 11 | 0 | 11 | Good — header, selector, season switch, navigation |
| FE SimilarTitles | 5 | 0 | 5 | Adequate — loading, render, empty, compact |
| FE useBodyScrollLock | 4+4 | 0 | 8* | Good (but duplicated — M3) |
| **Total** | **60** | **17** | **73** | |

*8 tests across 2 duplicate files for same hook.

**Missing test coverage (non-critical):**
- ViewCount tiebreaker when genre overlap is equal (BE)
- ContentRow → PreviewModal integration at row level
- "More Details" link navigation from modal to `/title/:id` (appears deferred)

---

## Checklist

| Criteria | BE | FE | Notes |
|----------|----|----|-------|
| Follows arch doc | PASS | PASS | Very close adherence |
| No security vulnerabilities | PASS | PASS | |
| Proper error handling | PASS | PASS | |
| Tests included & passing | PASS | PASS | 73 new tests |
| Performance considered | PASS* | PASS* | *M1, M2, M4 noted |
| Coding standards (TS strict, lint) | PASS | PASS | |
| One commit per task | PASS | PASS | 2 BE + 5 FE commits |

---

## Summary

Sprint 8 is a clean implementation with strong architecture adherence. The 2 high-priority items (H1, H2) are accessibility gaps that don't affect functionality but should be addressed in a future sprint. The medium items (M1-M4) are performance and maintenance improvements. No bugs found, no security issues, excellent test coverage.

**Verdict: APPROVED.**
