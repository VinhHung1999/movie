# Architecture Document: Sprint 10 — User Features

**Author:** TL (Tech Lead)
**Date:** 2026-02-09
**Status:** PENDING PO REVIEW
**Sprint:** 10 (User Features, 32pts: BE 11 + FE 18 + QA 3)
**Depends on:** Sprint 4 (Content APIs, DB models), Sprint 7 (Watch History), Sprint 9 (Search)

---

## 1. Pinned Dependency Versions

### Frontend (DO NOT UPGRADE)

| Package | Version | Notes |
|---------|---------|-------|
| next | 16.1.6 | App Router, Server/Client Components |
| react | 19.2.3 | React 19 |
| tailwindcss | ^4 | CSS-first config via globals.css |
| framer-motion | ^12.33.0 | Animations |
| zustand | ^5.0.11 | Auth + profile state |
| swr | ^2.4.0 | Client-side data fetching (watchlist, ratings, continue watching) |
| axios | ^1.13.4 | HTTP client with interceptors |
| lucide-react | ^0.511.0 | Icons (Check, Plus, ThumbsUp, ThumbsDown, Pencil, Trash2, User) |
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
| helmet | ^8.1.0 | Security headers (static files BEFORE helmet) |
| vitest | ^4.0.18 | Testing framework |
| supertest | ^7.1.0 | API integration testing |
| bcryptjs | ^3.0.2 | Password hashing |

### No New Packages

Sprint 10 requires no new npm dependencies. All features use existing packages:
- SWR for watchlist/ratings client caching
- Zustand for active profile state
- Lucide for new icons (Check, ThumbsUp, ThumbsDown, Pencil, Trash2)
- Framer Motion for profile selector animations

---

## 2. Port Configuration

| Service | Port | URL |
|---------|------|-----|
| FE (Next.js dev) | **1999** | `http://localhost:1999` |
| BE (Express) | **5001** | `http://localhost:5001` |
| PostgreSQL | 5432 | `postgresql://localhost:5432/webphim` |
| Redis | 6379 | For BullMQ transcode queue |

**FE env:** `NEXT_PUBLIC_API_URL=http://localhost:5001/api`

**CORS origins:** `http://localhost:1999`, `http://localhost:3000`, `http://localhost:3001` (already configured)

**Reminder:** Port 5000 blocked by macOS AirPlay.

---

## 3. Database Schema Changes

### 3.1 New Model: Profile

Add to `prisma/schema.prisma`:

```prisma
model Profile {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  name       String
  avatarUrl  String?  @map("avatar_url")
  isKids     Boolean  @default(false) @map("is_kids")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("profiles")
}
```

Add to `User` model:
```prisma
profiles      Profile[]
```

### 3.2 Migration

```bash
DATABASE_URL=postgresql://localhost:5432/webphim npx prisma migrate dev --name add_profiles
```

**IMPORTANT:** Always prefix with explicit `DATABASE_URL=` to avoid shell env pollution (AI-068).

### 3.3 Existing Models (NO changes needed)

The following models already exist from Sprint 4 and require NO migration:

- **Watchlist** — composite PK `(userId, contentId)`, `addedAt` timestamp
- **Rating** — composite PK `(userId, contentId)`, `score` Int, timestamps

**Design decision:** Watchlist/Rating/WatchHistory remain linked to `userId` (not `profileId`). This keeps Sprint 10 scope manageable. Multi-profile-scoped data can be added in a future sprint.

### 3.4 Seed Data Update

Add to `seed.ts` after Boss account creation:

```typescript
// Create default profile for Boss
const boss = await prisma.user.findUnique({ where: { email: 'boss@webphim.com' } });
if (boss) {
  await prisma.profile.upsert({
    where: { id: 'default' }, // won't match, forces create
    update: {},
    create: {
      userId: boss.id,
      name: 'Boss',
      avatarUrl: null,
    },
  });
}
```

**Note:** Default profile is auto-created on signup (see Section 5.3).

---

## 4. API Contracts

All authenticated endpoints use `Authorization: Bearer <token>` header. All responses follow `{ success: true, data: T }` shape.

### 4.1 Watchlist API (Task 10.1)

