# Architecture Document: Sprint 5 — Homepage & Browse UI

**Author:** TL (Tech Lead)
**Date:** 2026-02-06
**Status:** PENDING PO REVIEW
**Sprint:** 5 (Homepage & Browse UI, 40pts, FE-only)
**Depends on:** Sprint 4 (Content APIs — COMPLETE)

---

## 1. Pinned Dependency Versions

### Existing (DO NOT UPGRADE)

| Package | Version | Notes |
|---------|---------|-------|
| next | 16.1.6 | App Router, Server Components |
| react | 19.2.3 | |
| tailwindcss | ^4 | CSS-first config via globals.css |
| framer-motion | ^12.33.0 | Animations, drag, hover |
| zustand | ^5.0.11 | Auth state |
| axios | ^1.13.4 | API client (client-side) |
| lucide-react | ^0.511.0 | Icons |
| clsx | ^2.1.1 | Conditional classes |

### New Packages for Sprint 5

| Package | Version | Purpose |
|---------|---------|---------|
| `swr` | ^2.3.3 | Client-side data fetching with caching, revalidation, and stale-while-revalidate |

**Why SWR over React Query/TanStack Query:**
- Lighter bundle (~4KB vs ~13KB) — Netflix-style apps prioritize load performance
- Simpler API — `useSWR(key, fetcher)` covers 90% of our use cases
- Built by Vercel (same team as Next.js) — excellent App Router compatibility
- Stale-while-revalidate is the perfect pattern for content catalogs (show cached data instantly, refresh in background)
- We don't need React Query's advanced features (mutations, optimistic updates) until Sprint 10

**No other new packages needed.** Framer Motion handles all animation requirements (drag carousels, hover expand, spring physics).

---

## 2. Port Configuration

| Service | Port | URL |
|---------|------|-----|
| FE (Next.js dev) | **3000** | `http://localhost:3000` |
| BE (Express) | **5001** | `http://localhost:5001` |
| PostgreSQL | 5432 | `postgresql://localhost:5432/webphim` |

**FE env:** `NEXT_PUBLIC_API_URL=http://localhost:5001/api`

**Note:** PO mentioned port 3001 for FE. Next.js defaults to 3000. If 3000 is in use, Next.js auto-picks 3001. Keep default 3000 unless there's a conflict. BE stays on 5001 (macOS AirPlay blocks 5000).

---

## 3. Data Fetching Strategy

### Decision: Hybrid (Server Components + SWR)

Sprint 5 has two page types with different data needs:

| Page | Strategy | Reason |
|------|----------|--------|
| `/home` (Homepage) | **Server Component** fetches initial data → passes as props to Client Components | SEO-friendly, fast initial load, no loading spinners on first paint |
| `/browse/[genre]` (Genre Browse) | **Client Component** with SWR | Needs infinite scroll/load more, user-triggered pagination, client-side state |

### 3.1 Server-Side Fetching (Homepage)

The homepage is a **Server Component** that fetches all content rows on the server. No SWR needed here — data is rendered on first paint.

```tsx
// src/app/(main)/home/page.tsx — Server Component (NO 'use client')
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function fetchContent(params: string) {
  const res = await fetch(`${API_BASE}/content?${params}`, {
    next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
  });
  if (!res.ok) return { data: [], meta: null };
  return res.json();
}

async function fetchFeatured() {
  const res = await fetch(`${API_BASE}/content/featured`, {
    cache: 'no-store', // Always fresh for hero banner
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export default async function HomePage() {
  const [featured, trending, newReleases, actionMovies, ...] = await Promise.all([
    fetchFeatured(),
    fetchContent('sort=views&limit=20'),
    fetchContent('sort=newest&limit=20'),
    fetchContent('genre=action&limit=20'),
    // ... more rows
  ]);

  return (
    <>
      <HeroBanner featured={featured} />
      <ContentRow title="Trending Now" items={trending.data} />
      <ContentRow title="New Releases" items={newReleases.data} />
      ...
    </>
  );
}
```

