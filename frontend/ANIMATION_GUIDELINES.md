# Animation Guidelines — 3D Interactive Site

> Derived from UI/UX Pro Max skill: duration-timing, transform-performance, reduced-motion rules.

---

## 1. Motion Principles

| Principle | Implementation |
|-----------|---------------|
| **Purpose** | Every animation must communicate state change, guide attention, or enhance spatial hierarchy. Decorative-only motion is removed. |
| **Duration** | Micro: 150–250ms · UI transitions: 300–500ms · Section reveals: 600–1000ms · 3D cameras: 800–1500ms |
| **Easing** | Default: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out). Enter: `power2.out`. Exit: `power2.in`. Scrub: `linear`. |
| **GPU-only** | Animate **only** `transform` and `opacity`. Never `width`, `height`, `top`, `left`, `margin`, `padding`. |
| **Reduced motion** | Wrap all motion in `useReducedMotion()` or CSS `@media (prefers-reduced-motion: reduce)`. |

---

## 2. Component-Specific Motion

### Navigation Bar
```tsx
// Entrance
initial={{ y: -20, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}

// Scroll state change (glass intensity)
transition-all duration-300 ease-out  // CSS only — no JS
```

### Hero Section
```tsx
// Badge → Heading → Body → CTAs → Stats (staggered)
delay: 0.1, 0.2, 0.3, 0.4, 0.6  // 100ms base stagger

// Scroll indicator bounce
animate={{ y: [0, 8, 0] }}
transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
```

### Feature Cards (3D tilt)
```tsx
// Mouse-driven perspective tilt
rotateX: useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
  stiffness: 300, damping: 30
})

// Entrance stagger
delay: index * 0.08  // 80ms between cards
```

### Showcase Cards (scroll parallax)
```tsx
// Different speeds per card for depth illusion
y1: [60, -60]   // slow
y2: [30, -30]   // medium
y3: [90, -90]   // fast

// Driven by useScroll, no JS on every frame
```

### CTA Section
```tsx
// Standard reveal
initial={{ opacity: 0, y: 40 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ duration: 0.7 }}
```

---

## 3. 3D Object Animation

### Hero Model (useFrame)
```tsx
// Idle rotation (always running)
mesh.rotation.y = time * 0.15;
mesh.rotation.x = Math.sin(time * 0.3) * 0.2;

// Mouse reactivity (additive)
mesh.rotation.x += pointer.y * 0.2;
mesh.rotation.z = pointer.x * 0.1;
```

### Floating Shapes (InstancedMesh)
```tsx
// Per-instance offset for variety
x: baseX + Math.sin(time * speed + offset) * 0.5
y: baseY + Math.cos(time * speed * 0.7 + offset) * 0.3

// Keep all transforms in useFrame (no React state)
instancedMesh.instanceMatrix.needsUpdate = true;
```

---

## 4. GSAP Integration Points

Use GSAP for:
- Complex scroll-triggered timelines (`ScrollTrigger`)
- Morphing / path animations
- Staggered reveals with precise control

```typescript
// Import pattern
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Timeline example
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: sectionRef.current,
    start: 'top 80%',
    end: 'bottom 20%',
    scrub: 1,
  },
});

tl.fromTo('.card', { y: 50, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1 });
```

---

## 5. Framer Motion Integration Points

Use Framer Motion for:
- Component mount/unmount animations (`AnimatePresence`)
- Layout animations
- Gesture-based interactions (drag, hover, tap)
- Scroll-linked transforms (`useScroll`, `useTransform`)

```tsx
// Layout animation for nav state
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    />
  )}
</AnimatePresence>
```

---

## 6. Anti-Patterns

| Don't | Do Instead |
|-------|-----------|
| `animate({ width: '100%' })` | `animate({ scaleX: 1 })` |
| `transition: all 0.3s` | `transition: transform 0.3s, opacity 0.3s` |
| 50+ elements animating simultaneously | Stagger with 60-80ms delay |
| Parallax offset > 15% of viewport | Cap at `[-60, 60]` px range |
| GSAP + Framer on same element | Pick one per element |
| Animation without reduced-motion check | Always wrap with `useReducedMotion()` |
| `setTimeout` for sequencing | Use GSAP timeline or Framer `delay` |

---

## 7. Testing Checklist

- [ ] All animations play smoothly at 60fps (Chrome DevTools > Performance)
- [ ] `prefers-reduced-motion: reduce` disables all non-essential motion
- [ ] No layout shift during animations (CLS = 0)
- [ ] 3D object responds to mouse movement without jank
- [ ] Mobile: animations are simplified or disabled
- [ ] Scroll-triggered animations fire at correct viewport positions
- [ ] No animation plays before its element is visible