#### `GET /api/watchlist` — Get user's watchlist

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 50) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "contentId": "uuid",
      "addedAt": "2026-02-09T10:00:00Z",
      "content": {
        "id": "uuid",
        "type": "MOVIE",
        "title": "Inception",
        "description": "A thief who steals...",
        "releaseYear": 2010,
        "maturityRating": "PG13",
        "duration": 148,
        "thumbnailUrl": "/images/content/inception-thumb.jpg",
        "bannerUrl": "/images/content/inception-banner.jpg",
        "viewCount": 15420,
        "genres": [{ "id": "uuid", "name": "Action", "slug": "action" }]
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

#### `POST /api/watchlist/:contentId` — Add to watchlist (toggle ON)

**Response 201:**
```json
{
  "success": true,
  "data": { "contentId": "uuid", "addedAt": "2026-02-09T10:00:00Z" }
}
```

**Response 409 (already in watchlist):**
```json
{
  "success": true,
  "data": { "contentId": "uuid", "addedAt": "2026-02-09T09:00:00Z" }
}
```
Return 200 with existing record (idempotent, don't error).

#### `DELETE /api/watchlist/:contentId` — Remove from watchlist (toggle OFF)

**Response 200:**
```json
{ "success": true, "data": { "contentId": "uuid", "removed": true } }
```

**Response 404 (not in watchlist):** Return 200 with `{ removed: true }` (idempotent).

#### `GET /api/watchlist/check/:contentId` — Check if content is in watchlist

**Response 200:**
```json
{ "success": true, "data": { "inWatchlist": true } }
```

### 4.2 Ratings API (Task 10.2)

#### `POST /api/ratings/:contentId` — Rate content (upsert)

**Request body:**
```json
{ "score": 1 }
```
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| score | number | 1 or 2 | 1 = thumbs up, 2 = thumbs down (Netflix-style binary) |

**Response 200:**
```json
{
  "success": true,
  "data": { "contentId": "uuid", "score": 1, "updatedAt": "2026-02-09T10:00:00Z" }
}
```

#### `DELETE /api/ratings/:contentId` — Remove rating

**Response 200:**
```json
{ "success": true, "data": { "contentId": "uuid", "removed": true } }
```

#### `GET /api/ratings/:contentId` — Get user's rating for content

**Response 200:**
```json
{
  "success": true,
  "data": { "contentId": "uuid", "score": 1, "updatedAt": "2026-02-09T10:00:00Z" }
}
```

**Response 200 (no rating):**
```json
{ "success": true, "data": null }
```

#### `GET /api/ratings` — Get all user's ratings (for profile page, future use)

**Query params:** `page`, `limit`

**Response 200:** Same shape as watchlist but with `score` field.

### 4.3 Profile API (Task 10.3)

#### `GET /api/profiles` — Get all profiles for current user

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Boss",
      "avatarUrl": null,
      "isKids": false,
      "createdAt": "2026-02-09T10:00:00Z"
    }
  ]
}
```

#### `POST /api/profiles` — Create new profile

**Request body:**
```json
{ "name": "Kids", "avatarUrl": "/images/avatars/avatar-3.png", "isKids": true }
```
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| name | string | 1-30 chars, required | Profile display name |
| avatarUrl | string? | optional | One of predefined avatar paths |
| isKids | boolean | default false | Kids mode (restricts to G/PG content) |

**Response 201:**
```json
{ "success": true, "data": { "id": "uuid", "name": "Kids", "avatarUrl": "...", "isKids": true, "createdAt": "..." } }
```

**Response 409 (max 5 profiles):**
```json
{ "success": false, "message": "Maximum 5 profiles per account" }
```

#### `PUT /api/profiles/:profileId` — Update profile

**Request body:** Same fields as POST (partial update).

**Response 200:** Updated profile object.

**Response 403:** Cannot edit profile owned by another user.

#### `DELETE /api/profiles/:profileId` — Delete profile

**Response 200:**
```json
{ "success": true, "data": { "id": "uuid", "removed": true } }
```

**Response 400:** Cannot delete last profile (must have at least 1).

**Response 403:** Cannot delete profile owned by another user.

### 4.4 Continue Watching API (ALREADY EXISTS)

`GET /api/watch-history/continue?limit=20` — Already implemented in Sprint 7.

**Response shape (for FE reference):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "contentId": "uuid",
      "episodeId": null,
      "progress": 3600,
      "duration": 8880,
      "progressPercent": 41,
      "updatedAt": "2026-02-09T10:00:00Z",
      "content": {
        "id": "uuid",
        "title": "Inception",
        "type": "MOVIE",
        "thumbnailUrl": "/images/content/inception-thumb.jpg",
        "maturityRating": "PG13"
      }
    }
  ]
}
```

