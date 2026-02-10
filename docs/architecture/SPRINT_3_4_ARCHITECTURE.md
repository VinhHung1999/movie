# Architecture Document: Sprint 3 + Sprint 4 (Parallel)

**Author:** TL (Tech Lead)
**Date:** 2026-02-06
**Status:** PENDING PO REVIEW
**Sprints:** Sprint 3 (Landing Page & Layout, 34pts, FE) + Sprint 4 (DB Schema & Content API, 41pts, BE+QA)

---

## 1. Pinned Dependency Versions

### Existing (DO NOT UPGRADE)

| Package | FE Version | BE Version | Notes |
|---------|-----------|-----------|-------|
| next | 16.1.6 | - | App Router |
| react | 19.2.3 | - | |
| tailwindcss | ^4 | - | CSS-first config via `globals.css` |
| framer-motion | ^12.33.0 | - | Animations |
| zustand | ^5.0.11 | - | State management |
| axios | ^1.13.4 | - | API client |
| express | - | ^5.2.1 | Express 5 (read-only req.query/params!) |
| @prisma/client | - | ^7.3.0 | Prisma 7 (needs adapter-pg) |
| @prisma/adapter-pg | - | ^7.3.0 | PostgreSQL adapter |
| zod | - | ^4.3.6 | Validation (no AnyZodObject, use .issues) |
| vitest | - | ^4.0.18 | Test runner |
| supertest | - | ^7.2.2 | HTTP testing |

### New Packages for Sprint 3 (FE)

| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | ^0.511.0 | Icon library (Search, Bell, Menu, ChevronDown, X, Globe) |
| `clsx` | ^2.1.1 | Conditional CSS class utility |

**No other new packages needed.** Framer Motion already covers accordion animations, scroll effects, and hover transitions.

### New Packages for Sprint 4 (BE)

**No new packages needed.** Prisma, Zod, and existing stack cover all Sprint 4 requirements. Full-text search uses raw PostgreSQL (Prisma `$queryRaw`).

---

## 2. Port Configuration

| Service | Port | URL |
|---------|------|-----|
| FE (Next.js dev) | 3000 | `http://localhost:3000` |
| BE (Express) | **5001** | `http://localhost:5001` |
| PostgreSQL | 5432 | `postgresql://localhost:5432/webphim` |

**Reminder:** Port 5000 is blocked by macOS AirPlay. Always use 5001.

---

## 3. Sprint 3 — Component Tree (FE)

### 3.1 File Structure

```
src/
├── app/
│   ├── globals.css              # UPDATE: add Netflix font (Inter via next/font)
│   ├── layout.tsx               # Root layout (keep as-is)
│   ├── page.tsx                 # REWRITE: Full Netflix landing page
│   ├── (auth)/                  # Existing auth pages (no changes)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── (main)/
│       ├── layout.tsx           # UPDATE: wrap with MainLayout component
│       └── home/page.tsx        # Existing (Sprint 5 will enhance)
│
├── components/
│   ├── landing/                 # Sprint 3 — Landing page components
│   │   ├── Hero.tsx             # Task 3.2
│   │   ├── FeatureSection.tsx   # Task 3.3
│   │   └── FAQ.tsx              # Task 3.4
│   │
│   ├── layout/                  # Sprint 3 — Layout components
│   │   ├── GuestNavbar.tsx      # Task 3.5
│   │   ├── AuthNavbar.tsx       # Task 3.6
│   │   ├── MobileDrawer.tsx     # Task 3.8
│   │   ├── Footer.tsx           # Task 3.7
│   │   └── MainLayout.tsx       # Task 3.9
│   │
│   └── ui/                      # Shared UI primitives
│       └── Accordion.tsx        # Reusable accordion (used by FAQ)
│
├── hooks/
│   └── useScrollPosition.ts     # For navbar transparent→solid transition
│
├── store/
│   └── auth.store.ts            # Existing (no changes)
│
├── lib/
│   └── api.ts                   # Existing (no changes)
│
└── types/
    └── index.ts                 # Existing (no changes)
```

