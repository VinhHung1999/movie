# Netflix QA & Quality Research - WebPhim

**Author:** QA Team
**Date:** 2026-02-06
**Sprint:** 1 - Research

---

## Table of Contents

1. [Testing Strategies](#1-testing-strategies)
2. [Performance Benchmarks](#2-performance-benchmarks)
3. [A/B Testing Approach](#3-ab-testing-approach)
4. [Error Handling & Fallback Patterns](#4-error-handling--fallback-patterns)
5. [Accessibility Standards](#5-accessibility-standards)

---

## 1. Testing Strategies

### 1.1 Unit Testing

#### Recommended Frameworks & Tools

**For React Components:**
- **React Testing Library** - Industry standard, focusing on user interaction patterns
- **Vitest** - Modern, fast alternative to Jest with better ESM support and Next.js 14+ compatibility
- **Jest** - Traditional choice with extensive ecosystem support

**For Node.js Backend:**
- **Jest** - Comprehensive testing framework with built-in mocking and coverage
- **Vitest** - Faster execution with native TypeScript support
- **Supertest** - HTTP assertion library for API endpoint testing

#### What to Test

**React Components (Client-Side):**
- Pure Components: accept props and output JSX - primary testing focus
- User Interactions: button clicks, form submissions, input validation
- Conditional Rendering: loading states, error states, empty states
- Edge Cases: missing props, null/undefined data, network failures

**Services & Utilities:**
- API Service Layer: request/response handling, error management, retry logic
- Data Transformations: parsers, formatters, data normalizers
- Business Logic: video recommendation algorithms, subscription validation
- Authentication Utilities: token management, session handling
- Custom Hooks: React hooks for data fetching, state management

**Node.js Backend:**
- API Endpoints: input validation, response formats, status codes
- Database Models: CRUD operations, relationships, constraints
- Middleware: authentication, authorization, rate limiting

#### Coverage Targets

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    }
  }
}
```

#### Best Practices

1. **Test Features, Not Functions** - Focus on what matters to users
2. **Test User Behavior** - Write tests from the user's perspective
3. **Cover All Input/Output** - Every input and output of a component
4. **Avoid Over-Mocking** - Use real implementations when possible
5. **Fast Execution** - Unit tests should run in milliseconds

### 1.2 Integration Testing

#### Netflix's Approach

Netflix's integration testing focuses on **microservices testing through REST endpoints** rather than JAR dependencies, achieving test runtimes of 4-90 seconds.

#### What to Test

**API Integration:**
- REST Endpoint Integration
- Request/Response Contracts
- Error Propagation
- Authentication Flow
- Rate Limiting

**Database Integration:**
- ORM/Query Layer
- Transaction Management
- Connection Pooling
- Migration Scripts
- Data Integrity (foreign keys, constraints, cascading deletes)

**Third-Party Services:**
- Payment Gateways (Stripe/PayPal sandbox)
- CDN Integration
- Email Services
- Analytics
- Video Transcoding

#### Tools

```bash
npm install --save-dev supertest                    # API testing
npm install --save-dev @testcontainers/postgresql   # DB testing
npm install --save-dev nock msw                     # Mock external services
```

#### Example

```typescript
import request from 'supertest';
import app from '../server';

describe('Video Streaming API', () => {
  it('should fetch video metadata and stream URL', async () => {
    const response = await request(app)
      .get('/api/videos/123')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body).toHaveProperty('streamUrl');
    expect(response.body).toHaveProperty('metadata');
  });
});
```

### 1.3 End-to-End (E2E) Testing

#### Tool Selection

| Feature | Playwright (Recommended) | Cypress |
|---------|--------------------------|---------|
| Cross-browser | Chromium, Firefox, WebKit | Chromium-based |
| Auto-waiting | Built-in | Plugin-based |
| Parallel execution | Native | Dashboard required |
| Async component support | Excellent | Limited |

#### Next.js 14+ Specific Guidance

**Testing Approach by Component Type:**
- **Client Components**: Vitest + React Testing Library (unit tests)
- **Synchronous Server Components**: Vitest + React Testing Library
- **Async Server Components**: Playwright (E2E tests) - recommended over unit testing

#### Critical User Flows

**Authentication:**
- Sign up -> Email verification -> Login -> Dashboard
- Social login, Password reset, Session persistence

**Content Discovery:**
- Browse homepage -> Category navigation -> Video detail
- Search -> Filter results -> Play video

**Video Playback:**
- Click play -> Video loads -> Controls work
- Quality adjustment, Subtitle selection
- Continue watching (resume from bookmark)

#### Playwright Config

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 1.4 Testing at Scale - Netflix Patterns

#### Chaos Engineering - The Simian Army

| Tool | Purpose |
|------|---------|
| Chaos Monkey | Randomly shuts down server instances |
| Latency Monkey | Introduces artificial network latency |
| Chaos Gorilla | Simulates entire AWS AZ outages |
| Chaos Kong | Simulates entire AWS region failures |

**Real-World Impact:** During AWS's September 2014 outage affecting 10% of servers, Netflix remained fully operational with zero user impact.

#### Canary Deployments

**Three-Cluster System:**
1. **Production Cluster** - Stable version, majority traffic
2. **Baseline Cluster** - Current stable for comparison
3. **Canary Cluster** - New version, small traffic %

**Kayenta Platform** (Open-sourced by Netflix & Google):
- Automated canary analysis
- Sequential statistical tests to detect regressions
- Catches 0.01% regressions
- Automated rollback on metric degradation

```
Code Deploy -> Canary (5% traffic) -> Automated Metrics Analysis
  | (Pass)                              | (Fail)
Full Rollout (100%)              Automated Rollback
```

### 1.5 Test Organization

```
project/
├── __tests__/              # Unit tests
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── lib/
├── e2e/                    # E2E tests (Playwright)
│   ├── auth.spec.ts
│   ├── video-playback.spec.ts
│   └── helpers/
├── integration/            # Integration tests
│   ├── api/
│   ├── database/
│   └── services/
└── tests/
    ├── setup.ts
    ├── mocks/
    └── fixtures/
```

**Testing Pyramid:** 70% unit, 20% integration, 10% E2E

### 1.6 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit -- --coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
```

---

## 2. Performance Benchmarks

### 2.1 Core Web Vitals Targets

| Metric | Good | Poor | Description |
|--------|------|------|-------------|
| **LCP** | <= 2.5s | > 4.0s | Largest Contentful Paint |
| **INP** | <= 200ms | > 500ms | Interaction to Next Paint |
| **CLS** | <= 0.1 | > 0.25 | Cumulative Layout Shift |
| **TTFB** | < 600ms | > 800ms | Time to First Byte |
| **FCP** | < 1.8s | > 3.0s | First Contentful Paint |
| **TBT** | < 200ms | > 600ms | Total Blocking Time |

### 2.2 Video Streaming Quality Metrics

| Metric | Target | Critical Threshold |
|--------|--------|--------------------|
| **Video Startup Time** | < 2s | < 3s |
| **Rebuffering Ratio** | < 0.5% | < 1% |
| **Seek Latency** | < 1s | < 2s |
| **Quality Switches** | < 3/min | < 5/min |
| **Error Rate** | < 0.1% | < 0.5% |

**Adaptive Bitrate Quality Levels:**

| Quality | Resolution | Bitrate |
|---------|------------|---------|
| SD | 480p | 1-3 Mbps |
| HD | 720p | 3-5 Mbps |
| Full HD | 1080p | 5-8 Mbps |
| 4K | 2160p | 15-25 Mbps |

### 2.3 API Response Time Benchmarks

| Endpoint Type | p95 Target | p99 Target |
|---------------|------------|------------|
| Catalog/Browse | < 200ms | < 500ms |
| Search | < 300ms | < 700ms |
| User profile | < 150ms | < 400ms |
| Content metadata | < 100ms (cached) | < 300ms |

### 2.4 Mobile vs Desktop Targets

| Metric | Mobile (4G) | Desktop |
|--------|-------------|---------|
| LCP | < 2.5s | < 2.0s |
| FCP | < 1.8s | < 1.5s |
| INP | < 200ms | < 150ms |
| CLS | < 0.1 | < 0.05 |
| Video startup | < 3s | < 2s |
| Buffering ratio | < 1% | < 0.5% |
| JS bundle (gzip) | < 200KB | < 400KB |
| Total page weight | < 1MB | < 1.5MB |

### 2.5 Performance Budgets

- JavaScript bundle: < 200KB mobile, < 400KB desktop (gzipped)
- Total page weight: < 1MB initial load
- Number of requests: < 50 for initial page
- CDN cache hit ratio: > 95%
- Edge latency: < 50ms for cached content

### 2.6 Measurement & Monitoring Tools

**Recommended Stack:**

| Category | Tools |
|----------|-------|
| Core Web Vitals | Vercel Analytics, Lighthouse |
| Video Performance | Mux Data, custom metrics |
| Synthetic Testing | Lighthouse CI, WebPageTest |
| Error Tracking | Sentry |
| Full-stack | New Relic / Datadog |

**Alert Thresholds:**
- LCP > 2.5s for > 10% of users
- Video startup time > 3s
- Buffering ratio > 1%
- API p95 > 500ms

---

## 3. A/B Testing Approach

### 3.1 Netflix's Philosophy

Netflix has built a **culture of experimentation** with thousands of experiments annually:
- Data-driven decision making over HiPPO (Highest Paid Person's Opinion)
- Data scientists heavily involved in design, execution, and analysis
- Automation-first platform for experiment kickoff and analysis
- Personalization engine drives 80% of streams

### 3.2 What to A/B Test

| Category | Testing Variables |
|----------|-------------------|
| **Thumbnails** | Color contrast, text overlay, character positioning, emotional tone |
| **Recommendations** | Algorithm variations, row ordering, content grouping |
| **UI Layouts** | Grid vs list, items per row, navigation structure |
| **Video Player** | Skip intro placement, progress bar design, countdown timer |
| **Onboarding** | Registration form length, plan presentation, trial messaging |

**Key Insight:** Netflix improved navigation by 18% through thumbnail testing alone.

### 3.3 Tools for Next.js

| Feature | LaunchDarkly | Optimizely | Custom Middleware |
|---------|--------------|------------|-------------------|
| Cost | High | Medium-High | Low (dev time) |
| Feature Flags | Excellent | Good | Manual |
| A/B Testing | Good | Excellent | Manual |
| Edge Support | Yes | Yes | Yes (native) |
| Vendor Lock-in | Yes | Yes | No |

#### Custom Next.js Middleware Solution

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const variant = request.cookies.get('ab_test_variant')?.value ||
    Math.random() < 0.5 ? 'A' : 'B'

  const response = NextResponse.next()

  if (!request.cookies.get('ab_test_variant')) {
    response.cookies.set('ab_test_variant', variant)
  }

  if (variant === 'B' && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/variant-b', request.url))
  }

  return response
}
```

### 3.4 Statistical Considerations

- **Confidence Level:** Typically 95%
- **Statistical Power:** Typically 80%
- **Thumbnails/CTR tests:** 10,000-50,000 impressions per variant
- **UI layout changes:** 100,000+ unique users for small effects
- **Test duration:** Minimum 1-2 weeks for weekly viewing cycles

**Common Pitfalls:**
- Peeking Problem: Don't stop tests early
- Multiple Comparisons: Adjust significance levels
- Novelty Effect: Long-term vs short-term impact
- Segment Pollution: Users switching between variants

### 3.5 Feature Flags Pattern (Next.js 14+)

```typescript
// Server Component pattern
export default async function HomePage() {
  const user = await getCurrentUser()
  const flags = await getFeatureFlags(user.id)

  return (
    <div>
      {flags.newPlayerUI ? <NewPlayer /> : <LegacyPlayer />}
    </div>
  )
}
```

### 3.6 Metrics to Track

| Category | Metrics |
|----------|---------|
| **Engagement** | CTR, avg view duration, watch time |
| **Retention** | Day 1/7/30 retention, subscription retention, completion rate |
| **UX** | Session duration, bounce rate, time to first play |
| **Business** | Conversion rate, ARPU, subscriber growth |
| **Technical** | Video start time, buffering ratio, error rate |

---

## 4. Error Handling & Fallback Patterns

### 4.1 Netflix's Resilience Patterns

#### Circuit Breaker Pattern

Monitors service health, opens circuit when failure threshold exceeded, returns fallback responses.

**States:** CLOSED (normal) -> OPEN (blocking) -> HALF_OPEN (testing recovery)

```typescript
class CircuitBreaker {
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

#### Bulkhead Pattern

Isolates resources into separate pools, preventing failure cascade:

```typescript
const videoBulkhead = new Bulkhead(10, 100);      // Video service
const metadataBulkhead = new Bulkhead(20, 200);    // Metadata service
const authBulkhead = new Bulkhead(5, 50);          // Auth service
```

#### Retry with Exponential Backoff

```typescript
async function withRetry<T>(fn: () => Promise<T>, config: RetryConfig): Promise<T> {
  let attempt = 0;
  let delay = config.initialDelay;

  while (attempt < config.maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= config.maxAttempts) throw error;
      const jitter = Math.random() * 0.3 * delay;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }
}
```

### 4.2 Frontend Error Boundaries (Next.js 14+)

#### App Router Error Boundaries

```typescript
// app/error.tsx - Root error boundary
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/watch/[id]/error.tsx - Video-specific error boundary
// app/global-error.tsx - Global fallback (replaces <html>)
```

### 4.3 Graceful Degradation

| Strategy | When | How |
|----------|------|-----|
| **Offline mode** | No internet | Show cached/downloaded content |
| **Low bandwidth** | Slow connection | Reduce video quality, lazy load images |
| **CDN failure** | Edge server down | Fallback to alternate CDN, then origin |
| **API failure** | Backend down | Show cached data, skeleton screens |

#### Network-Aware Quality Adaptation

```typescript
getOptimalQuality(): 'high' | 'medium' | 'low' {
  if (networkInfo.saveData) return 'low';
  switch (networkInfo.effectiveType) {
    case '4g': return 'high';
    case '3g': return 'medium';
    case '2g': return 'low';
  }
}
```

### 4.4 Video Player Error Handling

| Error Type | Recoverable | Action |
|------------|-------------|--------|
| Network error | Yes | Reload source, retry |
| Decode error | No | Show error, suggest different browser |
| Source not supported | No | Show format error |
| DRM license error | Sometimes | Refresh license |
| Buffer stall | Yes | Seek forward slightly |

#### HLS.js Error Recovery

```typescript
hls.on(Hls.Events.ERROR, (event, data) => {
  if (data.fatal) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        hls.startLoad();         // Try to recover
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        hls.recoverMediaError(); // Try to recover
        break;
      default:
        hls.destroy();           // Unrecoverable
        break;
    }
  }
});
```

### 4.5 API Error Handling

**Structured Error Codes:**

| Code | Description | Retryable |
|------|-------------|-----------|
| AUTH_UNAUTHORIZED | Please sign in | No |
| AUTH_TOKEN_EXPIRED | Session expired | No (re-auth) |
| VIDEO_NOT_FOUND | Video unavailable | No |
| RATE_LIMIT_EXCEEDED | Too many requests | Yes (backoff) |
| SERVICE_UNAVAILABLE | Temporarily unavailable | Yes |

**Retryable HTTP Status Codes:** 408, 429, 500, 502, 503, 504

### 4.6 Fallback UI Patterns

| Pattern | Use Case |
|---------|----------|
| **Skeleton screens** | Initial loading, lazy loading |
| **Placeholder content** | Empty states (no search results, no favorites) |
| **Error states** | API failures, video errors |
| **Progressive loading** | Infinite scroll, load more |

### 4.7 Monitoring & Alerting

**Recommended Stack:**

| Tool | Purpose |
|------|---------|
| **Sentry** | Error tracking, performance monitoring, session replay |
| **LogRocket** | Session replay, user behavior tracking |
| **Custom metrics** | Video startup time, buffering, bitrate switches |

**Video Quality Metrics to Monitor:**
- Buffering count & duration
- Quality switches
- Average bitrate
- Startup time
- Rebuffer ratio (buffering time / total time)
- Playback errors by type

---

## 5. Accessibility Standards

### 5.1 WCAG 2.1 AA Requirements

**Level A (Minimum):**
- All player functions operable via keyboard
- Text alternatives for non-text content
- Content perceivable without color alone

**Level AA (Target):**
- Closed Captions (SC 1.2.4) for all pre-recorded audio
- Audio Descriptions (SC 1.2.5) for all pre-recorded video
- Color contrast: 4.5:1 for normal text, 3:1 for large text (18pt+)

### 5.2 Video Player Accessibility

**Required Keyboard Controls:**

| Key | Action |
|-----|--------|
| Enter/Space | Play/Pause |
| F | Toggle fullscreen |
| Esc | Exit fullscreen |
| Arrow Left/Right | Rewind/Forward (5-10s) |
| Arrow Up/Down | Volume control |
| M | Mute/Unmute |
| C | Toggle captions |
| Tab | Navigate between controls |

**Caption Requirements:**
- Include all spoken dialogue
- Include meaningful non-speech audio
- Accurately synchronized
- Identify all speakers
- Use `<track>` elements (not burned-in)

```html
<video controls>
  <source src="/video.mp4" type="video/mp4" />
  <track kind="captions" src="/captions-en.vtt" srclang="en" label="English" default />
  <track kind="captions" src="/captions-es.vtt" srclang="es" label="Espanol" />
</video>
```

### 5.3 Screen Reader Compatibility

**Key Patterns:**
- Use semantic HTML (`<section>`, `<article>`, `<nav>`)
- Provide `aria-label` for interactive elements
- Use `role="list"` and `role="listitem"` for carousels
- Hidden text with `.sr-only` class for context
- Live regions (`aria-live="polite"`) for dynamic updates

```tsx
<section aria-label={title}>
  <h2 id={`${title}-heading`}>{title}</h2>
  <div role="list" aria-labelledby={`${title}-heading`}>
    {movies.map(movie => (
      <article role="listitem" key={movie.id}>
        <a aria-label={`${movie.title}. Rating: ${movie.rating}`}>
          <img src={movie.thumbnail} alt={movie.title} />
        </a>
      </article>
    ))}
  </div>
</section>
```

### 5.4 Keyboard Navigation Patterns

**Carousel Navigation:**
- ArrowRight/Left: Move between items
- Home/End: Jump to first/last item
- Tab: Move to next component group
- Use `tabIndex={index === focusedIndex ? 0 : -1}` (roving tabindex)

**Modal Dialogs:**
- Focus trap within modal
- Esc to close
- Restore focus to trigger element on close
- `role="dialog"`, `aria-modal="true"`

### 5.5 Color Contrast (Tailwind CSS)

```javascript
// tailwind.config.js
colors: {
  netflix: {
    red: '#E50914',        // Primary brand
    'red-dark': '#B20710', // 4.5:1 on white
    black: '#141414',      // Background
    'gray-mid': '#808080', // 4.5:1 on dark bg
    white: '#FFFFFF',
  }
}
```

**Focus Indicators:**
```css
*:focus-visible {
  outline: 2px solid #E50914;
  outline-offset: 2px;
}
```

### 5.6 Focus Management in Next.js

```tsx
// hooks/useFocusOnNavigation.ts
export function useFocusOnNavigation() {
  const pathname = usePathname();
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    mainContent?.focus();
  }, [pathname]);
}

// app/layout.tsx - Skip links
<a href="#main-content" className="skip-link">Skip to main content</a>
<main id="main-content" tabIndex={-1}>{children}</main>
```

### 5.7 Testing Tools

| Tool | Type | Purpose |
|------|------|---------|
| **axe-core** | Automated | Runtime accessibility violations |
| **jest-axe** | Unit test | Test components for a11y violations |
| **eslint-plugin-jsx-a11y** | Linting | Catch issues at build time |
| **Lighthouse** | Audit | Accessibility scoring (target: > 90) |
| **VoiceOver** | Manual | macOS screen reader testing |
| **NVDA** | Manual | Windows screen reader testing |

```bash
npm install --save-dev @axe-core/react jest-axe eslint-plugin-jsx-a11y
```

### 5.8 Legal Requirements

| Regulation | Scope | Standard |
|------------|-------|----------|
| **ADA Title III** | Private businesses | WCAG 2.1 AA (court-referenced) |
| **ADA Title II** | Government websites | WCAG 2.1 AA (mandatory by April 2026) |
| **Section 508** | Federal agencies | WCAG 2.0 AA (moving to 2.1) |

**Risk Mitigation:**
- Conduct regular accessibility audits
- Document remediation efforts
- Provide accessibility statement on website
- Include accessibility in development workflow

### 5.9 Netflix's Accessibility Practices

**What Netflix does well:**
- 10,000+ hours of audio descriptions in 30+ languages
- Customizable caption appearance
- Screen reader support across web, iOS, Android
- VoiceOver/TalkBack integration

**Areas to improve upon:**
- Better keyboard navigation between categories
- More intuitive carousel navigation
- Smoother focus management during transitions

---

## Sources

### Testing Strategies
- [Testing in Production the Netflix Way | LaunchDarkly](https://launchdarkly.com/blog/testing-in-production-the-netflix-way/)
- [Product Integration Testing at the Speed of Netflix | Netflix TechBlog](https://netflixtechblog.com/product-integration-testing-at-the-speed-of-netflix-72e4117734a7)
- [How Netflix Uses Chaos Engineering to Create Resilience Systems](https://newsletter.systemdesign.one/p/chaos-engineering)
- [Guides: Testing | Next.js](https://nextjs.org/docs/app/guides/testing)
- [Introducing Kayenta | Google Cloud Blog](https://cloud.google.com/blog/products/gcp/introducing-kayenta-an-open-automated-canary-analysis-tool-from-google-and-netflix)
- [GitHub - goldbergyoni/nodejs-testing-best-practices](https://github.com/goldbergyoni/nodejs-testing-best-practices)

### Performance Benchmarks
- [Core Web Vitals Metrics And Thresholds | DebugBear](https://www.debugbear.com/docs/core-web-vitals-metrics)
- [Top Five QoE Metrics to Boost Video Streaming | FastPix](https://www.fastpix.io/blog/five-qoe-metrics-for-every-streaming-platform)
- [Quality of Experience in Video Streaming | Mux](https://www.mux.com/articles/qoe)
- [Netflix Tech Stack: CDN and Microservices | VdoCipher](https://www.vdocipher.com/blog/netflix-tech-stack-and-architecture/)

### A/B Testing
- [Netflix's Personalization Powerhouse: A/B Testing at Scale](https://medium.com/@productbrief/netflixs-personalization-powerhouse-how-a-b-testing-at-scale-built-a-300b-streaming-giant-f26804e0d92c)
- [A/B Testing and Beyond | Netflix TechBlog](https://netflixtechblog.com/a-b-testing-and-beyond-improving-the-netflix-streaming-experience-with-experimentation-and-data-5b0ae9295bdf)
- [A/B testing with Next.js middleware | Plasmic](https://www.plasmic.app/blog/nextjs-ab-testing)
- [Optimizely Feature Experimentation with Next.js](https://vercel.com/kb/guide/how-to-integrate-optimizely-feature-experimentation-next-vercel)

### Error Handling
- [Netflix/Hystrix GitHub Wiki](https://github.com/Netflix/Hystrix/wiki/How-it-Works)
- [Resilience4j Documentation](https://resilience4j.readme.io/docs/comparison-to-netflix-hystrix)
- [Error Handling | Next.js](https://nextjs.org/docs/app/getting-started/error-handling)
- [Best Practices for Video Playback 2025 | Mux](https://www.mux.com/articles/best-practices-for-video-playback-a-complete-guide-2025)

### Accessibility
- [ADA Video Compliance Guide 2026 | accessiBe](https://accessibe.com/blog/knowledgebase/ada-compliance-for-videos)
- [Accessibility on Netflix | Netflix Help Center](https://help.netflix.com/en/node/116022)
- [Building accessible apps with Next.js | Deque](https://www.deque.com/blog/building-accessible-apps-with-next-js-and-axe-devtools/)
- [App Router: Improving Accessibility | Next.js](https://nextjs.org/learn/dashboard-app/improving-accessibility)
