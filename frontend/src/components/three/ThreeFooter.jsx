import { cn } from '../../lib/utils';

/**
 * Minimal 3D-style footer.
 */
export default function ThreeFooter() {
  return (
    <footer className="relative z-10 border-t border-white/5 py-12 px-6">
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-hero">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>&copy; {new Date().getFullYear()} CodeHub. Made with passion by Team AI CHAMPS</span>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex items-center gap-6 text-sm text-slate-500">
            {['Privacy', 'Terms', 'Contact'].map((link) => (
              <li key={link}>
                <a
                  href={`#${link.toLowerCase()}`}
                  className="hover:text-slate-200 transition-colors duration-200 cursor-pointer"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
