# Architecture Document: Sprint 9 — Search

**Author:** TL (Tech Lead)
**Date:** 2026-02-09
**Status:** PENDING PO REVIEW
**Sprint:** 9 (Search + P0 Bug Fix, 29pts: BE 11 + FE 15 + QA 3)
**Depends on:** Sprint 4 (Content APIs), Sprint 8 (Test DB isolation)

---

## 1. Pinned Dependency Versions

### Frontend (DO NOT UPGRADE)

| Package | Version | Notes |
|---------|---------|-------|
| next | 16.1.6 | App Router, Server/Client Components |
| react | 19.2.3 | React 19 |
| tailwindcss | ^4 | CSS-first config via globals.css |
| framer-motion | ^12.33.0 | Animations |
| zustand | ^5.0.11 | Auth state |
| swr | ^2.4.0 | Client-side data fetching |
| axios | ^1.13.4 | HTTP client with interceptors |
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
| zod | ^4.3.6 | Validation (`.issues` not `.errors`, no `AnyZodObject`) |
| cors | ^2.8.6 | Callback origin pattern |
| helmet | ^8.1.0 | Security headers |
| vitest | ^4.0.18 | Testing framework |

### No New Packages

Sprint 9 requires no new dependencies. PostgreSQL tsvector is a built-in feature. SWR handles client-side search caching. Framer Motion handles search UI animations.

---

## 2. Port Configuration

| Service | Port | URL |
|---------|------|-----|
| FE (Next.js dev) | **1999** | `http://localhost:1999` |
| BE (Express) | **5001** | `http://localhost:5001` |
| PostgreSQL | 5432 | `postgresql://localhost:5432/webphim` |
| Redis | 6379 | For BullMQ transcode queue |

**FE env:** `NEXT_PUBLIC_API_URL=http://localhost:5001/api`

**CORS origins:** `http://localhost:1999`, `http://localhost:3000`, `http://localhost:3001` (already configured in `src/config/index.ts`)

**Reminder:** Port 5000 blocked by macOS AirPlay. FE port changed to 1999 (Sprint 8).

---

## 3. CRITICAL: Restore search_vector (AI-023 Debt)

### Background

Sprint 4 created `search_vector` tsvector column + GIN index + trigger via raw SQL migration. Sprint 6 migration (`add_video_model`) auto-dropped them because `search_vector` was NOT in `schema.prisma` — Prisma detected "drift" and removed it. Sprint 6 then cleaned up orphaned trigger/function.

**Current state (verified):** Both `webphim` and `webphim_test` have NO `search_vector` column, NO `idx_content_search` index, NO trigger, NO function.

### Solution: Prisma-Safe Restoration

**Step 1: Add `Unsupported("tsvector")` to schema.prisma**

This is the KEY fix. By declaring the column in schema.prisma, Prisma will NOT drop it in future migrations.

```prisma
model Content {
  // ... existing fields ...
  viewCount       Int            @default(0) @map("view_count")
  searchVector    Unsupported("tsvector")? @map("search_vector")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  // ... relations ...

  @@index([type])
  @@index([releaseYear])
  @@map("content")
}
```

