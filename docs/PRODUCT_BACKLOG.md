# WebPhim - Product Backlog

**Product:** WebPhim - Netflix Clone (Portfolio/Learning)
**Architecture:** Monorepo with 2 separate apps (FE + BE)
**Tech:** Full TypeScript
**Updated:** 2026-02-06

---

## Tech Stack

| | Frontend (`webphim-fe`) | Backend (`webphim-be`) |
|--|--|--|
| **Framework** | Next.js 14+ App Router | Express.js |
| **Language** | TypeScript | TypeScript |
| **UI** | Tailwind CSS, Framer Motion | - |
| **Auth** | JWT (store token, protected routes) | JWT tự build (bcrypt, access/refresh token) |
| **ORM** | - | Prisma |
| **Database** | - | PostgreSQL |
| **Video** | hls.js player | FFmpeg transcode HLS |
| **Storage** | - | Cloudflare R2 / local |
| **Deploy** | Vercel | Railway / Render |

---

## Sprint 2: Project Setup & Authentication

**Goal:** Dựng nền tảng 2 repos (FE + BE) và hệ thống auth hoạt động end-to-end.

### BE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 2.1 | **BE Project Init**: Setup Express.js + TypeScript, ESLint, Prettier, folder structure (routes/controllers/services/middleware) | P0 | 3 |
| 2.2 | **Database Setup**: PostgreSQL local, Prisma ORM init, schema users (email, password_hash, name, avatar, created_at) | P0 | 3 |
| 2.3 | **Auth - Register API**: POST /api/auth/register (validate input, hash password bcrypt, create user, return JWT) | P0 | 5 |
| 2.4 | **Auth - Login API**: POST /api/auth/login (verify email/password, return access token + refresh token) | P0 | 5 |
| 2.5 | **Auth - Refresh Token**: POST /api/auth/refresh (verify refresh token, issue new access token) | P0 | 3 |
| 2.6 | **Auth - Logout API**: POST /api/auth/logout (invalidate refresh token) | P0 | 2 |
| 2.7 | **Auth Middleware**: JWT verification middleware, protect private routes | P0 | 3 |
| 2.8 | **GET /api/auth/me**: Return current user info from token | P0 | 2 |
| 2.9 | **CORS Config**: Setup CORS cho FE origin (localhost:3000) | P0 | 1 |

### FE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 2.10 | **FE Project Init**: Setup Next.js 14+ App Router, TypeScript, Tailwind CSS, Framer Motion, ESLint, Prettier | P0 | 3 |
| 2.11 | **API Client Setup**: Axios/fetch wrapper, base URL config, JWT interceptor (auto attach token, auto refresh on 401) | P0 | 5 |
| 2.12 | **Auth UI - Login Page**: Email/password form, dark theme Netflix-style, background image, validation, error messages | P0 | 5 |
| 2.13 | **Auth UI - Signup Page**: Name/email/password form, Netflix-style, password strength indicator | P0 | 5 |
| 2.14 | **Auth Context/Store**: React context hoặc Zustand store cho auth state (user, token, isAuthenticated) | P0 | 3 |
| 2.15 | **Protected Route Middleware**: Next.js middleware redirect to /login nếu chưa auth | P0 | 3 |
| 2.16 | **Logout Flow**: Logout button, clear tokens, redirect to landing | P0 | 2 |

### QA Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 2.17 | **BE Unit Tests**: Test auth APIs (register, login, refresh, logout, me) | P0 | 5 |
| 2.18 | **E2E Auth Flow**: Signup → Login → Access protected page → Logout | P0 | 3 |

**Total: 66 points**

### Sprint 2 Learning

| Topic | Nội dung học |
|-------|-------------|
| **JWT Deep Dive** | Access token vs Refresh token là gì? Tại sao cần cả 2? Token expiry strategy. Cách store token an toàn (httpOnly cookie vs localStorage) |
| **Password Hashing** | Bcrypt hoạt động thế nào? Salt rounds là gì? Tại sao không dùng MD5/SHA256? |
| **Express Middleware** | Middleware pattern trong Express. Cách chain middleware. Error handling middleware |
| **Prisma ORM** | Schema definition, migrations, type-safe queries. So sánh với raw SQL |
| **CORS** | Cross-Origin Resource Sharing là gì? Tại sao cần? Cách config cho FE+BE riêng |

