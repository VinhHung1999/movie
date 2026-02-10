# Netflix System Architecture - Research Report

**Author:** TL (Tech Lead) - WebPhim Team
**Date:** 2026-02-06
**Sprint:** 1 - Research Phase

---

## Table of Contents

1. [Overall Tech Stack](#1-overall-tech-stack)
2. [Microservices Architecture](#2-microservices-architecture)
3. [Scalability & Infrastructure](#3-scalability--infrastructure)
4. [CDN Strategy (Open Connect)](#4-cdn-strategy-open-connect)
5. [Design System](#5-design-system)
6. [Key Takeaways for WebPhim](#6-key-takeaways-for-webphim)

---

## 1. Overall Tech Stack

### 1.1 Frontend

| Technology | Purpose | Why Chosen |
|-----------|---------|------------|
| **React.js** | Primary UI framework | Component-based architecture, modular development, reusable UI components |
| **Node.js** | Server-side rendering (BFF layer) | Unified JavaScript across frontend/backend, acts as API Gateway |
| **GraphQL** | Frontend-server communication | Efficient data fetching, reduces over-fetching |

- Netflix transitioned to JavaScript (React + Node.js) to **reduce developer complexity** and enable unified language development
- Node.js acts as a Backend-for-Frontend (BFF) layer, delivering customized data to different devices (TV, mobile, desktop)

### 1.2 Backend

| Technology | Purpose | Why Chosen |
|-----------|---------|------------|
| **Java + Spring Boot** | Core microservices | Scalability, security, robustness; adopted as core Java framework in 2018 |
| **Python** | ML/Data Science | Powers recommendation systems and analytics |
| **Go** | Infrastructure services | Observability tools and infrastructure components |

- Netflix built several cloud infrastructure libraries on Java: **Ribbon** (load balancing), **Eureka** (service discovery), **Hystrix** (circuit breaker)
- **Titus**: Netflix's proprietary container management platform, launches **3+ million containers/week**

### 1.3 Database Strategy (Polyglot Persistence)

| Database | Use Case | Why |
|----------|----------|-----|
| **Apache Cassandra** | User data, viewing history, video metadata | Global replication, massive scale, high availability |
| **CockroachDB** | Newer workloads requiring SQL (100+ clusters) | Multi-active topology, global transactions, SQL with scalability |
| **MySQL** | Billing, subscriptions, financial data | ACID compliance for financial transactions |
| **EVCache** | Caching (built on Memcached) | 400M ops/sec, 22,000 servers, 14.3 PB data |

- **Pragmatic polyglot persistence**: specialized databases optimized for specific workloads rather than one-size-fits-all

### 1.4 Messaging & Event-Driven Architecture

- **Apache Kafka**: De-facto standard for all eventing and messaging
- **Keystone pipeline**: Processes up to **2 trillion messages/day**
- **Data volume**: ~3 PB ingested daily, ~7 PB output daily
- **Apache Flink**: Real-time stream processing with windowed joins and aggregations

### 1.5 Video Encoding Pipeline

| Codec | Status | Compression vs H.264 |
|-------|--------|---------------------|
| **AV1** | Powers **30% of Netflix streaming** (2025) | 48.1% lower bitrate, royalty-free |
| **H.265/HEVC** | Used for 4K/HDR content | ~50% better compression |
| **VP9** | Open-source alternative | Better than H.264, less efficient than AV1 |
| **H.264/AVC** | Legacy device support | Baseline codec since 2007 |

- Multi-codec strategy based on device capability, bandwidth, and content requirements
- AV1 reduced buffering by **38%** and sped up playback by **2%**

---

## 2. Microservices Architecture

### 2.1 Evolution: Monolith to Microservices

- **2008**: Major database corruption caused a **3-day service outage** - exposed monolith fragility
- **2009**: Netflix began full transition to microservices
- **7-year migration**: Complete transition from monolith to microservices
- **Current state**: Manages **thousands of independent microservices**

### 2.2 Netflix OSS (Open Source Software)

| Tool | Purpose | Pattern |
|------|---------|---------|
| **Eureka** | Service Discovery | Services register and discover each other dynamically |
| **Zuul** | API Gateway | Dynamic routing, load balancing, monitoring at the edge |
| **Hystrix** | Circuit Breaker | Prevents cascading failures with fallback mechanisms |
| **Ribbon** | Client-Side Load Balancing | Resilient and intelligent routing across service instances |

- Released under **Apache 2.0 License** - became industry standards
- Integrates seamlessly with **Spring Cloud**

### 2.3 Service Communication Patterns

| Protocol | Use Case |
|----------|----------|
| **REST APIs** | Frontend-to-backend communication |
| **gRPC** | High-performance, low-latency internal service communication |
| **GraphQL** | Federated API layer for efficient data fetching |
| **Apache Kafka** | Asynchronous event-driven communication |
| **Service Mesh (Envoy)** | Zero-configuration resilience, routing, observability (2026) |

### 2.4 Deployment: Spinnaker

- **Spinnaker**: Open-source multi-cloud continuous delivery platform developed by Netflix
- Deploys **95%+ of Netflix's AWS infrastructure**
- Supports: blue/green, canary, rolling updates, automated rollbacks
- Enables **thousands of daily deployments**

### 2.5 Chaos Engineering

| Tool | Scope |
|------|-------|
| **Chaos Monkey** | Randomly terminates VMs/containers in production |
| **Chaos Kong** | Drops an entire AWS Region |
| **Chaos Gorilla** | Drops a full Availability Zone |
| **Latency Monkey** | Introduces artificial network delays |
| **Conformity Monkey** | Detects and removes misconfigured instances |

- Proven success: Netflix's systems handled the **September 2014 reboot of 10% of AWS servers** without customer impact
- Disciplined methodology, not random destruction

### 2.6 Data Architecture

- **Database-per-service pattern**: Each microservice owns its data store
- Services can choose the best database technology for their needs
- Consistency managed via **event sourcing**, **saga patterns**, and **eventual consistency**

---

## 3. Scalability & Infrastructure

### 3.1 AWS Cloud Infrastructure

- **Migration trigger**: Major database crash in 2008
- **Completed**: January 2016 (7-year transformation)
- **Current state**: Runs **100% on AWS** (except Open Connect CDN hardware)
- Operates across **4 AWS Regions** for global traffic
- Achieved **30% cost reduction** while handling **15x traffic spikes**

### 3.2 Scale Numbers (2025-2026)

| Metric | Value |
|--------|-------|
| Subscribers | **325+ million** globally |
| Viewing hours | **96 billion hours** in H2 2025 |
| EVCache throughput | **400M ops/sec** across 22,000 servers |
| EVCache data | **14.3 PB** |
| Cassandra | **6+ PB** data, millions of ops/sec |
| Kafka messages | **2 trillion/day** |
| Revenue (2026 projected) | **$50.7-51.7 billion** |
| Content spending (2026) | **$20 billion** |

### 3.3 Auto-Scaling

- **Scryer**: Netflix's internal predictive scaling system
  - Forecasts infrastructure needs **hours in advance**
  - Analyzes historical traffic patterns, upcoming content releases, external events
  - Provisions exact number of EC2 instances needed before demand occurs
- **Amazon EKS**: Simplified container orchestration for rapid deployment
- **Aurora migration**: 75% improved performance, 28% cost savings for relational workloads

### 3.4 Caching Strategy

| Layer | Technology | Details |
|-------|-----------|---------|
| **Application Cache** | EVCache (Memcached-based) | 400M ops/sec, SSD-backed tiered caching |
| **CDN Cache** | Open Connect | >80% of global traffic served from edge |
| **Client Cache** | Browser/App | Manifests, frequently accessed metadata |

- EVCache uses **Ketama consistent hashing** for data distribution
- Replication: 2-9 copies depending on cluster, reads from local zone
- SSD-backed with **extstore extension** for tiered caching (hot data in RAM, warm data on SSD)

### 3.5 Resilience Patterns

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| Circuit Breaker | Hystrix | Prevent cascading failures (tens of billions of calls/day) |
| Bulkhead | Per-dependency thread pools | Isolate failing dependencies |
| Retry with Backoff | Exponential backoff | Prevent thundering herd during recovery |
| Multi-AZ Failover | Automatic | Zone-level resilience |
| Multi-Region Failover | Manual/Automated | Region-level disaster recovery |
| Chaos Engineering | Simian Army | Proactive failure testing |

### 3.6 Observability

| Tool | Purpose |
|------|---------|
| **Atlas** | Dimensional time-series metrics database |
| **Mantis** | Real-time stream processing for operational insights |
| **NDBench** | Load testing and benchmarking |
| **Unomia** | Capacity analysis and planning |

---

## 4. CDN Strategy (Open Connect)

### 4.1 What is Open Connect?

- Netflix's **purpose-built CDN** responsible for serving **100% of Netflix video traffic**
- **~95% of Netflix's traffic** globally is delivered via direct connections between Open Connect and residential ISPs
- Launched in **2012**, with over **$1 billion** invested in development and distribution

### 4.2 Open Connect Appliances (OCAs)

| Spec | Details |
|------|---------|
| Count | **19,000+ OCAs** deployed globally |
| Locations | **1,500+ ISP locations** in **100+ countries** |
| Software | FreeBSD OS + NGINX web server |
| Cost to ISPs | **Free** - Netflix provides hardware; ISPs provide space, power, connectivity |
| Traffic routing | BGP sessions for explicit traffic steering |

- OCAs are **directed-cache appliances** - only serve clients at IP addresses advertised via BGP
- Same capabilities whether embedded in ISP networks or in Netflix's 60+ global data centers

### 4.3 Content Distribution Architecture

```
                    ┌─────────────┐
                    │   AWS Cloud  │
                    │  (Control)   │
                    │  - Encoding  │
                    │  - Metadata  │
                    │  - Steering  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌───▼────┐  ┌───▼────┐
         │  OCA @  │  │ OCA @  │  │ OCA @  │
         │  ISP A  │  │ ISP B  │  │ ISP C  │
         └────┬────┘  └───┬────┘  └───┬────┘
              │           │           │
         ┌────▼────┐  ┌───▼────┐  ┌───▼────┐
         │  Users  │  │ Users  │  │ Users  │
         └─────────┘  └────────┘  └────────┘
```

**How it works:**
1. **Encoding**: Content encoded in multiple qualities at AWS
2. **Fill window**: Encoded assets pushed to OCAs during **off-peak hours** (nightly)
3. **Playback**: Client fetches manifests and segments from **nearest OCA**
4. **Fallback**: Automatic fallback to other locations if needed
5. **Steering**: Control plane in AWS steers clients to optimal OCAs based on file availability, health, and network proximity

### 4.4 Adaptive Bitrate Streaming (ABR)

- Client dynamically adapts quality in real-time based on:
  - Network conditions
  - Screen size
  - Device capabilities
- Netflix sends **multiple quality copies** of each title to OCAs
- If connection degrades, system automatically selects lower-bitrate version

### 4.5 Encoding Optimization

| Technique | Impact |
|-----------|--------|
| **Per-title encoding** (2015) | ~20% bitrate reduction - analyzes each video's complexity for optimal encoding |
| **Per-scene/shot encoding** | ~30% bitrate reduction - optimizes at scene level |
| **AV1 Film Grain Synthesis** | 66% bitrate reduction while maintaining quality |

- Creates a matrix of test encodes at various bitrates and resolutions
- Finds ideal resolution at each point in the bitrate ladder per title

### 4.6 Open Connect vs Traditional CDNs

| Feature | Netflix Open Connect | Traditional CDN (Akamai/CloudFront) |
|---------|---------------------|--------------------------------------|
| **Ownership** | Netflix-owned, exclusive | Shared multi-tenant infrastructure |
| **Purpose** | Single-purpose (video delivery) | General-purpose (all content types) |
| **Cost model** | CapEx ($1B+ invested) | OpEx (pay per GB/request) |
| **Placement** | Inside ISP networks | Edge PoPs in data centers |
| **Scale** | 19,000+ OCAs | Akamai: 365,000+ servers; CloudFront: 700+ PoPs |
| **Reliability** | Extremely high (dedicated) | High (shared resources) |
| **Small assets** | Uses Akamai for non-video content | Full service |

- Netflix still uses **Akamai for small assets** (images, metadata) since Open Connect is optimized specifically for large video files
- Most streaming services lack in-house CDN and depend on third-party providers

---

## 5. Design System

### 5.1 Color Palette

| Color | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| **Netflix Red** | `#E50914` | (229, 9, 20) | Primary brand, CTAs, key UI elements |
| **Symbol Dark Red** | `#B20710` | (178, 7, 16) | Logo variations, symbol treatments |
| **Black** | `#000000` | (0, 0, 0) | Primary background |
| **Netflix Grey** | `#221F1F` | (34, 31, 31) | Secondary backgrounds |
| **Dark Gray** | `#141414` | (20, 20, 20) | Main app background |
| **White** | `#FFFFFF` | (255, 255, 255) | Primary text |
| **Netflix White** | `#F5F5F1` | (245, 245, 241) | Softer text contrast |

**Dark Theme Philosophy:**
- Focus on content (interface recedes, content stands out)
- Cinema feel (mimics movie theater experience)
- Reduced eye strain for extended viewing
- Battery efficiency (OLED screens)
- Premium, sophisticated aesthetic

### 5.2 Typography

**Netflix Sans** (Custom Typeface)
- **Designer**: Dalton Maag type foundry (released March 2018)
- **Style**: "Approachable geometric grotesque"
- **Design**: Clean, neutral letterforms; "cinematic" uppercase, "compact and efficient" lowercase
- **Weights**: Thin, Light, Regular, Medium, Bold, Black
- **Purpose**: Readable across all screen sizes, modern/professional feel, multi-language support, eliminates expensive font licensing costs

### 5.3 Layout Patterns

#### Hero Banner/Billboard
- Full-screen background image or video at top of homepage
- Dark gradient overlays for text readability
- Bold typography with clear CTAs (Play, More Info)
- Dynamic, personalized content featuring trailers or motion graphics

#### Horizontal Scrolling Rows (Carousels)
- Categories organized below the hero banner
- Left/right arrow navigation on hover
- Semi-transparent black backgrounds for controls
- CSS `transform: translate` for smooth horizontal scrolling
- Responsive scaling across devices

#### Card-Based Content Grid
- Poster thumbnail cards in horizontal rows
- Hover: slight zoom/scale effect + preview info or short trailer
- Smooth interactive visual effects

#### Modal/Detail Overlays
- Full-screen or centered modals for content details
- Dark overlay backgrounds
- Episode lists, trailers, and detailed metadata

### 5.4 Key UI Components

| Component | Details |
|-----------|---------|
| **Navigation Bar** | Red hover effects, responsive (dropdown on mobile), CSS media queries |
| **Profile Selector** | Bottom-anchored (2025 redesign), icon-based |
| **Video Player** | Minimal controls on hover, standard playback, timeline scrubbing |
| **Progress Indicators** | Visual markers showing watch progress on thumbnails |
| **Rating System** | Integrated into cards and detail pages, personalized |

### 5.5 Animation & Transitions

- **Card hover**: Scale up transform, additional details appear, auto-play preview
- **Carousel scrolling**: Smooth CSS transform-based easing
- **Page transitions**: Smooth state transitions maintaining user orientation
- **Navigation**: Hover animations, dropdown menu transitions

### 5.6 Responsive Design

| Device | Adaptation |
|--------|-----------|
| **Mobile** | Touch-optimized, simplified navigation |
| **Tablet** | Hybrid layout, touch + gesture support |
| **Desktop** | Full features, mouse interactions, hover states |
| **TV** | Remote-optimized, large touch targets |

### 5.7 Thumbnail Strategy

| Metric | Value |
|--------|-------|
| Impact on decisions | **80%+** of viewing choices influenced by thumbnails |
| Attention window | **90 seconds** before users leave |
| View time per thumbnail | **1.8 seconds** average |
| Engagement boost | **20-30%** from personalization |

- **A/B testing**: Multiple artwork variants tested per title across user segments
- **Personalization**: Different thumbnails per user based on viewing history
- Uses **collaborative filtering**, **content-based filtering**, and **deep learning models**
- Strong emotional expressions and familiar actors increase click-through rates

### 5.8 Logo & Branding

- **"N" Icon**: Netflix Red (`#E50914`) or Symbol Dark Red (`#B20710`)
- **Full Logo**: Netflix wordmark in Netflix Sans, primary color Netflix Red
- **Tudum**: Iconic intro animation with sound branding
- Wordmark may appear in black/white only in rare production-limited cases

---

## 6. Key Takeaways for WebPhim

### What We Can Adopt

| Netflix Concept | WebPhim Adaptation |
|----------------|-------------------|
| Dark theme with red accents | Use `#E50914` inspired palette, dark backgrounds |
| Hero banner + carousel layout | Implement billboard + horizontal scrolling rows |
| Card hover effects | Scale + preview on hover |
| React + Node.js frontend | Next.js 14+ (App Router) with React |
| HLS adaptive streaming | HLS with multiple quality levels |
| Per-title encoding concept | Multiple quality levels (480p, 720p, 1080p) |
| JWT authentication | NextAuth.js with JWT |
| Responsive design patterns | Tailwind CSS responsive breakpoints |

### What We Simplify (Scale Differences)

| Netflix (325M+ users) | WebPhim (MVP) |
|-----------------------|---------------|
| Thousands of microservices | Monolithic Next.js + API routes |
| Cassandra + CockroachDB + MySQL | PostgreSQL with Prisma |
| EVCache + Redis | Redis for caching |
| Open Connect CDN (19,000+ OCAs) | Cloudflare CDN |
| Apache Kafka (2T messages/day) | Simple event handling |
| Spinnaker deployment | Vercel deployment |
| Chaos Engineering | Basic error handling + monitoring |

### Design System for WebPhim

```css
/* WebPhim Color Palette (Netflix-Inspired) */
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
```

```
/* Font Stack */
font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
/* (Inter as open-source alternative to Netflix Sans) */
```

---

## Sources

### Tech Stack & Architecture
- [Netflix System Design and Backend Architecture - TechAhead](https://www.techaheadcorp.com/blog/netflix-system-design/)
- [Netflix's Tech Stack - ByteByteGo](https://bytebytego.com/guides/netflixs-tech-stack/)
- [Netflix Architecture in 2026 - ClickIT](https://www.clickittech.com/software-development/netflix-architecture/)
- [Netflix OSS and Spring Boot - Netflix TechBlog](https://netflixtechblog.com/netflix-oss-and-spring-boot-coming-full-circle-4855947713a0)

### Microservices
- [Netflix Microservices Architecture Guide - Yochana](https://www.yochana.com/netflixs-evolution-from-monolith-to-microservices-a-deep-dive-into-streaming-architecture/)
- [A Brief History of Scaling Netflix - ByteByteGo](https://blog.bytebytego.com/p/a-brief-history-of-scaling-netflix)
- [Rebuilding Netflix Video Processing Pipeline - Netflix TechBlog](https://netflixtechblog.com/rebuilding-netflix-video-processing-pipeline-with-microservices-4e5e6310e359)
- [Netflix Open Source Software Center](https://netflix.github.io/)

### Databases
- [The History of Databases at Netflix - CockroachDB](https://www.cockroachlabs.com/blog/netflix-at-cockroachdb/)
- [Netflix Tech Stack Databases - ByteByteGo](https://blog.bytebytego.com/p/ep60-netflix-tech-stack-databases)
- [Now Streaming: Netflix Runs 380+ CockroachDB Clusters](https://www.cockroachlabs.com/customers/netflix/)

### Scalability & Infrastructure
- [Netflix on AWS: Case Studies](https://aws.amazon.com/solutions/case-studies/innovators/netflix/)
- [Netflix Subscribers Statistics 2026 - DemandSage](https://www.demandsage.com/netflix-subscribers/)
- [Building a Global Caching System at Netflix - InfoQ](https://www.infoq.com/articles/netflix-global-cache/)
- [Netflix/EVCache - GitHub](https://github.com/Netflix/EVCache)

### Chaos Engineering & Deployment
- [What Is Chaos Monkey? - Gremlin](https://www.gremlin.com/chaos-monkey)
- [DevOps Case Study: Netflix - SEI CMU](https://www.sei.cmu.edu/blog/devops-case-study-netflix-and-the-chaos-monkey/)
- [Global Continuous Delivery with Spinnaker - Netflix TechBlog](https://netflixtechblog.com/global-continuous-delivery-with-spinnaker-2a6896c23ba7)

### CDN & Streaming
- [Netflix Open Connect](https://openconnect.netflix.com/en/)
- [Netflix Content Distribution - APNIC Blog](https://blog.apnic.net/2018/06/20/netflix-content-distribution-through-open-connect/)
- [AV1 Now Powering 30% of Netflix Streaming - Netflix TechBlog](https://netflixtechblog.com/av1-now-powering-30-of-netflix-streaming-02f592242d80)
- [Per-Title Encode Optimization - Netflix TechBlog](https://netflixtechblog.com/per-title-encode-optimization-7e99442b62a2)
- [Netflix's System Architecture - Streaming Media](https://www.streamingmedia.com/Articles/ReadArticle.aspx?ArticleID=161145)

### Design System
- [Netflix Brand Color Palette - Mobbin](https://mobbin.com/colors/brand/netflix)
- [Netflix: A Brand Breakdown - Canny Creative](https://www.canny-creative.com/brand-breakdown/brand/netflix/)
- [Dalton Maag | Netflix Sans](https://www.daltonmaag.com/portfolio/custom-fonts/netflix-sans.html)
- [Netflix Design: A Deep Dive into UX Strategy - CreateBytes](https://createbytes.com/insights/netflix-design-analysis-ui-ux-review)
- [Netflix Thumbnail Personalization - Medium](https://medium.com/@jmehul721/how-netflix-dynamically-decides-and-changes-thumbnails-for-recommended-movies-a-deep-dive-into-596c56e7367f)
