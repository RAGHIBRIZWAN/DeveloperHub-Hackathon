import { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * 3D-aware CTA button with glow effect.
 * - Gradient fill connects with the 3D scene's lighting
 * - Box-shadow glow creates depth
 * - Subtle scale on hover adds physicality
 */
export default function GlowButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  icon,
  ...props
}) {
  const reducedMotion = useReducedMotion();
  const buttonRef = useRef(null);

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-sm gap-2',
    lg: 'px-8 py-4 text-base gap-2.5',
  };

  const variantClasses = {
    primary: cn(
      'bg-gradient-hero text-white font-semibold',
      'shadow-glow-sm hover:shadow-glow-md',
    ),
    secondary: cn(
      'glass text-slate-100 font-medium',
      'hover:bg-glass-hover',
    ),
    ghost: cn(
      'bg-transparent text-slate-300 font-medium',
      'hover:text-white hover:bg-white/5',
    ),
  };

  const sharedClasses = cn(
    'inline-flex items-center justify-center rounded-xl',
    'transition-all duration-300 ease-out',
    'cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary',
    sizeClasses[size],
    variantClasses[variant],
    className,
  );

  const motionProps = reducedMotion
    ? {}
    : {
        whileHover: { scale: 1.03 },
        whileTap: { scale: 0.97 },
        transition: { type: 'spring', stiffness: 400, damping: 20 },
      };

  const content = (
    <>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <motion.a
        ref={buttonRef}
        href={href}
        className={sharedClasses}
        {...motionProps}
        {...props}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      className={sharedClasses}
      {...motionProps}
      {...props}
    >
      {content}
    </motion.button>
  );
}