---

## Sprint 3: Landing Page & Layout

**Goal:** Landing page cho guest và layout chính cho authenticated users.

### FE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 3.1 | **Dark Theme Config**: Tailwind config Netflix color palette (#E50914, #141414, #1F1F1F), font stack (Inter), global styles | P0 | 3 |
| 3.2 | **Landing Page Hero**: Full-screen hero section, background image, gradient overlay, headline, email capture, CTA button "Get Started" | P0 | 5 |
| 3.3 | **Landing Page Feature Sections**: Alternating left-right layout (Watch on TV, Download, Watch Everywhere, Kids) | P1 | 5 |
| 3.4 | **Landing Page FAQ**: Accordion component với animation (Framer Motion) | P1 | 3 |
| 3.5 | **Navbar - Guest**: Logo + Sign In button, transparent background | P0 | 3 |
| 3.6 | **Navbar - Authenticated**: Logo, nav links (Home, Series, Movies, My List), search icon, notification bell, profile dropdown. Transparent → solid on scroll | P0 | 5 |
| 3.7 | **Footer**: Links grid, language selector, copyright | P2 | 2 |
| 3.8 | **Mobile Responsive Navbar**: Hamburger menu, slide-out drawer | P1 | 5 |
| 3.9 | **Main Layout Component**: Wrapper layout cho authenticated pages (navbar + content + footer) | P0 | 3 |

**Total: 34 points**

### Sprint 3 Learning

| Topic | Nội dung học |
|-------|-------------|
| **Tailwind CSS Advanced** | Custom theme config, extend colors/fonts, responsive utilities (sm/md/lg/xl), group-hover |
| **Framer Motion Basics** | motion components, whileHover, AnimatePresence, layout animations. Spring vs tween transitions |
| **Next.js App Router** | Layout nesting, Server vs Client Components, khi nào dùng "use client" |
| **Responsive Design** | Mobile-first approach, breakpoints strategy, CSS Grid vs Flexbox cho layout |

---

## Sprint 4: Database Schema & Content API

**Goal:** Database hoàn chỉnh và REST API cho content catalog.

### BE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 4.1 | **DB Schema - Content**: Bảng content (id, type movie/series, title, description, release_year, maturity_rating, duration, thumbnail_url, banner_url, trailer_url, view_count) | P0 | 5 |
| 4.2 | **DB Schema - Series**: Bảng series_seasons + episodes (season_number, episode_number, title, duration, video_url) | P0 | 3 |
| 4.3 | **DB Schema - Genres**: Bảng genres + content_genres (many-to-many) | P0 | 2 |
| 4.4 | **DB Schema - Cast**: Bảng cast_crew + content_cast_crew (role: actor/director/writer) | P1 | 3 |
| 4.5 | **DB Schema - User Interactions**: Bảng watch_history, watchlist, ratings | P0 | 3 |
| 4.6 | **Full-text Search**: tsvector column + trigger trên content (weighted: title A, description B) | P1 | 3 |
| 4.7 | **Seed Data**: Script seed 30+ movies, 5+ series, genres, cast từ dữ liệu thật (TMDB hoặc manual) | P0 | 5 |
| 4.8 | **API - GET /api/content**: List content (filter by genre, type, sort by date/rating/views, pagination) | P0 | 5 |
| 4.9 | **API - GET /api/content/:id**: Content detail + genres + cast + episodes (if series) | P0 | 3 |
| 4.10 | **API - GET /api/genres**: List all genres with content count | P0 | 2 |
| 4.11 | **API - GET /api/content/featured**: Random/curated featured content cho hero banner | P1 | 2 |

### QA Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 4.12 | **API Tests**: Test tất cả content endpoints (list, detail, genres, filter, pagination) | P0 | 5 |

**Total: 41 points**

### Sprint 4 Learning