### 3.2 Component Tree Diagram

```
RootLayout (layout.tsx)
│
├── Landing Page (page.tsx) — route: /
│   ├── GuestNavbar
│   │   ├── Logo (img)
│   │   └── SignInButton (link → /login)
│   ├── Hero
│   │   ├── BackgroundImage + GradientOverlay
│   │   ├── Headline ("Unlimited movies, TV shows, and more")
│   │   ├── Subheadline
│   │   ├── EmailCapture (input + CTA button "Get Started >")
│   │   └── Framer Motion fade-in animation
│   ├── FeatureSection (×4, alternating layout)
│   │   ├── TextBlock (title + description)
│   │   └── MediaBlock (image/video)
│   ├── FAQ
│   │   ├── SectionTitle ("Frequently Asked Questions")
│   │   ├── Accordion (×6-8 items)
│   │   │   └── AccordionItem (question + animated answer)
│   │   └── EmailCapture (repeated CTA)
│   └── Footer
│       ├── ContactLink
│       ├── LinksGrid (4 columns)
│       ├── LanguageSelector (Globe icon + dropdown)
│       └── Copyright
│
├── Auth Pages (auth group) — routes: /login, /signup
│   └── (existing, no changes)
│
└── Main App (main group) — routes: /home, /browse, etc.
    └── MainLayout
        ├── AuthNavbar
        │   ├── Logo (link → /home)
        │   ├── NavLinks (Home, Series, Movies, My List)
        │   ├── SearchIcon
        │   ├── NotificationBell
        │   ├── ProfileDropdown
        │   │   ├── Avatar
        │   │   ├── ProfileName
        │   │   └── Menu (Account, Sign Out)
        │   └── MobileDrawer (hamburger, <md breakpoint)
        │       ├── HamburgerButton
        │       ├── SlideOutPanel (Framer Motion)
        │       │   ├── CloseButton
        │       │   ├── NavLinks (vertical)
        │       │   └── ProfileSection
        │       └── Backdrop (click to close)
        ├── {children} (page content)
        └── Footer
```

### 3.3 Component Specifications

#### GuestNavbar (Task 3.5)
- **Position:** `fixed top-0`, `z-50`
- **Background:** transparent (no scroll state needed on landing)
- **Content:** Logo (left) + "Sign In" button (right, Netflix red)
- **Responsive:** Logo scales down on mobile

#### AuthNavbar (Task 3.6)
- **Position:** `fixed top-0`, `z-50`
- **Background:** transparent → `bg-netflix-black` on scroll (use `useScrollPosition` hook, threshold: 50px)
- **Transition:** `transition-colors duration-300`
- **Left:** Logo + NavLinks (hidden on mobile)
- **Right:** Search icon + Bell icon + Profile dropdown
- **Profile Dropdown:** Click to toggle, shows avatar + name + menu items
- **Mobile (<md):** Hamburger replaces NavLinks, opens MobileDrawer

#### Hero (Task 3.2)
- **Background:** Full viewport height (`h-screen`), background image with `bg-cover bg-center`
- **Overlay:** Linear gradient from black (top 20%), transparent (middle), black (bottom 40%)
- **Content:** Centered, max-w-3xl
- **Animation:** Framer Motion `fadeInUp` on mount (opacity 0→1, y 30→0, duration 0.8s)
- **EmailCapture:** Input (email) + Button "Get Started >" in a flex row

#### FeatureSection (Task 3.3)
- **Layout:** Alternating `flex-row` / `flex-row-reverse` (use index % 2)
- **Sections (4 total):**
  1. "Enjoy on your TV" — TV image
  2. "Download your shows" — Phone image
  3. "Watch everywhere" — Multi-device image
  4. "Create profiles for kids" — Kids UI image
- **Images:** Use placeholder images (public/images/landing/), static assets
- **Responsive:** Stack vertically on mobile (`flex-col`)