**Why `Unsupported("tsvector")?`:**
- Prisma 7 doesn't have a native tsvector type
- `Unsupported` tells Prisma "this column exists but I can't manage it"
- The `?` makes it nullable (Prisma won't require it in creates)
- The `@map("search_vector")` maps to the actual column name
- Prisma will create the column in the migration but won't touch it afterwards

**Step 2: Create migration**

```bash
npx prisma migrate dev --name restore_fulltext_search
```

This generates a migration that adds `search_vector` column. Then manually edit the migration SQL to add the GIN index, trigger function, trigger, and backfill:

```sql
-- Prisma will auto-generate:
-- ALTER TABLE "content" ADD COLUMN "search_vector" tsvector;

-- MANUALLY ADD to the migration file:

-- Create GIN index for fast full-text search
CREATE INDEX idx_content_search ON content USING GIN(search_vector);

-- Create trigger function to auto-update search_vector
CREATE OR REPLACE FUNCTION content_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER content_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description ON content
  FOR EACH ROW
  EXECUTE FUNCTION content_search_vector_update();

-- Backfill existing rows
UPDATE content SET search_vector =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B');
```

**Step 3: Apply to both databases**

```bash
# Dev DB
npx prisma migrate deploy

# Test DB
DATABASE_URL=postgresql://phuhung:@localhost:5432/webphim_test npx prisma migrate deploy
```

**Step 4: Verify**

```bash
psql -U phuhung -d webphim -c "SELECT search_vector IS NOT NULL as has_vector FROM content LIMIT 3;"
psql -U phuhung -d webphim_test -c "\d content" | grep search_vector
```

### Why This Won't Get Dropped Again

With `searchVector Unsupported("tsvector")? @map("search_vector")` in schema.prisma, Prisma sees the column as part of the schema. Future `prisma migrate dev` will NOT detect drift for this column. The trigger and function are still raw SQL (Prisma can't manage those), but they depend on the column existing — as long as the column survives, they survive.

---

## 4. API Contracts

### 4.1 NEW: GET /api/search — Full-Text Search (Task 9.1 + 9.2)

**Route:** `GET /api/search`

**Auth:** Not required (public endpoint)

**Query Params:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| q | string | Yes | — | Search query (min 1 char, max 200 chars) |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page (1-50) |
| type | 'MOVIE' \| 'SERIES' | No | — | Filter by content type |
| genre | string | No | — | Filter by genre slug |
| yearFrom | number | No | — | Min release year (inclusive) |
| yearTo | number | No | — | Max release year (inclusive) |
| sort | 'relevance' \| 'newest' \| 'oldest' \| 'views' \| 'title' | No | 'relevance' | Sort order |

**Algorithm:**
1. Convert query `q` to tsquery using `websearch_to_tsquery('english', q)`
2. Search `content.search_vector` using `@@` operator
3. Apply filters (type, genre, yearFrom, yearTo) as WHERE clauses
4. Sort: `relevance` uses `ts_rank(search_vector, query) DESC`, others use existing SORT_MAP
5. Paginate with `OFFSET` and `LIMIT`
6. Return ContentSummary[] format (same shape as content list)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "MOVIE",
      "title": "The Dark Knight",
      "description": "When the menace known as...",
      "releaseYear": 2008,
      "maturityRating": "PG13",
      "duration": 152,
      "thumbnailUrl": "/images/content/...",
      "bannerUrl": "/images/content/...",
      "viewCount": 2500,
      "genres": [
        { "id": "uuid", "name": "Action", "slug": "action" }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "query": "dark knight"
  }
}
```

**Error Responses:**
- `400` — Missing or invalid `q`: `{ "success": false, "message": "Validation error", "errors": [{ "field": "q", "message": "Search query is required" }] }`
- `400` — Invalid filters: Standard Zod validation errors

**Implementation Notes:**

Must use `prisma.$queryRaw` for tsvector search — Prisma's query builder doesn't support tsvector natively. Example:

```typescript
const results = await prisma.$queryRaw<ContentRow[]>`
  SELECT c.id, c.type, c.title, c.description, c.release_year,
         c.maturity_rating, c.duration, c.thumbnail_url, c.banner_url,
         c.view_count,
         ts_rank(c.search_vector, websearch_to_tsquery('english', ${q})) as rank
  FROM content c
  WHERE c.search_vector @@ websearch_to_tsquery('english', ${q})
    ${type ? Prisma.sql`AND c.type = ${type}::"ContentType"` : Prisma.empty}
    ${genre ? Prisma.sql`AND EXISTS (
      SELECT 1 FROM content_genres cg
      JOIN genres g ON g.id = cg.genre_id
      WHERE cg.content_id = c.id AND g.slug = ${genre}
    )` : Prisma.empty}
    ${yearFrom ? Prisma.sql`AND c.release_year >= ${yearFrom}` : Prisma.empty}
    ${yearTo ? Prisma.sql`AND c.release_year <= ${yearTo}` : Prisma.empty}
  ORDER BY ${sort === 'relevance' ? Prisma.sql`rank DESC` : Prisma.sql`c.view_count DESC`}
  LIMIT ${limit} OFFSET ${(page - 1) * limit}
`;
```

**SECURITY NOTE:** Always use Prisma's tagged template literals (`Prisma.sql`, `$queryRaw\`...\``) for parameterized queries — NEVER string concatenation. This prevents SQL injection.