**Filter logic:** progress between 5% and 90% of duration, ordered by most recent `updatedAt`.

---

## 5. BE Implementation Details

### 5.1 File Structure (new files)

```
webphim-be/src/
├── routes/
│   ├── watchlist.routes.ts      (NEW - Task 10.1)
│   ├── rating.routes.ts         (NEW - Task 10.2)
│   └── profile.routes.ts        (NEW - Task 10.3)
├── controllers/
│   ├── watchlist.controller.ts  (NEW)
│   ├── rating.controller.ts     (NEW)
│   └── profile.controller.ts    (NEW)
├── services/
│   ├── watchlist.service.ts     (NEW)
│   ├── rating.service.ts        (NEW)
│   └── profile.service.ts       (NEW)
└── validations/
    ├── watchlist.validation.ts  (NEW)
    ├── rating.validation.ts     (NEW)
    └── profile.validation.ts    (NEW)
```

### 5.2 Route Registration

Update `src/routes/index.ts`:

```typescript
import watchlistRoutes from './watchlist.routes';
import ratingRoutes from './rating.routes';
import profileRoutes from './profile.routes';

router.use('/watchlist', watchlistRoutes);
router.use('/ratings', ratingRoutes);
router.use('/profiles', profileRoutes);
```

All three route files apply `router.use(authenticate)` at the top (same pattern as `watch-history.routes.ts`).

### 5.3 Profile Auto-Creation on Signup

In the existing auth service's `register` method, after creating the User, also create a default Profile:

```typescript
// After user creation
await prisma.profile.create({
  data: {
    userId: user.id,
    name: user.name,
    avatarUrl: null,
    isKids: false,
  },
});
```

This ensures every user always has at least 1 profile.

### 5.4 Watchlist Service Pattern

```typescript
// Idempotent add — use upsert (Prisma composite key)
async add(userId: string, contentId: string) {
  // Verify content exists first
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) throw ApiError.notFound('Content not found');

  const record = await prisma.watchlist.upsert({
    where: { userId_contentId: { userId, contentId } },
    update: {},  // no-op if already exists
    create: { userId, contentId },
  });
  return { contentId: record.contentId, addedAt: record.addedAt };
}

// Idempotent remove — deleteMany (returns count 0 if not found)
async remove(userId: string, contentId: string) {
  await prisma.watchlist.deleteMany({ where: { userId, contentId } });
  return { contentId, removed: true };
}
```

### 5.5 Rating Service Pattern

```typescript
// Upsert rating (score: 1 = thumbs up, 2 = thumbs down)
async rate(userId: string, contentId: string, score: number) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) throw ApiError.notFound('Content not found');

  const record = await prisma.rating.upsert({
    where: { userId_contentId: { userId, contentId } },
    update: { score },
    create: { userId, contentId, score },
  });
  return { contentId: record.contentId, score: record.score, updatedAt: record.updatedAt };
}
```

### 5.6 Validation Schemas (AI-065: Always use schema.parse())

**CRITICAL CONVENTION:** All controllers MUST use `schema.parse()` — never manual `as` casts.

```typescript
// watchlist.validation.ts
import { z } from 'zod';

export const watchlistQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

// rating.validation.ts
export const rateSchema = z.object({
  body: z.object({
    score: z.number().int().min(1).max(2),
  }),
});

// profile.validation.ts
export const createProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(30),
    avatarUrl: z.string().nullable().optional(),
    isKids: z.boolean().default(false),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(30).optional(),
    avatarUrl: z.string().nullable().optional(),
    isKids: z.boolean().optional(),
  }),
});
```

**Controller pattern:**
```typescript
async getWatchlist(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { query } = watchlistQuerySchema.parse({ query: req.query });
    const result = await watchlistService.getAll(req.user!.userId, query.page, query.limit);
    res.json({ success: true, data: result.items, meta: result.meta });
  } catch (error) { next(error); }
}
```

---

## 6. FE Component Tree

### 6.1 New Pages

