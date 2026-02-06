import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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
  Volume2
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Challenge not found</p>
      </div>
    );
  }

  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/courses')}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">{challenge.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  challenge.difficulty === 'easy' 
                    ? 'bg-green-500/20 text-green-400'
                    : challenge.difficulty === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {challenge.difficulty}
                </span>
                <span className="flex items-center gap-1">
                  <Award size={14} className="text-yellow-400" />
                  {challenge.xp_reward} XP
                </span>
                <span className="flex items-center gap-1">
                  🪙 {challenge.coin_reward} coins
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGetHint}
              disabled={isLoadingHint}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30"
            >
              <MessageCircle size={18} />
              {isLoadingHint ? 'Loading...' : 'Get Hint'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem Description */}
        <div className="w-1/3 border-r border-gray-700 overflow-auto p-6">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-bold text-white mb-4">Problem</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{challenge.description}</p>
            
            {challenge.description_ur && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-400 font-urdu">{challenge.description_ur}</p>
              </div>
            )}

            {/* Sample Input/Output */}
            {challenge.sample_input && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Sample Input</h3>
                <pre className="p-4 bg-gray-800 rounded-lg text-gray-300 text-sm">
                  {challenge.sample_input}
                </pre>
              </div>
            )}
            
            {challenge.sample_output && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Expected Output</h3>
                <pre className="p-4 bg-gray-800 rounded-lg text-green-400 text-sm">
                  {challenge.sample_output}
                </pre>
              </div>
            )}

            {/* Constraints */}
            {challenge.constraints && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Constraints</h3>
                <ul className="list-disc list-inside text-gray-400 text-sm">
                  {challenge.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hint */}
            {showHint && hint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} className="text-yellow-400" />
                    <span className="font-semibold text-yellow-400">AI Hint</span>
                  </div>
                  <button
                    onClick={() => handleSpeakHint(hint)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-yellow-500/20 rounded-lg transition-colors"
                    title={isSpeaking ? "Stop speaking" : "Listen to hint"}
                  >
                    <Volume2 size={16} className={isSpeaking ? "text-yellow-400" : ""} />
                  </button>
                </div>
                <p className="text-gray-300 text-sm">{hint}</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Code Editor & Output */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <select
              value={programmingLanguage}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-gray-300 text-sm"
              disabled
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                <Play size={16} />
                {isRunning ? 'Running...' : 'Run'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
              >
                <Send size={16} />
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1">
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

          {/* Output Panel */}
          <div className="h-64 bg-gray-900 border-t border-gray-700">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-4">
              <span className="text-gray-400 text-sm">Output</span>
              {testResults.length > 0 && (
                <span className={`text-sm ${passedTests === totalTests ? 'text-green-400' : 'text-red-400'}`}>
                  {passedTests}/{totalTests} tests passed
                </span>
              )}
            </div>
            <div className="p-4 overflow-auto h-48">
              {testResults.length > 0 ? (
                <div className="space-y-2">
                  {testResults.map((test, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        test.passed ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {test.passed ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <XCircle size={16} className="text-red-400" />
                        )}
                        <span className={test.passed ? 'text-green-400' : 'text-red-400'}>
                          Test Case {index + 1}
                        </span>
                        {!test.hidden && (
                          <span className="text-gray-500 text-xs">
                            ({test.time_ms}ms)
                          </span>
                        )}
                      </div>
                      {!test.hidden && !test.passed && (
                        <div className="text-sm text-gray-400 mt-2">
                          <p>Expected: <span className="text-green-400">{test.expected}</span></p>
                          <p>Got: <span className="text-red-400">{test.actual}</span></p>
                        </div>
                      )}
                      {test.hidden && (
                        <p className="text-gray-500 text-xs">Hidden test case</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {output || 'Run your code to see output here'}
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
