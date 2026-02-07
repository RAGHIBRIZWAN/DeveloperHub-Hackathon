import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import {
  Clock,
  Trophy,
  Send,
  CheckCircle,
  XCircle,
  Users,
  ArrowLeft,
  AlertTriangle,
  Crown,
  Medal,
} from 'lucide-react';
import { competeAPI, codeAPI } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import toast from 'react-hot-toast';

/* ─── parse naive-UTC strings ─── */
const parseUTC = (dateStr) => {
  if (!dateStr) return null;
  const s = String(dateStr);
  if (!s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s + 'Z');
  return new Date(s);
};

/* ════════════════════════════════════════════════════════════════════════ */
const Contest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { programmingLanguage } = useSettingsStore();
  const queryClient = useQueryClient();

  const [selectedProblem, setSelectedProblem] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(programmingLanguage || 'python');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState({});
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [examEnded, setExamEnded] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);

  /* ── Fetch contest ── */
  const { data: contestData, isLoading, error: contestError } = useQuery({
    queryKey: ['contest', id],
    queryFn: async () => {
      const response = await competeAPI.getContest(id);
      const data = response.data;
      if (data.is_disqualified) {
        setIsDisqualified(true);
        setExamEnded(true);
      }
      if (!data.is_registered) {
        toast.error('You are not registered for this contest');
        navigate('/compete');
        return null;
      }
      return data;
    },
    retry: false,
  });

  /* ── Fetch leaderboard (auto-refetch 30s) ── */
  const { data: leaderboardData } = useQuery({
    queryKey: ['contestLeaderboard', id],
    queryFn: async () => {
      const response = await competeAPI.getContestLeaderboard(id);
      return response.data;
    },
    refetchInterval: 30000,
  });

  const contest = contestData;
  const problems = contest?.problems || [];
  const leaderboard = leaderboardData?.leaderboard || [];

  /* ── Timer ── */
  useEffect(() => {
    if (!contest?.end_time) return;
    const endTime = parseUTC(contest.end_time).getTime();
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        toast.error('Contest ended!');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [contest]);

  /* ── Tab-switch proctoring — IMMEDIATE disqualification ── */
  useEffect(() => {
    if (!contest || examEnded || isDisqualified) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        console.log('TAB SWITCH DETECTED!');
        setTabSwitchCount((prev) => prev + 1);

        // Audio beep
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.3;
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
          console.error('Audio error:', error);
        }

        // Immediately disqualify
        setExamEnded(true);
        setIsDisqualified(true);

        try {
          await competeAPI.disqualifyUser(id, {
            reason: 'Tab switch violation - automatic disqualification',
          });
        } catch (err) {
          console.error('Failed to report disqualification:', err);
        }

        toast.error('TAB SWITCHING DETECTED! You have been DISQUALIFIED. Score set to 0.', {
          duration: 5000,
          style: { background: '#DC2626', color: '#fff', fontSize: '16px', fontWeight: 'bold' },
        });

        setTimeout(() => {
          navigate('/compete', {
            state: { disqualified: true, reason: 'Tab switching detected during exam' },
          });
        }, 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    console.log('Exam proctoring active - do NOT switch tabs!');
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [contest, examEnded, isDisqualified, navigate, id]);

  /* ── Load starter code on problem / language change ── */
  useEffect(() => {
    if (problems[selectedProblem]?.starter_code) {
      const starterCode = problems[selectedProblem].starter_code[language];
      setCode(starterCode || '');
    }
  }, [selectedProblem, problems, language]);

  /* ── Helpers ── */
  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (isDisqualified || examEnded) {
      toast.error('You have been disqualified and cannot submit');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await competeAPI.submitSolution(id, {
        problem_index: selectedProblem,
        code,
        language: language,
      });
      const result = response.data;
      setSubmissions((prev) => ({ ...prev, [selectedProblem]: result }));
      if (result.passed) {
        toast.success(`Problem ${String.fromCharCode(65 + selectedProblem)} accepted! +${result.points} pts`);
      } else {
        const errorMsg = result.errors && result.errors.length > 0 ? result.errors[0] : 'Wrong answer';
        toast.error(`Not accepted: ${errorMsg}`);
      }
      queryClient.invalidateQueries({ queryKey: ['contestLeaderboard', id] });
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail && detail.includes('disqualified')) {
        setIsDisqualified(true);
        setExamEnded(true);
        toast.error('You have been disqualified from this contest');
        setTimeout(() => navigate('/compete'), 2000);
      } else {
        toast.error(detail || 'Submission failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Timer derived state ── */
  const isLowTime = timeLeft > 0 && timeLeft < 300000;

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#06080f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
          <p className="text-slate-500 text-sm tracking-wide">Loading contest...</p>
        </div>
      </div>
    );
  }

  /* ── Error / not found ── */
  if (!contest) {
    const errorDetail = contestError?.response?.data?.detail || '';
    const isBlocked = errorDetail.includes('disqualified') || errorDetail.includes('must register') || errorDetail.includes('not registered');
    return (
      <div className="flex items-center justify-center h-screen bg-[#06080f] flex-col gap-4">
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 text-center max-w-md">
          <p className="text-slate-400 mb-2">{contestError ? errorDetail || contestError.message : 'Contest not found'}</p>
          {isBlocked && <p className="text-red-400 font-semibold mb-4">Access denied</p>}
          <button
            onClick={() => navigate('/compete')}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl
              hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            Back to Contests
          </button>
        </div>
      </div>
    );
  }

  const currentProblem = problems[selectedProblem];

  /* ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="h-screen flex flex-col bg-[#06080f]">

      {/* ── Proctoring Warning Banner ── */}
      {!examEnded && (
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600/90 via-red-500/90 to-red-600/90
          border-b border-red-400/20 text-white px-6 py-2 flex items-center justify-center gap-2
          shadow-[0_4px_30px_rgba(239,68,68,0.15)]">
          {/* animated scan line */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent
            animate-[shimmer_3s_ease-in-out_infinite]" style={{
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite',
            }} />
          <AlertTriangle size={18} className="relative z-10" />
          <span className="font-bold relative z-10 text-sm tracking-wide">EXAM MODE ACTIVE</span>
          <span className="text-xs relative z-10 text-red-100">
            — DO NOT switch tabs or minimize window. Violation = IMMEDIATE DISQUALIFICATION with 0 marks!
          </span>
        </div>
      )}

      {/* ── Header Bar ── */}
      <div className="bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/compete')}
              className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white
                hover:bg-white/[0.08] transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">{contest.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Users size={13} />
                  {contest.participant_count || 0} participants
                </span>
              </div>
            </div>
          </div>

          {/* Timer pill */}
          <div
            className={`flex items-center gap-2.5 px-5 py-2 rounded-full border backdrop-blur-md transition-all duration-500
              ${isLowTime
                ? 'bg-red-500/10 border-red-400/20 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.15)]'
                : 'bg-white/[0.04] border-white/[0.06] text-indigo-300'
              }`}
          >
            <Clock size={16} className={isLowTime ? 'animate-pulse' : ''} />
            <span className="font-mono text-lg font-bold tracking-wider">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Problem Sidebar (A, B, C...) ── */}
        <div className="w-16 bg-white/[0.02] border-r border-white/[0.06] flex flex-col items-center py-4 gap-2">
          {problems.map((problem, index) => {
            const isActive = selectedProblem === index;
            const isSolved = submissions[index]?.passed;
            return (
              <button
                key={index}
                onClick={() => setSelectedProblem(index)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                    : isSolved
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                  }`}
              >
                {String.fromCharCode(65 + index)}
              </button>
            );
          })}
        </div>

        {/* ── Problem Description Panel ── */}
        <div className="w-1/3 border-r border-white/[0.06] overflow-auto bg-white/[0.01]">
          {currentProblem && (
            <div className="p-6">
              {/* Title */}
              <div className="flex items-center gap-2.5 mb-5">
                <span className="text-2xl font-extrabold bg-gradient-to-b from-indigo-300 to-violet-400 bg-clip-text text-transparent">
                  {currentProblem.order || String.fromCharCode(65 + selectedProblem)}.
                </span>
                <h2 className="text-xl font-bold text-white">{currentProblem.title || `Problem ${selectedProblem + 1}`}</h2>
              </div>

              {/* Meta badges */}
              <div className="flex items-center gap-3 mb-6">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize
                    ${currentProblem.difficulty === 'easy'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : currentProblem.difficulty === 'medium'
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                >
                  {currentProblem.difficulty || 'medium'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold
                  bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                  {currentProblem.points} pts
                </span>
              </div>

              {/* Description */}
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{currentProblem.description || 'No description available'}</p>

              {currentProblem.input_format && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Input Format</h3>
                  <p className="text-slate-400 text-sm">{currentProblem.input_format}</p>
                </div>
              )}

              {currentProblem.output_format && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Output Format</h3>
                  <p className="text-slate-400 text-sm">{currentProblem.output_format}</p>
                </div>
              )}

              {currentProblem.examples && currentProblem.examples.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Examples</h3>
                  {currentProblem.examples.map((ex, idx) => (
                    <div key={idx} className="mb-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                      <div className="mb-2.5">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Input</span>
                        <pre className="text-slate-300 text-sm mt-1.5 font-mono bg-white/[0.03] rounded-lg p-2.5">{ex.input}</pre>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Output</span>
                        <pre className="text-emerald-400 text-sm mt-1.5 font-mono bg-white/[0.03] rounded-lg p-2.5">{ex.output}</pre>
                      </div>
                      {ex.explanation && (
                        <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">{ex.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Code Editor Panel ── */}
        <div className="flex-1 flex flex-col">
          {/* Editor toolbar */}
          <div className="bg-white/[0.03] border-b border-white/[0.06] px-4 py-2 flex items-center justify-between">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-slate-300 text-sm
                focus:outline-none focus:border-indigo-500/40 transition-colors appearance-none cursor-pointer"
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
            </select>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || timeLeft === 0 || isDisqualified || examEnded}
              className="flex items-center gap-2 px-5 py-1.5 rounded-xl text-sm font-medium transition-all duration-300
                bg-gradient-to-r from-emerald-600 to-teal-600 text-white
                hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>

          {/* Monaco editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language === 'javascript' ? 'javascript' : 'python'}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                padding: { top: 16 },
              }}
            />
          </div>

          {/* Submission result bar */}
          {submissions[selectedProblem] && (
            <div
              className={`p-4 border-t backdrop-blur-md transition-all
                ${submissions[selectedProblem].passed
                  ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                  : 'bg-red-500/[0.06] border-red-500/20'
                }`}
            >
              <div className="flex items-center gap-2.5">
                {submissions[selectedProblem].passed ? (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle className="text-emerald-400" size={16} />
                    <span className="text-emerald-400 font-semibold text-sm">Accepted</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                    <XCircle className="text-red-400" size={16} />
                    <span className="text-red-400 font-semibold text-sm">Wrong Answer</span>
                  </div>
                )}
                <span className="text-slate-500 text-sm">
                  ({submissions[selectedProblem].passed_tests}/{submissions[selectedProblem].total_tests} tests passed)
                </span>
                {submissions[selectedProblem].passed && (
                  <span className="text-yellow-400 text-sm font-semibold ml-auto">
                    +{submissions[selectedProblem].points} pts
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Leaderboard Panel ── */}
        <div className="w-64 bg-white/[0.02] border-l border-white/[0.06] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <div className="p-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Trophy className="text-yellow-400" size={14} />
              </div>
              Leaderboard
            </h3>
          </div>

          {/* Entries */}
          <div className="flex-1 overflow-auto">
            {leaderboard.slice(0, 20).map((entry, index) => (
              <div
                key={entry.user_id}
                className={`px-4 py-2.5 flex items-center gap-3 border-b border-white/[0.03]
                  hover:bg-white/[0.03] transition-colors
                  ${index === 0 ? 'bg-yellow-500/[0.03]' : ''}`}
              >
                {/* Rank */}
                <span className="w-6 text-center">
                  {index === 0 ? (
                    <Crown size={16} className="text-yellow-400 mx-auto" />
                  ) : index === 1 ? (
                    <Medal size={16} className="text-slate-300 mx-auto" />
                  ) : index === 2 ? (
                    <Medal size={16} className="text-orange-400 mx-auto" />
                  ) : (
                    <span className="text-xs font-bold text-slate-500">{index + 1}</span>
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{entry.username}</p>
                </div>

                <span className="text-sm font-bold bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">
                  {entry.total_points || entry.score || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* shimmer keyframes for proctoring banner */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Contest;
