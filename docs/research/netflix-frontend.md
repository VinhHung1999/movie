# Netflix Frontend Research - WebPhim

**Sprint:** 1 - Research
**Author:** FE (Frontend Developer)
**Date:** 2026-02-06

---

## Table of Contents

1. [UI/UX Patterns](#1-uiux-patterns)
2. [Component Structure](#2-component-structure)
3. [Animations & Transitions](#3-animations--transitions)
4. [Responsive Design](#4-responsive-design)
5. [Landing Page & Onboarding](#5-landing-page--onboarding)
6. [Implementation Stack](#6-implementation-stack)

---

## 1. UI/UX Patterns

### Homepage Layout

- **Billboard/Hero Section**: Large cinematic hero at top, auto-playing video trailer (muted). Most powerful engagement tool - personalized per user.
- **Horizontal Scrolling Rows**: Netflix's signature pattern. Each row = one category, scrolling horizontally. Page feels finite vertically but infinite horizontally.
- **Content Organization**:
  - Continue Watching (top priority)
  - Trending / Popular
  - Genre-based rows (Action, Comedy, Drama...)
  - "Because you watched X" personalized rows
  - Netflix Originals
  - Top 10 in your country

### Browse Page Structure

- Consistent carousel-based layout across all categories
- Same visual style and interaction pattern per category
- Seamless transitions between content categories

### Video Player UI

- Clean, minimalist - controls fade out during playback
- Controls appear on hover/interaction
- Features: progress bar, volume, quality settings, subtitles
- Next episode countdown timer (series)
- Skip intro/credits buttons

### Preview Modals

- Click card → detailed modal overlay:
  - Larger preview video
  - Title, synopsis, cast & crew
  - Play, Add to List, Like/Dislike buttons
  - Similar titles section

---

## 2. Component Structure

### Carousel/Slider

| Feature | Detail |
|---------|--------|
| Layout | Rectangular grid, horizontal scroll |
| Peek items | Partial cards on edges indicate more content |
| Scrolling | Smooth with momentum |
| Navigation | Left/right arrows on hover (desktop) |
| Items visible | 4-6 per row (desktop) |

**Implementation approach:**
```tsx
<motion.div
  drag="x"
  dragConstraints={{ left: -width, right: 0 }}
  whileTap={{ cursor: "grabbing" }}
>
  {items.map(item => <MovieCard key={item.id} {...item} />)}
</motion.div>
```

### Movie/Show Card

**Base state:** Rectangular card with poster image, minimal text.

**Hover state (expand ~1.3x-1.5x):**
- Auto-playing video preview (muted)
- Title overlay
- Quick info: match %, year, rating, duration
- Action buttons: Play, Add to List, Like/Dislike, More Info
- Genre tags
- Elevation: z-index + shadow

**Key details:**
- Hover delay (~300ms) prevents accidental triggers
- Cards expand upward to stay in viewport
- Spring animation for natural feel

### Navbar

| State | Style |
|-------|-------|
| Top of page | Transparent background |
| Scrolled | Solid black background |

**Elements:**
- Left: Logo + navigation links (Browse, My List...)
- Right: Search icon, Notifications bell, Profile dropdown
- Sticky positioning with scroll-based opacity transition

```tsx
<motion.nav
  style={{
    backgroundColor: scrollY > 100 ? "rgba(0,0,0,1)" : "rgba(0,0,0,0)"
  }}
  transition={{ duration: 0.3 }}
/>
```

### Hero Banner

- **Auto-play trailer** (muted by default)
- **Info overlay** (bottom-left): title, description, CTA buttons (Play, More Info)
- **Gradient overlay**: dark gradient from bottom for text contrast
- **Mute/unmute toggle**

### Profile Selector

- Grid of profile avatars
- "Add Profile" option
- Clean, centered layout
- Avatar image + name per profile

---

## 3. Animations & Transitions

### Card Hover Scale

```tsx
<motion.div
  whileHover={{ scale: 1.3 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
/>
```

### Row Sliding

```tsx
<motion.div
  animate={{ x: offset }}
  transition={{ ease: "easeInOut", duration: 0.5 }}
/>
```

### Modal Open/Close

```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    />
  )}
</AnimatePresence>
```

### Loading Skeletons

```tsx
<motion.div
  className="bg-gray-700 rounded"
  animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
/>
```

### Fade-in on Scroll

```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
/>
```

### Animation Principles

- **Non-intrusive**: Enhance, don't distract
- **Purposeful**: Each animation provides feedback or guides attention
- **Performant**: Use `transform` and `opacity` for GPU acceleration
- **Spring physics**: Natural, bouncy feel via Framer Motion springs

---

## 4. Responsive Design

### Breakpoints

| Device | Breakpoint | Cards/Row | Grid | Navigation |
|--------|-----------|-----------|------|------------|
| Mobile | < 640px | 2-3 | 4-col | Hamburger menu |
| Tablet | 640-1024px | 3-4 | 8-col | Condensed navbar |
| Desktop | 1024-1920px | 4-6 | 12-col | Full navbar |
| TV/Large | > 1920px | 5-7 | 12-col | Remote-friendly |

### Tailwind Breakpoints

```js
// tailwind.config.js
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}
```

### Adaptive Grid

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
  {movies.map(movie => <MovieCard key={movie.id} {...movie} />)}
</div>
```

### Device-Specific Adaptations

**Mobile:**
- Hamburger menu (top-left), profile icon (top-right)
- Search overlay instead of inline search
- Bottom navigation for key actions
- Smaller portrait-oriented cards

**Tablet:**
- Touch-friendly card sizes
- Swipe gestures for carousel
- Hybrid navigation

**Desktop:**
- Full navbar with all links
- Hover states and preview cards
- Keyboard navigation support

**TV:**
- Focus-based navigation (D-pad)
- Larger touch targets for remote
- High contrast, simplified UI

---

## 5. Landing Page & Onboarding

### Unauthenticated Landing Page Structure

#### Hero Section

```tsx
<section className="relative h-screen flex items-center justify-center">
  <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black" />
  <div className="relative z-10 text-center px-4">
    <h1 className="text-5xl md:text-7xl font-bold mb-4">
      Unlimited movies, TV shows, and more
    </h1>
    <p className="text-xl md:text-2xl mb-8">
      Watch anywhere. Cancel anytime.
    </p>
    <form className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
      <input type="email" placeholder="Email address"
        className="flex-1 px-6 py-4 text-lg rounded" />
      <button className="bg-red-600 hover:bg-red-700 px-8 py-4 text-xl font-semibold rounded">
        Get Started
      </button>
    </form>
  </div>
</section>
```

#### Feature Sections (Alternating Layout)

1. **Watch on TV** - TV image + description
2. **Download for Offline** - Mobile phone showing downloads
3. **Watch Everywhere** - Multiple devices
4. **Kids Profiles** - Colorful kids content

Pattern: alternating left-right image/text, dark background, section dividers.

#### FAQ Accordion

```tsx
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-gray-800 mb-2">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex justify-between items-center">
        <span className="text-xl">{question}</span>
        <motion.span animate={{ rotate: isOpen ? 45 : 0 }}>+</motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        className="overflow-hidden">
        <div className="p-6 pt-0 text-lg">{answer}</div>
      </motion.div>
    </div>
  );
};
```

#### Pricing Tiers

| Tier | Resolution | Screens |
|------|-----------|---------|
| Basic | SD | 1 |
| Standard | HD | 2 |
| Premium | 4K | 4 |

Card-based layout with feature comparison, clear pricing, highlighted recommended tier.

#### Signup Flow (5 Steps)

1. **Email Entry** - Landing page email capture
2. **Plan Selection** - Choose subscription tier
3. **Account Creation** - Set password
4. **Payment Method** - Credit card / payment
5. **Confirmation** - Welcome screen

Progress indicator:
```tsx
<div className="flex justify-center gap-2 mb-8">
  {steps.map((_, i) => (
    <div key={i} className={`h-1 flex-1 max-w-20 rounded ${
      i <= currentStep ? 'bg-red-600' : 'bg-gray-600'
    }`} />
  ))}
</div>
```

### Conversion Optimization

- "Cancel anytime" messaging prominently displayed
- Red CTA buttons (high contrast)
- Above-the-fold email capture
- Minimal form fields initially
- Fast page load (optimize images)

---

## 6. Implementation Stack

### Dependencies

```bash
npm install framer-motion
npm install @heroicons/react lucide-react
npm install react-intersection-observer
```

### Netflix Color Palette

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        netflix: {
          red: '#E50914',
          black: '#141414',
          gray: '#2F2F2F',
          'dark-gray': '#181818',
          white: '#E5E5E5',
        }
      },
      fontFamily: {
        netflix: ['Netflix Sans', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    }
  }
}
```

### Key Framer Motion Patterns

| Pattern | Use Case |
|---------|----------|
| `whileHover` | Card scaling |
| `whileInView` | Scroll-triggered animations |
| `AnimatePresence` | Modal transitions |
| `drag` with constraints | Carousels |
| Spring transitions | Natural physics |

### Component Priority (Build Order)

1. Landing Page (unauthenticated)
2. Auth Pages (Login/Signup)
3. Navbar
4. Hero Banner
5. Content Row (Carousel)
6. Movie Card
7. Preview Modal
8. Video Player
9. Profile Selector
10. Search Results

---

## Sources

- [Netflix Design System](https://www.designgurus.io/answers/detail/what-design-system-does-netflix-use)
- [Netflix Interface Analysis (Medium)](https://laurenmk.medium.com/design-talk-netflixs-interface-c47d9b44525c)
- [Netflix TV UI Breakdown](https://mlangendijk.medium.com/breaking-down-the-new-netflix-tv-ui-d651aff8bbee)
- [Netflix UX Strategy Deep Dive](https://createbytes.com/insights/netflix-design-analysis-ui-ux-review)
- [Netflix UX Analysis (CXL)](https://cxl.com/blog/netflix-design/)
- [Netflix Landing Page Flow](https://www.landingpageflow.com/post/how-netflix-crafts-a-seamless-landing-page)
- [Framer Motion Gestures](https://www.framer.com/motion/gestures/)
- [Advanced Framer Motion Patterns](https://blog.maximeheckel.com/posts/advanced-animation-patterns-with-framer-motion/)
- [Responsive Design Breakpoints 2025](https://www.browserstack.com/guide/responsive-design-breakpoints)