#### FAQ (Task 3.4)
- **Accordion:** Reusable `<Accordion>` component
- **Animation:** Framer Motion `AnimatePresence` + `motion.div` height auto (use `layout` prop)
- **Behavior:** Only one item open at a time (controlled state)
- **Styling:** Dark gray background per item, white text, + icon rotates to × on open

#### Footer (Task 3.7)
- **Layout:** Max-width container, 4-column grid of links
- **Links:** Questions? Contact us, FAQ, Help Center, Account, etc.
- **Language selector:** Globe icon + dropdown (visual only for now)
- **Copyright:** Bottom text with year

#### MobileDrawer (Task 3.8)
- **Trigger:** Hamburger icon (visible below `md` breakpoint)
- **Panel:** Slides in from right (`translateX` animation via Framer Motion)
- **Backdrop:** Semi-transparent black overlay, click to close
- **Content:** Nav links (vertical list) + profile section
- **Body scroll lock:** Add `overflow-hidden` to body when open

#### MainLayout (Task 3.9)
- **Structure:** `AuthNavbar` + `<main className="pt-16 min-h-screen">` + `Footer`
- **Usage:** Wrap `(main)/layout.tsx` children
- **Client component** (needs auth state for navbar)

### 3.4 Dark Theme Config (Task 3.1)

The Netflix color palette is already defined in `globals.css`. Additional updates:

```css
/* In globals.css - ADD to existing @theme */
@theme inline {
  /* Existing colors - keep as-is */
  --color-netflix-red: #E50914;
  --color-netflix-red-hover: #F40612;
  --color-netflix-black: #141414;
  --color-netflix-dark: #181818;
  --color-netflix-gray: #2F2F2F;
  --color-netflix-light-gray: #808080;
  --color-netflix-white: #E5E5E5;

  /* ADD these for Sprint 3 */
  --color-netflix-dark-gray: #303030;
  --color-netflix-mid-gray: #6D6D6E;
  --color-netflix-border: #333;
}
```

**Font:** Use `next/font/google` to load Inter in root layout:
```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
// Apply to <body className={inter.className}>
```

### 3.5 Static Assets

FE needs placeholder images for landing page. Create folder:
```
public/images/landing/
├── hero-bg.jpg          # Dark cinematic background (1920x1080)
├── tv.png               # TV feature section
├── mobile.jpg           # Download feature section
├── device-pile.png      # Watch everywhere section
├── kids.png             # Kids profile section
└── logo.png             # WebPhim logo (if not already present)
```

**Note:** Use royalty-free stock images or create simple dark gradient placeholders. Do NOT use Netflix copyrighted images.

---

## 4. Sprint 4 — Database Schema (BE)

### 4.1 Prisma Schema Extensions

Add to `prisma/schema.prisma`:

```prisma
// ============================================
// CONTENT
// ============================================

enum ContentType {
  MOVIE
  SERIES
}

enum MaturityRating {
  G
  PG
  PG13
  R
  NC17
}

model Content {
  id              String         @id @default(uuid())
  type            ContentType
  title           String
  description     String
  releaseYear     Int            @map("release_year")
  maturityRating  MaturityRating @default(PG13) @map("maturity_rating")
  duration        Int?           // minutes, null for series
  thumbnailUrl    String?        @map("thumbnail_url")
  bannerUrl       String?        @map("banner_url")
  trailerUrl      String?        @map("trailer_url")
  viewCount       Int            @default(0) @map("view_count")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  // Relations
  seasons         Season[]
  contentGenres   ContentGenre[]
  contentCast     ContentCastCrew[]
  watchHistory    WatchHistory[]
  watchlist       Watchlist[]
  ratings         Rating[]

  @@index([type])
  @@index([releaseYear])
  @@map("content")
}

// ============================================
// SERIES STRUCTURE
// ============================================

model Season {
  id            String   @id @default(uuid())
  contentId     String   @map("content_id")
  seasonNumber  Int      @map("season_number")
  title         String?
  createdAt     DateTime @default(now()) @map("created_at")

  content       Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)
  episodes      Episode[]

  @@unique([contentId, seasonNumber])
  @@map("seasons")
}

model Episode {
  id             String   @id @default(uuid())
  seasonId       String   @map("season_id")
  episodeNumber  Int      @map("episode_number")
  title          String
  description    String?
  duration       Int      // minutes
  videoUrl       String?  @map("video_url")
  thumbnailUrl   String?  @map("thumbnail_url")
  createdAt      DateTime @default(now()) @map("created_at")

  season         Season   @relation(fields: [seasonId], references: [id], onDelete: Cascade)

  @@unique([seasonId, episodeNumber])
  @@map("episodes")
}

// ============================================
// GENRES (Many-to-Many)
// ============================================

model Genre {
  id            String         @id @default(uuid())
  name          String         @unique
  slug          String         @unique
  createdAt     DateTime       @default(now()) @map("created_at")

  contentGenres ContentGenre[]

  @@map("genres")
}

model ContentGenre {
  contentId String  @map("content_id")
  genreId   String  @map("genre_id")

  content   Content @relation(fields: [contentId], references: [id], onDelete: Cascade)
  genre     Genre   @relation(fields: [genreId], references: [id], onDelete: Cascade)

  @@id([contentId, genreId])
  @@map("content_genres")
}

// ============================================
// CAST & CREW
// ============================================

enum CastRole {
  ACTOR
  DIRECTOR
  WRITER
}

model CastCrew {
  id          String            @id @default(uuid())
  name        String
  photoUrl    String?           @map("photo_url")
  createdAt   DateTime          @default(now()) @map("created_at")

  contentCast ContentCastCrew[]

  @@map("cast_crew")
}

model ContentCastCrew {
  contentId   String   @map("content_id")
  castCrewId  String   @map("cast_crew_id")
  role        CastRole
  character   String?  // character name (for actors)
  displayOrder Int     @default(0) @map("display_order")

  content     Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)
  castCrew    CastCrew @relation(fields: [castCrewId], references: [id], onDelete: Cascade)

  @@id([contentId, castCrewId, role])
  @@map("content_cast_crew")
}

// ============================================
// USER INTERACTIONS
// ============================================

model WatchHistory {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  contentId  String   @map("content_id")
  episodeId  String?  @map("episode_id") // null for movies
  progress   Int      @default(0)        // seconds watched
  duration   Int      @default(0)        // total duration in seconds
  watchedAt  DateTime @default(now()) @map("watched_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  content    Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)

  @@unique([userId, contentId, episodeId])
  @@index([userId])
  @@map("watch_history")
}

model Watchlist {
  userId    String   @map("user_id")
  contentId String   @map("content_id")
  addedAt   DateTime @default(now()) @map("added_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  content   Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)

  @@id([userId, contentId])
  @@map("watchlist")
}

model Rating {
  userId    String   @map("user_id")
  contentId String   @map("content_id")
  score     Int      // 1-5
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  content   Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)

  @@id([userId, contentId])
  @@map("ratings")
}
```

**Update User model** — add relations:
```prisma
model User {
  // ... existing fields ...
  watchHistory  WatchHistory[]
  watchlist     Watchlist[]
  ratings       Rating[]
}
```

### 4.2 Full-text Search (Task 4.6)

Prisma does not natively support `tsvector`. Use a **raw SQL migration** after Prisma migration:

```sql
-- Add tsvector column
ALTER TABLE content ADD COLUMN search_vector tsvector;

-- Create GIN index
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

**Implementation pattern for search queries:**
```typescript
// In content.service.ts
const results = await prisma.$queryRaw`
  SELECT id, title, description, ts_rank(search_vector, query) AS rank
  FROM content, plainto_tsquery('english', ${searchTerm}) query
  WHERE search_vector @@ query
  ORDER BY rank DESC
  LIMIT ${limit} OFFSET ${offset}
`;
```

### 4.3 Migration Strategy

1. Run `npx prisma migrate dev --name add_content_schema` for the Prisma schema changes
2. Create a separate raw SQL migration file for the tsvector column, index, and trigger
3. Run the raw SQL via `npx prisma migrate dev --name add_fulltext_search --create-only` then edit the migration file

---

## 5. Sprint 4 — API Contracts

### Base Response Format (existing)

```typescript
// Success
{ "success": true, "data": T, "meta"?: { pagination } }