**Genre resolution:** For search results, genres must be fetched separately (raw SQL doesn't include joins easily). After fetching content IDs from the raw query, use Prisma to fetch genres:

```typescript
// After raw query returns content IDs
const contentIds = results.map(r => r.id);
const genreMap = await prisma.contentGenre.findMany({
  where: { contentId: { in: contentIds } },
  include: { genre: { select: { id: true, name: true, slug: true } } },
});
```

### 4.2 NEW: GET /api/search/suggestions — Typeahead (Task 9.3)

**Route:** `GET /api/search/suggestions`

**Auth:** Not required

**Query Params:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| q | string | Yes | — | Partial query (min 1 char, max 100 chars) |

**Algorithm:**
1. Use `ILIKE` for prefix/partial matching on `title` (faster for short queries than tsvector)
2. Return top 5 matches ordered by viewCount DESC
3. Return minimal data (id, title, type, thumbnailUrl) for fast rendering

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "The Dark Knight",
      "type": "MOVIE",
      "thumbnailUrl": "/images/content/...",
      "releaseYear": 2008
    }
  ]
}
```

**Error Responses:**
- `400` — Missing `q`: Zod validation error

**Implementation:**
```typescript
const suggestions = await prisma.content.findMany({
  where: {
    title: { contains: q, mode: 'insensitive' },
  },
  select: { id: true, title: true, type: true, thumbnailUrl: true, releaseYear: true },
  orderBy: { viewCount: 'desc' },
  take: 5,
});
```

**Performance:** `ILIKE` with `contains` does a sequential scan. For the current catalog size (<100 items), this is fast enough. For production scale, add a `@@index` on `title` with `@db.Gin(ops: TrigramOps)` or use `pg_trgm` extension. Not needed now.

### 4.3 Existing Endpoints (No Changes)

All existing endpoints remain unchanged. The content list endpoint (`GET /api/content`) keeps its existing `search` query param but it remains unimplemented — Sprint 9 uses a dedicated `/api/search` endpoint instead, which supports proper tsvector ranking.

---

## 5. Test DB Configuration

### No Changes to Infrastructure

Test DB isolation (Task 8.7) is already in place:
- **Test DB:** `webphim_test` on `localhost:5432`
- **Config:** `.env.test` loaded via `tests/env-setup.ts` (first vitest setupFile)
- **Isolation:** Tests NEVER touch dev DB. Dev DB seed data (including boss@webphim.com) preserved.

### Sprint 9 Migration for Test DB

After creating the search migration, apply to test DB:
```bash
DATABASE_URL=postgresql://phuhung:@localhost:5432/webphim_test npx prisma migrate deploy
```

Verify search_vector exists in test DB before QA tests run.

### Test Seed Requirements

Search tests need content with known titles and descriptions to verify:
- Exact match: "Inception" → finds Inception
- Partial match: "dark" → finds "The Dark Knight"
- Weighted ranking: Title match ("knight") ranks higher than description-only match
- No match: "xyznonexistent" → empty results
- Special characters: Apostrophes, quotes, Unicode handled gracefully

Use existing test helpers (`tests/helpers/content.helper.ts`) to create test content with specific titles.

---

## 6. Component Tree

### 6.1 File Structure — New & Modified Files

```
webphim-fe/src/
├── app/
│   ├── (main)/
│   │   └── search/
│   │       └── page.tsx              # NEW: Search Results Page (Task 9.5)
│   └── ... (existing, no changes)
│
├── components/
│   ├── search/                       # NEW DIRECTORY
│   │   ├── SearchBar.tsx             # Task 9.4: Expandable search input
│   │   ├── SearchSuggestions.tsx      # Task 9.4: Dropdown suggestions
│   │   ├── SearchFilters.tsx         # Task 9.5: Filter sidebar
│   │   └── SearchEmptyState.tsx      # Task 9.6: No results UI
│   │
│   ├── layout/
│   │   └── AuthNavbar.tsx            # MODIFY: Wire search icon to SearchBar
│   │
│   └── ... (existing, no changes)
│
├── hooks/
│   └── useDebounce.ts               # NEW: Debounce hook for search input
│
└── types/
    └── index.ts                     # UPDATE: Add search-related types
