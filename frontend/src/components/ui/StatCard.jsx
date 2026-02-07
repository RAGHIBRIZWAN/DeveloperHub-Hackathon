import { motion} from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Premium animated stat card with icon, value, label, and optional trend.
 * Features glass morphism, gradient accent line, and hover glow.
 */
export default function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  color = 'indigo',
  delay = 0,
  className,
}) {
  const colorMap = {
    indigo: {
      iconBg: 'bg-indigo-500/15',
      iconText: 'text-indigo-400',
      glow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]',
      accent: 'from-indigo-500 to-indigo-400',
      trend: 'text-indigo-400',
    },
    violet: {
      iconBg: 'bg-violet-500/15',
      iconText: 'text-violet-400',
      glow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
      accent: 'from-violet-500 to-violet-400',
      trend: 'text-violet-400',
    },
    pink: {
      iconBg: 'bg-pink-500/15',
      iconText: 'text-pink-400',
      glow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]',
      accent: 'from-pink-500 to-pink-400',
      trend: 'text-pink-400',
    },
    blue: {
      iconBg: 'bg-blue-500/15',
      iconText: 'text-blue-400',
      glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]',
      accent: 'from-blue-500 to-blue-400',
      trend: 'text-blue-400',
    },
    green: {
      iconBg: 'bg-emerald-500/15',
      iconText: 'text-emerald-400',
      glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      accent: 'from-emerald-500 to-emerald-400',
      trend: 'text-emerald-400',
    },
    yellow: {
      iconBg: 'bg-yellow-500/15',
      iconText: 'text-yellow-400',
      glow: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]',
      accent: 'from-yellow-500 to-yellow-400',
      trend: 'text-yellow-400',
    },
    orange: {
      iconBg: 'bg-orange-500/15',
      iconText: 'text-orange-400',
      glow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]',
      accent: 'from-orange-500 to-orange-400',
      trend: 'text-orange-400',
    },
    red: {
      iconBg: 'bg-red-500/15',
      iconText: 'text-red-400',
      glow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]',
      accent: 'from-red-500 to-red-400',
      trend: 'text-red-400',
    },
    cyan: {
      iconBg: 'bg-cyan-500/15',
      iconText: 'text-cyan-400',
      glow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
      accent: 'from-cyan-500 to-cyan-400',
      trend: 'text-cyan-400',
    },
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'bg-white/[0.04] border border-white/[0.06]',
        'backdrop-blur-xl',
        'p-5',
        'transition-all duration-500',
        'hover:bg-white/[0.07] hover:border-white/[0.1]',
        c.glow,
        className,
      )}
    >
      {/* Top gradient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${c.accent} opacity-60`} />

      <div className="flex items-start justify-between">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', c.iconBg)}>
          {Icon && <Icon size={22} className={c.iconText} />}
        </div>
        {trend !== undefined && (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', c.iconBg, c.trend)}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-sm text-slate-400 mt-1">{label}</p>
      </div>

      {/* Subtle bottom glow on hover */}
      <div
        className={cn(
          'absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 rounded-full blur-2xl',
          `bg-gradient-to-r ${c.accent}`,
          'opacity-0 group-hover:opacity-20 transition-opacity duration-500',
        )}
      />
    </motion.div>
  );
}