// Error
{ "success": false, "message": string, "errors"?: [{ field, message }] }

// Pagination meta
{ "page": number, "limit": number, "total": number, "totalPages": number }
```

### 5.1 GET /api/content (Task 4.8)

List content with filtering, sorting, and pagination.

**Request:**
```
GET /api/content?page=1&limit=20&type=MOVIE&genre=action&sort=newest
```

| Query Param | Type | Default | Values |
|-------------|------|---------|--------|
| `page` | number | 1 | >= 1 |
| `limit` | number | 20 | 1-50 |
| `type` | string | - | `MOVIE`, `SERIES` |
| `genre` | string | - | genre slug (e.g., `action`, `comedy`) |
| `sort` | string | `newest` | `newest`, `oldest`, `rating`, `views`, `title` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "MOVIE",
      "title": "Inception",
      "description": "A thief who steals...",
      "releaseYear": 2010,
      "maturityRating": "PG13",
      "duration": 148,
      "thumbnailUrl": "/images/inception-thumb.jpg",
      "bannerUrl": "/images/inception-banner.jpg",
      "viewCount": 15420,
      "genres": [
        { "id": "uuid", "name": "Action", "slug": "action" },
        { "id": "uuid", "name": "Sci-Fi", "slug": "sci-fi" }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Validation schema (Zod):**
```typescript
const contentListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    type: z.enum(['MOVIE', 'SERIES']).optional(),
    genre: z.string().optional(),
    sort: z.enum(['newest', 'oldest', 'rating', 'views', 'title']).default('newest'),
  }),
});
```

### 5.2 GET /api/content/:id (Task 4.9)

Content detail with genres, cast, and episodes (if series).

**Request:**
```
GET /api/content/uuid-here
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "SERIES",
    "title": "Breaking Bad",
    "description": "A high school chemistry teacher...",
    "releaseYear": 2008,
    "maturityRating": "R",
    "duration": null,
    "thumbnailUrl": "...",
    "bannerUrl": "...",
    "trailerUrl": "...",
    "viewCount": 98200,
    "genres": [
      { "id": "uuid", "name": "Drama", "slug": "drama" },
      { "id": "uuid", "name": "Thriller", "slug": "thriller" }
    ],
    "cast": [
      { "id": "uuid", "name": "Bryan Cranston", "role": "ACTOR", "character": "Walter White", "photoUrl": "..." },
      { "id": "uuid", "name": "Vince Gilligan", "role": "DIRECTOR", "character": null, "photoUrl": "..." }
    ],
    "seasons": [
      {
        "id": "uuid",
        "seasonNumber": 1,
        "title": "Season 1",
        "episodes": [
          {
            "id": "uuid",
            "episodeNumber": 1,
            "title": "Pilot",
            "description": "...",
            "duration": 58,
            "thumbnailUrl": "..."
          }
        ]
      }
    ]
  }
}
```

**Response (404):**
```json
{ "success": false, "message": "Content not found" }
```

### 5.3 GET /api/genres (Task 4.10)

List all genres with content count.

**Request:**
```
GET /api/genres
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Action", "slug": "action", "contentCount": 12 },
    { "id": "uuid", "name": "Comedy", "slug": "comedy", "contentCount": 8 },
    { "id": "uuid", "name": "Drama", "slug": "drama", "contentCount": 15 }
  ]
}
```

### 5.4 GET /api/content/featured (Task 4.11)

Random/curated featured content for hero banner.

**Request:**
```
GET /api/content/featured
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "MOVIE",
    "title": "Inception",
    "description": "A thief who steals corporate secrets...",
    "releaseYear": 2010,
    "maturityRating": "PG13",
    "duration": 148,
    "bannerUrl": "/images/inception-banner.jpg",
    "trailerUrl": "/videos/inception-trailer.mp4",
    "genres": [
      { "id": "uuid", "name": "Action", "slug": "action" }
    ]
  }
}
```

**Logic:** Randomly select from content with `viewCount > median` OR with `bannerUrl` set. Refresh on each request (no caching for now).

---

## 6. Sprint 4 — BE Folder Structure Extensions

```
src/
├── controllers/
│   ├── auth.controller.ts       # Existing
│   └── content.controller.ts    # NEW: list, detail, featured
│   └── genre.controller.ts      # NEW: list genres
│
├── services/
│   ├── auth.service.ts          # Existing
│   └── content.service.ts       # NEW: content queries, search
│   └── genre.service.ts         # NEW: genre queries
│
├── routes/
│   ├── index.ts                 # UPDATE: register new routes
│   ├── auth.routes.ts           # Existing
│   └── content.routes.ts        # NEW: /api/content, /api/content/:id, /api/content/featured
│   └── genre.routes.ts          # NEW: /api/genres
│
├── validations/
│   ├── auth.validation.ts       # Existing
│   └── content.validation.ts    # NEW: query param schemas
│
└── types/
    └── index.ts                 # UPDATE: add Content, Genre, Cast types