**Key points:**
- Uses native `fetch()` (NOT the axios client, which depends on Zustand/browser APIs)
- `next: { revalidate: 300 }` enables ISR — page rebuilds every 5 minutes
- `cache: 'no-store'` for featured content — always random/fresh
- `Promise.all` fetches all rows in parallel — fast server-side data loading

### 3.2 Client-Side Fetching with SWR (Genre Browse)

Genre browse needs client-side fetching for infinite scroll and load-more:

```tsx
// src/app/(main)/browse/[genre]/page.tsx — Client Component
'use client';

import useSWRInfinite from 'swr/infinite';
import api from '@/lib/api';

const fetcher = (url: string) => api.get(url).then(res => res.data);

const getKey = (pageIndex: number, previousPageData: any, genre: string) => {
  if (previousPageData && !previousPageData.data.length) return null; // reached end
  return `/content?genre=${genre}&page=${pageIndex + 1}&limit=20`;
};

export default function GenreBrowsePage({ params }: { params: { genre: string } }) {
  const { data, size, setSize, isLoading } = useSWRInfinite(
    (pageIndex, prevData) => getKey(pageIndex, prevData, params.genre),
    fetcher,
  );
  // ... render grid with load more
}
```

### 3.3 SWR Configuration

Create a global SWR config provider:

```tsx
// src/lib/swr-config.tsx
'use client';

import { SWRConfig } from 'swr';
import api from '@/lib/api';

const swrFetcher = (url: string) => api.get(url).then(res => res.data);

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{
      fetcher: swrFetcher,
      revalidateOnFocus: false,      // Don't refetch when tab gains focus
      dedupingInterval: 5000,        // Deduplicate requests within 5s
      errorRetryCount: 2,            // Retry failed requests 2 times
    }}>
      {children}
    </SWRConfig>
  );
}
```

Add `<SWRProvider>` in `src/app/(main)/layout.tsx` wrapping the MainLayout.

### 3.4 When to Use What

| Scenario | Use | Why |
|----------|-----|-----|
| Homepage initial data | Server Component + `fetch()` | Fast first paint, SEO, no loading spinner |
| Hero banner featured | Server `fetch()` with `cache: 'no-store'` | Always fresh random content |
| Content rows on homepage | Server `fetch()` with `revalidate: 300` | Cached for 5 min, rebuilt automatically |
| Genre browse (paginated) | SWR `useSWRInfinite` | Client-side infinite scroll, caching between navigations |
| Any future authenticated API | SWR + axios client | Needs auth token from Zustand store |

---

## 4. TypeScript Types (FE)

Add content-related types to `src/types/index.ts`:

```typescript
// ============================================
// Content Types (matching Sprint 4 API responses)
// ============================================

export type ContentType = 'MOVIE' | 'SERIES';
export type MaturityRating = 'G' | 'PG' | 'PG13' | 'R' | 'NC17';

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface GenreWithCount extends Genre {
  contentCount: number;
}

export interface ContentSummary {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  releaseYear: number;
  maturityRating: MaturityRating;
  duration: number | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  viewCount: number;
  genres: Genre[];
}

export interface CastMember {
  id: string;
  name: string;
  role: 'ACTOR' | 'DIRECTOR' | 'WRITER';
  character: string | null;
  photoUrl: string | null;
}

export interface EpisodeSummary {
  id: string;
  episodeNumber: number;
  title: string;
  description: string | null;
  duration: number;
  thumbnailUrl: string | null;
}

export interface SeasonDetail {
  id: string;
  seasonNumber: number;
  title: string | null;
  episodes: EpisodeSummary[];
}

export interface ContentDetail extends ContentSummary {
  trailerUrl: string | null;
  cast: CastMember[];
  seasons?: SeasonDetail[];
}

export interface FeaturedContent {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  releaseYear: number;
  maturityRating: MaturityRating;
  duration: number | null;
  bannerUrl: string | null;
  trailerUrl: string | null;
  genres: Genre[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ContentListResponse {
  success: true;
  data: ContentSummary[];
  meta: PaginationMeta;
}

export interface FeaturedResponse {
  success: true;
  data: FeaturedContent;
}

export interface GenreListResponse {
  success: true;
  data: GenreWithCount[];
}
```