```

### 6.2 Component Tree Diagram

```
AuthNavbar (layout/AuthNavbar.tsx) — MODIFIED
│
├── SearchBar (search/SearchBar.tsx) ★ NEW — Task 9.4
│   ├── SearchIcon (toggle trigger)
│   ├── ExpandableInput (AnimatePresence, auto-focus on expand)
│   │   ├── <input> with debounce (300ms)
│   │   ├── ClearButton (X icon, visible when input has text)
│   │   └── CloseButton (Esc or click outside to collapse)
│   └── SearchSuggestions (dropdown below input) ★ NEW
│       ├── SuggestionItem (×5 max)
│       │   ├── Thumbnail (small, 40×60px)
│       │   ├── Title (highlighted matching text)
│       │   ├── Type badge (MOVIE/SERIES)
│       │   └── Year
│       └── "View all results" link → /search?q=...
│
├── ... (existing nav items)
│
SearchResultsPage (/search?q=) ★ NEW — Task 9.5
│
├── SearchHeader
│   ├── SearchInput (prefilled with q param, editable)
│   └── ResultCount ("X results for 'query'")
│
├── SearchFilters (sidebar on desktop, collapsible on mobile) ★ NEW
│   ├── TypeFilter
│   │   ├── All (default)
│   │   ├── Movies
│   │   └── Series
│   ├── GenreFilter
│   │   └── Checkbox list (from /api/genres)
│   ├── YearFilter
│   │   ├── From: <select> or <input type="number">
│   │   └── To: <select> or <input type="number">
│   └── SortSelect
│       ├── Most Relevant (default)
│       ├── Newest
│       ├── Most Popular
│       └── Title A-Z
│
├── ContentGrid (reuse from browse)
│   └── MovieCard (×N, compact mode)
│
├── Pagination or InfiniteScroll
│
└── SearchEmptyState (when data.length === 0) ★ NEW — Task 9.6
    ├── SearchIcon (large, muted)
    ├── "No results found for 'query'"
    ├── Suggestions text:
    │   ├── "Try different keywords"
    │   ├── "Check your spelling"
    │   └── "Try more general terms"
    └── PopularSearches (optional: link to genres)
```

### 6.3 Component Specifications

#### SearchBar (Task 9.4) — `'use client'`

**Props:**
```typescript
interface SearchBarProps {
  className?: string;
}
```

**Behavior:**
- **Collapsed state:** Only shows Search icon (existing button in AuthNavbar)
- **Expanded state:** Click icon → input slides in from right with Framer Motion
  - Animation: `width: 0 → 250px`, `opacity: 0 → 1`, duration 200ms
  - Auto-focus input on expand
  - Placeholder: "Titles, people, genres"
- **Debounce:** 300ms delay before firing suggestion API call
- **Suggestions dropdown:** Opens when input has 1+ chars and suggestions exist
- **Submit:** Enter key or "View all results" link navigates to `/search?q=...`
- **Close:** Esc key, click outside, or click X when empty → collapse back to icon
- **Keyboard:** Arrow keys navigate suggestions, Enter selects highlighted

**State management:** Local state only. `useState` for `isExpanded`, `query`, `selectedIndex`.

#### SearchSuggestions (Task 9.4) — `'use client'`

**Props:**
```typescript
interface SearchSuggestionsProps {
  query: string;
  isVisible: boolean;
  onSelect: (id: string) => void;
  onViewAll: () => void;
  selectedIndex: number;
}
```

**Behavior:**
- Fetches from `GET /api/search/suggestions?q=${query}` via SWR
- Shows top 5 results with thumbnail, title (matching text bold), type badge, year
- "View all results for '{query}'" link at bottom
- Keyboard: Up/Down changes `selectedIndex`, Enter navigates
- Loading: Show spinner while fetching
- Empty: Show "No suggestions" text

#### SearchFilters (Task 9.5) — `'use client'`

**Props:**
```typescript
interface SearchFiltersProps {
  filters: SearchFilterState;
  onFilterChange: (filters: SearchFilterState) => void;
  genres: Genre[];
}

interface SearchFilterState {
  type?: 'MOVIE' | 'SERIES';
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  sort: 'relevance' | 'newest' | 'oldest' | 'views' | 'title';
}
```

**Layout:**
- Desktop: Left sidebar (w-64), sticky
- Mobile: Collapsible panel above results with filter icon toggle
- Filters update URL query params for shareable URLs

#### SearchEmptyState (Task 9.6) — `'use client'`

**Props:**
```typescript
interface SearchEmptyStateProps {
  query: string;
}
```

**Behavior:**
- Large muted search icon
- "No results found for '{query}'"
- 3 suggestion tips (different keywords, check spelling, more general terms)
- Optional: Show genre links as "Browse by category" section

#### useDebounce Hook

```typescript
// src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 7. Accessibility Requirements (AI-049)

### SearchBar
- `role="search"` on the search container (or use `<search>` HTML5 element)
- `<input>` has `aria-label="Search titles, people, genres"`
- `aria-expanded="true/false"` on the search trigger button based on expanded state
- `aria-controls="search-suggestions"` links button to suggestions dropdown
- `aria-autocomplete="list"` on input
- `aria-activedescendant` points to currently highlighted suggestion

### SearchSuggestions
- Container: `role="listbox"`, `id="search-suggestions"`
- Each suggestion: `role="option"`, `aria-selected="true/false"`
- `id` on each option matching `aria-activedescendant` on input

