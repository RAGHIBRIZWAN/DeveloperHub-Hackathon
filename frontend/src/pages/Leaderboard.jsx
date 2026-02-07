import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, 
  Star,
  Medal,
  Crown,
  TrendingUp,
  User
} from 'lucide-react';
import { competeAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import PageBackground from '../components/ui/PageBackground';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

const Leaderboard = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Fetch global leaderboard
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['globalLeaderboard'],
    queryFn: () => competeAPI.getLeaderboard(),
  });

  const leaderboard = leaderboardData?.data?.leaderboard || [];

  // Compute current user's rank from the leaderboard data
  const userRank = leaderboard.findIndex(entry => entry.user_id === user?.id) + 1;
  const userRating = user?.rating || 1000;

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]" size={24} />;
      case 2: return <Medal className="text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.4)]" size={24} />;
      case 3: return <Medal className="text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.4)]" size={24} />;
      default: return <span className="text-slate-500 font-bold w-6 text-center">{rank}</span>;
    }
  };

  const getRankRowStyle = (rank) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/[0.08] via-amber-500/[0.06] to-transparent border-yellow-500/20';
      case 2: return 'bg-gradient-to-r from-slate-400/[0.06] via-slate-500/[0.04] to-transparent border-slate-400/15';
      case 3: return 'bg-gradient-to-r from-orange-500/[0.07] via-amber-500/[0.04] to-transparent border-orange-400/15';
      default: return 'bg-white/[0.02] border-white/[0.04]';
    }
  };

  const getTierColor = (rating) => {
    if (rating >= 2400) return 'text-red-400';
    if (rating >= 2000) return 'text-orange-400';
    if (rating >= 1600) return 'text-purple-400';
    if (rating >= 1200) return 'text-blue-400';
    return 'text-green-400';
  };

  const getTierGlow = (rating) => {
    if (rating >= 2400) return 'shadow-[0_0_12px_rgba(248,113,113,0.3)] bg-red-500/[0.12] border-red-500/25';
    if (rating >= 2000) return 'shadow-[0_0_12px_rgba(251,146,60,0.3)] bg-orange-500/[0.12] border-orange-500/25';
    if (rating >= 1600) return 'shadow-[0_0_12px_rgba(192,132,252,0.3)] bg-purple-500/[0.12] border-purple-500/25';
    if (rating >= 1200) return 'shadow-[0_0_12px_rgba(96,165,250,0.3)] bg-blue-500/[0.12] border-blue-500/25';
    return 'shadow-[0_0_12px_rgba(74,222,128,0.3)] bg-green-500/[0.12] border-green-500/25';
  };

  const getTierName = (rating) => {
    if (rating >= 2400) return 'Grandmaster';
    if (rating >= 2000) return 'Master';
    if (rating >= 1600) return 'Expert';
    if (rating >= 1200) return 'Intermediate';
    return 'Beginner';
  };

  return (
    <div className="relative min-h-screen">
      <PageBackground variant="compete" />

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/20">
              <Trophy className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" size={26} />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
              {t('leaderboard')}
            </span>
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Top programmers in CodeHub</p>
        </motion.div>

        {/* User Position Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8 rounded-2xl overflow-hidden"
        >
          {/* Gradient glow border effect */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/50 via-violet-500/50 to-pink-500/50 blur-[1px]" />
          <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl p-8 border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                  <User size={30} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">Your Position</p>
                  <h2 className="text-2xl font-bold text-white/90">{user?.username || 'Guest'}</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm font-medium">Rating</p>
                <div className="flex items-center gap-2 justify-end">
                  <Star className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]" size={22} />
                  <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-400">
                    {userRating}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-1">
                  {userRank > 0 ? (
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400 font-semibold">
                      Rank #{userRank}
                    </span>
                  ) : 'Unranked'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/[0.03] border-b border-white/[0.06] text-slate-500 text-sm font-semibold uppercase tracking-wider">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5">User</div>
            <div className="col-span-2 text-center">Rating</div>
            <div className="col-span-2 text-center">Tier</div>
            <div className="col-span-2 text-center">Contests</div>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-white/[0.04]">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.user_id === user?.id;
                
                return (
                  <motion.div
                    key={entry.user_id}
                    variants={fadeUp}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-l-2 transition-all duration-300 ${
                      isCurrentUser 
                        ? 'bg-indigo-500/[0.08] border-l-indigo-400 shadow-[inset_0_0_30px_rgba(99,102,241,0.06)]' 
                        : getRankRowStyle(rank)
                    }`}
                  >
                    <div className="col-span-1 flex justify-center">
                      {getRankIcon(rank)}
                    </div>
                    
                    <div className="col-span-5 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-600/40 flex items-center justify-center text-white font-bold text-sm backdrop-blur-sm border border-white/[0.1] ${rank <= 3 ? 'shadow-[0_0_16px_rgba(139,92,246,0.25)]' : ''}`}>
                        {entry.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className={`font-semibold ${getTierColor(entry.rating)}`}>
                          {entry.username}
                        </p>
                        <p className="text-slate-500 text-sm">{entry.full_name || ''}</p>
                      </div>
                    </div>
                    
                    <div className="col-span-2 text-center">
                      <span className={`text-lg font-bold ${getTierColor(entry.rating)}`}>
                        {entry.rating}
                      </span>
                    </div>
                    
                    <div className="col-span-2 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTierGlow(entry.rating)} ${getTierColor(entry.rating)}`}>
                        {getTierName(entry.rating)}
                      </span>
                    </div>
                    
                    <div className="col-span-2 text-center text-slate-400">
                      {entry.contests_participated || 0}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Rating Tiers Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-5 gap-4"
        >
          {[
            { name: 'Beginner', range: '0-1199', color: 'text-green-400', border: 'border-l-green-400', glow: 'hover:shadow-[0_0_20px_rgba(74,222,128,0.15)]' },
            { name: 'Intermediate', range: '1200-1599', color: 'text-blue-400', border: 'border-l-blue-400', glow: 'hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]' },
            { name: 'Expert', range: '1600-1999', color: 'text-purple-400', border: 'border-l-purple-400', glow: 'hover:shadow-[0_0_20px_rgba(192,132,252,0.15)]' },
            { name: 'Master', range: '2000-2399', color: 'text-orange-400', border: 'border-l-orange-400', glow: 'hover:shadow-[0_0_20px_rgba(251,146,60,0.15)]' },
            { name: 'Grandmaster', range: '2400+', color: 'text-red-400', border: 'border-l-red-400', glow: 'hover:shadow-[0_0_20px_rgba(248,113,113,0.15)]' },
          ].map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.08 }}
              className={`p-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] border-l-2 ${tier.border} transition-shadow duration-300 ${tier.glow}`}
            >
              <p className={`font-semibold ${tier.color}`}>{tier.name}</p>
              <p className="text-slate-500 text-sm mt-1">{tier.range}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;
