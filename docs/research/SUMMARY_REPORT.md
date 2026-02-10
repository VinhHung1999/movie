# Netflix Research - Final Summary Report

**Compiled by:** SM (Scrum Master)
**Date:** 2026-02-06
**Sprint:** 1 - Research Phase
**Reports Reviewed:** TL, FE, BE, QA (all excellent quality)

---

## Executive Summary

Sprint 1 Research Phase is complete. All 4 team members delivered comprehensive research reports analyzing how Netflix operates across architecture, frontend, backend, and quality assurance. This summary consolidates key findings and provides actionable recommendations for WebPhim MVP development.

**Key Insight:** Netflix operates at massive scale (325M+ subscribers, thousands of microservices, $1B+ CDN investment), but its core UX patterns, design principles, and architectural decisions can be adapted for WebPhim at a fraction of the complexity.

---

## 1. Architecture Overview (TL Report)

### Netflix's Architecture
- **Microservices:** Thousands of independent services, migrated from monolith over 7 years (2009-2016)
- **Infrastructure:** 100% AWS (except CDN hardware), 4 AWS regions
- **Data:** Polyglot persistence - Cassandra, CockroachDB, MySQL, EVCache (400M ops/sec)
- **Messaging:** Apache Kafka processing 2 trillion messages/day
- **CDN:** Open Connect - 19,000+ appliances in 1,500+ ISP locations, serves 100% of video traffic
- **Deployment:** Spinnaker handles thousands of daily deployments with canary analysis
- **Resilience:** Chaos Engineering (Simian Army) proactively tests failure scenarios

### Netflix OSS (Open Source)
| Tool | Pattern |
|------|---------|
| Eureka | Service Discovery |
| Zuul | API Gateway |
| Hystrix | Circuit Breaker |
| Ribbon | Client-Side Load Balancing |

