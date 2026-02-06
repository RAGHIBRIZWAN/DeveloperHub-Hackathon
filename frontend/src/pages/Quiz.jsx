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

  // Fetch all MCQs for the module
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

  // Find the specific MCQ if mcqId is provided
  useEffect(() => {
    if (mcqId && questions.length > 0) {
      const index = questions.findIndex(q => q.id === mcqId);
      if (index !== -1) {
        setCurrentQuestionIndex(index);
      }
    }
  }, [mcqId, questions]);

  // Check answer mutation
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
      
      // Auto-speak explanation if available
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
    // Stop any playing speech
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
      // Submit quiz results to backend for XP/coin awards
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
    // Stop any playing speech
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

  if (!moduleId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <HelpCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Module Selected</h2>
          <p className="text-gray-400 mb-6">Please select a module to start the quiz.</p>
          <Link
            to="/courses"
            className="px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors"
          >
            Go to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  // Quiz Complete Screen
  if (quizComplete) {
    const percentage = Math.round((score.correct / score.total) * 100);
    const passed = percentage >= 60;

    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 text-center"
          >
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              passed ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {passed ? (
                <CheckCircle className="w-12 h-12 text-green-400" />
              ) : (
                <XCircle className="w-12 h-12 text-red-400" />
              )}
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">
              Quiz Complete!
            </h1>
            <p className="text-gray-400 mb-6">
              {MODULE_NAMES[moduleId]}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-900/50 rounded-xl p-4">
                <div className="text-3xl font-bold text-white">{percentage}%</div>
                <div className="text-sm text-gray-400">Score</div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4">
                <div className="text-3xl font-bold text-green-400">{score.correct}</div>
                <div className="text-sm text-gray-400">Correct</div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4">
                <div className="text-3xl font-bold text-red-400">{score.total - score.correct}</div>
                <div className="text-sm text-gray-400">Wrong</div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/courses')}
                className="flex-1 px-6 py-3 bg-gray-700 rounded-xl text-white hover:bg-gray-600 transition-colors"
              >
                Back to Courses
              </button>
              <button
                onClick={handleRestartQuiz}
                className="flex-1 px-6 py-3 bg-primary rounded-xl text-white hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Retry Quiz
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </button>
          <div className="text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-8">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8"
          >
            {/* Question Header */}
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                currentQuestion?.difficulty === 'easy'
                  ? 'bg-green-500/20 text-green-400'
                  : currentQuestion?.difficulty === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {currentQuestion?.difficulty}
              </span>
              <span className="text-gray-400 text-sm">{currentQuestion?.topic}</span>
            </div>

            {/* Question */}
            <h2 className="text-xl font-medium text-white mb-8 whitespace-pre-wrap">
              {currentQuestion?.question}
            </h2>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion?.options.map((option) => {
                const isSelected = selectedAnswer === option.id;
                const isCorrectOption = showResult && correctAnswer === option.id;
                const isWrongSelected = showResult && isSelected && !isCorrect;

                let optionStyle = 'bg-gray-900/50 border-gray-700 hover:border-gray-600';
                if (showResult) {
                  if (isCorrectOption) {
                    optionStyle = 'bg-green-500/20 border-green-500';
                  } else if (isWrongSelected) {
                    optionStyle = 'bg-red-500/20 border-red-500';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-primary/20 border-primary';
                }

                return (
                  <motion.button
                    key={option.id}
                    whileHover={!showResult ? { scale: 1.01 } : {}}
                    whileTap={!showResult ? { scale: 0.99 } : {}}
                    onClick={() => handleAnswerSelect(option.id)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-xl text-left border-2 transition-all ${optionStyle} ${
                      showResult ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        isSelected || isCorrectOption
                          ? isCorrectOption
                            ? 'border-green-500 bg-green-500'
                            : isWrongSelected
                            ? 'border-red-500 bg-red-500'
                            : 'border-primary bg-primary'
                          : 'border-gray-600'
                      }`}>
                        {showResult && isCorrectOption && <Check className="w-4 h-4 text-white" />}
                        {showResult && isWrongSelected && <X className="w-4 h-4 text-white" />}
                        {!showResult && isSelected && <Check className="w-4 h-4 text-white" />}
                        {!showResult && !isSelected && (
                          <span className="text-gray-400 text-sm font-medium">
                            {option.id.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-white">{option.text}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Result Feedback */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 ${
                  isCorrect ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
                } rounded-xl overflow-hidden`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {isCorrect ? 'Correct! Well done!' : `Incorrect. The correct answer is ${correctAnswer?.toUpperCase()}.`}
                    </span>
                  </div>
                  
                  {/* AI Explanation */}
                  {aiExplanation && (
                    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xl">🤖</span>
                          <span className="font-semibold text-blue-400">AI Tutor Explanation</span>
                        </div>
                        <button
                          onClick={() => handleSpeakExplanation(aiExplanation)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title={isSpeaking ? "Stop speaking" : "Listen to explanation"}
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                        {aiExplanation}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              {!showResult ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || checkAnswerMutation.isPending}
                  className="px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                  className="flex items-center gap-2 px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors"
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
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-gray-400">Correct: {score.correct}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-gray-400">Wrong: {score.total - score.correct}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