---

## 5. Component Tree

### 5.1 File Structure

```
src/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx                # UPDATE: add SWRProvider
│   │   ├── home/
│   │   │   └── page.tsx              # REWRITE: Server Component, fetch + render rows
│   │   └── browse/
│   │       └── [genre]/
│   │           └── page.tsx          # NEW: Genre browse with infinite scroll (Task 5.6, 5.7)
│   └── ... (existing)
│
├── components/
│   ├── home/                          # Sprint 5 — Homepage components
│   │   ├── HeroBanner.tsx             # Task 5.1: Featured content hero
│   │   ├── ContentRow.tsx             # Task 5.2: Horizontal carousel row
│   │   └── MovieCard.tsx              # Task 5.3: Poster card with hover expand
│   │
│   ├── browse/                        # Sprint 5 — Browse page components
│   │   └── ContentGrid.tsx            # Task 5.6: Grid layout for genre browse
│   │
│   ├── skeleton/                      # Task 5.5: Loading skeletons
│   │   ├── HeroBannerSkeleton.tsx
│   │   ├── ContentRowSkeleton.tsx
│   │   └── MovieCardSkeleton.tsx
│   │
│   ├── landing/                       # Existing (Sprint 3)
│   ├── layout/                        # Existing (Sprint 3)
│   └── ui/                            # Existing
│
├── hooks/
│   ├── useScrollPosition.ts           # Existing
│   └── useIntersectionObserver.ts     # NEW: For infinite scroll trigger
│
├── lib/
│   ├── api.ts                         # Existing (client-side axios)
│   ├── swr-config.tsx                 # NEW: Global SWR configuration
│   └── fetchers.ts                    # NEW: Server-side fetch helpers
│
└── types/
    └── index.ts                       # UPDATE: Add content types
```

### 5.2 Component Tree Diagram

```
MainLayout (layout/MainLayout.tsx)
│
├── HomePage (/home) — SERVER COMPONENT
│   │
│   ├── HeroBanner (client component)
│   │   ├── BackgroundImage (bannerUrl, full viewport)
│   │   ├── GradientOverlay (top + bottom gradients)
│   │   ├── ContentInfo
│   │   │   ├── MaturityBadge (PG13, R, etc.)
│   │   │   ├── Title (h1, large bold text)
│   │   │   ├── Description (truncated to 2-3 lines)
│   │   │   ├── PlayButton (white bg, black text, ▶ icon)
│   │   │   └── MoreInfoButton (gray bg, ⓘ icon)
│   │   ├── RotationDots (indicator dots for multi-featured)
│   │   └── Auto-rotate timer (8s interval, pause on hover)
│   │
│   ├── ContentRow (×6+ rows, client component)
│   │   ├── RowTitle ("Trending Now", "New Releases", etc.)
│   │   ├── ScrollContainer (Framer Motion drag, overflow-hidden)
│   │   │   ├── MovieCard (×N per row)
│   │   │   │   ├── PosterImage (thumbnailUrl, aspect-ratio 2:3)
│   │   │   │   └── HoverOverlay (expanded, shown on hover with 300ms delay)
│   │   │   │       ├── PreviewImage (same thumbnail, scaled up)
│   │   │   │       ├── ActionButtons row
│   │   │   │       │   ├── PlayButton (circle, ▶)
│   │   │   │       │   ├── AddToListButton (circle, +)
│   │   │   │       │   └── MoreInfoButton (circle, ˅)
│   │   │   │       ├── Title (small text)
│   │   │   │       ├── MetaInfo (year, maturity, duration)
│   │   │   │       └── GenreTags (dot-separated)
│   │   │   └── ... more cards
│   │   ├── LeftArrow (shown on hover over row, absolute positioned)
│   │   └── RightArrow (shown on hover over row, absolute positioned)
│   │
│   └── (Rows: Trending, New Releases, Action, Comedy, Drama, Top Rated)
│
└── GenreBrowsePage (/browse/[genre]) — CLIENT COMPONENT
    ├── PageTitle (genre name, e.g. "Action Movies")
    ├── ContentGrid
    │   ├── MovieCard (×N, grid layout)
    │   └── ... cards in responsive grid
    ├── LoadMoreTrigger (intersection observer sentinel)
    └── LoadingSpinner (shown while fetching next page)
```