```

### Route Registration Order

**Important:** Register `/api/content/featured` BEFORE `/api/content/:id` in the router to avoid `:id` matching "featured" as a UUID.

```typescript
// content.routes.ts
router.get('/featured', contentController.getFeatured);  // FIRST
router.get('/:id', contentController.getDetail);          // SECOND
router.get('/', contentController.list);
```

---

## 7. Seed Data Strategy (Task 4.7)

### Approach
Create `prisma/seed.ts` with real movie/series data (titles, descriptions, years from public knowledge). No copyrighted images — use placeholder URLs.

### Data Volume
- **30+ movies** across multiple genres
- **5+ series** with seasons and episodes
- **12+ genres:** Action, Comedy, Drama, Horror, Sci-Fi, Thriller, Romance, Documentary, Animation, Fantasy, Mystery, Crime
- **50+ cast/crew** members

### Genres List (standardized slugs)
```
action, comedy, drama, horror, sci-fi, thriller,
romance, documentary, animation, fantasy, mystery, crime
```

### Seed Script Config
Add to `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run with: `npx prisma db seed`

---

## 8. Test Database Configuration (QA)

### Separate Test Database

```
# .env.test
DATABASE_URL=postgresql://user:password@localhost:5432/webphim_test
```

### Test Setup Pattern (existing, extend for Sprint 4)

```typescript
// tests/setup.ts — ADD cleanup for new tables
afterEach(async () => {
  // Clean in dependency order (children first)
  await prisma.rating.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.watchHistory.deleteMany();
  await prisma.contentCastCrew.deleteMany();
  await prisma.contentGenre.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.season.deleteMany();
  await prisma.castCrew.deleteMany();
  await prisma.content.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});
```

### Test Helpers for Sprint 4

```typescript
// tests/helpers/content.helper.ts
export const testGenres = [
  { name: 'Action', slug: 'action' },
  { name: 'Drama', slug: 'drama' },
];

export async function createTestGenres() { ... }
export async function createTestContent(overrides?) { ... }
export async function createTestSeries() { ... }
export async function seedTestData() { ... } // genres + content + cast
```

### QA Test Plan (Task 4.12)

Test all content endpoints:
1. `GET /api/content` — default pagination, filter by type, filter by genre, sort options, empty results
2. `GET /api/content/:id` — movie detail, series detail with episodes, not found (404)
3. `GET /api/genres` — list with counts, empty genres
4. `GET /api/content/featured` — returns valid content
5. Edge cases: invalid query params, non-existent genre slug, invalid UUID

