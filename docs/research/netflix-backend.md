# Netflix Backend Architecture Research

**Author:** BE (Backend Developer)
**Sprint:** 1 - Research
**Date:** 2026-02-06

---

## Table of Contents

1. [API Architecture - REST/GraphQL](#1-api-architecture)
2. [Video Streaming - HLS/DASH](#2-video-streaming)
3. [Database Design](#3-database-design)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Recommendation Engine](#5-recommendation-engine)
6. [CDN & Content Delivery](#6-cdn--content-delivery)
7. [Recommendations for WebPhim](#7-recommendations-for-webphim)

---

## 1. API Architecture

### What Netflix Uses

Netflix evolved from monolithic REST to **Federated GraphQL** (called "Studio Edge"):
- 150+ subgraphs, 3000+ types, 2800+ queries/mutations
- Powered by Netflix DGS Framework (Java + Spring Boot)
- **Zuul 2** as edge gateway: 80+ clusters, 1M+ req/sec
- **Eureka** for service discovery + **Ribbon** for client-side load balancing

### REST vs GraphQL

| Aspect | REST | GraphQL |
|--------|------|---------|
| Complexity | Simple | More complex |
| Caching | HTTP standards | Custom |
| Over-fetching | Common | Eliminated |
| Multi-client | Multiple endpoints | Single endpoint |
| Best for | MVP, < 100K users | Scale, multiple clients |

### Netflix Microservices (Key Services)

- **Auth Service** - Registration, login, session management
- **Catalog Service** - Movie/TV metadata, categorization, search
- **Recommendation Service** - Personalized suggestions, ML models
- **Playback Service** - Stream orchestration, ABR, DRM
- **Billing Service** - Payments, subscriptions, tiers

### Rate Limiting

Netflix uses **concurrency-based limiting** (Little's Law: `Limit = Avg RPS x Avg Latency`).

For a clone, use **Token Bucket with Redis**:

```javascript
// Sliding window rate limiting with Redis
const rateLimit = async (userId, maxRequests = 100, windowSeconds = 60) => {
  const now = Date.now();
  const key = `rate_limit:${userId}`;

  await redis.zremrangebyscore(key, 0, now - (windowSeconds * 1000));
  const requestCount = await redis.zcard(key);

  if (requestCount >= maxRequests) {
    return { allowed: false, retryAfter: windowSeconds };
  }

  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.expire(key, windowSeconds);
  return { allowed: true };
};
```

### Recommendation for WebPhim

**Start with REST** for MVP. Sample structure:

```javascript
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/playback', playbackRoutes);
app.use('/api/v1/user', userRoutes);
```

Migrate to GraphQL when multiple client types (web, mobile, TV) diverge in data needs.

---

## 2. Video Streaming

### HLS vs DASH

| Feature | HLS | DASH |
|---------|-----|------|
| Developer | Apple | MPEG (open standard) |
| Codec Support | H.264, H.265 | Codec-agnostic |
| Browser Support | Universal (native Safari) | Requires JS libraries |
| Manifest Format | .m3u8 (plain text) | .mpd (XML) |
| Segment Format | .ts or .fmp4 | .m4s, .mp4, .webm |
| DRM | FairPlay, Widevine | Widevine, PlayReady |

**Netflix uses DASH** with Widevine DRM + AV1 codec (48% lower bitrate vs H.264).

**For WebPhim: Use HLS** - wider browser support, simpler implementation.

### Adaptive Bitrate Streaming (ABR)

Video encoded into multiple quality versions, player switches based on network conditions.

**Recommended encoding ladder:**

| Resolution | Bitrate | Use Case |
|-----------|---------|----------|
| 1920x1080 | 5 Mbps | Full HD |
| 1280x720 | 2.5 Mbps | HD |
| 854x480 | 1 Mbps | SD/Mobile |
| 640x360 | 600 Kbps | Low bandwidth |

### Codec Choice

- **H.264 (AVC)** - Universal support, recommended for MVP
- **H.265 (HEVC)** - 50% better compression, limited browser support
- **AV1** - Royalty-free, best compression, slow encoding

### FFmpeg Transcoding Pipeline

**Single-bitrate HLS (for testing):**
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -preset medium -b:v 2.5M -maxrate 2.75M -bufsize 5M \
  -vf "scale=1280:720" \
  -c:a aac -b:a 128k \
  -hls_time 6 -hls_playlist_type vod -hls_segment_type mpegts \
  -hls_segment_filename "segment_%03d.ts" \
  playlist.m3u8
```

**Production multi-bitrate HLS:**
```bash
#!/bin/bash
INPUT="$1"
OUTPUT_DIR="$2"
mkdir -p "$OUTPUT_DIR"

ffmpeg -i "$INPUT" \
  -filter_complex \
  "[0:v]split=4[v1][v2][v3][v4]; \
   [v1]scale=w=1920:h=1080:force_original_aspect_ratio=decrease[v1out]; \
   [v2]scale=w=1280:h=720:force_original_aspect_ratio=decrease[v2out]; \
   [v3]scale=w=854:h=480:force_original_aspect_ratio=decrease[v3out]; \
   [v4]scale=w=640:h=360:force_original_aspect_ratio=decrease[v4out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 5M -maxrate:0 5.5M -bufsize:0 10M \
    -g:0 48 -sc_threshold:0 0 -keyint_min:0 48 \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 2.5M -maxrate:1 2.75M -bufsize:1 5M \
    -g:1 48 -sc_threshold:1 0 -keyint_min:1 48 \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 1M -maxrate:2 1.1M -bufsize:2 2M \
    -g:2 48 -sc_threshold:2 0 -keyint_min:2 48 \
  -map "[v4out]" -c:v:3 libx264 -b:v:3 600k -maxrate:3 660k -bufsize:3 1.2M \
    -g:3 48 -sc_threshold:3 0 -keyint_min:3 48 \
  -map 0:a -c:a aac -b:a 128k -ac 2 -ar 48000 \
  -f hls -hls_time 6 -hls_playlist_type vod \
  -hls_flags independent_segments -hls_segment_type mpegts \
  -hls_segment_filename "$OUTPUT_DIR/stream_%v/segment_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:0 v:2,a:0 v:3,a:0" \
  "$OUTPUT_DIR/stream_%v/playlist.m3u8"
```

### HLS Manifest Files

**Master playlist (master.m3u8):**
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5500000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
stream_0/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2750000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
stream_1/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1100000,RESOLUTION=854x480,CODECS="avc1.64001e,mp4a.40.2"
stream_2/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=660000,RESOLUTION=640x360,CODECS="avc1.64001e,mp4a.40.2"
stream_3/playlist.m3u8
```

### Frontend Player

Use **Video.js** or **hls.js** for HLS playback in browsers.

---

## 3. Database Design

### What Netflix Uses

**Polyglot persistence** - different DBs for different workloads:
- **CockroachDB** - Global subscriber/billing metadata (100+ production clusters)
- **Cassandra** - High-write workloads (viewing history, user activity)
- **MySQL** - Billing transactions (ACID compliance)
- **PostgreSQL** - Structured data with complex queries

### PostgreSQL Schema for WebPhim

```sql
-- USERS AND AUTHENTICATION
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free'
        CHECK (subscription_plan IN ('free', 'basic', 'standard', 'premium')),
    subscription_status VARCHAR(20) DEFAULT 'active'
        CHECK (subscription_status IN ('active', 'cancelled', 'suspended', 'trial')),
    subscription_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subscription_end_date TIMESTAMPTZ,
    country_code VARCHAR(2),
    language_preference VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    profile_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    is_kids_profile BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
    maturity_rating VARCHAR(10) DEFAULT 'all'
        CHECK (maturity_rating IN ('kids', 'teen', 'mature', 'all')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, profile_name)
);

-- CONTENT CATALOG
CREATE TABLE content (
    content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('movie', 'series')),
    title VARCHAR(500) NOT NULL,
    original_title VARCHAR(500),
    description TEXT,
    release_year INTEGER,
    release_date DATE,
    maturity_rating VARCHAR(10)
        CHECK (maturity_rating IN ('G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-PG', 'TV-14', 'TV-MA')),
    duration_minutes INTEGER,
    total_seasons INTEGER,
    imdb_rating DECIMAL(3,1),
    language VARCHAR(10),
    country VARCHAR(100),
    thumbnail_url VARCHAR(500),
    banner_url VARCHAR(500),
    trailer_url VARCHAR(500),
    is_original BOOLEAN DEFAULT FALSE,
    view_count BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE series_seasons (
    season_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content(content_id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    episode_count INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(content_id, season_number)
);

CREATE TABLE episodes (
    episode_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES series_seasons(season_id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    thumbnail_url VARCHAR(500),
    video_url VARCHAR(500),
    view_count BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(season_id, episode_number)
);

-- GENRES AND CATEGORIZATION
CREATE TABLE genres (
    genre_id SERIAL PRIMARY KEY,
    genre_name VARCHAR(100) UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE content_genres (
    content_id UUID NOT NULL REFERENCES content(content_id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, genre_id)
);

CREATE TABLE cast_crew (
    person_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE content_cast_crew (
    content_id UUID NOT NULL REFERENCES content(content_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES cast_crew(person_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('actor', 'director', 'writer', 'producer')),
    character_name VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    PRIMARY KEY (content_id, person_id, role)
);

-- USER INTERACTIONS
CREATE TABLE watch_history (
    watch_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(content_id) ON DELETE CASCADE,
    episode_id UUID REFERENCES episodes(episode_id) ON DELETE CASCADE,
    watch_duration_seconds INTEGER NOT NULL DEFAULT 0,
    total_duration_seconds INTEGER NOT NULL,
    progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS
        ((watch_duration_seconds::DECIMAL / NULLIF(total_duration_seconds, 0)) * 100) STORED,
    completed BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_type VARCHAR(50)
);

CREATE TABLE watchlist (
    watchlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(content_id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, content_id)
);

CREATE TABLE ratings (
    rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(content_id) ON DELETE CASCADE,
    rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, content_id)
);

-- FULL-TEXT SEARCH
ALTER TABLE content ADD COLUMN search_vector tsvector;
CREATE INDEX idx_content_search ON content USING GIN(search_vector);

CREATE OR REPLACE FUNCTION content_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_search_trigger
BEFORE INSERT OR UPDATE ON content
FOR EACH ROW EXECUTE FUNCTION content_search_vector_update();
```

### Key Indexes

```sql
-- Authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Content browsing
CREATE INDEX idx_content_genres_genre ON content_genres(genre_id, content_id);
CREATE INDEX idx_content_type_year ON content(content_type, release_year DESC);
CREATE INDEX idx_content_view_count ON content(view_count DESC);

-- Continue watching (critical for engagement)
CREATE INDEX idx_watch_history_continue
ON watch_history(profile_id, last_watched_at DESC)
WHERE completed = FALSE AND progress_percentage > 5;

-- Series navigation
CREATE INDEX idx_seasons_content ON series_seasons(content_id, season_number);
CREATE INDEX idx_episodes_season ON episodes(season_id, episode_number);

-- Watchlist
CREATE INDEX idx_watchlist_profile ON watchlist(profile_id, added_at DESC);
```

### Redis Caching Strategy

| Use Case | Structure | TTL | Size |
|----------|-----------|-----|------|
| User sessions | String (JSON) | 24h | 1-2 KB |
| Profile metadata | Hash | 1h | 0.5-1 KB |
| Home page rows | String (JSON) | 5-10min | 100-200 KB |
| Continue watching | Sorted Set | 30min | 10-50 KB |
| Watchlist | Set | 1h | 5-20 KB |
| Content metadata | Hash | 6h | 2-5 KB |
| Trending content | Sorted Set | 15min | 50-100 KB |
| Search suggestions | List | 7 days | 1-5 KB |

**Cache patterns:**
- **Cache-aside** for content metadata (lazy loading on miss)
- **Write-through** for user profile updates (update DB + cache together)
- **Event-based invalidation** for content updates

Target: **95-99% cache hit rate** (Netflix standard).

---

## 4. Authentication & Authorization

### Netflix's Approach

- **Edge Authentication Services (EAS)** at cloud edge via Zuul gateway
- Token-agnostic identity propagation
- Device-level + User-level authentication
- Heartbeat-based session tracking (2-5 min timeout)
- Concurrent stream limits per subscription tier

### Recommended: Hybrid JWT + Session Tracking

- **JWT** for stateless authentication (short-lived: 15 min access + long-lived refresh)
- **Redis/DB** for active stream tracking and concurrent stream enforcement

### NextAuth.js Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcrypt";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        if (!user || !user.hashedPassword) {
          throw new Error("Invalid credentials");
        }
        const isCorrect = await compare(credentials.password, user.hashedPassword);
        if (!isCorrect) throw new Error("Invalid credentials");
        return user;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "free";
        token.subscriptionTier = user.subscriptionTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.subscriptionTier = token.subscriptionTier as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/auth/signin", error: "/auth/error" },
};
```

### Subscription Tiers

| Feature | Free | Basic ($9.99) | Standard ($15.99) | Premium ($19.99) |
|---------|------|---------------|--------------------|--------------------|
| Profiles | 1 | 1 | 3 | 5 |
| Concurrent Streams | 0 | 1 | 2 | 4 |
| Max Quality | 480p | 720p | 1080p | 4K |
| Downloads | No | No | Yes | Yes |

### Concurrent Stream Enforcement

```typescript
class StreamManager {
  static HEARTBEAT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  static async canStartStream(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await this.cleanupStaleSessions();

    const activeStreams = await prisma.activeStream.count({
      where: {
        userId,
        status: "streaming",
        lastHeartbeat: { gte: new Date(Date.now() - this.HEARTBEAT_TIMEOUT) },
      },
    });

    return activeStreams < user.maxConcurrentStreams;
  }

  static async cleanupStaleSessions(): Promise<void> {
    await prisma.activeStream.deleteMany({
      where: { lastHeartbeat: { lt: new Date(Date.now() - this.HEARTBEAT_TIMEOUT) } },
    });
  }
}
```

---

## 5. Recommendation Engine

### Netflix's System

Netflix's recommendations drive **80%+ of content discovery** via:
- **Collaborative filtering** - "Users who watched X also watched Y"
- **Content-based filtering** - Match by genre, actors, director
- **Hybrid approach** - Combines both methods

### MVP Strategies (No ML Required)

**1. Genre-Based Recommendations**
```javascript
function getGenreRecommendations(userId) {
  const watchHistory = getUserWatchHistory(userId);
  const genrePreferences = {};
  watchHistory.forEach(video => {
    video.genres.forEach(genre => {
      genrePreferences[genre] = (genrePreferences[genre] || 0) + 1;
    });
  });
  const topGenres = Object.entries(genrePreferences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
  return getVideosByGenres(topGenres, { exclude: watchHistory });
}
```

**2. Content Similarity ("Because You Watched X")**
```javascript
function calculateSimilarityScore(video1, video2) {
  let score = 0;
  // Genre overlap (weight: 3)
  score += video1.genres.filter(g => video2.genres.includes(g)).length * 3;
  // Same director (weight: 5)
  if (video1.director === video2.director) score += 5;
  // Actor overlap (weight: 2)
  score += video1.actors.filter(a => video2.actors.includes(a)).length * 2;
  // Similar year (weight: 1-3)
  const yearDiff = Math.abs(video1.year - video2.year);
  if (yearDiff <= 2) score += 3;
  else if (yearDiff <= 5) score += 1;
  return score;
}
```

**3. Trending/Popular**
```javascript
function getTrendingContent(timeframe = '7days') {
  // Weight recent views more heavily
  return videos.sort((a, b) => {
    const scoreA = (a.recentViews * 10) + (a.totalViews * 0.1);
    const scoreB = (b.recentViews * 10) + (b.totalViews * 0.1);
    return scoreB - scoreA;
  }).slice(0, 20);
}
```

**4. Continue Watching**
- Track watch progress > 5% and < 90%
- Sort by most recent, show top row on homepage

### Homepage Row Priority

```
1. Continue Watching
2. Because You Watched [Recent Title]
3. Trending Now
4. Top Picks for You (genre-based)
5. New Releases
6. Popular in [Country]
7. [Top Genre] You'll Love
```

### When to Consider ML

Upgrade when you have:
- 100K+ user interactions
- 1,000+ active users
- 500+ videos
- 3+ months of behavioral data

---

## 6. CDN & Content Delivery

### Netflix Open Connect

- **$1B+ investment** in 8,000+ appliances globally
- Placed directly in ISP data centers
- Pre-positions content during off-peak "fill windows"
- 95% of traffic via direct connections
- Saved $1.25B by 2021

### CDN Options for WebPhim

| Provider | Latency | Egress Cost | Best For |
|----------|---------|-------------|----------|
| **Cloudflare R2 + CDN** | 50ms | **$0** | Cost-conscious startups |
| **BunnyCDN** | 25ms | $0.005/GB | Best price-performance |
| **AWS S3 + CloudFront** | 40ms | $0.09/GB | AWS-native stacks |
| **MinIO (self-hosted)** | Varies | $0 internal | Full control |

### Cost Comparison (1,000 users, 2hr/day)

- Monthly bandwidth: ~240 TB
- **AWS S3 egress**: $21,600/month
- **Cloudflare R2 egress**: **$0/month**

### Recommended: Cloudflare R2 + CDN

- Zero egress fees = 98% bandwidth savings
- S3-compatible API (easy migration)
- Built-in DDoS protection
- Cloudflare Workers for edge logic
- Free tier for development

### Storage Structure

```
/videos/
  /movie-{id}/
    master.m3u8
    /stream_0/  (1080p)
      playlist.m3u8
      segment_000.ts
      segment_001.ts
    /stream_1/  (720p)
    /stream_2/  (480p)
    /stream_3/  (360p)
```

### Budget Estimates

| Scale | Storage | Bandwidth | Total/month |
|-------|---------|-----------|-------------|
| Indie (< 10K users) | 5TB = $75-115 | 20TB = $0 (R2) | ~$175 |
| Medium (10K-100K) | 20TB = $300-460 | 200TB = $0 (R2) | ~$460 |

---

## 7. Recommendations for WebPhim

### Tech Stack Decision

| Component | Choice | Reason |
|-----------|--------|--------|
| **API** | REST (Next.js API Routes) | Simple, adequate for MVP |
| **Database** | PostgreSQL + Prisma | Relational integrity, great ORM |
| **Cache** | Redis | Sessions, popular content, streaming state |
| **Auth** | NextAuth.js + JWT | Battle-tested, multi-provider |
| **Streaming** | HLS + H.264 | Universal browser support |
| **CDN** | Cloudflare R2 | Zero egress, S3-compatible |
| **Player** | Video.js or hls.js | Free, well-documented |
| **Transcoding** | FFmpeg | Industry standard |

### Architecture Blueprint

```
┌─────────────┐
│   Client    │  Next.js Frontend (SSR)
│  (Browser)  │  Video.js Player
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Next.js API    │  REST Endpoints
│  Routes         │  NextAuth.js
└──────┬──────────┘
       │
  ┌────┴────┐
  ▼         ▼
┌──────┐ ┌──────┐
│Prisma│ │Redis │  Cache: sessions, content, streams
│  +   │ │      │
│ PG   │ └──────┘
└──────┘
       │
       ▼
┌─────────────────┐
│  Cloudflare R2  │  Video storage + CDN
│  + CDN          │  HLS segments
└─────────────────┘
```

### Implementation Priority

1. **Phase 1 (Sprint 2-3):** Auth + User/Profile management
2. **Phase 2 (Sprint 4-5):** Content catalog API + DB schema
3. **Phase 3 (Sprint 6-7):** Video upload + FFmpeg transcoding pipeline
4. **Phase 4 (Sprint 8-9):** Streaming API + player integration
5. **Phase 5 (Sprint 10+):** Recommendations, search, watchlist

---

## Sources

### API Architecture
- [Netflix Federated GraphQL - Apollo Blog](https://www.apollographql.com/blog/an-unexpected-journey-how-netflix-transitioned-to-a-federated-supergraph)
- [Netflix API with GraphQL Federation - InfoQ](https://www.infoq.com/presentations/netflix-api-graphql-federation/)
- [Netflix Zuul Gateway - GitHub](https://github.com/Netflix/zuul)
- [Netflix System Design - DEV Community](https://dev.to/gbengelebs/netflix-system-design-backend-architecture-10i3)

### Video Streaming
- [HLS vs DASH - Gumlet](https://www.gumlet.com/learn/hls-vs-dash/)
- [Adaptive Bitrate Streaming - Bitmovin](https://bitmovin.com/blog/adaptive-streaming/)
- [HLS Packaging with FFmpeg - OTTVerse](https://ottverse.com/hls-packaging-using-ffmpeg-live-vod/)
- [Netflix Video Codec Strategy - VdoCipher](https://www.vdocipher.com/blog/tech-update-netflix-updates-codecs-use-efficient-encoding/)

### Database Design
- [Netflix Databases: Cassandra to CockroachDB - CockroachLabs](https://www.cockroachlabs.com/blog/netflix-at-cockroachdb/)
- [Netflix Tech Stack Databases - ByteByteGo](https://blog.bytebytego.com/p/ep60-netflix-tech-stack-databases)
- [Netflix Media Database - Netflix TechBlog](https://netflixtechblog.com/implementing-the-netflix-media-database-53b5a840b42a)

### Authentication
- [Netflix Edge Authentication - Netflix TechBlog](https://netflixtechblog.com/edge-authentication-and-token-agnostic-identity-propagation-514e47e0b602)
- [User Identity at Netflix Scale - InfoQ](https://www.infoq.com/presentations/netflix-user-identity/)
- [NextAuth.js Documentation](https://next-auth.js.org/)

### Recommendation Engine
- [Netflix Recommendation Research](https://research.netflix.com/research-area/recommendations)
- [How Netflix Recommendation System Works - Stratoflow](https://stratoflow.com/how-netflix-recommendation-system-works/)

### CDN & Content Delivery
- [Netflix Open Connect - Wikipedia](https://en.wikipedia.org/wiki/Open_Connect)
- [Cloudflare R2 vs AWS S3 - Cloudflare](https://www.cloudflare.com/pg-cloudflare-r2-vs-aws-s3/)
- [AWS S3 + CloudFront Video Streaming - AWS Docs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/tutorial-s3-cloudfront-route53-video-streaming.html)
