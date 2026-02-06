import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  Code, 
  Trophy, 
  Flame, 
  Star,
  ArrowRight,
  Clock,
  Target,
  Gift,
  GitBranch,
  Database
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { lessonsAPI, gamifyAPI } from '../services/api';
import toast from 'react-hot-toast';

// Static module definitions for the new course structure
const MODULES = [
  {
    id: 'programming-fundamentals',
    name: 'Programming Fundamentals',
    name_ur: 'پروگرامنگ کے بنیادی اصول',
    description: 'Variables, loops, conditions & functions',
    icon: '💻',
    color: 'from-blue-500 to-cyan-500',
    lessons: 24,
  },
  {
    id: 'oop',
    name: 'Object-Oriented Programming',
    name_ur: 'آبجیکٹ اورینٹڈ پروگرامنگ',
    description: 'Classes, inheritance & polymorphism',
    icon: '🧩',
    color: 'from-purple-500 to-pink-500',
    lessons: 18,
  },
  {
    id: 'data-structures',
    name: 'Data Structures & Algorithms',
    name_ur: 'ڈیٹا سٹرکچرز اور الگورتھمز',
    description: 'Arrays, trees, graphs & sorting',
    icon: '🌳',
    color: 'from-green-500 to-emerald-500',
    lessons: 22,
  },
  {
    id: 'competitive-programming',
    name: 'Competitive Programming',
    name_ur: 'مسابقتی پروگرامنگ',
    description: 'Advanced algorithms for contests',
    icon: '🏆',
    color: 'from-yellow-500 to-orange-500',
    lessons: 30,
  }
];

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { 
    level, xp, xpToNextLevel, coins, currentStreak,
    updateGamification 
  } = useGamificationStore();
  
  const isUrdu = i18n.language === 'ur';

  // Fetch gamification data
  const { data: gamifyData } = useQuery({
    queryKey: ['gamification'],
    queryFn: () => gamifyAPI.getProfile(),
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
      icon: BookOpen,
      title: 'Continue Learning',
      titleUr: 'سیکھنا جاری رکھیں',
      description: 'Pick up where you left off',
      color: 'from-blue-500 to-cyan-500',
      link: '/courses',
    },
    {
      icon: Code,
      title: 'Practice Coding',
      titleUr: 'کوڈنگ کی مشق کریں',
      description: 'Solve coding challenges',
      color: 'from-purple-500 to-pink-500',
      link: '/courses',
    },
    {
      icon: Trophy,
      title: 'Join Contest',
      titleUr: 'مقابلے میں شامل ہوں',
      description: 'Compete with others',
      color: 'from-yellow-500 to-orange-500',
      link: '/compete',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Welcome back, {user?.full_name?.split(' ')[0] || user?.username}! 👋
            </h1>
            <p className="text-blue-100">
              Ready to continue your coding journey?
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-yellow-300">
                <Star size={20} />
                <span className="text-xl font-bold">{level}</span>
              </div>
              <span className="text-xs text-blue-100">Level</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-orange-300">
                <Flame size={20} />
                <span className="text-xl font-bold">{currentStreak}</span>
              </div>
              <span className="text-xs text-blue-100">Day Streak</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <BookOpen className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Lessons</p>
              <p className="text-white text-xl font-bold">
                {progress.completed_lessons || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Code className="text-purple-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">XP</p>
              <p className="text-white text-xl font-bold">{xp}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">🪙</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Coins</p>
              <p className="text-white text-xl font-bold">{coins}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Clock className="text-green-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Time</p>
              <p className="text-white text-xl font-bold">
                {progress.total_time_spent_minutes || 0}m
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Daily Reward */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Gift size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Daily Reward Available!</h3>
              <p className="text-gray-400 text-sm">
                Claim your daily coins and keep your streak going
              </p>
            </div>
          </div>
          <button
            onClick={handleClaimDaily}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Claim Now
          </button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={action.link}
                  className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                    <action.icon size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{action.title}</h3>
                    <p className="text-gray-400 text-sm">{action.description}</p>
                  </div>
                  <ArrowRight className="text-gray-500" size={20} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Learning Modules */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            {isUrdu ? 'سیکھنے کے ماڈیولز' : 'Learning Modules'}
          </h2>
          <div className="space-y-3">
            {MODULES.map((module, index) => {
              const modProgress = moduleProgress[module.id]?.progress || 0;
              return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/courses?module=${module.id}&mode=practice`}
                  className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-2xl`}>
                    {module.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">
                      {isUrdu ? module.name_ur : module.name}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">
                      {module.lessons} lessons • {module.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${module.color}`}
                        style={{ width: `${modProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{modProgress}%</span>
                  </div>
                  <ArrowRight className="text-gray-500 group-hover:text-white transition-colors flex-shrink-0" size={20} />
                </Link>
              </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">Level Progress</h3>
            <p className="text-gray-400 text-sm">
              {xpToNextLevel - xp} XP to Level {level + 1}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-lg">
            <Star className="text-blue-400" size={20} />
            <span className="text-blue-400 font-bold">Level {level}</span>
          </div>
        </div>
        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${(xp / xpToNextLevel) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
