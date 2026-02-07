import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';

/**
 * Central interactive 3D object for the hero section.
 * - MeshDistortMaterial gives organic, living feel
 * - Responds to mouse position for interactivity
 * - Wireframe overlay adds depth and tech vibe
 */
export default function HeroModel({ isMobile }) {
  const meshRef = useRef(null);
  const wireRef = useRef(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    // Slow idle rotation
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    meshRef.current.rotation.y = t * 0.15;

    // Mouse reactivity
    const mouseX = state.pointer.x * 0.3;
    const mouseY = state.pointer.y * 0.2;
    meshRef.current.rotation.x += mouseY;
    meshRef.current.rotation.z = mouseX * 0.1;

    // Wireframe follows
    if (wireRef.current) {
      wireRef.current.rotation.copy(meshRef.current.rotation);
    }
  });

  const segments = isMobile ? 32 : 64;

  return (
    <group position={[0, 0, 0]}>
      {/* Main distorted sphere */}
      <Sphere ref={meshRef} args={[1.6, segments, segments]}>
        <MeshDistortMaterial
          color="#6366F1"
          emissive="#8B5CF6"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.8}
          distort={0.3}
          speed={1.5}
          transparent
          opacity={0.85}
        />
      </Sphere>

      {/* Wireframe overlay for depth */}
      <Sphere ref={wireRef} args={[1.65, 20, 20]}>
        <meshBasicMaterial
          color="#8B5CF6"
          wireframe
          transparent
          opacity={0.08}
        />
      </Sphere>
    </group>
  );
}