### Design System
- **Colors:** Dark theme with Netflix Red (#E50914), black backgrounds (#141414)
- **Typography:** Custom "Netflix Sans" typeface (Inter as open-source alternative)
- **Layout:** Hero banner + horizontal scrolling carousel rows
- **Thumbnails:** Personalized per user, drive 80%+ of viewing decisions

---

## 2. Frontend Patterns (FE Report)

### Core UI Components
| Component | Key Details |
|-----------|-------------|
| **Hero Banner** | Full-screen, auto-play trailer (muted), gradient overlay, CTA buttons |
| **Carousel Rows** | Horizontal scroll, 4-6 items/row, left/right arrows on hover |
| **Movie Card** | Hover: scale 1.3x, video preview, action buttons, 300ms delay |
| **Navbar** | Transparent at top, solid black on scroll, sticky positioning |
| **Preview Modal** | AnimatePresence transitions, full details, similar titles |
| **Video Player** | Minimal controls, fade on idle, skip intro/credits |

### Animation Stack
- **Framer Motion** for all animations (spring physics, AnimatePresence, drag)
- Card hover scale, carousel sliding, modal open/close, skeleton loading
- GPU-accelerated using `transform` and `opacity`

### Responsive Design
| Device | Cards/Row | Navigation |
|--------|-----------|------------|
| Mobile (<640px) | 2-3 | Hamburger menu |
| Tablet (640-1024px) | 3-4 | Condensed navbar |
| Desktop (1024-1920px) | 4-6 | Full navbar |
| TV (>1920px) | 5-7 | Remote-friendly |

### Landing Page Structure
1. Hero section with email capture CTA
2. Alternating feature sections (Watch on TV, Download, Watch Everywhere, Kids)
3. FAQ accordion
4. Pricing tiers (Basic/Standard/Premium)
5. 5-step signup flow with progress indicator

### Component Build Priority
1. Landing Page → 2. Auth Pages → 3. Navbar → 4. Hero Banner → 5. Carousel → 6. Movie Card → 7. Preview Modal → 8. Video Player → 9. Profile Selector → 10. Search

---

## 3. Backend Architecture (BE Report)

### API Design
- Netflix uses Federated GraphQL (150+ subgraphs, 3000+ types)
- **WebPhim recommendation:** Start with REST (Next.js API Routes), migrate to GraphQL when needed
- API structure: `/api/v1/auth`, `/api/v1/catalog`, `/api/v1/recommendations`, `/api/v1/playback`, `/api/v1/user`

### Video Streaming
- Netflix uses DASH + Widevine DRM + AV1 codec
- **WebPhim recommendation:** HLS + H.264 (universal browser support)
- Encoding ladder: 1080p (5Mbps), 720p (2.5Mbps), 480p (1Mbps), 360p (600Kbps)
- FFmpeg for transcoding pipeline (multi-bitrate HLS with master playlist)
- Frontend player: Video.js or hls.js

### Database Schema (PostgreSQL)
Complete schema designed with:
- **Users & Auth:** users, profiles (multi-profile support)
- **Content Catalog:** content, series_seasons, episodes, genres, cast_crew
- **User Interactions:** watch_history, watchlist, ratings
- **Full-Text Search:** tsvector with GIN index on content
- Strategic indexes for authentication, browsing, continue watching, watchlist

### Redis Caching Strategy
| Use Case | TTL | Pattern |
|----------|-----|---------|
| User sessions | 24h | String (JSON) |
| Home page rows | 5-10min | String (JSON) |
| Continue watching | 30min | Sorted Set |
| Content metadata | 6h | Hash |
| Trending content | 15min | Sorted Set |

Target: 95-99% cache hit rate

### Authentication
- NextAuth.js with JWT (Credentials + Google + GitHub providers)
- Subscription tiers: Free, Basic ($9.99), Standard ($15.99), Premium ($19.99)
- Concurrent stream enforcement with heartbeat-based tracking (5min timeout)

### Recommendation Engine (MVP, No ML)
1. Genre-based recommendations (weighted by watch history)
2. Content similarity ("Because You Watched X") - genre, director, actor overlap scoring
3. Trending/Popular (time-weighted view counts)
4. Continue Watching (progress 5%-90%)

Homepage row priority: Continue Watching → Because You Watched → Trending → Top Picks → New Releases → Popular in Country

### CDN & Storage
- **Recommended:** Cloudflare R2 + CDN (zero egress fees = 98% bandwidth savings vs AWS S3)
- Cost estimate: ~$175/month for <10K users, ~$460/month for 10K-100K users
- HLS segment storage structure: `/videos/movie-{id}/stream_{quality}/segment_XXX.ts`

---

## 4. Quality & Testing (QA Report)

### Testing Strategy (Testing Pyramid: 70/20/10)
| Level | Tools | Coverage Target |
|-------|-------|-----------------|
| **Unit (70%)** | Vitest + React Testing Library | 90% branches/functions/lines |
| **Integration (20%)** | Supertest + Testcontainers + MSW | API contracts, DB integrity |
| **E2E (10%)** | Playwright (cross-browser) | Critical user flows |

### Performance Benchmarks
| Metric | Target |
|--------|--------|
| LCP | <= 2.5s |
| INP | <= 200ms |
| CLS | <= 0.1 |
| Video Startup Time | < 2s |
| Rebuffering Ratio | < 0.5% |
| API p95 Response | < 200ms (catalog), < 300ms (search) |
| JS Bundle (mobile) | < 200KB gzipped |

### Error Handling Patterns
- **Circuit Breaker:** Monitor service health, fallback on failure threshold
- **Bulkhead:** Isolate resources per service to prevent cascade
- **Retry with Exponential Backoff + Jitter:** For transient failures
- **Next.js Error Boundaries:** `error.tsx` per route segment
- **Video Player Recovery:** HLS.js auto-recovery for network/media errors

### A/B Testing
- Custom Next.js middleware for variant assignment (cookie-based)
- Test: thumbnails, layouts, player UI, onboarding flow
- Statistical requirements: 95% confidence, 80% power, 1-2 week minimum duration

### Accessibility (WCAG 2.1 AA Target)
- Keyboard navigation for all player controls and carousels
- Closed captions with `<track>` elements
- Screen reader compatibility (semantic HTML, aria-labels, live regions)
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Focus management with skip links and roving tabindex
- Tools: axe-core, jest-axe, eslint-plugin-jsx-a11y, Lighthouse (target > 90)

### CI/CD Pipeline
- GitHub Actions: unit tests → integration tests (with PostgreSQL service) → E2E tests (Playwright)
- Test organization: `__tests__/` (unit), `integration/` (API/DB), `e2e/` (Playwright)

---

## 5. Consolidated Tech Stack for WebPhim

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14+ (App Router) | SSR, API routes, file-based routing |
| **UI** | React + Tailwind CSS | Rapid styling, responsive design |
| **Animation** | Framer Motion | Spring physics, gesture support |
| **Icons** | Heroicons / Lucide React | Consistent icon set |
| **Auth** | NextAuth.js + JWT | Multi-provider, battle-tested |
| **Database** | PostgreSQL + Prisma ORM | Relational integrity, type-safe ORM |
| **Cache** | Redis | Sessions, content, streaming state |
| **API** | REST (Next.js API Routes) | Simple, adequate for MVP |
| **Streaming** | HLS + H.264 + FFmpeg | Universal browser support |
| **Player** | Video.js or hls.js | Free, well-documented |
| **CDN/Storage** | Cloudflare R2 + CDN | Zero egress, S3-compatible |
| **Testing** | Vitest + Playwright + Supertest | Full testing pyramid |
| **Error Tracking** | Sentry | Error + performance monitoring |
| **Deployment** | Vercel | Optimized for Next.js |

### Design System

```css
:root {
  --primary-red: #E50914;
  --dark-red: #B20710;
  --bg-primary: #141414;
  --bg-secondary: #1F1F1F;
  --bg-card: #2F2F2F;
  --text-primary: #FFFFFF;
  --text-secondary: #B3B3B3;
  --text-muted: #808080;
}
/* Font: Inter (open-source alternative to Netflix Sans) */
```

---

## 6. Implementation Roadmap

| Phase | Sprint | Focus | Key Deliverables |
|-------|--------|-------|------------------|
| **1** | 2-3 | Auth + Profiles | User signup/login, profile management, NextAuth.js setup |
| **2** | 4-5 | Content Catalog | DB schema, content CRUD API, genres, search |
| **3** | 6-7 | Video Pipeline | FFmpeg transcoding, HLS encoding, R2 storage |
| **4** | 8-9 | Streaming + Player | Video playback, ABR, continue watching |
| **5** | 10+ | Recommendations + Polish | Homepage rows, watchlist, trending, responsive design |

---

## 7. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Video transcoding complexity | High | Start with single-bitrate HLS, add multi-bitrate later |
| CDN costs at scale | Medium | Cloudflare R2 zero-egress model |
| Performance on mobile | Medium | Performance budgets, lazy loading, image optimization |
| Accessibility compliance | Medium | Integrate a11y testing from Sprint 2, axe-core in CI |
| Scope creep | High | SM monitors scope, PO manages backlog strictly |

---

## Sources

All sources are cited in individual team reports:
- **TL Report:** `docs/research/netflix-architecture.md` (30+ sources)
- **FE Report:** `docs/research/netflix-frontend.md` (8+ sources)
- **BE Report:** `docs/research/netflix-backend.md` (15+ sources)
- **QA Report:** `docs/research/netflix-qa-quality.md` (18+ sources)

---

*Report compiled by SM from TL, FE, BE, and QA research submissions.*
