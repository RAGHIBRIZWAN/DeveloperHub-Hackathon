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
  const theme = useMemo(() => THEME_COLORS[activeTheme] || THEME_COLORS.default, [activeTheme]);

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
    // Admin users ONLY see the Admin panel
    if (isAdmin) {
      return [
        { path: '/admin', icon: Shield, label: 'Admin Panel' },
      ];
    }
    // Regular users see full navigation with Leaderboard near top
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

  return (
    <div className="min-h-screen bg-surface-primary text-white flex">
      {/* ══════════════ SIDEBAR ══════════════ */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl z-30 shrink-0"
      >
        {/* Ambient glow behind sidebar top */}
        <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full bg-gradient-to-br ${theme.accent} opacity-[0.07] blur-3xl pointer-events-none`} />

        {/* ── Logo ── */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/[0.06]">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${theme.accent} flex items-center justify-center shrink-0 shadow-glow-sm`}>
              <span className="text-white font-bold text-sm">&lt;/&gt;</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="text-lg font-bold text-gradient whitespace-nowrap"
                >
                  CodeHub
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* ── User Card ── */}
        <div className="px-3 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt=""
                className={`w-10 h-10 rounded-full object-cover ring-2 ${theme.ring} shrink-0`}
              />
            ) : (
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${theme.accent} flex items-center justify-center shrink-0 ring-2 ${theme.ring}`}>
                <span className="font-bold text-sm">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
              </div>
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white truncate max-w-[120px]">{user?.username || 'User'}</p>
                    {isAdmin && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25 font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Level {level}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* XP bar */}
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
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

              {/* Coins + Streak row */}
              <div className="flex items-center justify-between mt-2.5 text-xs">
                <div className="flex items-center gap-1.5 text-yellow-400">
                  <Coins size={14} />
                  <span className="font-medium">{coins}</span>
                </div>
                <div className="flex items-center gap-1.5 text-orange-400">
                  <Flame size={14} />
                  <span className="font-medium">{currentStreak}d</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <Sparkles size={14} />
                  <span className="font-medium">Lv.{level}</span>
                </div>
              </div>
            </motion.div>
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
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-white/[0.08] text-white'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-gradient-to-b ${theme.accent}`}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    <Icon size={20} className="shrink-0" />

                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          className="text-sm font-medium whitespace-nowrap"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Hover glow */}
                    {isActive && (
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${theme.accent} opacity-[0.06] pointer-events-none`} />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Footer ── */}
        <div className="px-2 py-3 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200"
          >
            <LogOut size={20} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  {t('auth.logout')}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* ── Collapse Toggle ── */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-secondary border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/[0.15] transition-all z-40"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </motion.aside>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <main className="flex-1 overflow-auto relative">
        {/* Subtle top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
