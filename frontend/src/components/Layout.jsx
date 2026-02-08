import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  BookOpen,
  Trophy,
  User,
  LogOut,
  Coins,
  Flame,
  ShoppingBag,
  Shield,
  Swords,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Code2,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { gamifyAPI } from '../services/api';

/* ───── Theme palette map ───── */
const THEME_COLORS = {
  default:  { accent: 'from-indigo-500 to-violet-600', ring: 'ring-indigo-500/30' },
  dark:     { accent: 'from-slate-600 to-slate-800',     ring: 'ring-slate-500/30' },
  nature:   { accent: 'from-green-500 to-emerald-600', ring: 'ring-green-500/30' },
  ocean:    { accent: 'from-sky-500 to-blue-600',      ring: 'ring-sky-500/30' },
  sunset:   { accent: 'from-orange-500 to-red-600',    ring: 'ring-orange-500/30' },
  galaxy:   { accent: 'from-violet-500 to-purple-600', ring: 'ring-violet-500/30' },
  pakistan: { accent: 'from-green-600 to-green-800',   ring: 'ring-green-500/30' },
  gold:     { accent: 'from-yellow-500 to-amber-600',  ring: 'ring-yellow-500/30' },
};

/* ───── Bottom nav items (mobile only, max 5) ───── */
const MOBILE_NAV = [
  { path: '/dashboard',   icon: Home,    label: 'Home' },
  { path: '/courses',     icon: BookOpen, label: 'Learn' },
  { path: '/compete',     icon: Swords,  label: 'Compete' },
  { path: '/leaderboard', icon: Trophy,  label: 'Rank' },
  { path: '/profile',     icon: User,    label: 'Profile' },
];

const Layout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    level, xp, xpToNextLevel, coins, currentStreak,
    updateGamification, activeTheme,
  } = useGamificationStore();

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useMemo(() => THEME_COLORS[activeTheme] || THEME_COLORS.default, [activeTheme]);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  /* ──── Gamification data ──── */
  const { data: gamifyData } = useQuery({
    queryKey: ['gamification', user?.id],
    queryFn: async () => (await gamifyAPI.getProfile()).data,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (gamifyData) updateGamification(gamifyData);
  }, [gamifyData]);

  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);

  const navItems = useMemo(() => {
    if (isAdmin) {
      return [{ path: '/admin', icon: Shield, label: 'Admin Panel' }];
    }
    return [
      { path: '/dashboard',   icon: Home,       label: t('nav.home') },
      { path: '/leaderboard', icon: Trophy,      label: t('compete.leaderboard') || 'Leaderboard' },
      { path: '/courses',     icon: BookOpen,    label: t('nav.learn') },
      { path: '/practice',    icon: Code2,       label: 'Practice' },
      { path: '/compete',     icon: Swords,      label: t('nav.compete') },
      { path: '/shop',        icon: ShoppingBag, label: t('nav.shop') },
      { path: '/profile',     icon: User,        label: t('nav.profile') },
    ];
  }, [t, isAdmin]);

  const handleLogout = useCallback(() => { logout(); navigate('/'); }, [logout, navigate]);
  const xpPct = useMemo(() => Math.min((xp / xpToNextLevel) * 100, 100), [xp, xpToNextLevel]);

  /* ───── Shared sidebar content (used by desktop sidebar AND mobile drawer) ───── */
  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Ambient glow */}
      <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full bg-gradient-to-br ${theme.accent} opacity-[0.07] blur-3xl pointer-events-none`} />

      {/* ── Logo ── */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${theme.accent} flex items-center justify-center shrink-0 shadow-glow-sm`}>
            <span className="text-white font-bold text-sm">&lt;/&gt;</span>
          </div>
          {(isMobile || !collapsed) && (
            <span className="text-lg font-bold text-gradient whitespace-nowrap">CodeHub</span>
          )}
        </Link>
        {isMobile && (
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/[0.10] transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ── User Card ── */}
      <div className="px-3 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {user?.profile_picture ? (
            <img src={user.profile_picture} alt="" className={`w-10 h-10 rounded-full object-cover ring-2 ${theme.ring} shrink-0`} />
          ) : (
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${theme.accent} flex items-center justify-center shrink-0 ring-2 ${theme.ring}`}>
              <span className="font-bold text-sm">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
            </div>
          )}
          {(isMobile || !collapsed) && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-white truncate max-w-[140px]">{user?.username || 'User'}</p>
                {isAdmin && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25 font-medium">Admin</span>
                )}
              </div>
              <p className="text-xs text-slate-500">Level {level}</p>
            </div>
          )}
        </div>

        {(isMobile || !collapsed) && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>XP</span>
              <span>{xp} / {xpToNextLevel}</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${theme.accent} rounded-full`}
                initial={false}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <div className="flex items-center justify-between mt-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-yellow-400">
                <Coins size={14} /><span className="font-medium">{coins}</span>
              </div>
              <div className="flex items-center gap-1.5 text-orange-400">
                <Flame size={14} /><span className="font-medium">{currentStreak}d</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-400">
                <Sparkles size={14} /><span className="font-medium">Lv.{level}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <li key={path}>
                <Link
                  to={path}
                  className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId={isMobile ? 'nav-indicator-mobile' : 'nav-indicator'}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-gradient-to-b ${theme.accent}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={20} className="shrink-0" />
                  {(isMobile || !collapsed) && (
                    <span className="text-sm font-medium whitespace-nowrap">{label}</span>
                  )}
                  {isActive && (
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${theme.accent} opacity-[0.06] pointer-events-none`} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Logout ── */}
      <div className="px-2 py-3 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200"
        >
          <LogOut size={20} className="shrink-0" />
          {(isMobile || !collapsed) && (
            <span className="text-sm font-medium">{t('auth.logout')}</span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface-primary text-white flex flex-col md:flex-row">

      {/* ══════════ MOBILE TOP BAR ══════════ */}
      <header className="md:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-surface-primary/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/[0.10] transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.accent} flex items-center justify-center`}>
            <span className="text-white font-bold text-xs">&lt;/&gt;</span>
          </div>
          <span className="text-base font-bold text-gradient">CodeHub</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs">
          <Coins size={14} className="text-yellow-400" />
          <span className="text-yellow-400 font-semibold">{coins}</span>
        </div>
      </header>

      {/* ══════════ MOBILE DRAWER OVERLAY ══════════ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden fixed left-0 top-0 h-full w-[280px] max-w-[85vw] bg-surface-secondary border-r border-white/[0.06] z-50 flex flex-col overflow-y-auto"
            >
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ DESKTOP SIDEBAR ══════════ */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex relative flex-col border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl z-30 shrink-0"
      >
        <SidebarContent />

        {/* ── Collapse Toggle (desktop only) ── */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-secondary border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/[0.15] transition-all z-40"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </motion.aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="flex-1 overflow-auto relative pb-16 md:pb-0">
        <div className="hidden md:block absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        <Outlet />
      </main>

      {/* ══════════ MOBILE BOTTOM NAV ══════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-surface-primary/90 backdrop-blur-2xl border-t border-white/[0.06]">
        <div className="flex items-center justify-around h-full px-1">
          {(isAdmin ? [{ path: '/admin', icon: Shield, label: 'Admin' }] : MOBILE_NAV).map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-colors duration-200 ${
                  isActive ? 'text-indigo-400' : 'text-slate-500 active:text-slate-300'
                }`}
              >
                <Icon size={22} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-dot"
                    className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
