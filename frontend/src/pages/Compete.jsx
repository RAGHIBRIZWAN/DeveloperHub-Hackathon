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
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Gift,
} from 'lucide-react';
import { competeAPI } from '../services/api';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import PageBackground from '../components/ui/PageBackground';
import toast from 'react-hot-toast';

/* ─── tiny helper: parse naive-UTC strings ─── */
const parseUTC = (dateStr) => {
  if (!dateStr) return null;
  const s = String(dateStr);
  if (!s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s + 'Z');
  return new Date(s);
};

/* ─── Countdown sub-component ─── */
const CountdownTimer = ({ countdown, label = 'Starts in', urgent = false }) => {
  if (!countdown) return null;
  const { days, hours, minutes, seconds } = countdown;
  const isLow = !days && hours === 0 && minutes < 10;
  const glow = urgent || isLow;

  const Box = ({ value, unit }) => (
    <div
      className={`flex flex-col items-center px-3 py-2 rounded-xl border transition-all duration-500
        ${glow
          ? 'bg-red-500/10 border-red-400/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
          : 'bg-white/[0.04] border-white/[0.06]'
        } backdrop-blur-md`}
    >
      <span
        className={`text-lg font-bold font-mono bg-gradient-to-b ${
          glow ? 'from-red-300 to-red-500' : 'from-indigo-300 to-violet-400'
        } bg-clip-text text-transparent`}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{unit}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-slate-500 text-xs uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-1.5">
        {days > 0 && <Box value={days} unit="days" />}
        <Box value={hours} unit="hrs" />
        <span className={`text-lg font-bold ${glow ? 'text-red-400' : 'text-indigo-400'} animate-pulse`}>:</span>
        <Box value={minutes} unit="min" />
        <span className={`text-lg font-bold ${glow ? 'text-red-400' : 'text-indigo-400'} animate-pulse`}>:</span>
        <Box value={seconds} unit="sec" />
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════ */
const Compete = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [countdowns, setCountdowns] = useState({});

  /* ── data fetching ── */
  const { data: contestsData, isLoading } = useQuery({
    queryKey: ['contests', activeTab],
    queryFn: async () => {
      const statusMap = { upcoming: 'upcoming', ongoing: 'ongoing', past: 'completed' };
      const response = await api.get(`/compete/contests?status=${statusMap[activeTab]}`);
      return response.data;
    },
  });

  const { data: registrationsData } = useQuery({
    queryKey: ['myRegistrations'],
    queryFn: async () => {
      const response = await api.get('/compete/my-registrations');
      return response.data;
    },
  });

  const registeredContestIds = registrationsData?.registrations?.map((r) => r.contest_id) || [];
  const contests = contestsData?.contests || [];

  /* ── register mutation ── */
  const registerMutation = useMutation({
    mutationFn: (contestId) => api.post(`/compete/contests/${contestId}/register`),
    onSuccess: () => {
      toast.success('Successfully registered for contest!');
      queryClient.invalidateQueries(['contests']);
      queryClient.invalidateQueries(['myRegistrations']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to register');
    },
  });

  /* ── countdown timer logic ── */
  useEffect(() => {
    if (activeTab === 'past') return;
    const updateCountdowns = () => {
      const newCountdowns = {};
      contests.forEach((contest) => {
        const now = Date.now();
        let diff;
        if (activeTab === 'upcoming') diff = parseUTC(contest.start_time).getTime() - now;
        else if (activeTab === 'ongoing') diff = parseUTC(contest.end_time).getTime() - now;
        if (diff && diff > 0) {
          newCountdowns[contest.id] = {
            days: Math.floor(diff / 86400000),
            hours: Math.floor((diff % 86400000) / 3600000),
            minutes: Math.floor((diff % 3600000) / 60000),
            seconds: Math.floor((diff % 60000) / 1000),
          };
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

  const formatDate = (dateStr) =>
    parseUTC(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleRegister = (contestId) => {
    if (registeredContestIds.includes(contestId)) {
      toast.error('You are already registered for this contest');
      return;
    }
    registerMutation.mutate(contestId);
  };

  const isRegistered = (contestId) => registeredContestIds.includes(contestId);

  /* ── rating tier helper ── */
  const ratingValue = user?.rating || 1000;
  const tier =
    ratingValue >= 2400 ? { name: 'Grandmaster', gradient: 'from-red-400 to-pink-500', glow: 'shadow-red-500/30' }
    : ratingValue >= 2000 ? { name: 'Master', gradient: 'from-orange-400 to-yellow-500', glow: 'shadow-orange-500/25' }
    : ratingValue >= 1600 ? { name: 'Expert', gradient: 'from-violet-400 to-indigo-500', glow: 'shadow-violet-500/25' }
    : ratingValue >= 1200 ? { name: 'Intermediate', gradient: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-500/20' }
    : { name: 'Beginner', gradient: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-500/20' };

  /* ── tabs config ── */
  const tabs = [
    { id: 'upcoming', label: 'Upcoming', icon: Clock, gradient: 'from-indigo-500 to-violet-500' },
    { id: 'ongoing', label: 'Ongoing', icon: Zap, gradient: 'from-emerald-500 to-teal-500' },
    { id: 'past', label: 'Past', icon: Trophy, gradient: 'from-slate-400 to-slate-500' },
  ];

  /* ── difficulty badge colours ── */
  const diffColors = {
    easy: 'from-emerald-400 to-green-500',
    medium: 'from-yellow-400 to-orange-500',
    hard: 'from-red-400 to-pink-500',
  };

  /* ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="relative min-h-screen">
      <PageBackground variant="compete" />

      {/* floating content overlay */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">

        {/* ── Hero Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/10">
              <Trophy className="text-yellow-400" size={24} />
            </div>
            {t('compete.title')}
          </h1>
          <p className="text-slate-400 mt-2 ml-14">{t('compete.subtitle')}</p>
        </motion.div>

        {/* ── Rating Card ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`relative overflow-hidden rounded-2xl p-6 mb-8 border border-white/[0.08]
            bg-white/[0.04] backdrop-blur-xl shadow-2xl ${tier.glow}`}
        >
          {/* inner gradient wash */}
          <div className={`absolute inset-0 bg-gradient-to-r ${tier.gradient} opacity-[0.07] pointer-events-none`} />

          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-1.5 tracking-wide">Your Rating</p>
              <div className="flex items-center gap-3">
                <span className={`text-5xl font-extrabold bg-gradient-to-b ${tier.gradient} bg-clip-text text-transparent`}>
                  {ratingValue}
                </span>
                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide border
                    bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent border-white/[0.1]`}
                >
                  {tier.name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm mb-1.5 tracking-wide">Contests Participated</p>
              <span className="text-3xl font-bold text-white">{registeredContestIds.length}</span>
            </div>
          </div>
        </motion.div>

        {/* ── Tab Switcher ── */}
        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300
                  ${active
                    ? 'text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-300 bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.08]'
                  }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeCompeteTab"
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.gradient} opacity-90`}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon size={16} />
                  {tab.label}
                  {contestsData && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        active ? 'bg-white/20' : 'bg-white/[0.06] text-slate-500'
                      }`}
                    >
                      {contests.length}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Contests List ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          </div>
        ) : contests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06]"
          >
            {activeTab === 'upcoming' ? (
              <>
                <Clock size={48} className="mx-auto text-indigo-500/40 mb-4" />
                <p className="text-slate-400 text-lg">No upcoming contests</p>
                <p className="text-slate-500 text-sm mt-1">Check back later for new contests!</p>
              </>
            ) : activeTab === 'ongoing' ? (
              <>
                <Zap size={48} className="mx-auto text-emerald-500/40 mb-4" />
                <p className="text-slate-400 text-lg">No ongoing contests</p>
                <p className="text-slate-500 text-sm mt-1">Register for upcoming contests!</p>
              </>
            ) : (
              <>
                <Trophy size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400 text-lg">No past contests</p>
              </>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {contests.map((contest, index) => (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl
                    overflow-hidden hover:border-white/[0.12] hover:shadow-xl hover:shadow-indigo-500/[0.04] transition-all duration-300"
                >
                  {/* subtle top-edge gradient */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">

                      {/* ─ Contest Info ─ */}
                      <div className="flex-1 min-w-[300px]">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{contest.title}</h3>
                          {contest.contest_type === 'rated' && (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                              bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.08)]">
                              <Star size={11} />
                              Rated
                            </span>
                          )}
                          {isRegistered(contest.id) && activeTab === 'upcoming' && (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                              bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.08)]">
                              <CheckCircle size={11} />
                              Registered
                            </span>
                          )}
                        </div>

                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{contest.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-500" />
                            <span>{formatDate(contest.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-500" />
                            <span>{contest.duration_minutes} mins</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users size={14} className="text-slate-500" />
                            <span>{contest.registered_count || 0} registered</span>
                          </div>
                          {contest.difficulty && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize
                                bg-gradient-to-r ${diffColors[contest.difficulty] || diffColors.medium}
                                bg-clip-text text-transparent border border-white/[0.06]`}
                            >
                              {contest.difficulty}
                            </span>
                          )}
                        </div>

                        {/* Problems Preview */}
                        {contest.problems?.length > 0 && (
                          <div className="flex items-center gap-2 mt-4">
                            <span className="text-slate-500 text-xs">Problems:</span>
                            {contest.problems.map((prob, i) => (
                              <div
                                key={i}
                                className="w-8 h-8 bg-white/[0.06] border border-white/[0.06] rounded-lg flex items-center
                                  justify-center text-slate-300 text-sm font-medium hover:bg-white/[0.1] transition-colors"
                                title={prob.title || `Problem ${String.fromCharCode(65 + i)}`}
                              >
                                {String.fromCharCode(65 + i)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ─ Countdown / Actions ─ */}
                      <div className="flex flex-col items-end gap-3">
                        {activeTab === 'upcoming' && countdowns[contest.id] && (
                          <CountdownTimer countdown={countdowns[contest.id]} label="Starts in" />
                        )}

                        {activeTab === 'ongoing' && (
                          <div className="flex flex-col items-end gap-2">
                            {countdowns[contest.id] ? (
                              <CountdownTimer countdown={countdowns[contest.id]} label="Ends in" urgent />
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium
                                bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse
                                shadow-[0_0_20px_rgba(16,185,129,0.12)]">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                                Live Now
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {activeTab === 'upcoming' &&
                            (isRegistered(contest.id) ? (
                              <button
                                disabled
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-default
                                  bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              >
                                <CheckCircle size={16} />
                                Registered
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRegister(contest.id)}
                                disabled={registerMutation.isPending}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300
                                  bg-gradient-to-r from-indigo-600 to-violet-600 text-white
                                  hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]
                                  disabled:opacity-50 disabled:hover:scale-100"
                              >
                                {registerMutation.isPending ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                                Register Now
                              </button>
                            ))}

                          {activeTab === 'ongoing' &&
                            (isRegistered(contest.id) ? (
                              <Link
                                to={`/contest/${contest.id}`}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300
                                  bg-gradient-to-r from-emerald-600 to-teal-600 text-white
                                  hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <Zap size={16} />
                                Enter Contest
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-not-allowed
                                  bg-white/[0.04] border border-white/[0.06] text-slate-500"
                                title="You must register before the contest starts"
                              >
                                <XCircle size={16} />
                                Not Registered
                              </button>
                            ))}

                          {activeTab === 'past' && (
                            <Link
                              to={`/contest/${contest.id}`}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300
                                bg-white/[0.06] border border-white/[0.08] text-slate-300
                                hover:bg-white/[0.1] hover:border-white/[0.12]"
                            >
                              View Results
                              <ArrowRight size={16} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Info Section ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-14 grid md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Trophy,
              title: 'Compete & Win',
              desc: 'Join contests to test your skills against other programmers and climb the leaderboard.',
              gradient: 'from-indigo-500 to-violet-500',
              iconGlow: 'shadow-indigo-500/20',
            },
            {
              icon: TrendingUp,
              title: 'ELO Rating',
              desc: 'Your rating reflects your skill level. Win contests to increase your rating.',
              gradient: 'from-emerald-500 to-teal-500',
              iconGlow: 'shadow-emerald-500/20',
            },
            {
              icon: Gift,
              title: 'Earn Rewards',
              desc: 'Top performers earn bonus coins, exclusive badges, and special themes.',
              gradient: 'from-yellow-500 to-orange-500',
              iconGlow: 'shadow-yellow-500/20',
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
              className="group bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6
                hover:border-white/[0.12] hover:shadow-xl transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} p-[1px] mb-4 shadow-lg ${card.iconGlow}`}
              >
                <div className="w-full h-full rounded-xl bg-[#0B0F1A] flex items-center justify-center">
                  <card.icon size={22} className="text-white" />
                </div>
              </div>
              <h3 className="text-white font-semibold mb-2">{card.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Compete;