```
webphim-fe/src/app/
├── (main)/
│   ├── browse/
│   │   └── my-list/
│   │       └── page.tsx           (NEW - Task 10.4: My List page)
│   └── profiles/
│       ├── page.tsx               (NEW - Task 10.6: Profile Selector)
│       └── manage/
│           └── page.tsx           (NEW - Task 10.7: Profile Management)
```

### 6.2 New Components

```
webphim-fe/src/components/
├── watchlist/
│   ├── WatchlistButton.tsx        (NEW - Task 10.4: Plus/Check toggle)
│   └── WatchlistGrid.tsx          (NEW - Task 10.4: Grid of watchlist items)
├── ratings/
│   └── RatingButtons.tsx          (NEW - Task 10.4: ThumbsUp/ThumbsDown)
├── home/
│   └── ContinueWatchingRow.tsx    (NEW - Task 10.5: Client component)
├── profile/
│   ├── ProfileCard.tsx            (NEW - Task 10.6: Single profile avatar card)
│   ├── ProfileSelector.tsx        (NEW - Task 10.6: Grid of profile cards)
│   ├── ProfileForm.tsx            (NEW - Task 10.7: Create/edit form)
│   └── ProfileDeleteDialog.tsx    (NEW - Task 10.7: Delete confirmation)
```

### 6.3 Modified Components

| File | Change |
|------|--------|
| `MovieCard.tsx` | Wire Plus button to `WatchlistButton` |
| `PreviewModal.tsx` | Add `WatchlistButton` + `RatingButtons` |
| `home/page.tsx` | Add `ContinueWatchingRow` client component |
| `AuthNavbar.tsx` | Update "My List" href to `/browse/my-list`, add active profile indicator |

### 6.4 New Types

Add to `webphim-fe/src/types/index.ts`:

```typescript
// ============================================
// Watchlist Types (Sprint 10)
// ============================================

export interface WatchlistItem {
  contentId: string;
  addedAt: string;
  content: ContentSummary;
}

export interface WatchlistResponse {
  success: true;
  data: WatchlistItem[];
  meta: PaginationMeta;
}

// ============================================
// Rating Types (Sprint 10)
// ============================================

export interface RatingData {
  contentId: string;
  score: number; // 1 = thumbs up, 2 = thumbs down
  updatedAt: string;
}

// ============================================
// Profile Types (Sprint 10)
// ============================================

export interface Profile {
  id: string;
  name: string;
  avatarUrl: string | null;
  isKids: boolean;
  createdAt: string;
}

// ============================================
// Continue Watching Types (Sprint 10)
// ============================================

export interface ContinueWatchingItem {
  id: string;
  contentId: string;
  episodeId: string | null;
  progress: number;
  duration: number;
  progressPercent: number;
  updatedAt: string;
  content: {
    id: string;
    title: string;
    type: ContentType;
    thumbnailUrl: string | null;
    maturityRating: MaturityRating;
  };
}
```

### 6.5 Profile Store (Zustand)

Create `webphim-fe/src/store/profile.store.ts`:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile } from '@/types';

