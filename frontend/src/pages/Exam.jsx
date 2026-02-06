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
    defaultCode: `# Write your solution here
`,
  },
  cpp: {
    name: 'C++',
    defaultCode: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`,
  },
  javascript: {
    name: 'JavaScript',
    defaultCode: `// Write your solution here
`,
  },
};

const Exam = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('module');
  const { addXP, addCoins } = useGamificationStore();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // For MCQs
  const [codeAnswers, setCodeAnswers] = useState({}); // For coding problems
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResults, setExamResults] = useState(null);
  const [language, setLanguage] = useState('python');
  const [runOutput, setRunOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [examTerminated, setExamTerminated] = useState(false);

  // Fetch exam questions
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

  // Get current question ID
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

  // Tab switching detection with warning system
  useEffect(() => {
    if (!examResults && !examTerminated && questions.length > 0) {
      console.log('🔒 Module exam proctoring active');

      const handleVisibilityChange = () => {
        if (document.hidden) {
          const newCount = tabSwitchCount + 1;
          setTabSwitchCount(newCount);
          console.log(`⚠️ TAB SWITCH DETECTED! Count: ${newCount}`);

          // Create beep sound
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create two beeps
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
            // First warning
            toast.error('⚠️ WARNING: Tab switching detected! You have ONE more chance. Next switch will close the exam.', {
              duration: 5000,
              icon: '⚠️'
            });
          } else if (newCount >= 2) {
            // Second violation - terminate exam
            setExamTerminated(true);
            toast.error('❌ EXAM TERMINATED: You switched tabs twice. Exam has been closed due to violation.', {
              duration: 6000,
              icon: '❌'
            });
            
            // Auto-submit and redirect
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
    setAnswers(prev => ({
      ...prev,
      [qId]: optionId
    }));
  };

  const handleCodeChange = (value) => {
    const qId = getCurrentQuestionId();
    setCodeAnswers(prev => ({
      ...prev,
      [qId]: { code: value, language }
    }));
  };

  // Initialize code for coding questions
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
      // Combine MCQ and coding answers
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
      
      // Process XP/coin rewards
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
    
    if (q.type === 'mcq') {
      return !!answers[qData.id];
    } else if (q.type === 'coding') {
      return !!codeAnswers[qData.id]?.code && 
             codeAnswers[qData.id].code !== LANGUAGE_CONFIG[codeAnswers[qData.id]?.language || 'python'].defaultCode;
    }
    return false;
  };

  const getAnsweredCount = () => {
    return questions.filter((_, index) => isQuestionAnswered(index)).length;
  };

  if (!moduleId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Exam</h2>
          <p className="text-gray-400 mb-6">No module specified for the exam.</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors"
          >
            Back to Courses
          </button>
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

  // Results View
  if (examResults) {
    const passed = examResults.score >= examResults.passing_score;
    
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8"
          >
            {/* Results Header */}
            <div className="text-center mb-8">
              <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                passed 
                  ? 'bg-green-500/20 border-4 border-green-500' 
                  : 'bg-red-500/20 border-4 border-red-500'
              }`}>
                {passed ? (
                  <Trophy className="w-12 h-12 text-green-400" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-400" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {passed ? 'Congratulations!' : 'Better Luck Next Time'}
              </h1>
              <p className="text-gray-400">
                {passed ? 'You passed the exam!' : 'You did not pass this time.'}
              </p>
            </div>

            {/* Score */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {examResults.score}%
                </div>
                <div className="text-sm text-gray-400">Your Score</div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {examResults.correct}/{examResults.total}
                </div>
                <div className="text-sm text-gray-400">Correct Answers</div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {examResults.passing_score}%
                </div>
                <div className="text-sm text-gray-400">Passing Score</div>
              </div>
            </div>

            {/* Review Wrong Answers */}
            {examResults.review && examResults.review.length > 0 && (
              <div className="space-y-4 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Review Wrong Answers</h2>
                {examResults.review.map((item, index) => (
                  <div key={index} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <X className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">{item.question}</p>
                        <div className="space-y-2 text-sm">
                          <p className="text-red-400">
                            <span className="font-medium">Your answer:</span> {item.user_answer || 'Not answered'}
                          </p>
                          <p className="text-green-400">
                            <span className="font-medium">Correct answer:</span> {item.correct_answer}
                          </p>
                        </div>
                      </div>
                    </div>
                    {item.justification && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-sm text-gray-400">
                          <span className="font-medium text-primary">Explanation:</span> {item.justification}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/courses')}
                className="flex-1 px-6 py-3 bg-gray-700 rounded-xl text-white hover:bg-gray-600 transition-colors"
              >
                Back to Courses
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 bg-primary rounded-xl text-white hover:bg-primary/90 transition-colors"
              >
                Retake Exam
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Exam View
  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {MODULE_NAMES[moduleId]} Exam
              </h1>
              <p className="text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
                <span className="ml-2 px-2 py-0.5 rounded text-xs bg-gray-700">
                  {isMCQ ? 'MCQ' : 'Coding'}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-xl">
                <Clock className="w-5 h-5 text-primary" />
                <span className={`font-mono text-lg font-bold ${
                  timeRemaining < 300 ? 'text-red-400' : 'text-white'
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="px-4 py-2 bg-gray-900/50 rounded-xl">
                <span className="text-gray-400">Answered: </span>
                <span className="font-bold text-white">
                  {getAnsweredCount()}/{questions.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switch Warning Banner */}
        {tabSwitchCount > 0 && !examTerminated && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-600/20 border-2 border-red-500 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-400 mb-2">
                  {tabSwitchCount === 1 ? '⚠️ FIRST WARNING' : '❌ FINAL WARNING'}
                </h3>
                {tabSwitchCount === 1 ? (
                  <div className="text-gray-200">
                    <p className="font-semibold mb-1">
                      Tab switching has been detected during your exam!
                    </p>
                    <p className="text-sm">
                      You have <span className="font-bold text-yellow-400">ONE MORE CHANCE</span>. 
                      If you switch tabs again, your exam will be automatically closed and submitted.
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-200">
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-red-600 rounded-2xl p-8 text-center"
          >
            <XCircle className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              EXAM TERMINATED
            </h2>
            <p className="text-red-100 mb-4">
              Your exam has been closed due to multiple tab switching violations.
            </p>
            <p className="text-red-200 text-sm">
              Submitting your answers and redirecting...
            </p>
          </motion.div>
        )}

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 mb-6"
          >
            {/* Question Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                {isMCQ ? (
                  <FileQuestion className="w-5 h-5 text-purple-400" />
                ) : (
                  <Code className="w-5 h-5 text-blue-400" />
                )}
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  currentQuestionData?.difficulty === 'easy' 
                    ? 'bg-green-500/20 text-green-400'
                    : currentQuestionData?.difficulty === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {currentQuestionData?.difficulty}
                </span>
                <span className="text-gray-400 text-sm">
                  {currentQuestionData?.topic}
                </span>
              </div>
              
              {isMCQ ? (
                <h2 className="text-xl font-medium text-white whitespace-pre-wrap">
                  {currentQuestionData?.question}
                </h2>
              ) : (
                <div>
                  <h2 className="text-xl font-medium text-white mb-4">
                    {currentQuestionData?.name}
                  </h2>
                  <p className="text-gray-300 mb-4">{currentQuestionData?.description}</p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-primary font-medium mb-1">Input Format</div>
                      <div className="text-gray-400">{currentQuestionData?.input_format}</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-primary font-medium mb-1">Output Format</div>
                      <div className="text-gray-400">{currentQuestionData?.output_format}</div>
                    </div>
                  </div>
                  {currentQuestionData?.examples?.length > 0 && (
                    <div className="mt-4">
                      <div className="text-primary font-medium mb-2">Examples</div>
                      {currentQuestionData.examples.map((ex, i) => (
                        <div key={i} className="bg-gray-900/50 p-3 rounded-lg mb-2">
                          <div className="grid md:grid-cols-2 gap-4 text-sm font-mono">
                            <div>
                              <div className="text-gray-500 mb-1">Input:</div>
                              <pre className="text-white whitespace-pre-wrap">{ex.input}</pre>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">Output:</div>
                              <pre className="text-white whitespace-pre-wrap">{ex.output}</pre>
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
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-gray-900/50 border-2 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'border-primary bg-primary' 
                            : 'border-gray-600'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-white font-medium">{option.id.toUpperCase()}.</span>
                        <span className="text-white">{option.text}</span>
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
                  <span className="text-gray-400 text-sm">Language:</span>
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
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        language === key
                          ? 'bg-primary text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {config.name}
                    </button>
                  ))}
                </div>

                {/* Code Editor */}
                <div className="border border-gray-700 rounded-xl overflow-hidden">
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
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
                  >
                    {isRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Run Code
                  </button>
                  <span className="text-gray-500 text-sm">
                    Test your code with the first example
                  </span>
                </div>

                {runOutput && (
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                    <pre className="text-gray-300 whitespace-pre-wrap">{runOutput}</pre>
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
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 rounded-xl text-white hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {/* Question indicators */}
          <div className="flex gap-2 flex-wrap justify-center">
            {questions.map((q, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg font-medium transition-all relative ${
                  index === currentQuestionIndex
                    ? 'bg-primary text-white'
                    : isQuestionAnswered(index)
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {index + 1}
                {q.type === 'coding' && (
                  <Code className="w-3 h-3 absolute -top-1 -right-1 text-blue-400" />
                )}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 rounded-xl text-white hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 rounded-xl text-white hover:bg-gray-600 transition-colors"
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