| Topic | Nội dung học |
|-------|-------------|
| **Database Design** | Normalization (1NF, 2NF, 3NF), many-to-many relationships, indexing strategy |
| **Prisma Migrations** | Schema evolution, migration workflow, seeding data |
| **REST API Design** | RESTful conventions, pagination patterns (offset vs cursor), filtering, sorting |
| **PostgreSQL Full-text Search** | tsvector, tsquery, weights, GIN indexes. So sánh với Elasticsearch |
| **API Versioning** | Tại sao cần /api/v1/? Strategies: URL path vs header |

---

## Sprint 5: Homepage & Browse UI

**Goal:** Homepage giống Netflix với hero banner và content rows.

### FE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 5.1 | **Hero Banner**: Featured content, background image, gradient overlay, title + description + Play + More Info buttons, auto-rotate mỗi 8s | P0 | 8 |
| 5.2 | **Content Row/Carousel**: Horizontal scroll row, left/right arrows on hover, smooth slide animation, drag support (Framer Motion), peek items ở edges | P0 | 8 |
| 5.3 | **Movie Card**: Poster thumbnail, hover expand 1.3x (spring animation, 300ms delay), quick info (title, year, rating, genres), action buttons (Play, Add to List, More Info) | P0 | 8 |
| 5.4 | **Homepage Assembly**: Fetch data từ BE API, render multiple rows (Trending, New Releases, Action, Comedy, Drama, Top Rated) | P0 | 5 |
| 5.5 | **Loading Skeletons**: Skeleton screens cho cards, rows, hero banner | P1 | 3 |
| 5.6 | **Genre Browse Page**: /browse/[genre] - content grid filtered by genre | P1 | 5 |
| 5.7 | **Infinite Scroll hoặc Load More**: Cho genre browse page | P2 | 3 |

**Total: 40 points**

### Sprint 5 Learning

| Topic | Nội dung học |
|-------|-------------|
| **Framer Motion Advanced** | whileHover + scale, drag constraints, AnimatePresence, layout animations, spring physics |
| **React Performance** | useMemo, useCallback, React.memo - khi nào cần optimize? Virtualization cho long lists |
| **Data Fetching (Next.js)** | Server Components fetch vs Client-side fetch. SWR/React Query cho caching + revalidation |
| **Intersection Observer** | Lazy loading images, infinite scroll, scroll-triggered animations |

---

## Sprint 6: Video Upload & Transcode

**Goal:** Pipeline upload video và transcode sang HLS multi-bitrate.

### BE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 6.1 | **Upload API**: POST /api/videos/upload - multipart upload, validate file type/size, save to local/R2 | P0 | 8 |
| 6.2 | **FFmpeg Service**: Transcode video sang HLS multi-bitrate (1080p 5Mbps, 720p 2.5Mbps, 480p 1Mbps, 360p 600Kbps), generate master.m3u8 | P0 | 8 |
| 6.3 | **Storage Service**: Abstract storage layer (local dev / Cloudflare R2 production), upload HLS segments | P0 | 5 |
| 6.4 | **Transcode Queue**: Background job processing (Bull/BullMQ + Redis), track status (queued → processing → done → error) | P1 | 5 |
| 6.5 | **Thumbnail Generation**: Auto-extract thumbnail từ video tại multiple timestamps bằng FFmpeg | P1 | 3 |
| 6.6 | **API - GET /api/videos/:id/stream**: Return master.m3u8 URL (signed URL nếu dùng R2) | P0 | 3 |

### FE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 6.7 | **Admin Upload Page**: Form upload video + metadata input (title, description, genre, cast), drag & drop zone, upload progress bar | P0 | 5 |
| 6.8 | **Transcode Status UI**: Real-time status display (polling hoặc WebSocket) | P1 | 3 |

### QA Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 6.9 | **Upload + Transcode Test**: Upload video → verify HLS output (master.m3u8 + segments) | P0 | 5 |

**Total: 45 points**

### Sprint 6 Learning

