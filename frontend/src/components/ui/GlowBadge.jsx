import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Animated badge with glow – used for status tags, tiers, difficulty levels.
 */
export default function GlowBadge({
  children,
  color = 'indigo',
  size = 'sm',
  pulse = false,
  className,
}) {
  const colorMap = {
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    pink: 'bg-pink-500/15 text-pink-400 border-pink-500/25',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    red: 'bg-red-500/15 text-red-400 border-red-500/25',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    gray: 'bg-white/5 text-slate-400 border-white/10',
  };

  const sizeMap = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-sm px-4 py-1.5',
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border',
        colorMap[color] || colorMap.indigo,
        sizeMap[size] || sizeMap.sm,
        pulse && 'animate-pulse-glow',
        className,
      )}
    >
      {pulse && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          color === 'green' ? 'bg-emerald-400' :
          color === 'red' ? 'bg-red-400' :
          color === 'yellow' ? 'bg-yellow-400' :
          'bg-indigo-400'
        )} />
      )}
      {children}
    </motion.span>
  );
}