### 5.3 Component Specifications

#### HeroBanner (Task 5.1) — `'use client'`

**Props:**
```typescript
interface HeroBannerProps {
  featured: FeaturedContent | null;
}
```

**Behavior:**
- Full viewport height on initial render, `h-[85vh]` (leave space for first content row peek)
- Background: `bannerUrl` as `<Image>` with `fill` + `object-cover`, or gradient fallback if null
- Gradient overlay: `bg-gradient-to-b from-transparent via-transparent to-netflix-black` + `bg-gradient-to-r from-black/80 via-black/40 to-transparent`
- Content info positioned bottom-left: title (text-5xl), description (max 3 lines, line-clamp-3), buttons
- Play button: `bg-white text-black font-bold px-8 py-2 rounded`
- More Info button: `bg-netflix-gray/60 text-white px-8 py-2 rounded`
- **Auto-rotate:** If multiple featured items (future), rotate every 8s. For now, single item is fine.
- **Animation:** Fade-in on mount (Framer Motion, opacity 0→1, duration 0.5s)

#### ContentRow (Task 5.2) — `'use client'`

**Props:**
```typescript
interface ContentRowProps {
  title: string;
  items: ContentSummary[];
}
```

**Behavior:**
- Title: `text-xl font-bold text-white mb-2 px-4 md:px-12`
- Container: `overflow-hidden` (NOT `overflow-x-auto` — we control scroll with Framer Motion drag)
- Inner scroll: Framer Motion `<motion.div drag="x">` with constraints
  - `dragConstraints`: calculated from container width vs content width
  - `dragElastic={0.1}` — slight overscroll resistance
  - `dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}`
- **Cards layout:** `flex gap-1` with each card having fixed width
- **Peek effect:** First/last cards partially visible at edges (use `px-4 md:px-12` on container, `-mx-4 md:-mx-12` on scroll inner)
- **Arrow buttons:** Absolute positioned left/right, visible on row hover (`group-hover:opacity-100`), `z-10`
  - Left arrow: `<ChevronLeft>`, slides content right by row width
  - Right arrow: `<ChevronRight>`, slides content left by row width
  - Hidden when at start/end of scroll
- **Responsive card count:**
  - Mobile: ~2.5 visible
  - Tablet (md): ~4.5 visible
  - Desktop (lg): ~6.5 visible
  - The `.5` creates the "peek" effect

#### MovieCard (Task 5.3) — `'use client'`

**Props:**
```typescript
interface MovieCardProps {
  item: ContentSummary;
  index?: number;  // for stagger animation
}
```

**Behavior:**
- **Default state:** Poster thumbnail only (`thumbnailUrl`), aspect-ratio 2:3, rounded-sm
- **Hover expand:** Scale to 1.3x after 300ms delay
  - Use `onHoverStart` with `setTimeout(300ms)` to set `isHovered`
  - `onHoverEnd` cancels timeout and clears `isHovered`
  - Animation: `motion.div` with `animate={{ scale: isHovered ? 1.3 : 1 }}`
  - `transition={{ type: 'spring', stiffness: 300, damping: 25 }}`
  - `z-index: 50` when hovered (above other cards)
