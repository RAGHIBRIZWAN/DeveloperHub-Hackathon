import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Trophy,
  Calendar,
  Plus,
  Loader2,
  Clock,
  Target,
  X,
  Check,
  BarChart3,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import PageBackground from '../components/ui/PageBackground';

/* ─── animation variants ─── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── glass token ─── */
const glass = 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl';
const glassInput =
  'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 outline-none transition-colors';

const Admin = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showContestForm, setShowContestForm] = useState(false);

  // Contest form state
  const [contestForm, setContestForm] = useState({
    title: '',
    description: '',
    start_time: '',
    duration_minutes: 120,
    difficulty: 'mixed',
    contest_type: 'rated',
    is_public: true,
    max_participants: null,
  });

  // ── queries ──
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
    retry: 1,
  });

  const { data: contests, isLoading: contestsLoading } = useQuery({
    queryKey: ['adminContests'],
    queryFn: () => api.get('/admin/contests').then((r) => r.data),
    retry: 1,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.get('/admin/users').then((r) => r.data),
    retry: 1,
  });

  // ── create contest mutation ──
  const createContestMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Mutation function called with:', data);
      try {
        const response = await api.post('/admin/contests', data);
        console.log('Contest created successfully:', response.data);
        return response.data;
      } catch (err) {
        console.error('API Error:', err);
        console.error('Error Response:', err.response?.data);
        throw err;
      }
    },
  });

  const resetContestForm = () => {
    setContestForm({
      title: '',
      description: '',
      start_time: '',
      duration_minutes: 120,
      difficulty: 'mixed',
      contest_type: 'rated',
      is_public: true,
      max_participants: null,
    });
  };

  // ── access guard ──
  if (user?.role !== 'admin') {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <PageBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${glass} p-10 text-center max-w-sm`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <Shield className="text-red-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-slate-400">You don't have permission to access this page.</p>
        </motion.div>
      </div>
    );
  }

  // ── submit handler ──
  const handleContestSubmit = async (e) => {
    e.preventDefault();

    console.log('=== Contest Submit Started ===');
    console.log('Contest Form:', contestForm);

    if (!contestForm.title || contestForm.title.trim().length < 3) {
      toast.error('Contest title must be at least 3 characters');
      return;
    }
    if (!contestForm.description || contestForm.description.trim().length < 10) {
      toast.error('Contest description must be at least 10 characters');
      return;
    }
    if (!contestForm.start_time) {
      toast.error('Please select a start time');
      return;
    }

    try {
      const contestData = {
        title: contestForm.title,
        description: contestForm.description,
        start_time: new Date(contestForm.start_time).toISOString(),
        duration_minutes: parseInt(contestForm.duration_minutes),
        difficulty: contestForm.difficulty,
        contest_type: contestForm.contest_type,
        is_public: contestForm.is_public,
        max_participants: contestForm.max_participants || null,
      };

      console.log('=== Submitting Contest Data ===', contestData);
      const result = await createContestMutation.mutateAsync(contestData);

      console.log('=== Contest Submit Completed ===', result);
      toast.success('Contest created successfully with 5 random CP problems! Notification sent to all users.');

      await queryClient.invalidateQueries({ queryKey: ['adminContests'] });
      await queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      await queryClient.invalidateQueries({ queryKey: ['contests'] });

      setShowContestForm(false);
      resetContestForm();
    } catch (error) {
      console.error('=== Contest Submit Error ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);

      let errorMessage = 'Failed to create contest';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((e) => e.msg || e.message).join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { duration: 5000 });
    }
  };

  // ── tabs config ──
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'contests', label: 'Contests', icon: Trophy },
    { id: 'users', label: 'Users', icon: Users },
  ];

  // ── stat cards config ──
  const statCards = [
    {
      label: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      gradient: 'from-indigo-500 to-blue-500',
      iconBg: 'bg-indigo-500/15',
      iconColor: 'text-indigo-400',
      accent: 'bg-gradient-to-r from-indigo-500 to-blue-500',
    },
    {
      label: 'Total Contests',
      value: stats?.total_contests || 0,
      icon: Trophy,
      gradient: 'from-violet-500 to-purple-500',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-400',
      accent: 'bg-gradient-to-r from-violet-500 to-purple-500',
    },
    {
      label: 'Active Contests',
      value: stats?.active_users_today || 0,
      icon: Target,
      gradient: 'from-emerald-500 to-green-500',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      accent: 'bg-gradient-to-r from-emerald-500 to-green-500',
    },
    {
      label: 'Upcoming Contests',
      value: stats?.pending_contests || 0,
      icon: Calendar,
      gradient: 'from-pink-500 to-rose-500',
      iconBg: 'bg-pink-500/15',
      iconColor: 'text-pink-400',
      accent: 'bg-gradient-to-r from-pink-500 to-rose-500',
    },
  ];

  // ── status helpers ──
  const statusBadge = (status) => {
    const map = {
      ongoing: 'bg-emerald-500/15 text-emerald-400 shadow-emerald-500/20',
      upcoming: 'bg-amber-500/15 text-amber-400 shadow-amber-500/20',
      ended: 'bg-white/[0.06] text-slate-400 shadow-none',
    };
    return map[status] || map.ended;
  };

  const statusDot = (status) => {
    const map = {
      ongoing: 'bg-emerald-400 shadow-lg shadow-emerald-500/40',
      upcoming: 'bg-amber-400 shadow-lg shadow-amber-500/40',
      ended: 'bg-white/20',
    };
    return map[status] || map.ended;
  };

  return (
    <div className="relative min-h-screen">
      <PageBackground />

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Manage your platform</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowContestForm(true)}
            className="relative group flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow"
          >
            {/* glow */}
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
            <Plus size={18} className="relative z-10" />
            <span className="relative z-10">Create Contest</span>
          </motion.button>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <LayoutGroup>
            <div className="inline-flex items-center gap-1 p-1 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active ? 'text-white' : 'text-slate-400 hover:text-white/70'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="adminTabPill"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600/80 to-violet-600/80"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <tab.icon size={16} className="relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </motion.div>

        {/* ── Overview Tab ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              variants={stagger}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {statCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  variants={fadeUp}
                  className={`${glass} p-6 group hover:border-white/[0.1] transition-colors relative overflow-hidden`}
                >
                  {/* accent line */}
                  <div className={`absolute top-0 left-6 right-6 h-[2px] ${card.accent} rounded-full opacity-60`} />

                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                      <card.icon className={card.iconColor} size={22} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">{card.label}</p>
                      <p className="text-2xl font-bold text-white mt-0.5">
                        {statsLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                        ) : (
                          card.value
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── Contests Tab ── */}
          {activeTab === 'contests' && (
            <motion.div
              key="contests"
              variants={stagger}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="space-y-4"
            >
              {contestsLoading ? (
                <motion.div variants={fadeIn} className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </motion.div>
              ) : contests?.length > 0 ? (
                contests.map((contest, index) => (
                  <motion.div
                    key={contest.id}
                    variants={fadeUp}
                    className={`${glass} p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/[0.1] transition-colors`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${statusDot(contest.status)}`} />
                      <div>
                        <h3 className="font-semibold text-white">{contest.title}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {new Date(contest.start_time).toLocaleString()} &middot;{' '}
                          {contest.duration_minutes} mins &middot; {contest.difficulty}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-7 sm:ml-0">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shadow-md ${statusBadge(
                          contest.status
                        )}`}
                      >
                        {contest.status}
                      </span>
                      <span className="text-slate-500 text-sm">{contest.registered_count} registered</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div variants={fadeIn} className="text-center py-16 text-slate-500">
                  No contests found. Create your first contest!
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Users Tab ── */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              variants={fadeIn}
              initial="hidden"
              animate="show"
              exit="hidden"
              className={`${glass} overflow-hidden`}
            >
              {usersLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                        <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          User
                        </th>
                        <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          Role
                        </th>
                        <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {usersData?.users?.map((u, i) => (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
                                {u.username[0].toUpperCase()}
                              </div>
                              <span className="text-white font-medium">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{u.email}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                u.role === 'admin'
                                  ? 'bg-violet-500/15 text-violet-400 shadow-sm shadow-violet-500/20'
                                  : 'bg-indigo-500/15 text-indigo-400 shadow-sm shadow-indigo-500/20'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                u.is_active
                                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/20'
                                  : 'bg-red-500/15 text-red-400 shadow-sm shadow-red-500/20'
                              }`}
                            >
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Contest Creation Modal ── */}
      <AnimatePresence>
        {showContestForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
            onClick={() => {
              setShowContestForm(false);
              resetContestForm();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
            >
              {/* gradient accent on top */}
              <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 rounded-full" />

              {/* header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white">Create New Contest</h2>
                  <p className="text-slate-500 text-sm mt-1">Fill in the details below</p>
                </div>
                <button
                  onClick={() => {
                    setShowContestForm(false);
                    resetContestForm();
                  }}
                  className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.1] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleContestSubmit} className="space-y-6">
                {/* basic info */}
                <div className="space-y-5">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Basic Information
                  </h3>

                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Title</label>
                    <input
                      type="text"
                      value={contestForm.title}
                      onChange={(e) => setContestForm({ ...contestForm, title: e.target.value })}
                      required
                      className={glassInput}
                      placeholder="Weekly Challenge #1"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Description</label>
                    <textarea
                      value={contestForm.description}
                      onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })}
                      required
                      className={`${glassInput} h-24 resize-none`}
                      placeholder="Describe the contest..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        value={contestForm.start_time}
                        onChange={(e) => setContestForm({ ...contestForm, start_time: e.target.value })}
                        required
                        className={glassInput}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Duration (minutes)</label>
                      <input
                        type="number"
                        value={contestForm.duration_minutes}
                        onChange={(e) =>
                          setContestForm({ ...contestForm, duration_minutes: parseInt(e.target.value) })
                        }
                        required
                        min={30}
                        max={480}
                        className={glassInput}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Difficulty</label>
                      <select
                        value={contestForm.difficulty}
                        onChange={(e) => setContestForm({ ...contestForm, difficulty: e.target.value })}
                        className={glassInput}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Contest Type</label>
                      <select
                        value={contestForm.contest_type}
                        onChange={(e) => setContestForm({ ...contestForm, contest_type: e.target.value })}
                        className={glassInput}
                      >
                        <option value="rated">Rated</option>
                        <option value="unrated">Unrated</option>
                        <option value="practice">Practice</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={contestForm.is_public}
                      onChange={(e) => setContestForm({ ...contestForm, is_public: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-indigo-500 focus:ring-indigo-500/40"
                    />
                    <span className="text-slate-400 group-hover:text-white/70 transition-colors text-sm">
                      Public Contest
                    </span>
                  </label>
                </div>

                {/* problems info */}
                <div className="space-y-4 border-t border-white/[0.06] pt-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Trophy size={14} />
                    Contest Problems
                  </h3>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
                    <p className="text-indigo-300 text-sm flex items-center gap-2">
                      <Check size={16} />
                      5 random Competitive Programming problems will be automatically selected for this
                      contest
                    </p>
                  </div>
                </div>

                {/* actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowContestForm(false);
                      resetContestForm();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={createContestMutation.isPending}
                    className="relative group px-6 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                    {createContestMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                    ) : (
                      <Plus size={18} className="relative z-10" />
                    )}
                    <span className="relative z-10">Create Contest</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
