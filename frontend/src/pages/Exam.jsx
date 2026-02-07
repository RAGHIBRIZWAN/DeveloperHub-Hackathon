import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { 
  Clock, 
  AlertCircle, 
  Check, 
  X,
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  Trophy,
  XCircle,
  Code,
  FileQuestion,
  Play
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useGamificationStore } from '../stores/gamificationStore';

const MODULE_NAMES = {
  'programming-fundamentals': 'Programming Fundamentals',
  'oop': 'Object-Oriented Programming',
  'data-structures': 'Data Structures'
};

const LANGUAGE_CONFIG = {
  python: {
    name: 'Python',
    defaultCode: `# Write your solution here\n`,
  },
  cpp: {
    name: 'C++',
    defaultCode: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  },
  javascript: {
    name: 'JavaScript',
    defaultCode: `// Write your solution here\n`,
  },
};

const Exam = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('module');
  const { addXP, addCoins } = useGamificationStore();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [codeAnswers, setCodeAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResults, setExamResults] = useState(null);
  const [language, setLanguage] = useState('python');
  const [runOutput, setRunOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [examTerminated, setExamTerminated] = useState(false);

  const { data: examData, isLoading } = useQuery({
    queryKey: ['exam', moduleId],
    queryFn: async () => {
      const response = await api.get(`/problems/modules/${moduleId}/exam`);
      return response.data;
    },
    enabled: !!moduleId
  });

  const questions = examData?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionData = currentQuestion?.question_data;
  const isMCQ = currentQuestion?.type === 'mcq';
  const isCoding = currentQuestion?.type === 'coding';

  const getCurrentQuestionId = () => {
    return currentQuestionData?.id;
  };

  // Timer
  useEffect(() => {
    if (!examResults && questions.length > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [examResults, questions.length]);

  // Tab switching detection
  useEffect(() => {
    if (!examResults && !examTerminated && questions.length > 0) {
      console.log('🔒 Module exam proctoring active');

      const handleVisibilityChange = () => {
        if (document.hidden) {
          const newCount = tabSwitchCount + 1;
          setTabSwitchCount(newCount);
          console.log(`⚠️ TAB SWITCH DETECTED! Count: ${newCount}`);

          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const playBeep = (delay) => {
              setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
              }, delay);
            };
            playBeep(0);
            playBeep(300);
          } catch (error) {
            console.error('Audio error:', error);
          }

          if (newCount === 1) {
            toast.error('⚠️ WARNING: Tab switching detected! You have ONE more chance. Next switch will close the exam.', {
              duration: 5000,
              icon: '⚠️'
            });
          } else if (newCount >= 2) {
            setExamTerminated(true);
            toast.error('❌ EXAM TERMINATED: You switched tabs twice. Exam has been closed due to violation.', {
              duration: 6000,
              icon: '❌'
            });
            setTimeout(() => {
              handleSubmit();
              setTimeout(() => {
                navigate('/courses');
              }, 2000);
            }, 3000);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [examResults, examTerminated, questions.length, tabSwitchCount, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMCQSelect = (optionId) => {
    const qId = getCurrentQuestionId();
    setAnswers(prev => ({ ...prev, [qId]: optionId }));
  };

  const handleCodeChange = (value) => {
    const qId = getCurrentQuestionId();
    setCodeAnswers(prev => ({ ...prev, [qId]: { code: value, language } }));
  };

  useEffect(() => {
    if (isCoding) {
      const qId = getCurrentQuestionId();
      if (!codeAnswers[qId]) {
        setCodeAnswers(prev => ({
          ...prev,
          [qId]: { code: LANGUAGE_CONFIG[language].defaultCode, language }
        }));
      }
    }
  }, [currentQuestionIndex, isCoding]);

  const handleRunCode = async () => {
    const qId = getCurrentQuestionId();
    const codeData = codeAnswers[qId];
    if (!codeData?.code) {
      toast.error('Please write some code first');
      return;
    }

    setIsRunning(true);
    try {
      const example = currentQuestionData?.examples?.[0];
      const response = await api.post('/problems/run', {
        code: codeData.code,
        language: codeData.language,
        stdin: example?.input || ''
      });
      
      let output = '';
      if (response.data.error) {
        output = `Error: ${response.data.error}`;
      } else {
        output = `Output: ${response.data.output || 'No output'}\n`;
        if (example) {
          output += `\nExpected: ${example.output}`;
          if (response.data.output?.trim() === example.output?.trim()) {
            output += '\n\n✓ Matches expected output!';
          } else {
            output += '\n\n✗ Does not match expected output';
          }
        }
      }
      setRunOutput(output);
    } catch (error) {
      setRunOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const allAnswers = [];
      questions.forEach(q => {
        const qData = q.question_data;
        if (q.type === 'mcq' && answers[qData.id]) {
          allAnswers.push({
            question_id: qData.id,
            question_type: 'mcq',
            selected_option: answers[qData.id]
          });
        } else if (q.type === 'coding' && codeAnswers[qData.id]) {
          allAnswers.push({
            question_id: qData.id,
            question_type: 'coding',
            code: codeAnswers[qData.id].code,
            language: codeAnswers[qData.id].language
          });
        }
      });

      const response = await api.post('/problems/modules/exam/submit', {
        module_id: moduleId,
        answers: allAnswers
      });
      setExamResults(response.data);
      
      const results = response.data;
      if (results.already_completed) {
        toast('✅ Exam already completed — no duplicate XP awarded', { icon: 'ℹ️' });
      } else if (results.xp_earned) {
        addXP(results.xp_earned);
        addCoins(results.coins_earned || 0);
        toast.success(`⚡ +${results.xp_earned} XP, +${results.coins_earned || 0} coins!`);
        if (results.leveled_up) {
          toast.success(`🌟 Level Up! You're now level ${results.new_level}!`);
        }
        queryClient.invalidateQueries({ queryKey: ['gamification'] });
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isQuestionAnswered = (index) => {
    const q = questions[index];
    const qData = q?.question_data;
    if (!qData) return false;
    if (q.type === 'mcq') return !!answers[qData.id];
    if (q.type === 'coding') {
      return !!codeAnswers[qData.id]?.code && 
             codeAnswers[qData.id].code !== LANGUAGE_CONFIG[codeAnswers[qData.id]?.language || 'python'].defaultCode;
    }
    return false;
  };

  const getAnsweredCount = () => {
    return questions.filter((_, index) => isQuestionAnswered(index)).length;
  };

  /* ── No module ── */
  if (!moduleId) {
    return (
      <div className="min-h-screen bg-[#07080f] flex items-center justify-center p-6">
        <div className="text-center bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-10 shadow-2xl shadow-black/40">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Exam</h2>
          <p className="text-slate-400 mb-8">No module specified for the exam.</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.03]"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07080f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 blur-xl opacity-40 animate-pulse" />
            <Loader2 className="relative w-12 h-12 text-violet-400 animate-spin" />
          </div>
          <span className="text-slate-500 text-sm tracking-wide">Preparing exam…</span>
        </div>
      </div>
    );
  }

  /* ── Results View ── */
  if (examResults) {
    const passed = examResults.score >= examResults.passing_score;
    
    return (
      <div className="min-h-screen bg-[#07080f] p-6">
        <div className="max-w-4xl mx-auto pt-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-10 shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Background glow */}
            <div className={`absolute -top-40 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[120px] opacity-20 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-10">
                <div className={`w-28 h-28 mx-auto mb-5 rounded-full flex items-center justify-center border-2 ${
                  passed 
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xl shadow-emerald-500/20' 
                    : 'bg-rose-500/10 border-rose-500/40 shadow-xl shadow-rose-500/20'
                }`}>
                  {passed ? (
                    <Trophy className="w-14 h-14 text-emerald-400" />
                  ) : (
                    <XCircle className="w-14 h-14 text-rose-400" />
                  )}
                </div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {passed ? 'Congratulations!' : 'Better Luck Next Time'}
                </h1>
                <p className="text-slate-400">
                  {passed ? 'You passed the exam!' : 'You did not pass this time.'}
                </p>
              </div>

              {/* Score Cards */}
              <div className="grid grid-cols-3 gap-3 mb-10">
                <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-1">
                    {examResults.score}%
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Your Score</div>
                </div>
                <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    {examResults.correct}/{examResults.total}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Correct</div>
                </div>
                <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-slate-300 mb-1">
                    {examResults.passing_score}%
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Pass Mark</div>
                </div>
              </div>

              {/* Score bar */}
              <div className="mb-10">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>0%</span>
                  <span className="text-slate-400 font-medium">Pass: {examResults.passing_score}%</span>
                  <span>100%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 w-px bg-amber-400/60 z-10" style={{ left: `${examResults.passing_score}%` }} />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${examResults.score}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={`h-full rounded-full ${passed ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-pink-400'}`}
                    style={{ boxShadow: passed ? '0 0 24px rgba(16,185,129,0.4)' : '0 0 24px rgba(244,63,94,0.4)' }}
                  />
                </div>
              </div>

              {/* Review Wrong Answers */}
              {examResults.review && examResults.review.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-400" />
                    Review Wrong Answers
                  </h2>
                  <div className="space-y-3">
                    {examResults.review.map((item, index) => (
                      <div key={index} className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-6 h-6 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="w-3.5 h-3.5 text-rose-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium mb-3 leading-relaxed">{item.question}</p>
                            <div className="space-y-2 text-sm">
                              <p className="text-rose-400 flex items-center gap-2">
                                <span className="font-semibold">Your answer:</span>
                                <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md">{item.user_answer || 'Not answered'}</span>
                              </p>
                              <p className="text-emerald-400 flex items-center gap-2">
                                <span className="font-semibold">Correct answer:</span>
                                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">{item.correct_answer}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        {item.justification && (
                          <div className="mt-3 pt-3 border-t border-white/[0.06]">
                            <p className="text-sm text-slate-400 leading-relaxed">
                              <span className="font-semibold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Explanation:</span>{' '}
                              {item.justification}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/courses')}
                  className="flex-1 px-6 py-3.5 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all duration-300 font-medium"
                >
                  Back to Courses
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 rounded-xl text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all duration-300"
                >
                  Retake Exam
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Exam View ── */
  const timerLow = timeRemaining < 300;
  const timerCritical = timeRemaining < 60;
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#07080f] p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header Bar */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 mb-5 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                {MODULE_NAMES[moduleId]} Exam
              </h1>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Question</span>
                <span className="text-white font-semibold">{currentQuestionIndex + 1}</span>
                <span className="text-slate-500">of</span>
                <span className="text-white font-semibold">{questions.length}</span>
                <span className={`ml-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                  isMCQ
                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                }`}>
                  {isMCQ ? 'MCQ' : 'Coding'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer Pill */}
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-sm transition-all duration-500 ${
                timerCritical
                  ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-500/20 animate-pulse'
                  : timerLow
                  ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/15'
                  : 'bg-white/[0.04] border-white/[0.06]'
              }`}>
                <Clock className={`w-4.5 h-4.5 ${timerCritical ? 'text-rose-400' : timerLow ? 'text-amber-400' : 'text-violet-400'}`} />
                <span className={`font-mono text-lg font-bold tracking-wider ${
                  timerCritical ? 'text-rose-400' : timerLow ? 'text-amber-400' : 'text-white'
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Answered Counter */}
              <div className="px-4 py-2.5 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-full">
                <span className="text-slate-500 text-sm">Answered </span>
                <span className="font-bold text-white text-sm">
                  {getAnsweredCount()}/{questions.length}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 relative"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] bg-[length:200%_100%]" />
            </motion.div>
          </div>
        </div>

        {/* Tab Switch Warning Banner */}
        {tabSwitchCount > 0 && !examTerminated && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 bg-rose-500/[0.08] backdrop-blur-xl border border-rose-500/30 rounded-2xl p-5 shadow-lg shadow-rose-500/5"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-rose-400 mb-1">
                  {tabSwitchCount === 1 ? '⚠️ FIRST WARNING' : '❌ FINAL WARNING'}
                </h3>
                {tabSwitchCount === 1 ? (
                  <div className="text-slate-300 text-sm">
                    <p className="font-semibold mb-0.5">
                      Tab switching has been detected during your exam!
                    </p>
                    <p className="text-slate-400">
                      You have <span className="font-bold text-amber-400">ONE MORE CHANCE</span>. 
                      If you switch tabs again, your exam will be automatically closed and submitted.
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-300 text-sm">
                    You have already received one warning. Do NOT switch tabs again or your exam will be terminated immediately.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Exam Terminated Banner */}
        {examTerminated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 bg-gradient-to-r from-rose-600/20 to-red-600/20 backdrop-blur-xl border border-rose-500/40 rounded-2xl p-8 text-center shadow-2xl shadow-rose-500/10"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">EXAM TERMINATED</h2>
            <p className="text-slate-400 mb-2">
              Your exam has been closed due to multiple tab switching violations.
            </p>
            <p className="text-slate-500 text-sm">
              Submitting your answers and redirecting...
            </p>
          </motion.div>
        )}

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -24, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 mb-5 shadow-2xl shadow-black/30"
          >
            {/* Question Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                {isMCQ ? (
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <FileQuestion className="w-4 h-4 text-violet-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                    <Code className="w-4 h-4 text-sky-400" />
                  </div>
                )}
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                  currentQuestionData?.difficulty === 'easy' 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : currentQuestionData?.difficulty === 'medium'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                }`}>
                  {currentQuestionData?.difficulty}
                </span>
                <span className="text-slate-500 text-sm">
                  {currentQuestionData?.topic}
                </span>
              </div>
              
              {isMCQ ? (
                <h2 className="text-xl font-medium text-white whitespace-pre-wrap leading-relaxed">
                  {currentQuestionData?.question}
                </h2>
              ) : (
                <div>
                  <h2 className="text-xl font-medium text-white mb-4">
                    {currentQuestionData?.name}
                  </h2>
                  <p className="text-slate-400 mb-5 leading-relaxed">{currentQuestionData?.description}</p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] p-4 rounded-xl">
                      <div className="text-violet-400 font-semibold mb-1.5 text-xs uppercase tracking-wider">Input Format</div>
                      <div className="text-slate-400">{currentQuestionData?.input_format}</div>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] p-4 rounded-xl">
                      <div className="text-violet-400 font-semibold mb-1.5 text-xs uppercase tracking-wider">Output Format</div>
                      <div className="text-slate-400">{currentQuestionData?.output_format}</div>
                    </div>
                  </div>
                  {currentQuestionData?.examples?.length > 0 && (
                    <div className="mt-5">
                      <div className="text-violet-400 font-semibold mb-3 text-xs uppercase tracking-wider">Examples</div>
                      {currentQuestionData.examples.map((ex, i) => (
                        <div key={i} className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] p-4 rounded-xl mb-2">
                          <div className="grid md:grid-cols-2 gap-4 text-sm font-mono">
                            <div>
                              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider font-sans">Input:</div>
                              <pre className="text-slate-300 whitespace-pre-wrap">{ex.input}</pre>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider font-sans">Output:</div>
                              <pre className="text-slate-300 whitespace-pre-wrap">{ex.output}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MCQ Options */}
            {isMCQ && (
              <div className="space-y-3">
                {currentQuestionData?.options?.map((option) => {
                  const isSelected = answers[currentQuestionData.id] === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleMCQSelect(option.id)}
                      className={`w-full p-4 rounded-xl text-left border backdrop-blur-sm transition-all duration-300 ${
                        isSelected
                          ? 'bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-500/10'
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          isSelected 
                            ? 'border-violet-500 bg-violet-500 shadow-md shadow-violet-500/30' 
                            : 'border-slate-600'
                        }`}>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <span className="text-slate-500 text-xs font-medium">{option.id.toUpperCase()}</span>
                          )}
                        </div>
                        <span className="text-slate-300 font-medium">{option.id.toUpperCase()}.</span>
                        <span className="text-slate-300">{option.text}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Coding Editor */}
            {isCoding && (
              <div className="space-y-4">
                {/* Language Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">Language:</span>
                  <div className="flex gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
                    {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setLanguage(key);
                          const qId = getCurrentQuestionId();
                          if (!codeAnswers[qId] || codeAnswers[qId].code === LANGUAGE_CONFIG[codeAnswers[qId].language].defaultCode) {
                            setCodeAnswers(prev => ({
                              ...prev,
                              [qId]: { code: config.defaultCode, language: key }
                            }));
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          language === key
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-violet-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        {config.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Editor */}
                <div className="border border-white/[0.06] rounded-xl overflow-hidden shadow-inner shadow-black/20">
                  <Editor
                    height="300px"
                    language={language === 'cpp' ? 'cpp' : language}
                    theme="vs-dark"
                    value={codeAnswers[currentQuestionData?.id]?.code || LANGUAGE_CONFIG[language].defaultCode}
                    onChange={handleCodeChange}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      padding: { top: 10 },
                      scrollBeyondLastLine: false
                    }}
                  />
                </div>

                {/* Run Button & Output */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 hover:bg-emerald-500/25 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-40 transition-all duration-300 font-medium"
                  >
                    {isRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Run Code
                  </button>
                  <span className="text-slate-500 text-sm">
                    Test your code with the first example
                  </span>
                </div>

                {runOutput && (
                  <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-xl p-4 font-mono text-sm">
                    <pre className="text-slate-400 whitespace-pre-wrap">{runOutput}</pre>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {/* Question indicators */}
          <div className="flex gap-1.5 flex-wrap justify-center">
            {questions.map((q, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-9 h-9 rounded-xl font-medium text-sm transition-all duration-300 relative border ${
                  index === currentQuestionIndex
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-lg shadow-violet-500/20'
                    : isQuestionAnswered(index)
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300'
                }`}
              >
                {index + 1}
                {q.type === 'coding' && (
                  <Code className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-sky-400" />
                )}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Exam
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="flex items-center gap-2 px-6 py-3 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all duration-300 font-medium"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Exam;
