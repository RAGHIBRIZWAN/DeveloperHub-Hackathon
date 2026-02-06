import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Trophy, 
  Clock, 
  Users,
  Calendar,
  ArrowRight,
  Star,
  Zap,
  Lock,
  CheckCircle,
  Timer,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { competeAPI } from '../services/api';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const Compete = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [countdowns, setCountdowns] = useState({});

  // Fetch contests
  const { data: contestsData, isLoading } = useQuery({
    queryKey: ['contests', activeTab],
    queryFn: async () => {
      const statusMap = {
        upcoming: 'upcoming',
        ongoing: 'ongoing',
        past: 'completed'
      };
      const response = await api.get(`/compete/contests?status=${statusMap[activeTab]}`);
      return response.data;
    },
  });

  // Fetch user's registrations
  const { data: registrationsData } = useQuery({
    queryKey: ['myRegistrations'],
    queryFn: async () => {
      const response = await api.get('/compete/my-registrations');
      return response.data;
    },
  });

  const registeredContestIds = registrationsData?.registrations?.map(r => r.contest_id) || [];

  // Register for contest mutation
  const registerMutation = useMutation({
    mutationFn: (contestId) => api.post(`/compete/contests/${contestId}/register`),
    onSuccess: () => {
      toast.success('Successfully registered for contest!');
      queryClient.invalidateQueries(['contests']);
      queryClient.invalidateQueries(['myRegistrations']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to register');
    }
  });

  const contests = contestsData?.contests || [];

  // Countdown timer logic for both upcoming and ongoing contests
  useEffect(() => {
    if (activeTab === 'past') return;

    const updateCountdowns = () => {
      const newCountdowns = {};
      contests.forEach(contest => {
        const now = Date.now();
        let diff;
        
        if (activeTab === 'upcoming') {
          const startTime = new Date(contest.start_time).getTime();
          diff = startTime - now;
        } else if (activeTab === 'ongoing') {
          const endTime = new Date(contest.end_time).getTime();
          diff = endTime - now;
        }

        if (diff && diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          newCountdowns[contest.id] = { days, hours, minutes, seconds };
        } else {
          newCountdowns[contest.id] = null;
        }
      });
      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [contests, activeTab]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRegister = (contestId) => {
    if (registeredContestIds.includes(contestId)) {
      toast.error('You are already registered for this contest');
      return;
    }
    registerMutation.mutate(contestId);
  };

  const isRegistered = (contestId) => registeredContestIds.includes(contestId);

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', icon: Clock, color: 'blue' },
    { id: 'ongoing', label: 'Ongoing', icon: Zap, color: 'green' },
    { id: 'past', label: 'Past', icon: Trophy, color: 'gray' },
  ];

  const CountdownTimer = ({ countdown, label = "Starts in" }) => {
    if (!countdown) return null;

    const { days, hours, minutes, seconds } = countdown;
    
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-1.5">
          {days > 0 && (
            <div className="flex flex-col items-center bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg border border-blue-500/30">
              <span className="text-lg font-bold font-mono">{days}</span>
              <span className="text-xs text-gray-400">days</span>
            </div>
          )}
          <div className="flex flex-col items-center bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg border border-blue-500/30">
            <span className="text-lg font-bold font-mono">{String(hours).padStart(2, '0')}</span>
            <span className="text-xs text-gray-400">hrs</span>
          </div>
          <span className="text-blue-400 text-xl font-bold">:</span>
          <div className="flex flex-col items-center bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg border border-blue-500/30">
            <span className="text-lg font-bold font-mono">{String(minutes).padStart(2, '0')}</span>
            <span className="text-xs text-gray-400">min</span>
          </div>
          <span className="text-blue-400 text-xl font-bold">:</span>
          <div className="flex flex-col items-center bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg border border-blue-500/30">
            <span className="text-lg font-bold font-mono">{String(seconds).padStart(2, '0')}</span>
            <span className="text-xs text-gray-400">sec</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-gray-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Trophy className="text-yellow-400" />
          {t('compete.title')}
        </h1>
        <p className="text-gray-400 mt-2">{t('compete.subtitle')}</p>
      </motion.div>

      {/* User Rating Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-purple-200 text-sm mb-1">Your Rating</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-white">{user?.rating || 1000}</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                {(user?.rating || 1000) >= 2400 ? 'Grandmaster' :
                 (user?.rating || 1000) >= 2000 ? 'Master' :
                 (user?.rating || 1000) >= 1600 ? 'Expert' :
                 (user?.rating || 1000) >= 1200 ? 'Intermediate' : 'Beginner'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-purple-200 text-sm mb-1">Contests Participated</p>
            <span className="text-2xl font-bold text-white">{registeredContestIds.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg transition-all ${
              activeTab === tab.id
                ? `bg-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-500/20`
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            <span className="font-medium">{tab.label}</span>
            {contestsData && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {contests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : contests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700"
        >
          {activeTab === 'upcoming' ? (
            <>
              <Clock size={48} className="mx-auto text-blue-500/50 mb-4" />
              <p className="text-gray-400 text-lg">No upcoming contests</p>
              <p className="text-gray-500 text-sm mt-1">Check back later for new contests!</p>
            </>
          ) : activeTab === 'ongoing' ? (
            <>
              <Zap size={48} className="mx-auto text-green-500/50 mb-4" />
              <p className="text-gray-400 text-lg">No ongoing contests</p>
              <p className="text-gray-500 text-sm mt-1">Register for upcoming contests!</p>
            </>
          ) : (
            <>
              <Trophy size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">No past contests</p>
            </>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {contests.map((contest, index) => (
            <motion.div
              key={contest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Contest Info */}
                  <div className="flex-1 min-w-[300px]">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{contest.title}</h3>
                      {contest.contest_type === 'rated' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                          <Star size={12} />
                          Rated
                        </span>
                      )}
                      {isRegistered(contest.id) && activeTab === 'upcoming' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                          <CheckCircle size={12} />
                          Registered
                        </span>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {contest.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={16} className="text-gray-500" />
                        <span>{formatDate(contest.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={16} className="text-gray-500" />
                        <span>{contest.duration_minutes} mins</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={16} className="text-gray-500" />
                        <span>{contest.registered_count || 0} registered</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Trophy size={16} className="text-gray-500" />
                        <span className="capitalize">{contest.difficulty}</span>
                      </div>
                    </div>

                    {/* Problems Preview */}
                    {contest.problems?.length > 0 && (
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-gray-500 text-xs">Problems:</span>
                        {contest.problems.map((prob, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 bg-gray-700/70 rounded flex items-center justify-center text-gray-300 text-sm font-medium"
                            title={prob.title || `Problem ${String.fromCharCode(65 + i)}`}
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Countdown / Action */}
                  <div className="flex flex-col items-end gap-3">
                    {activeTab === 'upcoming' && countdowns[contest.id] && (
                      <CountdownTimer countdown={countdowns[contest.id]} label="Starts in" />
                    )}

                    {activeTab === 'ongoing' && (
                      <div className="flex flex-col items-end gap-2">
                        {countdowns[contest.id] ? (
                          <CountdownTimer countdown={countdowns[contest.id]} label="Ends in" />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm animate-pulse">
                            <span className="w-2 h-2 bg-green-400 rounded-full" />
                            Live Now
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {activeTab === 'upcoming' && (
                        isRegistered(contest.id) ? (
                          <button
                            disabled
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-500/20 text-green-400 rounded-lg cursor-default"
                          >
                            <CheckCircle size={18} />
                            Registered
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegister(contest.id)}
                            disabled={registerMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                          >
                            {registerMutation.isPending ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <CheckCircle size={18} />
                            )}
                            Register Now
                          </button>
                        )
                      )}

                      {activeTab === 'ongoing' && (
                        <Link
                          to={`/contest/${contest.id}`}
                          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                        >
                          <Zap size={18} />
                          Enter Contest
                        </Link>
                      )}

                      {activeTab === 'past' && (
                        <Link
                          to={`/contest/${contest.id}`}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          View Results
                          <ArrowRight size={18} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12 grid md:grid-cols-3 gap-6"
      >
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
            <Trophy className="text-blue-400" size={24} />
          </div>
          <h3 className="text-white font-semibold mb-2">Compete & Win</h3>
          <p className="text-gray-400 text-sm">
            Join contests to test your skills against other programmers and climb the leaderboard.
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
            <Star className="text-green-400" size={24} />
          </div>
          <h3 className="text-white font-semibold mb-2">ELO Rating</h3>
          <p className="text-gray-400 text-sm">
            Your rating reflects your skill level. Win contests to increase your rating.
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
            <Zap className="text-yellow-400" size={24} />
          </div>
          <h3 className="text-white font-semibold mb-2">Earn Rewards</h3>
          <p className="text-gray-400 text-sm">
            Top performers earn bonus coins, exclusive badges, and special themes.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Compete;
