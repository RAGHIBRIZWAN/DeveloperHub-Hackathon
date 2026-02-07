import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ttsService from '../services/ttsService';
import { useGamificationStore } from '../stores/gamificationStore';

const MODULE_NAMES = {
  'programming-fundamentals': 'Programming Fundamentals',
  'oop': 'Object-Oriented Programming',
  'data-structures': 'Data Structures'
};

const Quiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('module');
  const mcqId = searchParams.get('mcq');
  const { addXP, addCoins } = useGamificationStore();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizComplete, setQuizComplete] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { data: mcqData, isLoading } = useQuery({
    queryKey: ['mcqs', moduleId],
    queryFn: async () => {
      const response = await api.get(`/problems/modules/${moduleId}/mcqs`);
      return response.data;
    },
    enabled: !!moduleId
  });

  const questions = mcqData?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (mcqId && questions.length > 0) {
      const index = questions.findIndex(q => q.id === mcqId);
      if (index !== -1) {
        setCurrentQuestionIndex(index);
      }
    }
  }, [mcqId, questions]);

  const checkAnswerMutation = useMutation({
    mutationFn: async ({ questionId, selectedOption }) => {
      const response = await api.post(`/problems/modules/mcqs/${questionId}/check`, {
        selected_option: selectedOption
      });
      return response.data;
    },
    onSuccess: (data) => {
      setShowResult(true);
      setIsCorrect(data.is_correct);
      setCorrectAnswer(data.correct_option);
      setAiExplanation(data.ai_explanation || data.explanation);
      
      if (data.is_correct) {
        setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
        toast.success('Correct! 🎉');
      } else {
        toast.error('Incorrect!');
      }
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
      
      if (data.ai_explanation || data.explanation) {
        handleSpeakExplanation(data.ai_explanation || data.explanation);
      }
    },
    onError: (error) => {
      toast.error('Failed to check answer');
      console.error(error);
    }
  });

  const handleAnswerSelect = (optionId) => {
    if (showResult) return;
    setSelectedAnswer(optionId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer');
      return;
    }
    checkAnswerMutation.mutate({
      questionId: currentQuestion.id,
      selectedOption: selectedAnswer
    });
  };

  const handleNextQuestion = () => {
    ttsService.stop();
    setIsSpeaking(false);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setCorrectAnswer(null);
      setAiExplanation(null);
    } else {
      setQuizComplete(true);
      submitQuizResults();
    }
  };

  const submitQuizResults = async () => {
    try {
      const response = await api.post('/problems/modules/quiz/complete', {
        module_id: moduleId,
        correct: score.correct,
        total: score.total
      });
      const data = response.data;
      if (data.already_completed) {
        toast('✅ Quiz already completed — no duplicate XP awarded', { icon: 'ℹ️' });
      } else if (data.xp_earned) {
        addXP(data.xp_earned);
        addCoins(data.coins_earned || 0);
        toast.success(`⚡ +${data.xp_earned} XP, +${data.coins_earned || 0} coins!`);
        if (data.leveled_up) {
          toast.success(`🌟 Level Up! You're now level ${data.new_level}!`);
        }
        queryClient.invalidateQueries({ queryKey: ['gamification'] });
      }
    } catch (error) {
      console.error('Failed to submit quiz results:', error);
    }
  };

  const handlePreviousQuestion = () => {
    ttsService.stop();
    setIsSpeaking(false);
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setCorrectAnswer(null);
      setAiExplanation(null);
    }
  };

  const handleSpeakExplanation = async (text) => {
    if (isSpeaking) {
      ttsService.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      await ttsService.speak(text, {
        rate: 0.95,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (error) => {
          console.error('TTS error:', error);
          setIsSpeaking(false);
        }
      });
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectAnswer(null);
    setScore({ correct: 0, total: 0 });
    setQuizComplete(false);
  };

  /* ── No module selected ── */
  if (!moduleId) {
    return (
      <div className="min-h-screen bg-[#07080f] flex items-center justify-center p-6">
        <div className="text-center bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-10 shadow-2xl shadow-indigo-500/5">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
            <HelpCircle className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Module Selected</h2>
          <p className="text-slate-400 mb-8">Please select a module to start the quiz.</p>
          <Link
            to="/courses"
            className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.03]"
          >
            Go to Courses
          </Link>
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
          <span className="text-slate-500 text-sm tracking-wide">Loading questions…</span>
        </div>
      </div>
    );
  }

  /* ── Quiz Complete ── */
  if (quizComplete) {
    const percentage = Math.round((score.correct / score.total) * 100);
    const passed = percentage >= 60;

    return (
      <div className="min-h-screen bg-[#07080f] p-6">
        <div className="max-w-2xl mx-auto pt-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-10 text-center shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Decorative glow */}
            <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] opacity-30 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />

            <div className="relative z-10">
              <div className={`w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center border-2 ${
                passed
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                  : 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-500/20'
              }`}>
                {passed ? (
                  <CheckCircle className="w-14 h-14 text-emerald-400" />
                ) : (
                  <XCircle className="w-14 h-14 text-rose-400" />
                )}
              </div>

              <h1 className="text-3xl font-bold text-white mb-1">Quiz Complete!</h1>
              <p className="text-slate-400 mb-8">{MODULE_NAMES[moduleId]}</p>

              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5">
                  <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{percentage}%</div>
                  <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Score</div>
                </div>
                <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5">
                  <div className="text-3xl font-bold text-emerald-400">{score.correct}</div>
                  <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Correct</div>
                </div>
                <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-5">
                  <div className="text-3xl font-bold text-rose-400">{score.total - score.correct}</div>
                  <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Wrong</div>
                </div>
              </div>

              {/* Progress ring visual */}
              <div className="w-full h-2 rounded-full bg-white/[0.06] mb-8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className={`h-full rounded-full ${passed ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-pink-400'}`}
                  style={{ boxShadow: passed ? '0 0 20px rgba(16,185,129,0.4)' : '0 0 20px rgba(244,63,94,0.4)' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/courses')}
                  className="flex-1 px-6 py-3.5 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all duration-300 font-medium"
                >
                  Back to Courses
                </button>
                <button
                  onClick={handleRestartQuiz}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 rounded-xl text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Quiz
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Main Quiz View ── */
  return (
    <div className="min-h-screen bg-[#07080f] p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Back to Courses</span>
          </button>
          <div className="px-4 py-1.5 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-full text-sm text-slate-400">
            Question <span className="text-white font-semibold">{currentQuestionIndex + 1}</span> of <span className="text-white font-semibold">{questions.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] mb-8 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 relative"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] bg-[length:200%_100%]" />
          </motion.div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 30, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 shadow-2xl shadow-black/30"
          >
            {/* Difficulty & Topic */}
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                currentQuestion?.difficulty === 'easy'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : currentQuestion?.difficulty === 'medium'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
              }`}>
                {currentQuestion?.difficulty}
              </span>
              <span className="text-slate-500 text-sm">{currentQuestion?.topic}</span>
            </div>

            {/* Question Text */}
            <h2 className="text-xl font-medium text-white mb-8 whitespace-pre-wrap leading-relaxed">
              {currentQuestion?.question}
            </h2>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion?.options.map((option) => {
                const isSelected = selectedAnswer === option.id;
                const isCorrectOption = showResult && correctAnswer === option.id;
                const isWrongSelected = showResult && isSelected && !isCorrect;

                let optionStyle = 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]';
                let glowStyle = '';
                if (showResult) {
                  if (isCorrectOption) {
                    optionStyle = 'bg-emerald-500/10 border-emerald-500/40';
                    glowStyle = 'shadow-lg shadow-emerald-500/10';
                  } else if (isWrongSelected) {
                    optionStyle = 'bg-rose-500/10 border-rose-500/40';
                    glowStyle = 'shadow-lg shadow-rose-500/10';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-violet-500/10 border-violet-500/40';
                  glowStyle = 'shadow-lg shadow-violet-500/10';
                }

                return (
                  <motion.button
                    key={option.id}
                    whileHover={!showResult ? { scale: 1.01 } : {}}
                    whileTap={!showResult ? { scale: 0.99 } : {}}
                    onClick={() => handleAnswerSelect(option.id)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-xl text-left border backdrop-blur-sm transition-all duration-300 ${optionStyle} ${glowStyle} ${
                      showResult ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isSelected || isCorrectOption
                          ? isCorrectOption
                            ? 'border-emerald-500 bg-emerald-500 shadow-md shadow-emerald-500/30'
                            : isWrongSelected
                            ? 'border-rose-500 bg-rose-500 shadow-md shadow-rose-500/30'
                            : 'border-violet-500 bg-violet-500 shadow-md shadow-violet-500/30'
                          : 'border-slate-600'
                      }`}>
                        {showResult && isCorrectOption && <Check className="w-4 h-4 text-white" />}
                        {showResult && isWrongSelected && <X className="w-4 h-4 text-white" />}
                        {!showResult && isSelected && <Check className="w-4 h-4 text-white" />}
                        {!showResult && !isSelected && (
                          <span className="text-slate-500 text-sm font-medium">
                            {option.id.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-300">{option.text}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Result Feedback */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`mb-6 rounded-xl overflow-hidden border ${
                  isCorrect
                    ? 'bg-emerald-500/[0.08] border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                    : 'bg-rose-500/[0.08] border-rose-500/20 shadow-lg shadow-rose-500/5'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <span className={`font-semibold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isCorrect ? 'Correct! Well done!' : `Incorrect. The correct answer is ${correctAnswer?.toUpperCase()}.`}
                    </span>
                  </div>
                  
                  {aiExplanation && (
                    <div className="mt-4 p-4 bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06]">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🤖</span>
                          <span className="font-semibold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent text-sm">AI Tutor Explanation</span>
                        </div>
                        <button
                          onClick={() => handleSpeakExplanation(aiExplanation)}
                          className="p-2 text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all duration-200"
                          title={isSpeaking ? "Stop speaking" : "Listen to explanation"}
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-5 h-5 text-violet-400" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-slate-400 leading-relaxed whitespace-pre-line text-sm">
                        {aiExplanation}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 rounded-xl hover:bg-white/[0.04]"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              {!showResult ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || checkAnswerMutation.isPending}
                  className="px-7 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 rounded-xl text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 hover:scale-[1.02] flex items-center gap-2"
                >
                  {checkAnswerMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Check Answer'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 rounded-xl text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.02]"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Score Tracker */}
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-full">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Correct: <span className="text-emerald-400 font-semibold">{score.correct}</span></span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-full">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span className="text-slate-400">Wrong: <span className="text-rose-400 font-semibold">{score.total - score.correct}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
