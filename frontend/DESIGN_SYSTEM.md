# 3D Interactive Website — Design System

> Generated using **UI/UX Pro Max** skill methodology.

---

## 1. UI/UX Rationale

### Why Glassmorphism + Dark Mode First?

| Decision | Rationale |
|----------|-----------|
| **Dark mode first** | 3D scenes rendered via WebGL emit their own light; dark backgrounds prevent wash-out and let 3D objects pop visually. Reduces eye strain during extended immersive sessions. |
| **Glassmorphism panels** | Frosted-glass surfaces create a natural depth illusion that harmonises with 3D content behind them, producing a cohesive foreground ↔ background relationship. |
| **Floating UI** | Detaching panels from viewport edges gives the 3D scene breathing room, maintaining immersion while keeping controls accessible. |
| **Minimal overlays** | Every opaque pixel blocks 3D content; keeping UI footprint small maximises the "window into the scene" effect. |
| **Large typography** | Needs to remain readable on top of animated, noisy 3D backgrounds. High contrast + generous sizing solves this. |
| **Soft accent gradients** | Neon/hard gradients compete with 3D lighting. Soft gradients (low saturation delta) add colour without visual conflict. |

### Depth-Based Layering Model

```
┌────────────────────────────────────────────┐
│  z-50  Overlays (modals, tooltips)         │
│  z-40  Navigation bar                      │
│  z-30  Floating panels / CTA buttons       │
│  z-20  Feature cards / mid-layer content   │
│  z-10  Scroll sections                     │
│  z-0   3D Canvas (Three.js / R3F)          │
└────────────────────────────────────────────┘
```

---

## 2. Color Palette

### Primary Tokens (Dark Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0A0A0F` | Page background |
| `--bg-secondary` | `#12121A` | Card/panel backgrounds |
| `--bg-glass` | `rgba(255,255,255,0.05)` | Glassmorphism fill |
| `--border-glass` | `rgba(255,255,255,0.08)` | Glass panel borders |
| `--text-primary` | `#F1F5F9` | Headings (slate-100) |
| `--text-secondary` | `#94A3B8` | Body text (slate-400) |
| `--text-muted` | `#64748B` | Captions (slate-500) |
| `--accent-primary` | `#6366F1` | Indigo-500, primary accent |
| `--accent-secondary` | `#8B5CF6` | Violet-500, secondary accent |
| `--accent-glow` | `rgba(99,102,241,0.25)` | Glow effects |
| `--success` | `#10B981` | Emerald-500 |
| `--warning` | `#F59E0B` | Amber-500 |
| `--error` | `#EF4444` | Red-500 |

### Gradient Presets

```css
--gradient-hero:     linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);
--gradient-subtle:   linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%);
--gradient-card:     linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
--gradient-text:     linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899);
```

---

## 3. Typography

### Font Pairing

| Role | Font | Weight | Rationale |
|------|------|--------|-----------|
| **Headings** | Inter | 700, 800 | Geometric, modern, excellent at large sizes. Clean shapes harmonise with 3D geometry. |
| **Body** | Inter | 400, 500 | Same family for consistency; x-height optimised for screen. |
| **Code / Mono** | JetBrains Mono | 400 | For any tech/data readouts overlaying the 3D scene. |

### Type Scale (Fluid)

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| H1 (Hero) | `clamp(3rem, 5vw, 5rem)` | 3rem | 2.25rem |
| H2 (Section) | `clamp(2rem, 3.5vw, 3rem)` | 2rem | 1.75rem |
| H3 (Card) | `clamp(1.25rem, 2vw, 1.5rem)` | 1.25rem | 1.125rem |
| Body | `1rem` (16px) | 1rem | 1rem |
| Caption | `0.875rem` (14px) | 0.875rem | 0.875rem |

### Line Height & Spacing

- **Headings**: `line-height: 1.1 – 1.2` (tight for drama)
- **Body text**: `line-height: 1.6 – 1.75` (comfortable reading)
- **Max line length**: `65ch` on prose blocks

---

## 4. Glassmorphism Specification

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

---

## 5. Animation Guidelines

| Category | Duration | Easing | Notes |
|----------|----------|--------|-------|
| Micro-interactions (hover, tap) | 150–250ms | `cubic-bezier(0.4, 0, 0.2, 1)` | GSAP or CSS transitions |
| Panel reveal | 300–500ms | `power2.out` (GSAP) | Slide + fade |
| Section transitions | 600–1000ms | `power3.inOut` | Scroll-triggered via GSAP ScrollTrigger |
| 3D camera movement | 800–1500ms | `power2.inOut` | Smooth orbit/dolly |
| Page-level transitions | 400–600ms | `ease-in-out` | Framer Motion `AnimatePresence` |