| Topic | Nội dung học |
|-------|-------------|
| **HLS Streaming** | HLS protocol là gì? master.m3u8 vs variant playlist. Segments (.ts). Adaptive Bitrate Switching (ABR) |
| **FFmpeg** | Cơ bản FFmpeg CLI, video codecs (H.264), container formats, transcoding pipeline, keyframes |
| **File Upload** | Multipart upload, chunked upload cho file lớn, upload progress tracking |
| **Background Jobs** | Job queue pattern (Bull/BullMQ), Redis as message broker, worker processes |
| **Object Storage** | S3-compatible APIs, signed URLs, content delivery patterns |

---

## Sprint 7: Video Player

**Goal:** Video player hoạt động với HLS adaptive streaming.

### FE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 7.1 | **HLS Player Component**: Integrate hls.js, load master.m3u8, auto adaptive bitrate | P0 | 8 |
| 7.2 | **Custom Player Controls**: Play/Pause, volume slider, progress bar (seek), current time/duration, fullscreen toggle | P0 | 8 |
| 7.3 | **Quality Selector**: Manual quality override (Auto, 1080p, 720p, 480p, 360p) | P1 | 3 |
| 7.4 | **Watch Page**: /watch/[id] - cinema mode layout, auto-hide controls, back button, title overlay | P0 | 5 |
| 7.5 | **Keyboard Shortcuts**: Space (play/pause), F (fullscreen), Esc (exit fullscreen), ←/→ (seek ±10s), ↑/↓ (volume), M (mute) | P1 | 3 |
| 7.6 | **Error Handling**: Network error recovery (auto-retry), unsupported format fallback, loading spinner | P1 | 3 |

### BE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 7.7 | **Watch Progress API**: POST /api/watch-history (save position), GET /api/watch-history/:contentId (get position) | P0 | 3 |
| 7.8 | **Continue Watching API**: GET /api/watch-history/continue (list in-progress content, progress > 5% and < 90%) | P0 | 3 |

### QA Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 7.9 | **Player E2E Test**: Play video → controls work → quality switch → seek → resume from saved position | P0 | 5 |

**Total: 41 points**

### Sprint 7 Learning

| Topic | Nội dung học |
|-------|-------------|
| **hls.js** | Cách hls.js parse manifest, select quality levels, buffer management, error recovery |
| **HTML5 Video API** | HTMLVideoElement events (play, pause, timeupdate, ended), properties (currentTime, duration, volume) |
| **Custom Video Controls** | Tại sao build custom thay vì dùng native controls? CSS styling, progress bar math |
| **Streaming Concepts** | Adaptive Bitrate (ABR) algorithms, buffering strategies, bandwidth estimation |

---

## Sprint 8: Content Detail & Preview Modal

**Goal:** Trang chi tiết phim và preview modal giống Netflix.

### FE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 8.1 | **Preview Modal**: Click card → modal overlay, trailer/preview auto-play, synopsis, cast, genres, maturity rating, Play + Add to List + Like buttons, Similar titles row | P0 | 8 |
| 8.2 | **Content Detail Page**: /title/[id] - hero section với trailer, full info, cast & crew section, similar titles | P0 | 5 |
| 8.3 | **Episode List (Series)**: Season dropdown/tabs, episode cards (thumbnail, title, duration, description), click to play | P0 | 5 |
| 8.4 | **Modal Animations**: Scale + fade open/close (AnimatePresence), backdrop blur, scroll lock | P1 | 3 |
| 8.5 | **Similar Titles Section**: Row of similar content based on shared genres | P1 | 3 |

### BE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 8.6 | **API - GET /api/content/:id/similar**: Content cùng genre, exclude current, limit 12 | P1 | 3 |

**Total: 27 points**

### Sprint 8 Learning

| Topic | Nội dung học |
|-------|-------------|
| **Modal Patterns** | Portal rendering, focus trap, scroll lock, accessibility (aria-modal, role="dialog") |
| **AnimatePresence** | Mount/unmount animations, exit animations, layout animations |
| **React Portals** | Tại sao dùng Portal cho modals? createPortal API, z-index management |
| **Content-based Filtering** | Similarity scoring algorithms, weighted attributes, recommendation basics |

---

## Sprint 9: Search

