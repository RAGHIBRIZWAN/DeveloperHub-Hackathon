import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import HeroModel from './HeroModel';
import FloatingShapes from './FloatingShapes';
import Effects from './Effects';

/**
 * Main 3D scene wrapper.
 * - Suspense prevents blocking during model load
 * - dpr adapts to device pixel ratio
 * - Disabled on very small screens for performance
 */
export default function Scene() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div
      className="canvas-container interactive"
      role="img"
      aria-label="Interactive 3D scene with floating geometric shapes and a central glowing object"
    >
      <Canvas
        dpr={[1, isMobile ? 1.5 : 2]}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{
          antialias: !isMobile,
          powerPreference: 'high-performance',
          alpha: true,
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.15} />
          <directionalLight position={[5, 5, 5]} intensity={0.4} color="#6366F1" />
          <directionalLight position={[-3, 3, -5]} intensity={0.2} color="#8B5CF6" />
          <pointLight position={[0, 0, 3]} intensity={0.6} color="#EC4899" distance={10} />

          {/* 3D Objects */}
          <HeroModel isMobile={isMobile} />
          <FloatingShapes count={isMobile ? 8 : 20} />

          {/* Post-processing (desktop only) */}
          {!isMobile && <Effects />}

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