---

## 9. Known Gotchas (from MEMORY.md)

| Issue | Solution | Affects |
|-------|----------|---------|
| **Prisma 7**: `prisma.config.ts` required | Already configured at project root | BE |
| **Prisma 7**: Client needs `@prisma/adapter-pg` | Already using `PrismaPg({ connectionString })` | BE |
| **Prisma 7**: `PrismaClientKnownRequestError` not importable | Use `err.name === 'PrismaClientKnownRequestError'` | BE error middleware |
| **Express 5**: `req.query` and `req.params` are READ-ONLY | Validation middleware must NOT reassign query/params, only `req.body` | BE validation |
| **Zod v4**: No `AnyZodObject` | Use `z.ZodType` instead | BE validation |
| **Zod v4**: Error array is `.issues` not `.errors` | Already handled in error middleware | BE |
| **Port 5000**: Blocked by macOS AirPlay | Always use port **5001** | BE |
| **JWT types**: `expiresIn` type mismatch | Cast with `as unknown as jwt.SignOptions['expiresIn']` | BE (already done) |

### Sprint 4 Specific Gotchas

1. **Prisma enums**: When using `z.coerce` with enum query params, coerce string → enum carefully. Express 5 query params are strings.
2. **Route order matters**: `/api/content/featured` must be registered BEFORE `/api/content/:id` or Express will try to match "featured" as a UUID param.
3. **Full-text search**: `tsvector` column is NOT in Prisma schema — it's managed via raw SQL migration. Use `$queryRaw` for search queries.
4. **Pagination with z.coerce**: Query params are strings in Express 5. Use `z.coerce.number()` to convert, but remember req.query is read-only — parse and use the validated result directly in the controller, don't try to write back.

---

## 10. Parallel Sprint Coordination

Sprint 3 (FE) and Sprint 4 (BE) are **fully independent** and can run in parallel:

- **No FE→BE dependency in Sprint 3:** Landing page, navbars, and layout are static UI components. No API calls needed.
- **No BE→FE dependency in Sprint 4:** Content APIs are standalone. FE will consume them in Sprint 5.
- **Shared:** Both use the same Git repo but different directories (`webphim-fe/` vs `webphim-be/`).

### Integration Point
Sprint 5 (Homepage & Browse UI) will be the first sprint where FE consumes Sprint 4's content APIs. The API contracts defined above ensure smooth integration.

---

## 11. Acceptance Criteria Summary

### Sprint 3 (FE) — Definition of Done
- [ ] Dark theme fully applied (Netflix color palette + Inter font)
- [ ] Landing page renders with Hero, 4 Feature Sections, FAQ, Footer
- [ ] Guest Navbar shows on landing page (transparent, logo + Sign In)
- [ ] Auth Navbar shows on authenticated pages (transparent→solid on scroll)
- [ ] Auth Navbar has working profile dropdown with Sign Out
- [ ] Mobile drawer opens/closes with animation below `md` breakpoint
- [ ] Footer renders with links grid and language selector
- [ ] MainLayout wraps all authenticated pages
- [ ] All components are responsive (mobile, tablet, desktop)
- [ ] No TypeScript errors, ESLint clean, builds successfully

### Sprint 4 (BE+QA) — Definition of Done
- [ ] Prisma migration creates all new tables (content, seasons, episodes, genres, cast_crew, join tables, user interaction tables)
- [ ] Full-text search column + trigger + GIN index on content table
- [ ] Seed script populates 30+ movies, 5+ series, 12+ genres, 50+ cast
- [ ] `GET /api/content` works with pagination, type filter, genre filter, sorting
- [ ] `GET /api/content/:id` returns full detail with genres, cast, episodes
- [ ] `GET /api/genres` returns genres with content counts
- [ ] `GET /api/content/featured` returns random featured content
- [ ] All endpoints return consistent response format
- [ ] QA tests pass for all content endpoints
- [ ] No TypeScript errors, ESLint clean, builds successfully
