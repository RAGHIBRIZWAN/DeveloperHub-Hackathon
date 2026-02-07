import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { 
  Play,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Loader2,
  ChevronLeft,
  Eye,
  EyeOff,
  MessageCircle,
  Volume2,
  Sparkles,
  Terminal,
  Code2,
  Zap,
  Trophy
} from 'lucide-react';
import { codeAPI, aiAPI } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import { useGamificationStore } from '../stores/gamificationStore';
import toast from 'react-hot-toast';
import ttsService from '../services/ttsService';

const Challenge = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { programmingLanguage, instructionLanguage } = useSettingsStore();
  const { addCoins, addXP } = useGamificationStore();
  
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [hint, setHint] = useState('');
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Fetch challenge
  const { data: challengeData, isLoading } = useQuery({
    queryKey: ['challenge', slug],
    queryFn: () => codeAPI.getChallenge(slug),
  });

  const challenge = challengeData?.data;

  useEffect(() => {
    if (challenge?.starter_code) {
      const starterCode = challenge.starter_code[programmingLanguage];
      setCode(starterCode || challenge.starter_code.python || '');
    }
  }, [challenge, programmingLanguage]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    setTestResults([]);
    
    try {
      const response = await codeAPI.runCode({
        code,
        language: programmingLanguage,
        stdin: challenge?.sample_input || '',
      });
      
      const result = response.data;
      if (result.status === 'Accepted') {
        setOutput(result.stdout || 'No output');
      } else {
        setOutput(result.stderr || result.compile_output || `Error: ${result.status}`);
      }
    } catch (error) {
      setOutput(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setTestResults([]);
    
    try {
      const response = await codeAPI.submitChallenge(slug, {
        code,
        language: programmingLanguage,
      });
      
      const result = response.data;
      setTestResults(result.test_results || []);
      
      if (result.passed) {
        toast.success('🎉 All tests passed!');
        addCoins(result.coins_earned || 25);
        addXP(result.xp_earned || 50);
      } else {
        const passedCount = result.test_results?.filter(t => t.passed).length || 0;
        toast.error(`${passedCount}/${result.test_results?.length || 0} tests passed`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    setIsLoadingHint(true);
    try {
      const response = await aiAPI.getCodeHelp({
        code,
        problem: challenge?.description,
        language: programmingLanguage,
        instruction_language: instructionLanguage,
      });
      const hintText = response.data.hint || response.data.response;
      setHint(hintText);
      setShowHint(true);
      
      // Auto-speak hint
      handleSpeakHint(hintText);
    } catch (error) {
      toast.error('Failed to get hint');
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleSpeakHint = async (text) => {
    if (isSpeaking) {
      ttsService.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      await ttsService.speak(text, {
        language: instructionLanguage,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <div className="absolute inset-0 w-14 h-14 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <p className="text-slate-400">Challenge not found</p>
      </div>
    );
  }

  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  const allPassed = totalTests > 0 && passedTests === totalTests;

  const difficultyConfig = {
    easy: { color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    medium: { color: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    hard: { color: 'rose', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
  };
  const diff = difficultyConfig[challenge.difficulty] || difficultyConfig.easy;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      {/* Header with gradient accent */}
      <div className="relative bg-white/[0.03] backdrop-blur-2xl border-b border-white/[0.06]">
        {/* Top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/courses')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Code2 size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-white tracking-tight">{challenge.title}</h1>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${diff.bg} ${diff.border} border ${diff.text}`}>
                    {challenge.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <Sparkles size={12} className="text-amber-400" />
                    <span className="text-amber-300">{challenge.xp_reward} XP</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-amber-300/80">
                    🪙 {challenge.coin_reward}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGetHint}
              disabled={isLoadingHint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/[0.15] disabled:opacity-50 transition-all duration-200"
            >
              {isLoadingHint ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {isLoadingHint ? 'Thinking...' : 'AI Hint'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem Description - Sidebar */}
        <div className="w-1/3 bg-white/[0.02] border-r border-white/[0.06] overflow-auto">
          {/* Sidebar header */}
          <div className="sticky top-0 z-10 bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06] px-5 py-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-sm font-semibold text-white tracking-tight">Problem</span>
          </div>

          <div className="p-5 space-y-5">
            <p className="text-slate-300 text-[14px] leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
            
            {challenge.description_ur && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-slate-400 font-urdu text-sm">{challenge.description_ur}</p>
              </div>
            )}

            {/* Sample Input/Output */}
            {challenge.sample_input && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                  <h3 className="text-sm font-semibold text-white">Sample Input</h3>
                </div>
                <pre className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-300 text-sm font-mono">
                  {challenge.sample_input}
                </pre>
              </div>
            )}
            
            {challenge.sample_output && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-500 to-green-500" />
                  <h3 className="text-sm font-semibold text-white">Expected Output</h3>
                </div>
                <pre className="p-4 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/[0.1] text-emerald-300 text-sm font-mono">
                  {challenge.sample_output}
                </pre>
              </div>
            )}

            {/* Constraints */}
            {challenge.constraints && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                  <h3 className="text-sm font-semibold text-white">Constraints</h3>
                </div>
                <ul className="space-y-1.5">
                  {challenge.constraints.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-400 text-sm">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hint */}
            <AnimatePresence>
              {showHint && hint && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  className="relative p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/[0.15] overflow-hidden"
                >
                  {/* Subtle glow */}
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
                  
                  <div className="relative flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Sparkles size={13} className="text-amber-400" />
                      </div>
                      <span className="font-semibold text-amber-300 text-sm">AI Hint</span>
                    </div>
                    <button
                      onClick={() => handleSpeakHint(hint)}
                      className={`p-1.5 rounded-lg transition-all duration-200 ${
                        isSpeaking
                          ? 'text-amber-400 bg-amber-500/15'
                          : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
                      }`}
                      title={isSpeaking ? "Stop speaking" : "Listen to hint"}
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                  <p className="relative text-slate-300 text-sm leading-relaxed">{hint}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Code Editor & Output */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500/60" />
              <select
                value={programmingLanguage}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1 text-slate-300 text-xs font-medium focus:outline-none focus:border-indigo-500/40 appearance-none cursor-default"
                disabled
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-slate-200 text-sm font-medium hover:bg-white/[0.1] disabled:opacity-40 transition-all duration-200"
              >
                <Play size={14} className={isRunning ? 'animate-spin' : ''} />
                {isRunning ? 'Running...' : 'Run'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-40 disabled:hover:shadow-none transition-all duration-300 hover:scale-[1.02]"
              >
                <Send size={14} />
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 relative">
            <div className="absolute inset-0">
              <Editor
                height="100%"
                defaultLanguage={programmingLanguage}
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
          </div>

          {/* Output Panel */}
          <div className="h-64 bg-white/[0.02] border-t border-white/[0.06] flex flex-col">
            <div className="bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-slate-500" />
                <span className="text-slate-400 text-xs font-medium tracking-wider uppercase">Output</span>
              </div>
              {testResults.length > 0 && (
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  allPassed
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                }`}>
                  {allPassed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {passedTests}/{totalTests} passed
                </div>
              )}
            </div>
            <div className="p-4 overflow-auto flex-1">
              {testResults.length > 0 ? (
                <div className="space-y-2">
                  {testResults.map((test, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative p-3.5 rounded-xl overflow-hidden ${
                        test.passed
                          ? 'bg-emerald-500/[0.06] border border-emerald-500/[0.12]'
                          : 'bg-rose-500/[0.06] border border-rose-500/[0.12]'
                      }`}
                    >
                      {/* Subtle glow for passed tests */}
                      {test.passed && (
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500/20 rounded-full blur-xl" />
                      )}
                      
                      <div className="relative flex items-center gap-2 mb-1">
                        {test.passed ? (
                          <CheckCircle size={15} className="text-emerald-400" />
                        ) : (
                          <XCircle size={15} className="text-rose-400" />
                        )}
                        <span className={`text-sm font-medium ${test.passed ? 'text-emerald-300' : 'text-rose-300'}`}>
                          Test Case {index + 1}
                        </span>
                        {!test.hidden && (
                          <span className="text-slate-600 text-xs ml-auto">
                            {test.time_ms}ms
                          </span>
                        )}
                      </div>
                      {!test.hidden && !test.passed && (
                        <div className="relative text-sm mt-2 space-y-1 pl-[23px]">
                          <p className="text-slate-400">Expected: <span className="text-emerald-400 font-mono">{test.expected}</span></p>
                          <p className="text-slate-400">Got: <span className="text-rose-400 font-mono">{test.actual}</span></p>
                        </div>
                      )}
                      {test.hidden && (
                        <p className="relative text-slate-600 text-xs pl-[23px]">Hidden test case</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <pre className="text-sm text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                  {output || (
                    <span className="text-slate-600 italic">Run your code to see output here</span>
                  )}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Challenge;