### SearchFilters
- Filter groups wrapped in `<fieldset>` with `<legend>`
- Type filter: `role="radiogroup"` with `role="radio"` buttons
- Genre filter: Standard `<input type="checkbox">` with `<label>`
- Year inputs: `<label>` associated with each `<input>`/`<select>`
- Sort dropdown: `<select>` with `<label>`

### SearchResultsPage
- `<h1>` for "Search Results for '{query}'"
- Results count announced: `aria-live="polite"` region for result count updates
- Keyboard: Tab navigates between search input, filters, and result cards

### SearchEmptyState
- `role="status"` with `aria-live="polite"` so screen readers announce empty state

---

## 8. CORS Configuration

### No Changes Needed

The existing CORS config in `webphim-be/src/config/index.ts` already includes `http://localhost:1999` in the default allowed origins list:

```typescript
corsOrigin: process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:1999', 'http://localhost:3000', 'http://localhost:3001'],
```

New search endpoints are public (no auth) — no CORS changes needed.

---

## 9. Validated Query Middleware Pattern (AI-020)

Express 5 `req.query` is read-only. For search endpoints:

- `q` is read from `req.query.q as string` after Zod validation
- Filter params read directly from `req.query` after validation
- Zod schema uses `z.coerce.number()` for numeric params (yearFrom, yearTo, page, limit)
- Controller does NOT reassign `req.query` — reads only

**Validation Schemas:**

```typescript
// Search
export const searchSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(200),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    type: z.enum(['MOVIE', 'SERIES']).optional(),
    genre: z.string().optional(),
    yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
    yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
    sort: z.enum(['relevance', 'newest', 'oldest', 'views', 'title']).default('relevance'),
  }),
});

// Suggestions
export const suggestionsSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(100),
  }),
});
```

---

## 10. Seed Data Review (AI-021)

### Current Seed Data Status

Sprint 4 seed has 31 movies + 6 series with varied titles and descriptions. Sufficient for search testing:

**Search test coverage by seed data:**
- Single-word search: "inception", "knight", "breaking" → match specific titles
- Multi-word: "dark knight" → tsquery handles phrase matching
- Partial: "inter" → matches "Interstellar" via tsvector stemming
- Genre filter: Action (10 items), Drama (31), Thriller (12) — enough to test filtering
- Year range: Content spans 1994–2023 — enough for year filtering
- Type filter: 31 MOVIE + 6 SERIES
- Empty results: "xyznonexistent" → zero results
- Description match: Words appearing only in description rank lower than title matches

### Boss Account Verification
- `boss@webphim.com` / `Boss@123456` exists in seed data
- MUST survive migration and re-seed
- Verify after applying search migration

---

## 11. Known Gotchas

### From Memory (Still Relevant)

| Issue | Impact on Sprint 9 |
|-------|-------------------|
| Prisma migration drift (AI-023) | CRITICAL — Use `Unsupported("tsvector")?` in schema.prisma. See Section 3. |
| Express 5 read-only req.query | BE: Read query params directly, don't reassign |
| Port 5000 blocked by macOS | BE on 5001 |
| FE port is 1999 | FE dev server, CORS already configured |
| SWR cache isolation in tests | FE: `<SWRConfig value={{ provider: () => new Map() }}>` |
| Framer Motion onHoverStart jsdom | FE: Use `onPointerEnter`/`onPointerLeave` in tests |
| fetchFromAPI double-unwrap | FE: `fetchFromAPI` returns `json.data` (pre-unwrapped) |
| Boss account must survive | Verify boss@webphim.com after migration |

### Sprint 9 Specific Gotchas

1. **`websearch_to_tsquery` vs `to_tsquery` vs `plainto_tsquery`.** Use `websearch_to_tsquery` (PostgreSQL 11+) — it handles user-friendly queries like "dark knight rises" without requiring `&`/`|` operators. Falls back gracefully for special characters.

2. **`Prisma.$queryRaw` returns snake_case columns.** Raw SQL returns `release_year`, `maturity_rating`, etc. (database column names). Must map to camelCase in service layer before returning. Don't rely on Prisma's automatic mapping — it doesn't apply to raw queries.

3. **`Prisma.$queryRaw` and BigInt.** Raw queries return numeric columns as BigInt by default in some PostgreSQL drivers. Use `::int` cast in SQL for integer columns to avoid serialization issues.

4. **`Prisma.sql` for dynamic WHERE clauses.** Use `Prisma.sql` tagged template for fragments and `Prisma.empty` for no-op fragments. NEVER use string concatenation — it bypasses parameterization.