- **Hover overlay:** Shown below expanded poster when hovered
  - Background: `bg-netflix-dark rounded-b shadow-lg`
  - Action buttons row: Play (circle, filled white), Add to List (circle, outline), More Info (circle, outline with chevron-down)
  - Title: truncated single line
  - Meta: `releaseYear • maturityRating • duration` (dot-separated)
  - Genre tags: first 3 genres, dot-separated
- **Image:** Use Next.js `<Image>` with `fill` + `sizes` for responsive loading
- **Fallback:** Gray placeholder if `thumbnailUrl` is null

#### ContentGrid (Task 5.6) — Used in Genre Browse

**Props:**
```typescript
interface ContentGridProps {
  items: ContentSummary[];
}
```

**Behavior:**
- CSS Grid: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2`
- Each cell renders a `<MovieCard>` (reused from 5.3, but without the carousel context)
- Cards in grid use simpler hover — scale 1.05x (not 1.3x, since grid has no horizontal overflow space)

#### Loading Skeletons (Task 5.5)

**HeroBannerSkeleton:**
- Full `h-[85vh]` div with `animate-pulse bg-netflix-dark`
- Fake title bar (h-8 w-1/3), description bars (h-4 w-1/2), button bars

**ContentRowSkeleton:**
- Title bar + row of 6 skeleton cards
- Each card: `aspect-[2/3] rounded-sm bg-netflix-dark animate-pulse`

**MovieCardSkeleton:**
- Single card placeholder: `aspect-[2/3] rounded-sm bg-netflix-dark animate-pulse`

#### useIntersectionObserver Hook (Task 5.7)

```typescript
// src/hooks/useIntersectionObserver.ts
export function useIntersectionObserver(
  callback: () => void,
  options?: IntersectionObserverInit
): React.RefObject<HTMLDivElement>;
```

- Returns a ref to attach to sentinel element at bottom of content grid
- When sentinel enters viewport, triggers callback (fetch next page)
- Used in Genre Browse for infinite scroll

---

## 6. API Integration Patterns

### 6.1 Server-Side Fetch Helpers

Create reusable fetch functions for Server Components:

```typescript
// src/lib/fetchers.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export async function fetchFromAPI<T>(
  path: string,
  options?: { revalidate?: number | false; cache?: RequestCache }
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: options?.revalidate !== undefined
        ? { revalidate: options.revalidate }
        : { revalidate: 300 },
      cache: options?.cache,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}
