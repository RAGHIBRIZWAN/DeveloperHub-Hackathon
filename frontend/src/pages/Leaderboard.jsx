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
      case 1: return <Crown className="text-yellow-400" size={24} />;
      case 2: return <Medal className="text-gray-400" size={24} />;
      case 3: return <Medal className="text-orange-400" size={24} />;
      default: return <span className="text-gray-500 font-bold w-6 text-center">{rank}</span>;
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-500/30';
      case 3: return 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/30';
      default: return 'bg-gray-800 border-gray-700';
    }
  };

  const getTierColor = (rating) => {
    if (rating >= 2400) return 'text-red-400'; // Grandmaster
    if (rating >= 2000) return 'text-orange-400'; // Master
    if (rating >= 1600) return 'text-purple-400'; // Expert
    if (rating >= 1200) return 'text-blue-400'; // Intermediate
    return 'text-green-400'; // Beginner
  };

  const getTierName = (rating) => {
    if (rating >= 2400) return 'Grandmaster';
    if (rating >= 2000) return 'Master';
    if (rating >= 1600) return 'Expert';
    if (rating >= 1200) return 'Intermediate';
    return 'Beginner';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-yellow-400" />
          {t('leaderboard.title')}
        </h1>
        <p className="text-gray-400 mt-1">Top programmers in CodeHub</p>
      </div>

      {/* User's Position */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <p className="text-purple-200 text-sm">Your Position</p>
              <h2 className="text-2xl font-bold text-white">{user?.username || 'Guest'}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-purple-200 text-sm">Rating</p>
            <div className="flex items-center gap-2">
              <Star className="text-yellow-300" size={20} />
              <span className="text-3xl font-bold text-white">{userRating}</span>
            </div>
            <p className="text-purple-200 text-sm">
              {userRank > 0 ? `Rank #${userRank}` : 'Unranked'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-900 text-gray-500 text-sm font-semibold">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5">User</div>
          <div className="col-span-2 text-center">Rating</div>
          <div className="col-span-2 text-center">Tier</div>
          <div className="col-span-2 text-center">Contests</div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.user_id === user?.id;
              
              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border ${
                    isCurrentUser 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : getRankStyle(rank)
                  }`}
                >
                  <div className="col-span-1 flex justify-center">
                    {getRankIcon(rank)}
                  </div>
                  
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {entry.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className={`font-semibold ${getTierColor(entry.rating)}`}>
                        {entry.username}
                      </p>
                      <p className="text-gray-500 text-sm">{entry.full_name || ''}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    <span className={`text-lg font-bold ${getTierColor(entry.rating)}`}>
                      {entry.rating}
                    </span>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTierColor(entry.rating)} bg-gray-700`}>
                      {getTierName(entry.rating)}
                    </span>
                  </div>
                  
                  <div className="col-span-2 text-center text-gray-400">
                    {entry.contests_participated || 0}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Tiers Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 grid grid-cols-5 gap-4"
      >
        {[
          { name: 'Beginner', range: '0-1199', color: 'text-green-400', bg: 'bg-green-500/20' },
          { name: 'Intermediate', range: '1200-1599', color: 'text-blue-400', bg: 'bg-blue-500/20' },
          { name: 'Expert', range: '1600-1999', color: 'text-purple-400', bg: 'bg-purple-500/20' },
          { name: 'Master', range: '2000-2399', color: 'text-orange-400', bg: 'bg-orange-500/20' },
          { name: 'Grandmaster', range: '2400+', color: 'text-red-400', bg: 'bg-red-500/20' },
        ].map((tier) => (
          <div
            key={tier.name}
            className={`p-4 rounded-xl ${tier.bg} border border-gray-700`}
          >
            <p className={`font-semibold ${tier.color}`}>{tier.name}</p>
            <p className="text-gray-500 text-sm">{tier.range}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Leaderboard;