5. **GIN index not used for `ILIKE`.** The suggestions endpoint uses `ILIKE` (Prisma `contains` + `mode: 'insensitive'`), which does NOT use the GIN tsvector index. It does a sequential scan. Fine for <100 items. For scale, would need `pg_trgm` extension + trigram GIN index.

6. **tsvector stemming.** English stemmer reduces words to stems: "running" → "run", "knights" → "knight". This means searching "knight" matches "knights" and vice versa. This is correct behavior, not a bug. Test expectations should account for stemming.

7. **Search input XSS.** The `q` parameter from the URL is displayed in "Results for '{query}'". Ensure this is rendered via JSX text interpolation (`{query}`) — NOT `dangerouslySetInnerHTML`. React auto-escapes, so this is safe by default.

8. **URL encoding for search query.** When navigating to `/search?q=dark%20knight`, Next.js `useSearchParams` auto-decodes. When building URLs, use `encodeURIComponent(query)`. SWR keys should use the decoded query for deduplication.

9. **Empty string vs undefined for filters.** URL params like `?genre=` (empty string) should be treated as "no filter". Zod `z.string().optional()` passes empty strings through. Consider using `.transform(v => v || undefined)` to normalize.

10. **Browser testing (AI-055/AI-056).** All features MUST be tested in real browser at `http://localhost:1999` before QA reports pass. Search bar expand/collapse, suggestions dropdown, keyboard navigation, results page with filters — all must work visually.

---

## 12. Routing

### New Route

| Route | Component | Type | Description |
|-------|-----------|------|-------------|
| `/search` | `app/(main)/search/page.tsx` | Client | Search results with filters |

### URL Query Params (Search Results Page)

```
/search?q=dark+knight&type=MOVIE&genre=action&yearFrom=2000&yearTo=2024&sort=relevance&page=1
```

All params sync to URL for shareable/bookmarkable search results. Filters update URL via `router.push` with shallow navigation.

### Navigation Flow

```
AuthNavbar → Search Icon click → SearchBar expands
SearchBar → Type query → Suggestions dropdown
SearchBar → Enter or "View all results" → /search?q=...
SearchSuggestion → Click item → /title/:id (detail page)
SearchResults → Click card → /title/:id (opens preview modal or detail)
SearchFilters → Change filter → URL updates, results refresh
```

---

## 13. State Management

### Search Query State

**In SearchBar (AuthNavbar):** Local `useState` for `isExpanded`, `inputValue`.

**In SearchResultsPage:** Read `q` from URL `searchParams`. Filters also from URL params. SWR key derived from URL params — automatic cache management.

```typescript
// SearchResultsPage
const searchParams = useSearchParams();
const q = searchParams.get('q') || '';
const type = searchParams.get('type') as 'MOVIE' | 'SERIES' | undefined;
const genre = searchParams.get('genre') || undefined;
// ... etc

const { data, isLoading } = useSWR(
  q ? `/search?q=${encodeURIComponent(q)}&type=${type || ''}&...` : null
);
```

### No New Zustand Stores

All search state is URL-driven (query params) + SWR cache. No global store needed.

---

## 14. BE Implementation Guide

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | MODIFY | Add `searchVector Unsupported("tsvector")?` to Content |
| `prisma/migrations/...restore_fulltext_search/migration.sql` | CREATE | Migration + manual SQL additions |
| `src/routes/search.routes.ts` | CREATE | Search route definitions |
| `src/controllers/search.controller.ts` | CREATE | Search + suggestions handlers |
| `src/services/search.service.ts` | CREATE | tsvector search + ILIKE suggestions logic |
| `src/validations/search.validation.ts` | CREATE | Zod schemas for search + suggestions |
| `src/routes/index.ts` | MODIFY | Register search routes |
| `tests/search.test.ts` | CREATE | Search API tests |
| `tests/search-suggestions.test.ts` | CREATE | Suggestions API tests |

### Task Execution Order (BE)

```
9.0 (Restore search_vector — Section 3) → 9.1 (Search API) → 9.2 (Filters) → 9.3 (Suggestions)
```

search_vector restoration MUST be done first. Without it, search is impossible.

---

## 15. FE Type Updates

Add to `webphim-fe/src/types/index.ts`:

```typescript
// ============================================
// Search Types (Sprint 9)
// ============================================

export interface SearchSuggestion {
  id: string;
  title: string;
  type: ContentType;
  thumbnailUrl: string | null;
  releaseYear: number;
}

export interface SearchSuggestionsResponse {
  success: true;
  data: SearchSuggestion[];
}

export interface SearchResultsResponse {
  success: true;
  data: ContentSummary[];
  meta: PaginationMeta & { query: string };
}

export interface SearchFilterState {
  type?: 'MOVIE' | 'SERIES';
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  sort: 'relevance' | 'newest' | 'oldest' | 'views' | 'title';
}
```

---

## 16. Infrastructure Verification (AI-050)

### Verified Before Doc Submission

| Check | Result | Command |
|-------|--------|---------|
| `webphim` DB exists | YES | `psql -U phuhung -lqt \| grep webphim` |
| `webphim_test` DB exists | YES | Same |
| `search_vector` column in `webphim` | NO — needs restore | `\d content` |
| `search_vector` column in `webphim_test` | NO — needs restore | Same |
| `idx_content_search` index | NO — needs restore | `\di` on content |
| Search trigger/function | NO — needs restore | `pg_trigger`, `pg_proc` |
| BE tests pass (161 pre-existing) | YES (159 pass, 2 timeout) | `npx vitest run` |
| FE tests pass (173) | YES | `npx vitest run` |
| Port 5001 available | YES | `lsof -i :5001` |
| Port 1999 available | YES | `lsof -i :1999` |
| Redis running | YES | `redis-cli ping` |
| boss@webphim.com in seed | YES | Verified in `prisma/seed.ts` |
| Validation `search` param in content.validation.ts | EXISTS (unused) | Confirmed — dedicated search route used instead |

---

## 17. Acceptance Criteria

### Task 9.1 — Search API (5 pts, BE)
- [ ] `search_vector` column restored with `Unsupported("tsvector")?` in schema.prisma
- [ ] GIN index, trigger function, and trigger recreated via migration
- [ ] Existing content backfilled (search_vector populated)
- [ ] `GET /api/search?q=...` returns ranked results using tsvector
- [ ] `websearch_to_tsquery` handles user-friendly queries
- [ ] Results in ContentSummary format with genres
- [ ] Pagination (page, limit, total, totalPages) works
- [ ] Default sort by relevance (`ts_rank`)
- [ ] Applied to both `webphim` and `webphim_test` DBs
- [ ] All tests passing

### Task 9.2 — Search Filters (3 pts, BE)
- [ ] Type filter: `?type=MOVIE` or `?type=SERIES`
- [ ] Genre filter: `?genre=action` (by slug)
- [ ] Year range filter: `?yearFrom=2000&yearTo=2020`
- [ ] Sort options: relevance, newest, oldest, views, title
- [ ] Filters combine correctly (AND logic)
- [ ] Zod validation for all filter params

### Task 9.3 — Search Suggestions API (3 pts, BE)
- [ ] `GET /api/search/suggestions?q=...` returns top 5 title matches
- [ ] Uses ILIKE (case-insensitive partial match)
- [ ] Returns minimal data: id, title, type, thumbnailUrl, releaseYear
- [ ] Ordered by viewCount DESC
- [ ] Fast response (<100ms for current catalog size)

### Task 9.4 — Search UI (5 pts, FE)
- [ ] Click search icon → input expands with animation
- [ ] Auto-focus on expand
- [ ] Debounce 300ms before fetching suggestions
- [ ] Suggestions dropdown: 5 items max with thumbnail, title, type, year
- [ ] Keyboard navigation: Up/Down arrows, Enter to select
- [ ] Enter submits to /search?q=...
- [ ] Esc or click outside closes
- [ ] Accessibility: `role="search"`, `aria-expanded`, `aria-autocomplete="list"`, `aria-activedescendant`

### Task 9.5 — Search Results Page (5 pts, FE)
- [ ] Page at `/search?q=...`
- [ ] Shows result count: "X results for '{query}'"
- [ ] Grid layout (reuses ContentGrid/MovieCard)
- [ ] Filter sidebar: type, genre, year range, sort
- [ ] Filters sync to URL query params (shareable URLs)
- [ ] Pagination or infinite scroll
- [ ] Loading state while fetching
- [ ] Accessibility: `<h1>` for title, `aria-live="polite"` for result count

### Task 9.6 — Empty State (2 pts, FE)
- [ ] Shows when search returns 0 results
- [ ] "No results found for '{query}'"
- [ ] 3 suggestion tips (different keywords, check spelling, more general terms)
- [ ] Accessibility: `role="status"`, `aria-live="polite"`

