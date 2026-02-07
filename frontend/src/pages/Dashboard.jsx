import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Code,
  Trophy,
  Flame,
  Star,
  ArrowRight,
  Clock,
  Target,
  Gift,
  Sparkles,
  Zap,
  ChevronRight,
  Swords,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { lessonsAPI, gamifyAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageBackground from '../components/ui/PageBackground';
import StatCard from '../components/ui/StatCard';

/* ─── animation presets ─── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};
const fadeScale = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// Static module definitions for the new course structure
const MODULES = [
  {
    id: 'programming-fundamentals',
    name: 'Programming Fundamentals',
    name_ur: 'پروگرامنگ کے بنیادی اصول',
    description: 'Variables, loops, conditions & functions',
    icon: '💻',
    color: 'from-blue-500 to-cyan-500',
    accent: 'blue',
    lessons: 24,
  },
  {
    id: 'oop',
    name: 'Object-Oriented Programming',
    name_ur: 'آبجیکٹ اورینٹڈ پروگرامنگ',
    description: 'Classes, inheritance & polymorphism',
    icon: '🧩',
    color: 'from-purple-500 to-pink-500',
    accent: 'violet',
    lessons: 18,
  },
  {
    id: 'data-structures',
    name: 'Data Structures & Algorithms',
    name_ur: 'ڈیٹا سٹرکچرز اور الگورتھمز',
    description: 'Arrays, trees, graphs & sorting',
    icon: '🌳',
    color: 'from-green-500 to-emerald-500',
    accent: 'green',
    lessons: 22,
  },
  {
    id: 'competitive-programming',
    name: 'Competitive Programming',
    name_ur: 'مسابقتی پروگرامنگ',
    description: 'Advanced algorithms for contests',
    icon: '🏆',
    color: 'from-yellow-500 to-orange-500',
    accent: 'yellow',
    lessons: 30,
  },
];

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const {
    level, xp, xpToNextLevel, coins, currentStreak,
    updateGamification,
  } = useGamificationStore();

  const isUrdu = i18n.language === 'ur';

  // Fetch gamification data
  const { data: gamifyData } = useQuery({
    queryKey: ['gamification'],
    queryFn: () => gamifyAPI.getProfile(),
  });

  // Fetch fresh user profile (for up-to-date stats like contests participated)
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await authAPI.getProfile();
      return response.data;
    },
  });

  // Fetch user progress
  const { data: progressData } = useQuery({
    queryKey: ['userProgress'],
    queryFn: () => lessonsAPI.getUserProgress(),
  });

  // Fetch per-module progress
  const { data: moduleProgressData } = useQuery({
    queryKey: ['moduleProgress'],
    queryFn: () => lessonsAPI.getModuleProgress(),
  });

  useEffect(() => {
    if (gamifyData?.data) {
      updateGamification(gamifyData.data);
    }
  }, [gamifyData, updateGamification]);

  // Sync fresh profile data into auth store
  useEffect(() => {
    if (profileData) {
      updateUser(profileData);
    }
  }, [profileData, updateUser]);

  const handleClaimDaily = async () => {
    try {
      const response = await gamifyAPI.claimDailyReward();
      toast.success(`Claimed ${response.data.coins_earned} coins! 🎁`);
      updateGamification({
        coins: response.data.total_coins,
        current_streak: response.data.streak_day,
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Already claimed today');
    }
  };

  const progress = progressData?.data || {};
  const moduleProgress = moduleProgressData?.data?.module_progress || {};

  const quickActions = [
    {
      icon: Trophy,
      title: 'Leaderboard',
      titleUr: 'لیڈربورڈ',
      description: 'See top coders & your rank',
      color: 'from-yellow-500 to-amber-500',
      glow: 'group-hover:shadow-[0_0_40px_rgba(245,158,11,0.2)]',
      link: '/leaderboard',
    },
    {
      icon: Target,
      title: 'Continue Learning',
      titleUr: 'سیکھنا جاری رکھیں',
      description: 'Pick up where you left off',
      color: 'from-blue-500 to-cyan-500',
      glow: 'group-hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]',
      link: '/courses',
    },
    {
      icon: Code,
      title: 'Practice Coding',
      titleUr: 'کوڈنگ کی مشق کریں',
      description: 'Solve coding challenges',
      color: 'from-violet-500 to-pink-500',
      glow: 'group-hover:shadow-[0_0_40px_rgba(139,92,246,0.2)]',
      link: '/courses',
    },
    {
      icon: Swords,
      title: 'Join Contest',
      titleUr: 'مقابلے میں شامل ہوں',
      description: 'Compete with others',
      color: 'from-orange-500 to-red-500',
      glow: 'group-hover:shadow-[0_0_40px_rgba(234,88,12,0.2)]',
      link: '/compete',
    },
  ];

  const xpPercent = xpToNextLevel > 0 ? (xp / xpToNextLevel) * 100 : 0;

  return (
    <div className="relative min-h-screen">
      {/* ── Immersive background ── */}
      <PageBackground variant="dashboard" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ═══════════════════════════════════════════
            1. HERO WELCOME SECTION
        ═══════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06] p-8 md:p-10"
        >
          {/* gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 opacity-80" />

          {/* subtle inner glow */}
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                >
                  <Sparkles className="text-yellow-400" size={28} />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-extrabold">
                  <span className="bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                    Welcome back, {user?.full_name?.split(' ')[0] || user?.username}!
                  </span>
                </h1>
              </div>
              <p className="text-slate-400 text-lg max-w-xl">
                Ready to continue your coding journey? Let's build something amazing today.
              </p>
            </div>

            {/* Level & streak pills */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl">
                <Star className="text-yellow-400" size={18} />
                <span className="text-white font-bold text-lg">{level}</span>
                <span className="text-slate-400 text-sm">Level</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl">
                <Flame className="text-orange-400" size={18} />
                <span className="text-white font-bold text-lg">{currentStreak}</span>
                <span className="text-slate-400 text-sm">Streak</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════
            2. STAT CARDS GRID
        ═══════════════════════════════════════════ */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            icon={Trophy}
            value={user?.stats?.total_contests_participated || 0}
            label="Contests"
            color="blue"
            delay={0.1}
          />
          <StatCard
            icon={Zap}
            value={xp}
            label="Total XP"
            color="violet"
            delay={0.18}
          />
          <StatCard
            icon={Gift}
            value={coins}
            label="Coins"
            color="yellow"
            delay={0.26}
          />
          <StatCard
            icon={Clock}
            value={`${progress.total_time_spent_minutes || 0}m`}
            label="Time Spent"
            color="green"
            delay={0.34}
          />
        </motion.div>

        {/* ═══════════════════════════════════════════
            3. DAILY REWARD CARD
        ═══════════════════════════════════════════ */}
        <motion.div
          variants={fadeScale}
          initial="hidden"
          animate="show"
          className="group relative overflow-hidden rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-amber-500/20 hover:border-amber-400/30 transition-all duration-500"
        >
          {/* special gradient border glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 opacity-80" />
          <div className="absolute -top-20 right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-colors duration-700" />

          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 p-6 md:p-8">
            <div className="flex items-center gap-5">
              <motion.div
                animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20"
              >
                <Gift size={28} className="text-white" />
              </motion.div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  Daily Reward Available!
                </h3>
                <p className="text-slate-400 text-sm mt-0.5">
                  Claim your daily coins and keep your streak going
                </p>
              </div>
            </div>
            <button
              onClick={handleClaimDaily}
              className="relative px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm tracking-wide hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles size={16} />
                Claim Now
              </span>
            </button>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            4. QUICK ACTIONS + LEARNING MODULES (2-col)
        ═══════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── Quick Actions ── */}
          <motion.div variants={stagger} initial="hidden" animate="show">
            <h2 className="text-xl font-bold mb-5">
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Quick Actions
              </span>
            </h2>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.div key={action.title} variants={fadeUp}>
                  <Link
                    to={action.link}
                    className={`group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-500 ${action.glow}`}
                  >
                    {/* icon container */}
                    <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                      <action.icon size={22} className="text-white" />
                      {/* soft glow behind icon */}
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-[0.95rem]">
                        {isUrdu ? action.titleUr : action.title}
                      </h3>
                      <p className="text-slate-500 text-sm truncate">{action.description}</p>
                    </div>
                    <ChevronRight className="text-white/20 group-hover:text-white/60 transition-colors duration-300 flex-shrink-0" size={18} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Learning Modules ── */}
          <motion.div variants={stagger} initial="hidden" animate="show">
            <h2 className="text-xl font-bold mb-5">
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {isUrdu ? 'سیکھنے کے ماڈیولز' : 'Learning Modules'}
              </span>
            </h2>
            <div className="space-y-3">
              {MODULES.map((module) => {
                const modProgress = moduleProgress[module.id]?.progress || 0;
                return (
                  <motion.div key={module.id} variants={fadeUp}>
                    <Link
                      to={`/courses?module=${module.id}&mode=practice`}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.04)]"
                    >
                      {/* module emoji icon */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-2xl shadow-lg`}>
                        {module.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-[0.95rem] truncate">
                          {isUrdu ? module.name_ur : module.name}
                        </h3>
                        <p className="text-slate-500 text-sm truncate">
                          {module.lessons} lessons • {module.description}
                        </p>

                        {/* gradient progress bar */}
                        <div className="mt-2.5 flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full bg-gradient-to-r ${module.color}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${modProgress}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500 w-9 text-right">
                            {modProgress}%
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="text-white/20 group-hover:text-white/60 transition-colors duration-300 flex-shrink-0" size={18} />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════
            5. LEVEL PROGRESS BAR
        ═══════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06] p-6 md:p-8"
        >
          {/* accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-70" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-lg font-bold">
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Level Progress
                </span>
              </h3>
              <p className="text-slate-500 text-sm mt-0.5">
                {xpToNextLevel - xp > 0 ? `${xpToNextLevel - xp} XP to Level ${level + 1}` : 'Max level reached!'}
              </p>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/15">
              <Star className="text-indigo-400" size={18} />
              <span className="text-indigo-300 font-bold text-sm tracking-wide">
                Level {level}
              </span>
            </div>
          </div>

          {/* progress bar */}
          <div className="relative h-4 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
            />
            {/* animated shimmer */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${xpPercent}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>

          {/* XP text */}
          <div className="flex justify-between mt-3 text-xs text-slate-500">
            <span>{xp} XP</span>
            <span>{xpToNextLevel} XP</span>
          </div>
        </motion.section>

      </div>
    </div>
  );
};

export default Dashboard;