interface ProfileState {
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      activeProfile: null,
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      clearProfile: () => set({ activeProfile: null }),
    }),
    {
      name: 'webphim-profile',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

**Why persist?** Profile selection persists across page reloads, matching Netflix behavior where you stay on your profile until you switch.

---

## 7. FE Implementation Details

### 7.1 WatchlistButton Component (Task 10.4)

```tsx
// Key behavior:
// - Uses SWR to check /watchlist/check/:contentId
// - Optimistic update on click (mutate local cache immediately)
// - Shows Check icon when in watchlist, Plus when not
// - Used in MovieCard hover overlay AND PreviewModal

interface WatchlistButtonProps {
  contentId: string;
  size?: number;
  className?: string;
}
```

**SWR pattern:**
```typescript
const { data, mutate } = useSWR<{ success: true; data: { inWatchlist: boolean } }>(
  `/watchlist/check/${contentId}`
);
const inWatchlist = data?.data?.inWatchlist ?? false;

const toggle = async () => {
  // Optimistic update
  mutate({ success: true, data: { inWatchlist: !inWatchlist } }, false);
  try {
    if (inWatchlist) {
      await api.delete(`/watchlist/${contentId}`);
    } else {
      await api.post(`/watchlist/${contentId}`);
    }
    mutate(); // revalidate
  } catch {
    mutate(); // rollback on error
  }
};
```

**REMINDER (SWR double-unwrap):** SWR fetcher returns `{success, data, meta}`. Access via `data?.data?.inWatchlist` not `data?.inWatchlist`.

### 7.2 RatingButtons Component (Task 10.4)

```tsx
// Netflix-style thumbs up/down
// Shows filled icon when that rating is active
// Click active rating to remove it

interface RatingButtonsProps {
  contentId: string;
}
```

Uses `useSWR<{ success: true; data: RatingData | null }>('/ratings/:contentId')`.

### 7.3 ContinueWatchingRow (Task 10.5)

This MUST be a **client component** because it requires auth (Bearer token from Zustand store).

**Integration with HomePage (server component):**

```tsx
// home/page.tsx (server component)
import ContinueWatchingRow from '@/components/home/ContinueWatchingRow';

// In JSX, insert BEFORE the first ContentRow:
<ContinueWatchingRow />
```

**ContinueWatchingRow component:**
```tsx
// Uses SWR to fetch /watch-history/continue?limit=20
// Shows progress bar overlay on each card
// Shows "Continue Watching for {profileName}" title
// Returns null if no items (empty state hidden)
```

**Progress bar design:**
```tsx
<div className="absolute bottom-0 left-0 right-0 h-1 bg-netflix-gray">
  <div
    className="h-full bg-netflix-red"
    style={{ width: `${item.progressPercent}%` }}
  />
</div>
```

**IMPORTANT (AI-063):** All `thumbnailUrl` rendering MUST prepend `SERVER_BASE`:
```typescript
const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');
// Then: src={`${SERVER_BASE}${item.content.thumbnailUrl}`}
```

### 7.4 My List Page (Task 10.4)

Route: `/browse/my-list` (already linked in AuthNavbar)

```tsx
// Client component — requires auth
// Uses SWR to fetch /watchlist?page=1&limit=40
// Grid layout matching SearchResults page pattern
// Empty state: "Your list is empty. Add movies and series to keep track."
// Each item renders as MovieCard (reuse existing component)
```

### 7.5 Profile Selector (Task 10.6)

Route: `/profiles`

**Flow:**
1. On first login (or manual switch), redirect to `/profiles`
2. Show grid of profile cards (max 5) + "Add Profile" button
3. Click profile → set in Zustand store → redirect to `/home`
4. "Manage Profiles" link → navigate to `/profiles/manage`

**ProfileCard design:**
```
┌─────────┐
│  Avatar  │  (colored square with initial, or avatar image)
│  (96px)  │
├─────────┤
│  Name   │
└─────────┘
```

Predefined avatar options (8 solid colors):
```typescript
const AVATAR_COLORS = [
  '#E50914', '#B81D24', '#221F1F', '#F5F5F1',
  '#0073E6', '#46D369', '#E87C03', '#6B3FA0',
];
```

When no `avatarUrl` is set, display colored background with first letter of name.

### 7.6 Profile Management (Task 10.7)

Route: `/profiles/manage`

- Grid of profiles with edit/delete overlays
- Click profile → navigate to edit form
- "Add Profile" → navigate to create form
- ProfileForm: name input, avatar/color picker, kids toggle
- ProfileDeleteDialog: confirmation modal before deletion
- Cannot delete last remaining profile (button disabled with tooltip)

### 7.7 MovieCard Plus Button Wiring

Replace the current placeholder in `MovieCard.tsx` (lines 90-92):

```tsx
// BEFORE (placeholder):
<button className="flex h-8 w-8 ...">
  <Plus size={14} />
</button>

// AFTER:
<WatchlistButton contentId={item.id} size={14} />
```

---

## 8. Test Configuration

### 8.1 BE Test Database

Use existing `webphim_test` database (set up in Sprint 8).

**`webphim-be/.env.test`:**
```
DATABASE_URL=postgresql://localhost:5432/webphim_test
PORT=5002
JWT_SECRET=test-secret
JWT_REFRESH_SECRET=test-refresh-secret
```

### 8.2 Test File Structure

```
webphim-be/tests/
├── watchlist.test.ts         (NEW - Task 10.1)
├── rating.test.ts            (NEW - Task 10.2)
└── profile.test.ts           (NEW - Task 10.3)

webphim-fe/src/__tests__/
├── WatchlistButton.test.tsx  (NEW - Task 10.4)
├── WatchlistGrid.test.tsx    (NEW - Task 10.4)
├── RatingButtons.test.tsx    (NEW - Task 10.4)
├── ContinueWatchingRow.test.tsx (NEW - Task 10.5)
├── MyListPage.test.tsx       (NEW - Task 10.4)
├── ProfileSelector.test.tsx  (NEW - Task 10.6)
├── ProfileForm.test.tsx      (NEW - Task 10.7)
└── ProfileManage.test.tsx    (NEW - Task 10.7)
```

### 8.3 BE Test Helper Pattern

Reuse existing test helpers from Sprint 8/9:

```typescript
// Get auth token for tests
async function getToken(): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({
    email: 'test@test.com', password: 'Test@123456'
  });
  return res.body.data.accessToken;
}
```

### 8.4 FE Test SWR Isolation

**CRITICAL:** Wrap each test render with isolated SWR cache (Sprint 6 lesson):

```typescript
import { SWRConfig } from 'swr';

function renderWithSWR(ui: React.ReactElement) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {ui}
    </SWRConfig>
  );
}
```

If component has its own `SWRProvider`, mock the `swr` module directly instead.

---

## 9. Known Gotchas (from Project Memory)

### AI-063: SERVER_BASE Mandatory for BE-Hosted Images

**ALL `<img>` tags rendering BE-served files MUST prepend `SERVER_BASE`.** Relative paths resolve against FE port (1999), not BE (5001).

```typescript
const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');
```

**Applies to:** WatchlistGrid thumbnails, ContinueWatchingRow thumbnails, ProfileCard avatars (if stored as BE paths).

### AI-065: Controllers Must Use schema.parse()

**NEVER use manual `as` casts on `req.query`/`req.params`.** Always use Zod `schema.parse({ query: req.query })` to get fully transformed values (coerce, defaults, empty→undefined).

### AI-064: QA Must Verify Real Content

QA must query actual dev database content before writing assertions. Seed data movie titles and IDs differ from test fixtures.

### Prisma 7: Null in Composite Unique Where

Prisma 7 rejects `null` in compound unique `where` clause. Use `findFirst` + manual upsert pattern (same as watch-history.service.ts).

**However:** Watchlist and Rating composite keys `(userId, contentId)` have no nullable fields, so standard `upsert` with `where: { userId_contentId: { userId, contentId } }` works fine.

### Express 5: Read-Only req.query/params

Cannot reassign `req.query` or `req.params`. Read values directly from Zod parsed result.

### React 19 Lint Rules

- No `setState` calls directly in `useEffect` body → derive state instead
- No ref reads during render → destructure hook returns
- Applies to: ContinueWatchingRow, WatchlistButton, RatingButtons

### SWR Double-Unwrap Pattern

SWR fetcher `api.get(url).then(res => res.data)` returns `{ success, data, meta }`.
Access actual data via `swrData?.data` not `swrData` directly.

### Helmet Blocks Cross-Origin Static Files

Static files (avatars if served from BE) must be served BEFORE `app.use(helmet())`. Already configured in Sprint 7.

---

## 10. CORS Configuration

Already configured in `src/config/index.ts` with callback pattern supporting multiple origins. No changes needed for Sprint 10.

---

## 11. Validated Query Middleware Pattern

For Sprint 10, follow the inline Zod parse pattern (no separate middleware):

```typescript
// In controller:
const { query } = watchlistQuerySchema.parse({ query: req.query });
```

This is consistent with the Sprint 9 search controller pattern after the code review fix.

---

## 12. Seed Data Review

### Existing Seed Data (seed.ts):

| Type | Count | Details |
|------|-------|---------|
| Users | 1 | Boss (boss@webphim.com / Boss@123456) |
| Genres | 12 | action, comedy, drama, horror, sci-fi, thriller, romance, documentary, animation, fantasy, mystery, crime |
| Cast/Crew | 53 | Actors + Directors |
| Movies | 31 | Inception, Dark Knight, Interstellar, etc. |
| Series | 6 | Breaking Bad, Stranger Things, Queen's Gambit, Ozark, Witcher, Last of Us |
| Profiles | 0 | **NEW: seed must create default profile for Boss** |

### QA Test Verification

QA should verify:
1. Boss account can login and has a default profile
2. Watchlist add/remove works with real content IDs from seed data
3. Rating 1 (up) and 2 (down) both persist correctly
4. Continue Watching only shows items with 5%-90% progress

---

## 13. Accessibility (AI-049)

### 13.1 WatchlistButton
- `aria-label`: "Add to My List" / "Remove from My List" (toggles with state)
- `aria-pressed`: true/false reflecting watchlist state
- `role="button"` (implicit on `<button>`)
- Focus visible ring for keyboard navigation

### 13.2 RatingButtons
- `aria-label`: "Rate thumbs up" / "Rate thumbs down"
- `aria-pressed`: true when that rating is active
- Group with `role="group"` and `aria-label="Rate this title"`

### 13.3 ContinueWatchingRow
- Progress bar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax=100`
- `aria-label="Watch progress: X%"`

### 13.4 Profile Selector
- Profile cards: `role="button"`, `aria-label="Switch to {name} profile"`
- Add Profile: `aria-label="Add new profile"`
- Manage Profiles: `aria-label="Manage profiles"`
- Auto-focus first profile on page load

### 13.5 Profile Management
- Delete dialog: `role="alertdialog"`, `aria-labelledby`, `aria-describedby`
- Focus trap in delete dialog
- Form inputs with proper `<label>` elements and `htmlFor`
- Kids toggle: accessible checkbox with label

### 13.6 My List Page
- Empty state with helpful message (not just blank page)
- Grid uses `role="list"` with `role="listitem"` for each card

---

## 14. Task Assignments & Execution Order

### BE Execution Order: 10.1 → 10.2 → 10.3

| # | Task | Points | Dependencies | Tests |
|---|------|--------|--------------|-------|
| 10.1 | Watchlist API (CRUD + check) | 3 | None (Watchlist model exists) | ~15 tests |
| 10.2 | Ratings API (upsert + delete + get) | 3 | None (Rating model exists) | ~12 tests |
| 10.3 | Profile API (CRUD + max 5 + auto-create) | 5 | Migration needed (Profile model) | ~18 tests |

**BE Note:** Run migration for Profile model FIRST (Task 10.3 prerequisite), but implement Watchlist API first since it's P0 and FE depends on it.

**Suggested order:** Migration → 10.1 → 10.2 → 10.3

### FE Execution Order: 10.5 → 10.4 → 10.6 → 10.7

| # | Task | Points | Dependencies | Tests |
|---|------|--------|--------------|-------|
| 10.5 | Continue Watching Row | 5 | BE watch-history API (exists) | ~8 tests |
| 10.4 | Watchlist UI + My List page | 5 | BE Task 10.1 (Watchlist API) | ~12 tests |
| 10.6 | Profile Selector Screen | 5 | BE Task 10.3 (Profile API) | ~8 tests |
| 10.7 | Profile Management | 3 | BE Task 10.3 + FE Task 10.6 | ~6 tests |

**FE Note:** Task 10.5 can start immediately (BE API already exists). Task 10.4 can start with mocked API while waiting for BE. Tasks 10.6/10.7 need Profile API from BE.

### QA

| # | Task | Points | Dependencies | Tests |
|---|------|--------|--------------|-------|
| 10.8 | User Features Tests | 3 | All BE + FE tasks | ~20 tests + browser walkthrough |

**QA Note:** QA receives this arch doc simultaneously with FE/BE. Begin test planning immediately. Browser walkthrough is MANDATORY (AI-056).

---

## 15. Checklist Verification

| # | Item | Status |
|---|------|--------|
| 1 | Pinned dependency versions (AI-002) | Section 1 |
| 2 | API contracts with req/res (AI-007) | Section 4 |
| 3 | Port 5001 standard (AI-003) | Section 2 |
| 4 | Test DB config (AI-006) | Section 8 |
| 5 | Component tree (AI-005) | Section 6 |
| 6 | Known gotchas from memory | Section 9 |
| 7 | CORS configuration (AI-016) | Section 10 |
| 8 | Validated query middleware (AI-020) | Section 11 |
| 9 | Seed data review (AI-021) | Section 12 |
| 10 | Accessibility (AI-049) | Section 13 |

---

## 16. Infrastructure Verification

Before sprint starts, verify:
- [ ] PostgreSQL running on port 5432
- [ ] `webphim` database accessible
- [ ] `webphim_test` database accessible
- [ ] Redis running on port 6379
- [ ] Boss account (boss@webphim.com) can login
- [ ] BE starts on port 5001
- [ ] FE starts on port 1999
- [ ] Existing 491+ tests still pass

---

*End of Architecture Document*