### Rules

1. **Always respect `prefers-reduced-motion`** — disable non-essential animations.
2. **Use `transform` and `opacity` only** — never animate `width`, `height`, `top`, `left`.
3. **Stagger children** — 50–80ms stagger for list/card reveals.
4. **3D objects**: animate via R3F `useFrame` or GSAP `gsap.to(mesh.rotation, ...)`.
5. **Parallax**: max 15% offset — too much causes motion sickness.

---

## 6. Component Architecture

```
src/
├── app/
│   ├── layout.tsx            # Root layout, font loading, providers
│   ├── page.tsx              # Home page composition
│   └── globals.css           # Tailwind base + design tokens
├── components/
│   ├── layout/
│   │   ├── FloatingNav.tsx   # Glassmorphic floating navbar
│   │   └── Footer.tsx        # Minimal footer
│   ├── sections/
│   │   ├── HeroSection.tsx   # Hero + 3D canvas integration
│   │   ├── FeaturesSection.tsx
│   │   ├── ShowcaseSection.tsx
│   │   └── CTASection.tsx
│   ├── three/
│   │   ├── Scene.tsx         # R3F Canvas wrapper
│   │   ├── HeroModel.tsx     # Interactive 3D object
│   │   ├── FloatingShapes.tsx
│   │   └── Effects.tsx       # Post-processing
│   ├── ui/
│   │   ├── GlassCard.tsx     # Reusable glass panel
│   │   ├── GlowButton.tsx    # 3D-aware CTA button
│   │   ├── SectionWrapper.tsx
│   │   └── MotionWrapper.tsx # Reduced-motion aware wrapper
│   └── shared/
│       ├── Icons.tsx         # SVG icon components
│       └── constants.ts      # Design tokens as JS
├── hooks/
│   ├── useReducedMotion.ts
│   ├── useScrollProgress.ts
│   └── useMousePosition.ts
├── lib/
│   └── animations.ts         # GSAP timeline presets
└── styles/
    └── fonts.ts               # Font configuration
```

---

## 7. Z-Index Scale

| Layer | z-index | Elements |
|-------|---------|----------|
| Base canvas | `0` | Three.js `<Canvas>` |
| Background effects | `5` | Gradient orbs, noise |
| Content sections | `10` | Feature cards, text blocks |
| Floating panels | `20` | Info panels, side drawers |
| CTA buttons | `30` | Primary action buttons |
| Navigation | `40` | Floating navbar |
| Overlays | `50` | Modals, tooltips, menus |

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Strategy |
|------------|-------|----------|
| Mobile | `< 640px` | Stack layout, hide 3D or reduce complexity, full-width panels |
| Tablet | `640–1023px` | 2-column grid, simplified 3D, medium glass panels |
| Desktop | `1024–1439px` | Full layout, full 3D scene |
| Large | `≥ 1440px` | Max-width container `1280px`, centered |

### 3D Responsive Strategy

- **Mobile**: Replace complex 3D with static/simple animated shapes or disable entirely.
- **Tablet**: Reduce polygon count, disable post-processing.
- **Desktop**: Full experience with all effects.
- Use `useMediaQuery` or R3F's `useThree().viewport` for adaptive rendering.

---

## 9. Accessibility Checklist

- [x] Minimum 4.5:1 contrast ratio for all text over glass panels
- [x] `prefers-reduced-motion` disables all non-essential animations
- [x] `prefers-color-scheme` respected (light mode fallback provided)
- [x] All interactive elements have visible focus rings (`ring-2 ring-indigo-500`)
- [x] `aria-label` on icon-only buttons
- [x] Skip-to-content link for keyboard navigation
- [x] 3D canvas has `role="img"` with `aria-label` describing the scene
- [x] Touch targets ≥ 44×44px
- [x] No content conveyed by colour alone

---

## 10. Performance Budget

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Total Blocking Time | < 200ms |
| 3D Scene FPS | ≥ 60fps desktop, ≥ 30fps mobile |
| JS Bundle (initial) | < 150KB gzipped |
| 3D Assets | < 2MB total |

### Anti-Patterns to Avoid

- ❌ Emojis as icons — use Lucide React SVGs
- ❌ Layout-shifting hover effects (no `scale` on cards in flow)
- ❌ Uncompressed 3D models — always use Draco/glTF
- ❌ Synchronous 3D loading — always lazy-load with Suspense
- ❌ CSS `filter: blur()` on large areas — use `backdrop-filter` on small panels only
- ❌ Re-creating 3D geometries on every render — memoize with `useMemo`
