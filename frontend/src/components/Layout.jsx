import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  User, 
  Settings, 
  LogOut,
  Coins,
  Star,
  Flame,
  ShoppingBag,
  Shield,
  Bell
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { gamifyAPI } from '../services/api';

const Layout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { level, xp, xpToNextLevel, coins, currentStreak, updateGamification, activeTheme } = useGamificationStore();

  // Theme color mapping  
  const THEME_COLORS = {
    default: { sidebar: 'bg-gray-800', accent: 'from-blue-500 to-purple-600', border: 'border-gray-700', bg: 'bg-gray-900' },
    dark: { sidebar: 'bg-gray-950', accent: 'from-gray-600 to-gray-800', border: 'border-gray-800', bg: 'bg-black' },
    nature: { sidebar: 'bg-emerald-950', accent: 'from-green-500 to-emerald-600', border: 'border-emerald-800', bg: 'bg-gray-900' },
    ocean: { sidebar: 'bg-sky-950', accent: 'from-sky-500 to-blue-600', border: 'border-sky-800', bg: 'bg-gray-900' },
    sunset: { sidebar: 'bg-orange-950', accent: 'from-orange-500 to-red-600', border: 'border-orange-800', bg: 'bg-gray-900' },
    galaxy: { sidebar: 'bg-violet-950', accent: 'from-violet-500 to-purple-600', border: 'border-violet-800', bg: 'bg-gray-900' },
    pakistan: { sidebar: 'bg-green-950', accent: 'from-green-600 to-green-800', border: 'border-green-800', bg: 'bg-gray-900' },
    gold: { sidebar: 'bg-yellow-950', accent: 'from-yellow-500 to-amber-600', border: 'border-yellow-800', bg: 'bg-gray-900' },
  };
  const themeStyle = THEME_COLORS[activeTheme] || THEME_COLORS.default;

  // Fetch gamification data
  const { data: gamifyData } = useQuery({
    queryKey: ['gamification'],
    queryFn: async () => {
      const response = await gamifyAPI.getProfile();
      return response.data;
    },
  });

  // Update gamification store when data is fetched
  useEffect(() => {
    if (gamifyData) {
      updateGamification(gamifyData);
    }
  }, [gamifyData, updateGamification]);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Base navigation items for regular users
  const userNavItems = [
    { path: '/dashboard', icon: Home, label: t('nav.home') },
    { path: '/courses', icon: BookOpen, label: t('nav.learn') },
    { path: '/compete', icon: Trophy, label: t('nav.compete') },
    { path: '/leaderboard', icon: Star, label: t('compete.leaderboard') },
    { path: '/shop', icon: ShoppingBag, label: t('nav.shop') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  // Admin users only see Admin tab
  const adminNavItems = [
    { path: '/admin', icon: Shield, label: t('nav.admin') || 'Admin' },
  ];

  // Use admin nav items for admin, regular nav items for others
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className={`min-h-screen ${themeStyle.bg} text-white flex`}>
      {/* Sidebar */}
      <aside className={`w-64 ${themeStyle.sidebar} border-r ${themeStyle.border} flex flex-col`}>
        {/* Logo */}
        <div className={`p-4 border-b ${themeStyle.border}`}>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className={`w-10 h-10 bg-gradient-to-br ${themeStyle.accent} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">&lt;/&gt;</span>
            </div>
            <span className="text-xl font-bold gradient-text">CodeHub</span>
          </Link>
        </div>

        {/* User Stats */}
        <div className={`p-4 border-b ${themeStyle.border}`}>
          <div className="flex items-center gap-3 mb-3">
            {user?.profile_picture || user?.avatar_url ? (
              <img 
                src={user.profile_picture || user.avatar_url} 
                alt={user?.username}
                className={`w-12 h-12 rounded-full object-cover border-2`}
                style={{ borderColor: THEME_COLORS[activeTheme]?.accent?.includes('purple') ? '#a855f7' : '#3b82f6' }}
              />
            ) : (
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${themeStyle.accent} flex items-center justify-center`}>
                <span className="text-lg font-bold">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{user?.username || 'User'}</p>
                {isAdmin && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">Level {level}</p>
            </div>
          </div>
          
          {/* XP Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>XP</span>
              <span>{xp} / {xpToNextLevel}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full bg-gradient-to-r ${themeStyle.accent}`}
                initial={{ width: 0 }}
                animate={{ width: `${(xp / xpToNextLevel) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1 text-yellow-400">
              <Coins size={16} />
              <span>{coins}</span>
            </div>
            <div className="flex items-center gap-1 text-orange-400">
              <Flame size={16} />
              <span>{currentStreak} days</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className={`p-4 border-t ${themeStyle.border}`}>
          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
