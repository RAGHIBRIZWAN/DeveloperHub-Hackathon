import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '#features' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Contact', href: '#cta' },
];

/**
 * Floating glassmorphic navigation bar.
 * - Offset from viewport edges for floating effect
 * - Intensifies glass effect on scroll
 * - Responsive mobile drawer
 */
export default function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={reducedMotion ? false : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed top-4 left-4 right-4 z-40',
        'mx-auto max-w-6xl',
        'rounded-2xl px-6 py-3',
        'transition-all duration-300 ease-out',
        scrolled ? 'glass-strong shadow-float' : 'glass',
      )}
    >
      <nav className="flex items-center justify-between" aria-label="Main navigation">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight group cursor-pointer"
          aria-label="Go to homepage"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-gradient">CodeHub</span>
        </Link>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              {item.href.startsWith('#') ? (
                <a
                  href={item.href}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium rounded-lg',
                    'text-slate-300 hover:text-white',
                    'transition-colors duration-200',
                    'hover:bg-white/5 cursor-pointer',
                  )}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  to={item.href}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium rounded-lg',
                    'text-slate-300 hover:text-white',
                    'transition-colors duration-200',
                    'hover:bg-white/5 cursor-pointer',
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Link
            to="/register"
            className={cn(
              'hidden md:inline-flex items-center px-5 py-2 text-sm font-semibold',
              'rounded-xl bg-gradient-hero text-white',
              'shadow-glow-sm hover:shadow-glow-md',
              'transition-shadow duration-300 cursor-pointer',
            )}
          >
            Get Started
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden"
          >
            <ul className="flex flex-col gap-1 pt-4 pb-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  {item.href.startsWith('#') ? (
                    <a
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block mt-2 px-4 py-3 text-sm font-semibold text-center rounded-xl bg-gradient-hero text-white cursor-pointer"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
