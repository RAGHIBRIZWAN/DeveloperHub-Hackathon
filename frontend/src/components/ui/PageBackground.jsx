import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Animated mesh gradient background with floating orbs.
 * Creates depth and atmosphere behind page content.
 */
export default function PageBackground({ variant = 'default', className = '' }) {
  const reduced = useReducedMotion();

  const orbs = {
    default: [
      { color: 'bg-indigo-500/20', size: 'w-96 h-96', pos: '-top-48 -right-48', delay: 0 },
      { color: 'bg-violet-500/15', size: 'w-80 h-80', pos: 'top-1/3 -left-40', delay: 2 },
      { color: 'bg-pink-500/10', size: 'w-72 h-72', pos: 'bottom-0 right-1/4', delay: 4 },
    ],
    auth: [
      { color: 'bg-indigo-600/25', size: 'w-[500px] h-[500px]', pos: '-top-64 -left-64', delay: 0 },
      { color: 'bg-violet-600/20', size: 'w-96 h-96', pos: 'bottom-0 -right-48', delay: 3 },
      { color: 'bg-pink-600/15', size: 'w-72 h-72', pos: 'top-1/2 left-1/2', delay: 1.5 },
    ],
    dashboard: [
      { color: 'bg-blue-500/15', size: 'w-[600px] h-[600px]', pos: '-top-72 -right-72', delay: 0 },
      { color: 'bg-indigo-500/10', size: 'w-96 h-96', pos: 'top-1/2 -left-48', delay: 2 },
      { color: 'bg-cyan-500/10', size: 'w-80 h-80', pos: 'bottom-0 right-0', delay: 4 },
    ],
    compete: [
      { color: 'bg-yellow-500/15', size: 'w-[500px] h-[500px]', pos: '-top-64 -right-64', delay: 0 },
      { color: 'bg-orange-500/10', size: 'w-96 h-96', pos: 'bottom-0 -left-48', delay: 2 },
      { color: 'bg-red-500/10', size: 'w-72 h-72', pos: 'top-1/3 right-1/3', delay: 3 },
    ],
    shop: [
      { color: 'bg-purple-500/20', size: 'w-[500px] h-[500px]', pos: '-top-64 -left-64', delay: 0 },
      { color: 'bg-pink-500/15', size: 'w-96 h-96', pos: 'bottom-0 -right-48', delay: 2 },
      { color: 'bg-fuchsia-500/10', size: 'w-72 h-72', pos: 'top-1/2 right-1/4', delay: 4 },
    ],
  };

  const orbSet = orbs[variant] || orbs.default;

  return (
    <div className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}>
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating gradient orbs */}
      {orbSet.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${orb.color} ${orb.size} ${orb.pos}`}
          animate={
            reduced
              ? {}
              : {
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }
          }
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: orb.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