**Goal:** Search hoạt động nhanh với full-text search PostgreSQL.

### BE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 9.1 | **Search API**: GET /api/search?q= (PostgreSQL tsvector, weighted title > description, rank results) | P0 | 5 |
| 9.2 | **Search Filters**: Filter by genre, type (movie/series), release year range | P1 | 3 |
| 9.3 | **Search Suggestions API**: GET /api/search/suggestions?q= (top 5 title matches, fast query) | P2 | 3 |

### FE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 9.4 | **Search UI**: Click search icon → expand input animation, debounce 300ms, real-time dropdown suggestions | P0 | 5 |
| 9.5 | **Search Results Page**: /search?q= - grid layout, filter sidebar (genre, type, year), sort options | P0 | 5 |
| 9.6 | **Empty State**: "No results found" UI với suggestions | P1 | 2 |

### Bug Fixes

| # | Task | Priority | Points |
|---|------|----------|--------|
| 9.8 | **BUG: Video Player not updating on ID change** - Click play on different videos always shows the same video. URL/ID changes but player doesn't re-render/re-load the new video source. Likely React state/key issue in /watch/[id] page or HLS player component not reacting to prop changes. | P0 | 3 |

### QA Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 9.7 | **Search Tests**: Test search accuracy, filters, empty state, special characters | P0 | 3 |

**Total: 29 points**

### Sprint 9 Learning

| Topic | Nội dung học |
|-------|-------------|
| **Full-text Search** | PostgreSQL tsvector/tsquery, ranking (ts_rank), weights, GIN index performance |
| **Debounce Pattern** | Debounce vs throttle, useDebounce hook, khi nào dùng cái nào |
| **Search UX** | Autocomplete patterns, search-as-you-type, highlighting matches, recent searches |

---

## Sprint 10: User Features (Watchlist, Continue Watching, Profiles)

**Goal:** Các feature cá nhân hóa trải nghiệm user.

