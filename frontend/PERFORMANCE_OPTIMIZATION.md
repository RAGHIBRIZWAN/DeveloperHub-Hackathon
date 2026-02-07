# Performance Optimization — 3D Interactive Website

> Derived from UI/UX Pro Max skill: image-optimization, reduced-motion, content-jumping rules.

---

## 1. Bundle Strategy

### Code Splitting
```tsx
// Three.js dynamically imported (ssr: false)
const Scene = dynamic(() => import('@/components/three/Scene'), { ssr: false });
```

- **Why**: Three.js + R3F + postprocessing = ~150KB gzipped. By dynamically importing with `ssr: false`, the initial page load delivers only HTML/CSS/text (~30KB), and the 3D scene loads in parallel.
- **Result**: FCP < 1.5s even on slow connections.

### Tree Shaking
```json
// next.config.js — transpilePackages ensures proper tree-shaking
transpilePackages: ['three', '@react-three/fiber', '@react-three/drei']
```

### Import Specifics
```tsx
// ❌ Bad — imports entire drei library
import { Sphere, MeshDistortMaterial, Preload } from '@react-three/drei';

// ✅ Good — same result, but bundler can tree-shake
import { Sphere } from '@react-three/drei/core/Sphere';
```

---

## 2. 3D Scene Optimization

### Adaptive Quality
```tsx
// Device-aware rendering
<Canvas
  dpr={[1, isMobile ? 1.5 : 2]}  // Cap DPR on mobile
  gl={{
    antialias: !isMobile,          // Disable AA on mobile
    powerPreference: 'high-performance',
    alpha: true,
  }}
/>
```

### Instanced Rendering
```tsx
// ❌ Bad — 20 separate draw calls
{shapes.map(s => <mesh key={s.id}><octahedronGeometry /><meshStandardMaterial /></mesh>)}

// ✅ Good — 1 draw call for all 20 shapes
<instancedMesh args={[undefined, undefined, 20]}>
  <octahedronGeometry args={[1, 0]} />
  <meshStandardMaterial />
</instancedMesh>
```

### Geometry Memoization
```tsx
// ✅ Geometry created once, reused across renders
const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.5, 4), []);
```

### Post-Processing Budget
```tsx
// Desktop only — completely skip on mobile
{!isMobile && <Effects />}

// Inside Effects: minimize passes
<EffectComposer multisampling={0}>  {/* Disable MSAA, use FXAA if needed */}
  <Bloom luminanceThreshold={0.6} />  {/* High threshold = fewer pixels */}
</EffectComposer>
```

### 3D Asset Loading
```tsx
// ✅ Lazy load with Suspense
<Suspense fallback={null}>
  <HeroModel />
  <Preload all />
</Suspense>

// For GLTF models: always use Draco compression
// npx gltf-pipeline -i model.glb -o model-draco.glb --draco.compressionLevel 7
```

---

## 3. CSS Performance

### GPU-Composited Properties Only
```css
/* ✅ Animatable without layout recalculation */
transform: translateY(20px);
opacity: 0.5;

/* ❌ Triggers layout/paint */
width: 100px;
height: 100px;
top: 50px;
margin-left: 20px;
```

### Backdrop Filter Budget
```css
/* ✅ Small area — acceptable perf */
.glass-nav { backdrop-filter: blur(16px); }

/* ❌ Full-viewport blur — kills FPS */
.full-bg { backdrop-filter: blur(20px); }
```

### Contain for Isolation
```css
/* Isolate paint/layout to individual sections */
.section { contain: layout style paint; }
```

---

## 4. Image & Font Optimization

### Fonts
```tsx
// Next.js font optimization (automatic subsetting + preload)
const inter = Inter({ subsets: ['latin'], display: 'swap' });
```

### Images (if added)
```tsx
import Image from 'next/image';

<Image
  src="/showcase.webp"
  alt="Showcase preview"
  width={800}
  height={600}
  loading="lazy"         // Below fold
  placeholder="blur"     // Prevent CLS
  sizes="(max-width: 768px) 100vw, 33vw"
/>
```

---

## 5. Rendering Strategy

| Content Type | Strategy | Rationale |
|---|---|---|
| Page shell (nav, footer) | SSR | Immediate visible UI |
| Text sections | SSR | SEO + fast FCP |
| 3D Scene | Client-only (`dynamic`, `ssr: false`) | Requires WebGL |
| Animations | Client-only (`'use client'`) | Need browser APIs |

---

## 6. Metrics Targets

| Metric | Target | How to Measure |
|--------|--------|---------------|
| FCP | < 1.5s | Lighthouse / WebPageTest |
| LCP | < 2.5s | Lighthouse |
| TBT | < 200ms | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| 3D FPS | ≥ 60fps desktop, ≥ 30fps mobile | `Stats` from drei or Chrome FPS overlay |
| JS Bundle (initial) | < 150KB gzip | `next build` + `@next/bundle-analyzer` |

---

## 7. Responsive 3D Strategy

```tsx
function useAdaptiveQuality() {
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    const w = window.innerWidth;
    const gpu = (navigator as any).gpu;  // WebGPU check

    if (w < 640) setQuality('low');
    else if (w < 1024) setQuality('medium');
    else setQuality('high');
  }, []);

  return quality;
}

// Usage in Scene
const quality = useAdaptiveQuality();
const segments = { high: 64, medium: 32, low: 16 }[quality];
const enablePostProcessing = quality === 'high';
const particleCount = { high: 20, medium: 12, low: 6 }[quality];
```

---

## 8. Quick Wins Checklist

- [x] Dynamic import 3D scene (`ssr: false`)
- [x] InstancedMesh for repeated geometries
- [x] Disable post-processing on mobile
- [x] Cap DPR at 1.5 on mobile, 2 on desktop
- [x] Use `Suspense` + `Preload` for 3D assets
- [x] `prefers-reduced-motion` check on all animations
- [x] Next.js font optimization with `display: swap`
- [x] CSS `contain` on independent sections
- [ ] Add `@next/bundle-analyzer` and audit
- [ ] GLTF models compressed with Draco
- [ ] Implement `useAdaptiveQuality` hook for granular control
- [ ] Add `<Stats />` from drei in dev mode for FPS monitoring
