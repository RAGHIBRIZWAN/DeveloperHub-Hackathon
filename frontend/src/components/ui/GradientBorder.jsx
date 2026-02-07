import { cn } from '../../lib/utils';

/**
 * Animated gradient border wrapper.
 * Uses a rotating conic gradient underneath with a dark inner fill.
 */
export default function GradientBorder({
  children,
  className,
  borderWidth = 1,
  rounded = '2xl',
  animate = true,
}) {
  const roundedMap = {
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  };

  const r = roundedMap[rounded] || roundedMap['2xl'];

  return (
    <div className={cn('relative group', className)}>
      {/* Gradient border (animated rotation) */}
      <div
        className={cn(
          'absolute -inset-[1px]',
          r,
          'bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500',
          'opacity-40 group-hover:opacity-70',
          'transition-opacity duration-500',
          animate && 'animate-[spin_6s_linear_infinite]',
          'blur-[1px]',
        )}
        style={{ padding: borderWidth }}
      />
      {/* Inner content */}
      <div
        className={cn(
          'relative bg-surface-primary',
          r,
          'overflow-hidden',
        )}
      >
        {children}
      </div>
    </div>
  );
}