### BE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 10.1 | **Watchlist API**: POST /api/watchlist/:contentId (add), DELETE /api/watchlist/:contentId (remove), GET /api/watchlist (list) | P0 | 3 |
| 10.2 | **Ratings API**: POST /api/ratings/:contentId (rate 1-5), GET /api/ratings/my (user's ratings) | P2 | 3 |
| 10.3 | **Profile API**: CRUD /api/profiles (create, update, delete, list per user, max 5 profiles) | P1 | 5 |

### FE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 10.4 | **Watchlist UI**: My List page (grid layout), add/remove button trên cards + detail page + modal, toggle animation | P0 | 5 |
| 10.5 | **Continue Watching Row**: Homepage top row, progress bar on cards, click to resume | P0 | 5 |
| 10.6 | **Profile Selector Screen**: Grid of profile avatars, "Add Profile" button, centered layout | P1 | 5 |
| 10.7 | **Profile Management**: Edit name, change avatar, delete profile | P2 | 3 |

### QA Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 10.8 | **User Features Tests**: Watchlist add/remove, continue watching resume, profile CRUD | P0 | 3 |

**Total: 32 points**

### Sprint 10 Learning

| Topic | Nội dung học |
|-------|-------------|
| **Optimistic Updates** | Update UI trước khi API respond, rollback on error. Tại sao cải thiện UX? |
| **State Management** | Context vs Zustand vs Redux - khi nào dùng gì? Global state patterns |
| **Multi-profile Architecture** | Profile switching, scoped data (watchlist per profile, not per user) |

---

## Sprint 11: Polish, Responsive & Deploy

**Goal:** Hoàn thiện UI, responsive design, optimize, deploy production.

### FE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 11.1 | **Mobile Responsive**: Hamburger menu, touch-friendly cards, swipe carousels, bottom nav (optional) | P0 | 8 |
| 11.2 | **Tablet Responsive**: Hybrid layout, adjusted grid columns, touch gestures | P1 | 5 |
| 11.3 | **Page Transitions**: Smooth fade/slide transitions giữa pages (Framer Motion) | P2 | 3 |
| 11.4 | **Image Optimization**: Next.js Image, lazy loading, blur placeholder, responsive srcset | P1 | 3 |
| 11.5 | **SEO & Meta**: Dynamic meta tags, Open Graph cho sharing, sitemap.xml | P2 | 3 |
| 11.6 | **Error Pages**: Custom 404, 500 pages Netflix-style | P1 | 2 |
| 11.7 | **Accessibility Pass**: Keyboard navigation, aria labels, focus indicators, color contrast | P1 | 3 |

### BE Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 11.8 | **Rate Limiting**: Express rate limiter middleware | P1 | 2 |
| 11.9 | **API Documentation**: Swagger/OpenAPI docs | P2 | 3 |
| 11.10 | **Error Handling**: Global error handler, structured error responses | P1 | 2 |

### DevOps Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 11.11 | **Deploy FE**: Vercel, environment variables, domain config | P0 | 3 |
| 11.12 | **Deploy BE**: Railway/Render, PostgreSQL production, environment variables | P0 | 5 |
| 11.13 | **CI/CD**: GitHub Actions - lint, test, build on PR | P1 | 5 |

### QA Tasks

| # | Task | Priority | Points |
|---|------|----------|--------|
| 11.14 | **Final Regression**: Full E2E test suite, cross-browser (Chrome, Firefox, Safari), mobile responsive check | P0 | 5 |
| 11.15 | **Performance Audit**: Lighthouse score > 90, Core Web Vitals pass | P0 | 3 |

**Total: 52 points**

### Sprint 11 Learning

| Topic | Nội dung học |
|-------|-------------|
| **Deployment** | Vercel deployment workflow, Railway/Render for backend, environment variables management |
| **CI/CD** | GitHub Actions basics, automated testing on PR, deployment pipeline |
| **Web Performance** | Core Web Vitals (LCP, INP, CLS), Lighthouse optimization tips, bundle analysis |
| **Accessibility** | WCAG 2.1 AA basics, screen reader testing, keyboard navigation patterns |
| **Production Readiness** | Error monitoring (Sentry), logging, rate limiting, security headers |

---

## Backlog Summary

| Sprint | Focus | Points | Assignees | Status |
|--------|-------|--------|-----------|--------|
| Sprint 1 | Netflix Research | - | All | DONE |
| Sprint 2 | Project Setup & Auth | 66 | BE + FE + QA | Backlog |
| Sprint 3 | Landing Page & Layout | 34 | FE | Backlog |
| Sprint 4 | DB Schema & Content API | 41 | BE + QA | Backlog |
| Sprint 5 | Homepage & Browse UI | 40 | FE | Backlog |
| Sprint 6 | Video Upload & Transcode | 45 | BE + FE + QA | Backlog |
| Sprint 7 | Video Player | 41 | FE + BE + QA | Backlog |
| Sprint 8 | Content Detail & Preview Modal | 27 | FE + BE | Backlog |
| Sprint 9 | Search | 26 | BE + FE + QA | Backlog |
| Sprint 10 | User Features | 32 | BE + FE + QA | Backlog |
| Sprint 11 | Polish & Deploy | 52 | All | Backlog |

**Total: 10 sprints remaining (~404 story points)**

---

## Dependencies

```
Sprint 2 (Auth) ──────────► Sprint 3 (Landing/Layout)
                 ──────────► Sprint 4 (DB/API) ──────► Sprint 5 (Homepage UI)
                                       │
                                       ▼
                             Sprint 6 (Upload/Transcode) ──► Sprint 7 (Player)
                                                                    │
Sprint 5 (Homepage) + Sprint 7 (Player) ──► Sprint 8 (Detail/Modal)
                                            Sprint 9 (Search)
                                            Sprint 10 (User Features)
                                                    │
                                                    ▼
                                            Sprint 11 (Polish/Deploy)
```

## Notes

- Mỗi sprint kết thúc có phần **Sprint Learning** để Boss học thêm
- FE và BE có thể chạy song song từ Sprint 3+4 (FE làm Landing, BE làm DB/API)
- Priority P0 phải hoàn thành, P1/P2 có thể defer sang sprint sau
- Sprint order có thể điều chỉnh dựa trên dependencies
