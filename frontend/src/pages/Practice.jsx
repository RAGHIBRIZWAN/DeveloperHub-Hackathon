import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  X,
  SlidersHorizontal,
  Code,
  Play,
  Send,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  ArrowLeft,
  Maximize2,
  Minimize2,
  BookOpen,
  Cpu,
  Layers,
  Trophy,
  Lightbulb,
  Sparkles,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import api from '../services/api';
import { problemsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useGamificationStore } from '../stores/gamificationStore';

// Difficulty color mapping
const getDifficultyColor = (rating) => {
  if (!rating) return 'bg-slate-500';
  if (rating < 1200) return 'bg-emerald-500';
  if (rating < 1400) return 'bg-cyan-500';
  if (rating < 1600) return 'bg-blue-500';
  if (rating < 1900) return 'bg-purple-500';
  if (rating < 2100) return 'bg-amber-500';
  if (rating < 2400) return 'bg-orange-500';
  return 'bg-rose-500';
};

const getDifficultyLabel = (difficulty) => {
  const labels = {
    'easy': { text: 'Easy', color: 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.12)]' },
    'medium': { text: 'Medium', color: 'text-amber-300 bg-amber-500/15 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.12)]' },
    'hard': { text: 'Hard', color: 'text-orange-300 bg-orange-500/15 border border-orange-500/20 shadow-[0_0_12px_rgba(249,115,22,0.12)]' },
    'expert': { text: 'Expert', color: 'text-rose-300 bg-rose-500/15 border border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.12)]' }
  };
  return labels[difficulty] || { text: difficulty, color: 'text-slate-400 bg-white/[0.04] border border-white/[0.06]' };
};

// Language configurations
const LANGUAGE_CONFIG = {
  python: {
    name: 'Python',
    icon: '🐍',
    defaultCode: `# Read input
n = int(input())

# Your code here

print(result)
`,
  },
  cpp: {
    name: 'C++',
    icon: '⚡',
    defaultCode: `#include <iostream>
using namespace std;

int main() {
    // Read input
    int n;
    cin >> n;
    
    // Your code here
    
    cout << result << endl;
    return 0;
}
`,
  },
  javascript: {
    name: 'JavaScript',
    icon: '🌐',
    defaultCode: `// Read input using readLine()
const n = parseInt(readLine());

// Your code here

console.log(result);
`,
  },
};

const MODULE_INFO = {
  'programming-fundamentals': { 
    name: 'Programming Fundamentals', 
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    description: 'Variables, loops, functions, arrays, and basic concepts'
  },
  'oop': { 
    name: 'Object-Oriented Programming', 
    icon: Cpu,
    color: 'from-purple-500 to-pink-500',
    description: 'Classes, inheritance, polymorphism, encapsulation'
  },
  'data-structures': { 
    name: 'Data Structures', 
    icon: Layers,
    color: 'from-orange-500 to-red-500',
    description: 'Stacks, queues, linked lists, trees, graphs'
  }
};

