import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Scroll-aware section wrapper with entrance animation.
 * - Consistent vertical rhythm across all sections
 * - Respects prefers-reduced-motion
 */
export default function SectionWrapper({
  children,
  id,
  className,
  padNav = false,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={reducedMotion ? false : { opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative z-10 px-6 py-24 md:py-32',
        padNav && 'pt-32 md:pt-40',
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </motion.section>
  );
}