```

### 6.2 Homepage API Calls (Server-Side)

| Row | API Call | Cache Strategy |
|-----|----------|---------------|
| Hero Banner | `GET /api/content/featured` | `cache: 'no-store'` (always fresh) |
| Trending Now | `GET /api/content?sort=views&limit=20` | `revalidate: 300` (5 min) |
| New Releases | `GET /api/content?sort=newest&limit=20` | `revalidate: 300` |
| Action | `GET /api/content?genre=action&limit=20` | `revalidate: 300` |
| Comedy | `GET /api/content?genre=comedy&limit=20` | `revalidate: 300` |
| Drama | `GET /api/content?genre=drama&limit=20` | `revalidate: 300` |
| Top Rated | `GET /api/content?sort=views&limit=20` | `revalidate: 300` |

**All fetched in parallel with `Promise.all` in the Server Component.**

### 6.3 Genre Browse API Calls (Client-Side with SWR)

| Action | API Call | SWR Hook |
|--------|----------|----------|
| Initial load | `GET /api/content?genre={slug}&page=1&limit=20` | `useSWRInfinite` |
| Load more | `GET /api/content?genre={slug}&page={N}&limit=20` | `setSize(size + 1)` |
| Genre info | `GET /api/genres` | `useSWR('/genres')` (for page title resolution) |

### 6.4 Genre Slug Resolution

The genre browse page route is `/browse/[genre]` where `[genre]` is the slug (e.g., `action`, `comedy`). To display the genre name in the page title, fetch from `/api/genres` and find by slug.

---

## 7. Routing Updates

### New Routes

| Route | Component | Type | Description |
|-------|-----------|------|-------------|
| `/home` | `app/(main)/home/page.tsx` | Server | Homepage with hero + content rows |
| `/browse/[genre]` | `app/(main)/browse/[genre]/page.tsx` | Client | Genre browse with infinite scroll |

### Navigation Integration

AuthNavbar links (already implemented in Sprint 3):
- "Home" → `/home`
- "Series" → `/browse/series` (needs handling — this is a content type, not genre)
- "Movies" → `/browse/movies` (same)
- "My List" → `/browse/my-list` (Sprint 10)

**Important:** The current nav links "Series" and "Movies" filter by **content type**, not genre. The genre browse page filters by genre slug. We need to handle both:
- `/browse/[genre]` where genre is a slug like `action`, `comedy`
- For "Series"/"Movies" nav links, use query param: `/browse/series` and `/browse/movies`

**Implementation:** In the `[genre]/page.tsx`, detect if the param is a content type (`MOVIE`/`SERIES`) or a genre slug, and call the appropriate API filter:
```typescript
const isContentType = ['movies', 'series'].includes(params.genre);
const apiUrl = isContentType
  ? `/content?type=${params.genre === 'movies' ? 'MOVIE' : 'SERIES'}&page=${page}&limit=20`
  : `/content?genre=${params.genre}&page=${page}&limit=20`;
```

---

## 8. Image Strategy

### Next.js Image Optimization

All content images use `<Image>` from `next/image`:

```tsx
<Image
  src={item.thumbnailUrl || '/images/placeholder-poster.svg'}
  alt={item.title}
  fill
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
  className="object-cover"
/>
```

**Key settings:**
- `fill` + parent `relative` container for responsive sizing
- `sizes` attribute for responsive srcset (saves bandwidth on mobile)
- Placeholder fallback SVG for null thumbnailUrl
- `loading="lazy"` is default for images below the fold

### Image Placeholders

Since seed data uses placeholder URLs (`/images/content/...`), FE should gracefully handle missing images:

```tsx
// Placeholder component for missing images
<div className="flex h-full w-full items-center justify-center bg-netflix-dark">
  <span className="text-netflix-mid-gray text-sm">{title}</span>
</div>
```

Create one generic placeholder:
```
public/images/placeholder-poster.svg    # Gray poster placeholder with film icon
public/images/placeholder-banner.svg    # Wide banner placeholder
```

---

## 9. Animation Specifications

### MovieCard Hover (Framer Motion)

```tsx
// Timing
const HOVER_DELAY = 300;   // ms before expand triggers
const SCALE_AMOUNT = 1.3;  // scale factor

// Spring config for expand
const springConfig = { type: 'spring', stiffness: 300, damping: 25 };

// Implementation pattern
const [isHovered, setIsHovered] = useState(false);
const hoverTimeout = useRef<NodeJS.Timeout>();

const handleHoverStart = () => {
  hoverTimeout.current = setTimeout(() => setIsHovered(true), HOVER_DELAY);
};

const handleHoverEnd = () => {
  clearTimeout(hoverTimeout.current);
  setIsHovered(false);
};
```

### ContentRow Drag (Framer Motion)

```tsx
// Drag constraints calculated from content width
const [containerWidth, setContainerWidth] = useState(0);
const contentWidth = items.length * (cardWidth + gap);
const maxDrag = -(contentWidth - containerWidth);

<motion.div
  drag="x"
  dragConstraints={{ left: maxDrag, right: 0 }}
  dragElastic={0.1}
  dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
