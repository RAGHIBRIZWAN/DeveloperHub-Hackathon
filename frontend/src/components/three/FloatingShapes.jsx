import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Ambient floating geometric shapes in the background.
 * - InstancedMesh: 1 draw call for all shapes
 * - Random positions create depth and parallax
 * - Low opacity so they don't compete with UI overlays
 */
export default function FloatingShapes({ count = 20 }) {
  const meshRef = useRef(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10 - 3,
        ),
        scale: Math.random() * 0.15 + 0.05,
        speed: Math.random() * 0.3 + 0.1,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    particles.forEach((particle, i) => {
      const { position, scale, speed, offset } = particle;

      dummy.position.set(
        position.x + Math.sin(t * speed + offset) * 0.5,
        position.y + Math.cos(t * speed * 0.7 + offset) * 0.3,
        position.z,
      );
      dummy.rotation.set(t * speed * 0.5, t * speed * 0.3, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#6366F1"
        emissive="#8B5CF6"
        emissiveIntensity={0.3}
        transparent
        opacity={0.15}
        roughness={0.5}
        metalness={0.5}
      />
    </instancedMesh>
  );
}
