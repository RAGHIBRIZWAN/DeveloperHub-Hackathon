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
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowLeft
} from 'lucide-react';
import { competeAPI, codeAPI } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import toast from 'react-hot-toast';

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

  // Helper: parse server datetime as UTC (server returns naive UTC without 'Z')
  const parseUTC = (dateStr) => {
    if (!dateStr) return null;
    const s = String(dateStr);
    if (!s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s + 'Z');
    return new Date(s);
  };

  // Fetch contest
  const { data: contestData, isLoading, error: contestError } = useQuery({
    queryKey: ['contest', id],
    queryFn: async () => {
      const response = await competeAPI.getContest(id);
      const data = response.data;
      // Check if user is disqualified
      if (data.is_disqualified) {
        setIsDisqualified(true);
        setExamEnded(true);
      }
      // Check if user is registered
      if (!data.is_registered) {
        toast.error('You are not registered for this contest');
        navigate('/compete');
        return null;
      }
      return data;
    },
    retry: false,
  });

  // Fetch leaderboard with auto-refetch every 30 seconds
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

  // Timer
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

  // Tab Switching Detection - Exam Proctoring
  useEffect(() => {
    if (!contest || examEnded || isDisqualified) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // User switched tabs or minimized window
        console.log('TAB SWITCH DETECTED!');
        setTabSwitchCount(prev => prev + 1);
        
        // Play beep sound using AudioContext for better browser support
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
        
        // IMMEDIATELY disqualify on backend
        setExamEnded(true);
        setIsDisqualified(true);
        
        try {
          await competeAPI.disqualifyUser(id, {
            reason: 'Tab switch violation - automatic disqualification'
          });
        } catch (err) {
          console.error('Failed to report disqualification:', err);
        }
        
        toast.error('TAB SWITCHING DETECTED! You have been DISQUALIFIED. Score set to 0.', {
          duration: 5000,
          style: {
            background: '#DC2626',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        });
        
        // Navigate away after showing message
        setTimeout(() => {
          navigate('/compete', { 
            state: { 
              disqualified: true,
              reason: 'Tab switching detected during exam'
            } 
          });
        }, 3000);
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Log that proctoring is active
    console.log('Exam proctoring active - do NOT switch tabs!');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [contest, examEnded, isDisqualified, navigate, id]);

  useEffect(() => {
    if (problems[selectedProblem]?.starter_code) {
      const starterCode = problems[selectedProblem].starter_code[language];
      setCode(starterCode || '');
    }
  }, [selectedProblem, problems, language]);

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
      setSubmissions(prev => ({
        ...prev,
        [selectedProblem]: result,
      }));
      
      if (result.passed) {
        toast.success(`Problem ${String.fromCharCode(65 + selectedProblem)} accepted! +${result.points} pts`);
      } else {
        const errorMsg = result.errors && result.errors.length > 0 ? result.errors[0] : 'Wrong answer';
        toast.error(`Not accepted: ${errorMsg}`);
      }
      
      // Refetch leaderboard immediately after submission
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!contest) {
    const errorDetail = contestError?.response?.data?.detail || '';
    const isBlocked = errorDetail.includes('disqualified') || errorDetail.includes('must register') || errorDetail.includes('not registered');
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <p className="text-gray-400">{contestError ? errorDetail || contestError.message : 'Contest not found'}</p>
        {isBlocked && (
          <p className="text-red-400 font-semibold">Access denied</p>
        )}
        <button onClick={() => navigate('/compete')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
          Back to Contests
        </button>
      </div>
    );
  }

  const currentProblem = problems[selectedProblem];

  return (
    <div className="h-screen flex flex-col">      {/* Proctoring Warning */}
      {!examEnded && (
        <div className="bg-red-600 text-white px-6 py-2 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">EXAM MODE ACTIVE</span>
          <span className="text-sm">- DO NOT switch tabs or minimize window. Violation will result in IMMEDIATE DISQUALIFICATION with 0 marks!</span>
        </div>
      )}
            {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/compete')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">{contest.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {contest.participant_count || 0} participants
                </span>
              </div>
            </div>
          </div>
          
          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            timeLeft < 300000 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            <Clock size={18} />
            <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem List Sidebar */}
        <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 gap-2">
          {problems.map((problem, index) => (
            <button
              key={index}
              onClick={() => setSelectedProblem(index)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors ${
                selectedProblem === index
                  ? 'bg-blue-600 text-white'
                  : submissions[index]?.passed
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {String.fromCharCode(65 + index)}
            </button>
          ))}
        </div>

        {/* Problem Description */}
        <div className="w-1/3 border-r border-gray-700 overflow-auto p-6">
          {currentProblem && (
            <div className="prose prose-invert max-w-none">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-white">
                  {currentProblem.order || String.fromCharCode(65 + selectedProblem)}.
                </span>
                <h2 className="text-xl font-bold text-white m-0">{currentProblem.title || `Problem ${selectedProblem + 1}`}</h2>
              </div>
              
              <div className="flex items-center gap-4 mb-4 text-sm">
                <span className={`px-2 py-1 rounded ${
                  currentProblem.difficulty === 'easy' 
                    ? 'bg-green-500/20 text-green-400'
                    : currentProblem.difficulty === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {currentProblem.difficulty || 'medium'}
                </span>
                <span className="text-yellow-400">{currentProblem.points} pts</span>
              </div>

              <p className="text-gray-300 whitespace-pre-wrap">{currentProblem.description || 'No description available'}</p>

              {currentProblem.input_format && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Input Format</h3>
                  <p className="text-gray-300">{currentProblem.input_format}</p>
                </div>
              )}

              {currentProblem.output_format && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Output Format</h3>
                  <p className="text-gray-300">{currentProblem.output_format}</p>
                </div>
              )}

              {currentProblem.examples && currentProblem.examples.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Examples</h3>
                  {currentProblem.examples.map((ex, idx) => (
                    <div key={idx} className="mb-4 bg-gray-800 rounded-lg p-4">
                      <div className="mb-2">
                        <span className="text-sm text-gray-400">Input:</span>
                        <pre className="text-gray-300 text-sm mt-1">{ex.input}</pre>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Output:</span>
                        <pre className="text-green-400 text-sm mt-1">{ex.output}</pre>
                      </div>
                      {ex.explanation && (
                        <div className="mt-2 text-sm text-gray-500">
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-gray-300 text-sm"
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
            </select>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || timeLeft === 0 || isDisqualified || examEnded}
              className="flex items-center gap-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
            >
              <Send size={16} />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
          
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

          {/* Submission Result */}
          {submissions[selectedProblem] && (
            <div className={`p-4 border-t ${
              submissions[selectedProblem].passed 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {submissions[selectedProblem].passed ? (
                  <CheckCircle className="text-green-400" size={20} />
                ) : (
                  <XCircle className="text-red-400" size={20} />
                )}
                <span className={submissions[selectedProblem].passed ? 'text-green-400' : 'text-red-400'}>
                  {submissions[selectedProblem].passed ? 'Accepted' : 'Wrong Answer'}
                </span>
                <span className="text-gray-400 text-sm ml-2">
                  ({submissions[selectedProblem].passed_tests}/{submissions[selectedProblem].total_tests} tests passed)
                </span>
                {submissions[selectedProblem].passed && (
                  <span className="text-yellow-400 text-sm ml-auto">
                    +{submissions[selectedProblem].points} pts
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 overflow-auto">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Trophy className="text-yellow-400" size={18} />
              Leaderboard
            </h3>
          </div>
          <div className="divide-y divide-gray-700">
            {leaderboard.slice(0, 20).map((entry, index) => (
              <div key={entry.user_id} className="px-4 py-2 flex items-center gap-3">
                <span className={`w-6 text-center font-bold ${
                  index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-gray-400' :
                  index === 2 ? 'text-orange-400' : 'text-gray-500'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{entry.username}</p>
                </div>
                <span className="text-blue-400 text-sm font-bold">{entry.total_points || entry.score || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contest;