/>
```

### Hero Banner Fade-In

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
/>
```

---

## 10. Known Gotchas

### From MEMORY.md (Still Relevant)

| Issue | Impact on Sprint 5 |
|-------|-------------------|
| Port 5000 blocked by macOS AirPlay | BE stays on 5001. FE env: `NEXT_PUBLIC_API_URL=http://localhost:5001/api` |
| Express 5 read-only req.query | N/A for FE (BE only) |
| Prisma 7 adapter pattern | N/A for FE (BE only) |

### Sprint 5 Specific Gotchas

1. **Server Components cannot use hooks or browser APIs.** The homepage `page.tsx` must be a Server Component (no `'use client'`). All interactive elements (HeroBanner, ContentRow, MovieCard) must be separate Client Components receiving data via props.

2. **`fetch()` in Server Components vs `axios` in Client Components.** Server Components use native `fetch()` with `next: { revalidate }` for caching. Client Components use the existing `axios` instance (which has auth interceptors). Do NOT import `axios` in Server Components — it won't work.

3. **Framer Motion requires `'use client'`.** Any component using `motion.*` or `AnimatePresence` must have `'use client'` directive. This is already the case for Sprint 3 components.

4. **Image `fill` requires parent `position: relative`.** When using `<Image fill>`, the parent must have `relative` or `absolute` positioning. Common mistake that causes images to fill the entire page.

5. **Infinite scroll sentinel placement.** The intersection observer sentinel must be placed AFTER the content grid, not inside it. If placed inside, grid layout may prevent it from entering the viewport.

6. **SWR `useSWRInfinite` key function.** The key function must return `null` to stop fetching. If the API returns an empty `data` array, return `null` for the next key to prevent infinite requests.

7. **Content type vs genre in browse route.** `/browse/series` and `/browse/movies` are content types, not genres. The `[genre]` route handler must detect this and use the `type` query param instead of `genre`. See Section 7 for implementation.

8. **`next/image` with external URLs.** If thumbnailUrl points to an external domain in the future, `next.config.ts` needs `images.remotePatterns` configured. For now, all URLs are local paths — no config needed.

---

## 11. Responsive Breakpoints

Consistent with Sprint 3, using Tailwind default breakpoints:

| Breakpoint | Width | Cards per Row | Grid Cols (Browse) |
|------------|-------|--------------|-------------------|
| Default (mobile) | < 640px | ~2.5 | 2 |
| `sm` | 640px | ~3.5 | 3 |
| `md` | 768px | ~4.5 | 4 |
| `lg` | 1024px | ~5.5 | 5 |
| `xl` | 1280px | ~6.5 | 6 |

---

## 12. Acceptance Criteria

### Sprint 5 — Definition of Done

- [ ] Hero Banner renders featured content with background image, gradient, title, description, Play + More Info buttons
- [ ] Hero Banner handles null/missing data gracefully (fallback UI)
- [ ] Content Rows render horizontally with Framer Motion drag scrolling
- [ ] Left/right arrows appear on row hover and scroll content
- [ ] Movie Cards show poster thumbnail, expand 1.3x on hover after 300ms delay
- [ ] Hover overlay shows action buttons, title, meta info, genre tags
- [ ] Homepage fetches data from BE API (server-side) and renders 6+ content rows
- [ ] Loading skeletons show during data loading (hero, rows, cards)
- [ ] Genre browse page renders at `/browse/[genre]` with content grid
- [ ] Infinite scroll / load more works on genre browse page
- [ ] `/browse/movies` and `/browse/series` correctly filter by content type
- [ ] All images use Next.js `<Image>` with proper `sizes` and fallback
- [ ] Responsive design: mobile (2 cols), tablet (4 cols), desktop (6 cols)
- [ ] No TypeScript errors, ESLint clean, builds successfully
- [ ] BE server must be running on port 5001 for homepage to render data