export default function Practice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addXP, addCoins } = useGamificationStore();
  const queryClient = useQueryClient();
  const moduleId = searchParams.get('module');
  const problemIdFromUrl = searchParams.get('problem');
  
  // Active category tab: 'cp' for competitive programming or module id
  const [activeCategory, setActiveCategory] = useState(moduleId || 'cp');
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [ratingMin, setRatingMin] = useState('');
  const [ratingMax, setRatingMax] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  
  // Code editor state
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGE_CONFIG.python.defaultCode);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState('output');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Update category when URL params change
  useEffect(() => {
    if (moduleId) {
      setActiveCategory(moduleId);
    }
  }, [moduleId]);

  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setSelectedProblem(null);
    setPage(1);
    if (category === 'cp') {
      setSearchParams({});
    } else {
      setSearchParams({ module: category });
    }
  };
  
  // Fetch module-based coding problems if a module is active
  const { data: moduleProblems, isLoading: moduleLoading } = useQuery({
    queryKey: ['module-problems', activeCategory],
    queryFn: async () => {
      const response = await api.get(`/problems/modules/${activeCategory}/coding`);
      return response.data;
    },
    enabled: activeCategory !== 'cp'
  });
  
  // Fetch CP problems if CP category is active
  const { data, isLoading, error } = useQuery({
    queryKey: ['cp-problems', page, ratingMin, ratingMax, selectedDifficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (ratingMin) params.append('rating_min', ratingMin);
      if (ratingMax) params.append('rating_max', ratingMax);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      
      const response = await api.get(`/problems/cp/problems?${params.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: activeCategory === 'cp'
  });
  
  // Fetch solved problems for completion tracking
  const { data: solvedData } = useQuery({
    queryKey: ['solved-problems'],
    queryFn: async () => {
      const response = await problemsAPI.getSolvedProblems();
      return response.data;
    },
    staleTime: 30 * 1000,
  });
  const solvedProblemIds = new Set(solvedData?.solved_problem_ids || []);
  
  // Auto-select problem from URL
  useEffect(() => {
    if (problemIdFromUrl && moduleProblems?.problems) {
      const problem = moduleProblems.problems.find(p => p.id === problemIdFromUrl);
      if (problem) {
        setSelectedProblem(problem);
      }
    }
  }, [problemIdFromUrl, moduleProblems]);
  
  // Fetch problem details
  const { data: problemData, isLoading: problemLoading } = useQuery({
    queryKey: ['problem-detail', selectedProblem?.id, activeCategory],
    queryFn: async () => {
      if (activeCategory === 'cp') {
        const response = await api.get(`/problems/cp/problems/${selectedProblem.id}`);
        return response.data;
      } else {
        const response = await api.get(`/problems/modules/coding/${selectedProblem.id}`);
        return response.data;
      }
    },
    enabled: !!selectedProblem
  });
  
  // Run code mutation
  const runCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/problems/run', {
        code,
        language,
        stdin: input
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput(data.output || 'No output');
      }
      setActiveTab('output');
    },
    onError: (error) => {
      setOutput(`Error: ${error.message}`);
      setActiveTab('output');
    }
  });
  
  // Submit solution mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const endpoint = activeCategory === 'cp' 
        ? `/problems/submit/${selectedProblem.id}`
        : `/problems/modules/submit/${selectedProblem.id}`;
      
      const response = await api.post(endpoint, {
        problem_id: selectedProblem.id,
        code,
        language
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.verdict === 'AC') {
        toast.success(`🎉 ${data.verdict_message}`);
        if (data.xp_earned && !data.already_solved) {
          addXP(data.xp_earned);
          addCoins(data.coins_earned || 0);
          toast.success(`⚡ +${data.xp_earned} XP, +${data.coins_earned || 0} coins!`);
          if (data.leveled_up) {
            toast.success(`🌟 Level Up! You're now level ${data.new_level}!`);
          }
          queryClient.invalidateQueries({ queryKey: ['gamification'] });
        } else if (data.already_solved) {
          toast(`✅ Already solved — no duplicate XP awarded`, { icon: 'ℹ️' });
        }
        queryClient.invalidateQueries({ queryKey: ['solved-problems'] });
      } else {
        toast.error(`${data.verdict}: ${data.verdict_message}`);
      }
      
      if (data.ai_suggestions) {
        setAiSuggestions(data.ai_suggestions);
      }
      
      let resultOutput = `Verdict: ${data.verdict}\n`;
      resultOutput += `${data.verdict_message}\n`;
      resultOutput += `Passed: ${data.passed_tests}/${data.total_tests} tests\n`;
      resultOutput += `Time: ${data.execution_time_ms}ms\n\n`;
      
      if (data.ai_guidance) {
        resultOutput += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        resultOutput += '🤖 AI TUTOR GUIDANCE\n';
        resultOutput += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        resultOutput += data.ai_guidance + '\n\n';
      }
      
      if (data.oop_validation) {
        resultOutput += '--- OOP Validation ---\n';
        resultOutput += `Status: ${data.oop_validation.valid ? '✓ Valid OOP' : '✗ Invalid OOP'}\n`;
        if (data.oop_validation.feedback) {
          resultOutput += `Feedback: ${data.oop_validation.feedback}\n`;
        }
        resultOutput += '\n';
      }
      
      if (data.test_results) {
        resultOutput += '--- Test Results ---\n';
        data.test_results.forEach(tr => {
          const status = tr.passed ? '✓' : '✗';
          resultOutput += `\nTest ${tr.test_number}: ${status}\n`;
          if (!tr.passed) {
            resultOutput += `Input: ${tr.input_data}\n`;
            resultOutput += `Expected: ${tr.expected_output}\n`;
            resultOutput += `Got: ${tr.actual_output || tr.error || 'N/A'}\n`;
          }
        });
      }
      
      setOutput(resultOutput);
      setActiveTab('output');
    },
    onError: (error) => {
      toast.error(`Submission failed: ${error.message}`);
      setOutput(`Error: ${error.message}`);
    }
  });

  // Reset code when language changes
  useEffect(() => {
    setCode(LANGUAGE_CONFIG[language]?.defaultCode || '');
  }, [language]);

  // Set example input when problem loads
  useEffect(() => {
    if (problemData?.examples?.[0]) {
      setInput(problemData.examples[0].input);
    }
  }, [problemData]);

  const clearFilters = () => {
    setRatingMin('');
    setRatingMax('');
    setSelectedDifficulty('');
    setSearch('');
    setPage(1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(LANGUAGE_CONFIG[language]?.defaultCode || '');
    setOutput('');
    setInput(problemData?.examples?.[0]?.input || '');
  };

  // ─── PROBLEM SOLVER VIEW ───────────────────────────────────────────
  if (selectedProblem) {
    return (
      <div className={`h-screen flex flex-col bg-[#07080f] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {/* Ambient background glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/[0.04] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-violet-600/[0.04] rounded-full blur-[120px]" />
        </div>

        {/* Top Header Bar */}
        <div className="relative flex-shrink-0">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
          <div className="bg-white/[0.04] backdrop-blur-2xl border-b border-white/[0.06] px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedProblem(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm">Back</span>
              </button>
              <div className="w-px h-5 bg-white/[0.08]" />
              <h2 className="text-white font-semibold text-sm truncate max-w-[300px]">
                {selectedProblem.name}
              </h2>
              {problemData && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyLabel(problemData.difficulty).color}`}>
                  {getDifficultyLabel(problemData.difficulty).text}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Split Pane */}
        <div className="flex flex-1 min-h-0">
          {/* ── Problem Description Panel ────────────────────────── */}
          <div className={`${isFullscreen ? 'w-2/5' : 'w-1/2'} border-r border-white/[0.06] overflow-auto`}>
            <div className="p-6">
              {problemLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : problemData ? (
                <div className="space-y-6">
                  {/* Problem Header */}
                  <div>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyLabel(problemData.difficulty).color}`}>
                        {getDifficultyLabel(problemData.difficulty).text}
                      </span>
                      {problemData.rating && (
                        <span className="text-slate-500 text-sm flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${getDifficultyColor(problemData.rating)}`} />
                          Rating: {problemData.rating}
                        </span>
                      )}
                      {activeCategory === 'oop' && (
                        <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 rounded-full text-xs border border-purple-500/20">
                          OOP Required
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">
                      {problemData.name}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                      {problemData.tags?.map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-white/[0.04] text-slate-400 rounded-xl text-xs border border-white/[0.06]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* OOP Notice */}
                  {activeCategory === 'oop' && (
                    <div className="p-4 bg-purple-500/[0.06] border border-purple-500/20 rounded-xl backdrop-blur-sm">
                      <h4 className="text-purple-300 font-medium mb-2 flex items-center gap-2">
                        <Cpu size={18} />
                        OOP Requirements
                      </h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Your solution must use proper Object-Oriented Programming concepts as described in the problem.
                        The code will be validated by AI to ensure it follows OOP principles (classes, methods, inheritance, etc.).
                        Even if the output is correct, solutions not following OOP requirements will fail.
                      </p>
                    </div>
                  )}

                  {/* Problem Description */}
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                        Description
                      </h3>
                      <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-[15px]">
                        {problemData.description}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500" />
                        Input Format
                      </h3>
                      <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-[15px]">
                        {problemData.input_format}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                        Output Format
                      </h3>
                      <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-[15px]">
                        {problemData.output_format}
                      </div>
                    </div>

                    {/* Examples */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                        Examples
                      </h3>
                      {problemData.examples?.map((example, idx) => (
                        <div key={idx} className="mb-4 bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
                          <div className="mb-3">
                            <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">Input:</span>
                            <pre className="bg-black/30 p-3 rounded-xl mt-1.5 text-slate-200 text-sm overflow-x-auto font-mono border border-white/[0.04]">
                              {example.input}
                            </pre>
                          </div>
                          <div className="mb-2">
                            <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">Output:</span>
                            <pre className="bg-black/30 p-3 rounded-xl mt-1.5 text-slate-200 text-sm overflow-x-auto font-mono border border-white/[0.04]">
                              {example.output}
                            </pre>
                          </div>
                          {example.explanation && (
                            <div className="text-slate-400 text-sm mt-3 pt-3 border-t border-white/[0.04]">
                              <span className="font-medium text-slate-300">Explanation:</span> {example.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {problemData.solution_hint && (
                      <div className="p-4 bg-indigo-500/[0.06] border border-indigo-500/20 rounded-xl backdrop-blur-sm">
                        <h4 className="text-indigo-300 font-medium mb-2 flex items-center gap-2">
                          <Lightbulb size={16} className="text-indigo-400" />
                          Hint
                        </h4>
                        <p className="text-slate-400 text-sm leading-relaxed">{problemData.solution_hint}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Code Editor Panel ────────────────────────────────── */}
          <div className={`${isFullscreen ? 'w-3/5' : 'w-1/2'} flex flex-col`}>
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                {/* Language Selector */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-white text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer appearance-none pr-8"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                >
                  {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key} className="bg-[#0d0f1a]">
                      {config.icon} {config.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all"
                  title="Copy code"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all"
                  title="Reset code"
                >
                  <RotateCcw size={16} />
                </button>
                
                <div className="w-px h-5 bg-white/[0.06] mx-1" />
                
                <button
                  onClick={() => runCodeMutation.mutate()}
                  disabled={runCodeMutation.isPending || !code.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 rounded-xl hover:bg-emerald-500/25 hover:border-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
                >
                  {runCodeMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                  Run
                </button>
                
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending || !code.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-lg shadow-indigo-500/20"
                >
                  {submitMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Submit
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 relative">
              <div className="absolute inset-0">
                <Editor
                  height="100%"
                  language={language === 'cpp' ? 'cpp' : language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    fontSize: 14,
                    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    padding: { top: 16, bottom: 16 },
                    renderLineHighlight: 'gutter',
                  }}
                />
              </div>
            </div>

            {/* I/O Panel */}
            <div className="h-48 border-t border-white/[0.06] bg-white/[0.01]">
              <div className="flex border-b border-white/[0.06] justify-between">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('output')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative ${
                      activeTab === 'output'
                        ? 'text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Terminal size={14} />
                    Output
                    {activeTab === 'output' && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('input')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative ${
                      activeTab === 'input'
                        ? 'text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Input
                    {activeTab === 'input' && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500" />
                    )}
                  </button>
                </div>
                
                {/* AI Suggestions Button */}
                {aiSuggestions && (
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-500/[0.06] transition-all animate-pulse"
                  >
                    <Lightbulb size={14} />
                    AI Suggestions
                    <Sparkles size={12} />
                  </button>
                )}
              </div>
              <div className="h-36 overflow-auto">
                {activeTab === 'output' ? (
                  <pre className={`p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed ${
                    output.includes('Error') || output.includes('✗') ? 'text-rose-400' : 
                    output.includes('✓') || output.includes('Accepted') ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {output || (
                      <span className="text-slate-600 italic">Run or submit your code to see output...</span>
                    )}
                  </pre>
                ) : (
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter input for your program..."
                    className="w-full h-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none placeholder-slate-600"
                  />
                )}
              </div>
            </div>
            
            {/* ── AI Suggestions Modal ────────────────────────────── */}
            <AnimatePresence>
              {showAiModal && aiSuggestions && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-50 flex items-center justify-center p-4"
                  onClick={() => setShowAiModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl shadow-black/40"
                  >
                    {/* Modal Header */}
                    <div className="relative border-b border-white/[0.06] p-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.06] to-orange-500/[0.06]" />
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                            <Lightbulb className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-white">AI Code Review & Suggestions</h2>
                            <p className="text-slate-500 text-sm">Powered by Groq LLM</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowAiModal(false)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] space-y-4">
                      {/* Code Review */}
                      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-3">
                          <Code className="w-4 h-4 text-blue-400" />
                          <h3 className="font-semibold text-white text-sm">Code Review</h3>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-sm">{aiSuggestions.code_review}</p>
                      </div>
                      
                      {/* Complexity Analysis */}
                      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-4 h-4 text-purple-400" />
                          <h3 className="font-semibold text-white text-sm">Complexity Analysis</h3>
                        </div>
                        <p className="text-slate-300 font-mono text-sm">{aiSuggestions.complexity_analysis}</p>
                      </div>
                      
                      {/* Improvements */}
                      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <h3 className="font-semibold text-white text-sm">Suggested Improvements</h3>
                        </div>
                        <ul className="space-y-2">
                          {aiSuggestions.improvements?.map((improvement, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Hints */}
                      <div className="bg-amber-500/[0.04] rounded-xl p-4 border border-amber-500/15">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-amber-400" />
                          <h3 className="font-semibold text-white text-sm">Hints & Tips</h3>
                        </div>
                        <ul className="space-y-2">
                          {aiSuggestions.hints?.map((hint, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                              <span className="text-amber-400 mt-0.5">💡</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Best Practices */}
                      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <h3 className="font-semibold text-white text-sm">Best Practices</h3>
                        </div>
                        <ul className="space-y-2">
                          {aiSuggestions.best_practices?.map((practice, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                              <span className="text-cyan-400 mt-0.5">✓</span>
                              <span>{practice}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // ─── PROBLEM LIST VIEW ─────────────────────────────────────────────
  const currentProblems = activeCategory === 'cp' ? data?.problems : moduleProblems?.problems;
  const currentLoading = activeCategory === 'cp' ? isLoading : moduleLoading;

  return (
    <div className="h-screen flex flex-col bg-[#07080f] overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/3 w-[700px] h-[500px] bg-indigo-600/[0.03] rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[400px] bg-violet-600/[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[300px] bg-cyan-600/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* Top Header */}
      <div className="relative flex-shrink-0">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
        <div className="bg-white/[0.04] backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="max-w-[1600px] mx-auto px-6 py-5">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-xl border border-white/[0.06]">
                    <Code size={20} className="text-indigo-400" />
                  </div>
                  Practice Problems
                </h1>
                <p className="text-slate-500 text-sm mt-1 ml-[52px]">
                  Master programming through hands-on coding challenges
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-6">

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-3">
              {/* CP Tab */}
              <button
                onClick={() => handleCategoryChange('cp')}
                className={`relative flex items-center gap-3 px-5 py-3 rounded-xl transition-all group ${
                  activeCategory === 'cp'
                    ? 'bg-white/[0.10] text-white shadow-lg shadow-amber-500/10'
                    : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 border border-white/[0.06]'
                }`}
              >
                {activeCategory === 'cp' && (
                  <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                )}
                <Trophy size={18} className={activeCategory === 'cp' ? 'text-amber-400' : ''} />
                <div className="text-left">
                  <div className="font-medium text-sm">Competitive Programming</div>
                  <div className="text-xs opacity-60">Codeforces-style problems</div>
                </div>
              </button>

              {/* Module Tabs */}
              {Object.entries(MODULE_INFO).map(([key, info]) => {
                const Icon = info.icon;
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(key)}
                    className={`relative flex items-center gap-3 px-5 py-3 rounded-xl transition-all group ${
                      isActive
                        ? 'bg-white/[0.10] text-white shadow-lg'
                        : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 border border-white/[0.06]'
                    }`}
                  >
                    {isActive && (
                      <div className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r ${info.color}`} />
                    )}
                    <Icon size={18} />
                    <div className="text-left">
                      <div className="font-medium text-sm">{info.name}</div>
                      <div className="text-xs opacity-60">{info.description.substring(0, 30)}...</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Search and Filter Bar (only for CP) */}
          {activeCategory === 'cp' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/[0.04] backdrop-blur-2xl rounded-xl p-4 mb-6 border border-white/[0.06]"
            >
              <div className="flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search problems by name..."
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all ${
                    showFilters || selectedDifficulty || ratingMin || ratingMax
                      ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300'
                      : 'bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                </button>

                {/* Clear Filters */}
                {(selectedDifficulty || ratingMin || ratingMax || search) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Expanded Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-white/[0.06]">
                      {/* Rating Range */}
                      <div className="mb-4">
                        <label className="text-xs text-slate-500 mb-2 block uppercase tracking-wider font-medium">Rating Range</label>
                        <div className="flex gap-4 items-center">
                          <input
                            type="number"
                            value={ratingMin}
                            onChange={(e) => { setRatingMin(e.target.value); setPage(1); }}
                            placeholder="Min (800)"
                            min="800"
                            max="3500"
                            step="100"
                            className="w-32 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:border-indigo-500/40 transition-all"
                          />
                          <span className="text-slate-600 text-sm">to</span>
                          <input
                            type="number"
                            value={ratingMax}
                            onChange={(e) => { setRatingMax(e.target.value); setPage(1); }}
                            placeholder="Max (3500)"
                            min="800"
                            max="3500"
                            step="100"
                            className="w-32 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:border-indigo-500/40 transition-all"
                          />
                        </div>
                      </div>

                      {/* Difficulty */}
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block uppercase tracking-wider font-medium">Difficulty</label>
                        <div className="flex flex-wrap gap-2">
                          {['easy', 'medium', 'hard', 'expert'].map(diff => (
                            <button
                              key={diff}
                              onClick={() => {
                                setSelectedDifficulty(selectedDifficulty === diff ? '' : diff);
                                setPage(1);
                              }}
                              className={`px-4 py-2 rounded-xl text-sm transition-all capitalize ${
                                selectedDifficulty === diff
                                  ? getDifficultyLabel(diff).color
                                  : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] border border-white/[0.06]'
                              }`}
                            >
                              {diff}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Module Info Banner (for module categories) */}
          {activeCategory !== 'cp' && MODULE_INFO[activeCategory] && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 relative overflow-hidden rounded-xl border border-white/[0.06]"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${MODULE_INFO[activeCategory].color} opacity-[0.08]`} />
              <div className="relative p-5">
                <div className="flex items-start gap-4">
                  {(() => {
                    const Icon = MODULE_INFO[activeCategory].icon;
                    return (
                      <div className="p-2.5 bg-white/[0.06] rounded-xl border border-white/[0.08]">
                        <Icon size={24} className="text-white/80" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">
                      {MODULE_INFO[activeCategory].name}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {MODULE_INFO[activeCategory].description}
                    </p>
                    {activeCategory === 'oop' && (
                      <p className="text-slate-300 text-xs mt-2 bg-white/[0.06] px-3 py-1.5 rounded-xl inline-block border border-white/[0.06]">
                        ⚠️ Solutions must follow proper OOP principles
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Info */}
          {activeCategory === 'cp' && data && (
            <div className="text-slate-500 text-sm mb-4">
              Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, data.total)} of {data.total} problems
            </div>
          )}

          {activeCategory !== 'cp' && moduleProblems && (
            <div className="text-slate-500 text-sm mb-4">
              {moduleProblems.total || moduleProblems.problems?.length || 0} problems available
            </div>
          )}

          {/* Problems List */}
          {currentLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          ) : (activeCategory === 'cp' && error) ? (
            <div className="bg-rose-500/[0.06] border border-rose-500/20 rounded-xl p-8 text-center backdrop-blur-sm">
              <p className="text-rose-400">Failed to load problems. Please try again later.</p>
            </div>
          ) : !currentProblems?.length ? (
            <div className="bg-white/[0.04] rounded-xl p-12 text-center border border-white/[0.06] backdrop-blur-sm">
              <div className="p-3 bg-white/[0.04] rounded-xl inline-block mb-4">
                <Search className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400">No problems found matching your criteria.</p>
              {activeCategory === 'cp' && (
                <button onClick={clearFilters} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {currentProblems.map((problem, index) => (
                <motion.div
                  key={problem.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.025 }}
                  onClick={() => setSelectedProblem(problem)}
                  className="group relative bg-white/[0.02] backdrop-blur-sm rounded-xl p-4 border border-white/[0.06] hover:bg-white/[0.05] hover:border-indigo-500/20 hover:shadow-[0_0_30px_rgba(99,102,241,0.06)] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Solved indicator */}
                    {solvedProblemIds.has(problem.id) && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.15)]" title="Solved">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    )}
                    {/* Problem Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-white font-medium truncate group-hover:text-indigo-300 transition-colors text-[15px]">
                          {problem.name}
                        </h3>
                        {problem.topic && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-md text-xs border border-blue-500/15">
                            {problem.topic}
                          </span>
                        )}
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {problem.tags?.slice(0, 5).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-white/[0.04] text-slate-500 rounded-md text-xs border border-white/[0.04]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {/* Difficulty */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyLabel(problem.difficulty).color}`}>
                        {getDifficultyLabel(problem.difficulty).text}
                      </span>
                      
                      {/* Rating (only for CP) */}
                      {problem.rating && (
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getDifficultyColor(problem.rating)} shadow-[0_0_6px_currentColor]`} />
                          <span className="text-white text-sm font-medium tabular-nums">
                            {problem.rating}
                          </span>
                        </div>
                      )}

                      <Code className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination (only for CP) */}
          {activeCategory === 'cp' && data && data.total_pages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 mt-8"
            >
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.08] transition-all text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="text-slate-500 text-sm px-4 py-2 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{data.total_pages}</span>
              </span>

              <button
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.08] transition-all text-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Difficulty Legend (only for CP) */}
          {activeCategory === 'cp' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 mb-6 bg-white/[0.02] rounded-xl p-5 border border-white/[0.06]"
            >
              <h3 className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-3">Difficulty Legend</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { rating: 800, label: 'Newbie (800-1199)' },
                  { rating: 1200, label: 'Pupil (1200-1399)' },
                  { rating: 1400, label: 'Specialist (1400-1599)' },
                  { rating: 1600, label: 'Expert (1600-1899)' },
                  { rating: 1900, label: 'Candidate Master (1900-2099)' },
                  { rating: 2100, label: 'Master (2100-2399)' },
                  { rating: 2400, label: 'Grandmaster (2400+)' },
                ].map(level => (
                  <div key={level.label} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${getDifficultyColor(level.rating)} shadow-[0_0_6px_currentColor]`} />
                    <span className="text-slate-500 text-sm">{level.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