### Task 9.7 — Search Tests (3 pts, QA)
- [ ] Search accuracy: exact title match, partial match, description match
- [ ] Weighted ranking: title match ranks higher than description match
- [ ] Filter combinations: type + genre + year range
- [ ] Special characters: apostrophes, quotes, Unicode
- [ ] Empty results: no-match query returns empty with correct empty state
- [ ] Suggestions: partial title returns correct suggestions
- [ ] **Browser walkthrough** (AI-056): Search bar expand, type query, see suggestions, navigate to results, apply filters, verify empty state — all in real browser at localhost:1999

---

## 18. P0 Bug Fix: Video Player Not Reloading on ID Change (Task 9.8 — FE, 3 pts)

### Bug Description

**Reported by:** Boss
**Priority:** P0
**Symptom:** Click play on different videos → URL/ID changes but player always shows the same (first) video. Player doesn't reload.

### Root Cause Analysis

**File:** `webphim-fe/src/app/watch/[id]/page.tsx` (line ~86)

The `VideoPlayer` component is rendered **without a `key` prop**:

```tsx
<VideoPlayer
  streamUrl={streamUrl}
  title={content.title}
  contentId={contentId}
  // ... no key prop
>
```

When navigating from video A (`/watch/abc`) to video B (`/watch/xyz`):
1. React sees the same `VideoPlayer` component type in the same position
2. React **reuses the existing instance** (updates props, but does NOT remount)
3. The HLS player instance, internal refs (`seekedRef`, `hlsRef`), and DOM video element are reused
4. Even though `useVideoPlayer` has `streamUrl` in its useEffect dependency array, the race between HLS cleanup and re-initialization can cause stale state

**Secondary issues:**
- `seekedRef.current` in `VideoPlayer.tsx` (line ~43) persists as `true` across navigations → new video won't seek to its saved progress
- HLS instance cleanup/init may race when React batches updates

### Fix

**Primary fix — Add `key` prop to force remount:**

```tsx
// webphim-fe/src/app/watch/[id]/page.tsx
<VideoPlayer
  key={contentId}           // ← ADD THIS LINE
  streamUrl={streamUrl}
  title={content.title}
  contentId={contentId}
  thumbnailUrl={thumbnailUrl}
  onBack={handleBack}
>
```

Adding `key={contentId}` makes React treat each video as a completely new component instance. When contentId changes:
- Old `VideoPlayer` **unmounts** (HLS destroyed, all state cleared, refs reset)
- New `VideoPlayer` **mounts** fresh (new HLS instance, new state, new refs)
- No race conditions, no stale state

**No other changes needed.** The `useVideoPlayer` hook's cleanup logic is correct — it just wasn't getting triggered reliably without the remount.

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `webphim-fe/src/app/watch/[id]/page.tsx` | MODIFY | Add `key={contentId}` to `VideoPlayer` component |

### Test Plan

- [ ] Navigate from `/watch/A` to `/watch/B` → Player shows video B (not A)
- [ ] Navigate back to `/watch/A` → Player shows video A correctly
- [ ] Watch progress resumes correctly per video (seekedRef resets)
- [ ] HLS quality selector works on each new video
- [ ] No console errors during navigation
- [ ] Rapid navigation between 3+ videos doesn't crash or show stale video

### Acceptance Criteria

- [ ] Adding `key={contentId}` to `VideoPlayer` in `/watch/[id]/page.tsx`
- [ ] Player remounts on every video ID change
- [ ] Each video loads its own stream URL
- [ ] No stale video or audio from previous video
- [ ] Watch progress tracking works correctly per video
- [ ] Test written verifying remount behavior

---

## Architecture Doc Checklist (AI-011)

- [x] **Pinned dependency versions** (AI-002) — Section 1
- [x] **API contracts** (AI-007) — Section 4 (search + suggestions + filters)
- [x] **Port standard** (AI-003) — Section 2 (BE: 5001, FE: 1999)
- [x] **Test DB config** (AI-006/AI-028) — Section 5
- [x] **Component tree** (AI-005) — Section 6 (full hierarchy with props)
- [x] **Known gotchas** — Section 11 (memory + Sprint 9 specific, 10 items)
- [x] **CORS configuration** (AI-016) — Section 8 (already includes 1999)
- [x] **Validated query middleware pattern** (AI-020) — Section 9
- [x] **Seed data review** (AI-021) — Section 10
- [x] **Accessibility requirements** (AI-049) — Section 7 (SearchBar, Suggestions, Filters, Results, EmptyState)
- [x] **Infrastructure verification** (AI-050) — Section 16 (all checks documented with results)
