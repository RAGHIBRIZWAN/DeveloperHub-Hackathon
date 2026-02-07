import { cn } from '../../lib/utils';

/**
 * Reusable glassmorphism card with optional hover glow.
 * Frosted-glass background lets 3D content show through.
 */
export default function GlassCard({
  children,
  className,
  hover = true,
  glow = false,
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={cn(
        'glass rounded-2xl p-6',
        'shadow-glass',
        'transition-all duration-300 ease-out',
        hover && 'hover:bg-glass-hover hover:border-white/[0.12] cursor-pointer',
        glow && 'glow-hover',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
