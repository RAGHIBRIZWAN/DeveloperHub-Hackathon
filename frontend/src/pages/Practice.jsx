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
  if (!rating) return 'bg-gray-500';
  if (rating < 1200) return 'bg-green-500';
  if (rating < 1400) return 'bg-cyan-500';
  if (rating < 1600) return 'bg-blue-500';
  if (rating < 1900) return 'bg-purple-500';
  if (rating < 2100) return 'bg-yellow-500';
  if (rating < 2400) return 'bg-orange-500';
  return 'bg-red-500';
};

const getDifficultyLabel = (difficulty) => {
  const labels = {
    'easy': { text: 'Easy', color: 'text-green-400 bg-green-500/20' },
    'medium': { text: 'Medium', color: 'text-yellow-400 bg-yellow-500/20' },
    'hard': { text: 'Hard', color: 'text-orange-400 bg-orange-500/20' },
    'expert': { text: 'Expert', color: 'text-red-400 bg-red-500/20' }
  };
  return labels[difficulty] || { text: difficulty, color: 'text-gray-400 bg-gray-500/20' };
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
        // CP problems use different endpoint
        const response = await api.get(`/problems/cp/problems/${selectedProblem.id}`);
        return response.data;
      } else {
        // Module coding endpoint
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
      // Use different endpoint based on problem type
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
        // Award XP and coins from backend response (skipped if already solved)
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
        // Refresh solved problems list
        queryClient.invalidateQueries({ queryKey: ['solved-problems'] });
      } else {
        toast.error(`${data.verdict}: ${data.verdict_message}`);
      }
      
      // Store AI suggestions if available
      if (data.ai_suggestions) {
        setAiSuggestions(data.ai_suggestions);
      }
      
      // Build detailed output
      let resultOutput = `Verdict: ${data.verdict}\n`;
      resultOutput += `${data.verdict_message}\n`;
      resultOutput += `Passed: ${data.passed_tests}/${data.total_tests} tests\n`;
      resultOutput += `Time: ${data.execution_time_ms}ms\n\n`;
      
      // Show AI Guidance if present
      if (data.ai_guidance) {
        resultOutput += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        resultOutput += '🤖 AI TUTOR GUIDANCE\n';
        resultOutput += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        resultOutput += data.ai_guidance + '\n\n';
      }
      
      // Show OOP validation feedback if present
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

  // If a problem is selected, show the problem solving view
  if (selectedProblem) {
    return (
      <div className={`min-h-screen bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        <div className="flex h-screen">
          {/* Problem Description Panel */}
          <div className={`${isFullscreen ? 'w-2/5' : 'w-1/2'} border-r border-gray-700 overflow-auto`}>
            <div className="p-6">
              {/* Back Button */}
              <button
                onClick={() => setSelectedProblem(null)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
              >
                <ArrowLeft size={20} />
                Back to Problems
              </button>
              
              {problemLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : problemData ? (
                <div>
                  {/* Problem Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-sm ${getDifficultyLabel(problemData.difficulty).color}`}>
                        {getDifficultyLabel(problemData.difficulty).text}
                      </span>
                      {problemData.rating && (
                        <span className="text-gray-400 text-sm">Rating: {problemData.rating}</span>
                      )}
                      {activeCategory === 'oop' && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                          OOP Required
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      {problemData.name}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                      {problemData.tags?.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-700/50 text-gray-400 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* OOP Notice */}
                  {activeCategory === 'oop' && (
                    <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <h4 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                        <Cpu size={18} />
                        OOP Requirements
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Your solution must use proper Object-Oriented Programming concepts as described in the problem.
                        The code will be validated by AI to ensure it follows OOP principles (classes, methods, inheritance, etc.).
                        Even if the output is correct, solutions not following OOP requirements will fail.
                      </p>
                    </div>
                  )}

                  {/* Problem Description */}
                  <div className="prose prose-invert max-w-none">
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <div className="text-gray-300 whitespace-pre-wrap mb-6">
                      {problemData.description}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">Input Format</h3>
                    <div className="text-gray-300 whitespace-pre-wrap mb-6">
                      {problemData.input_format}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">Output Format</h3>
                    <div className="text-gray-300 whitespace-pre-wrap mb-6">
                      {problemData.output_format}
                    </div>

                    {/* Examples */}
                    <h3 className="text-lg font-semibold text-white mb-2">Examples</h3>
                    {problemData.examples?.map((example, idx) => (
                      <div key={idx} className="mb-4 bg-gray-800/50 rounded-lg p-4">
                        <div className="mb-2">
                          <span className="text-gray-400 text-sm">Input:</span>
                          <pre className="bg-gray-900 p-2 rounded mt-1 text-gray-200 text-sm overflow-x-auto">
                            {example.input}
                          </pre>
                        </div>
                        <div className="mb-2">
                          <span className="text-gray-400 text-sm">Output:</span>
                          <pre className="bg-gray-900 p-2 rounded mt-1 text-gray-200 text-sm overflow-x-auto">
                            {example.output}
                          </pre>
                        </div>
                        {example.explanation && (
                          <div className="text-gray-400 text-sm mt-2">
                            <span className="font-medium">Explanation:</span> {example.explanation}
                          </div>
                        )}
                      </div>
                    ))}

                    {problemData.solution_hint && (
                      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <h4 className="text-blue-400 font-medium mb-2">💡 Hint</h4>
                        <p className="text-gray-300 text-sm">{problemData.solution_hint}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Code Editor Panel */}
          <div className={`${isFullscreen ? 'w-3/5' : 'w-1/2'} flex flex-col`}>
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center gap-4">
                {/* Language Selector */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-blue-500"
                >
                  {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                  title="Copy code"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                  title="Reset code"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                
                <button
                  onClick={() => runCodeMutation.mutate()}
                  disabled={runCodeMutation.isPending || !code.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50"
                >
                  {runCodeMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  Run
                </button>
                
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending || !code.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
                >
                  {submitMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Submit
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  fontSize: 14,
                  fontFamily: "'Fira Code', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>

            {/* I/O Panel */}
            <div className="h-48 border-t border-gray-700">
              <div className="flex border-b border-gray-700 justify-between">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('output')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'output'
                        ? 'text-white border-b-2 border-blue-500 bg-gray-800'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Terminal size={16} />
                    Output
                  </button>
                  <button
                    onClick={() => setActiveTab('input')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'input'
                        ? 'text-white border-b-2 border-blue-500 bg-gray-800'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Input
                  </button>
                </div>
                
                {/* AI Suggestions Button */}
                {aiSuggestions && (
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 transition-colors animate-pulse"
                  >
                    <Lightbulb size={16} />
                    AI Suggestions
                    <Sparkles size={14} />
                  </button>
                )}
              </div>
              <div className="h-36 overflow-auto">
                {activeTab === 'output' ? (
                  <pre className={`p-4 text-sm font-mono whitespace-pre-wrap ${
                    output.includes('Error') || output.includes('✗') ? 'text-red-400' : 
                    output.includes('✓') || output.includes('Accepted') ? 'text-green-400' : 'text-gray-300'
                  }`}>
                    {output || 'Run or submit your code to see output...'}
                  </pre>
                ) : (
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter input for your program..."
                    className="w-full h-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none"
                  />
                )}
              </div>
            </div>
            
            {/* AI Suggestions Modal */}
            <AnimatePresence>
              {showAiModal && aiSuggestions && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowAiModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-gray-700 shadow-2xl"
                  >
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-b border-gray-700 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-yellow-500/20 rounded-xl">
                            <Lightbulb className="w-6 h-6 text-yellow-400" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">AI Code Review & Suggestions</h2>
                            <p className="text-gray-400 text-sm">Powered by Groq LLM</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowAiModal(false)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] space-y-6">
                      {/* Code Review */}
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Code className="w-5 h-5 text-blue-400" />
                          <h3 className="font-semibold text-white">Code Review</h3>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{aiSuggestions.code_review}</p>
                      </div>
                      
                      {/* Complexity Analysis */}
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-5 h-5 text-purple-400" />
                          <h3 className="font-semibold text-white">Complexity Analysis</h3>
                        </div>
                        <p className="text-gray-300 font-mono text-sm">{aiSuggestions.complexity_analysis}</p>
                      </div>
                      
                      {/* Improvements */}
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          <h3 className="font-semibold text-white">Suggested Improvements</h3>
                        </div>
                        <ul className="space-y-2">
                          {aiSuggestions.improvements?.map((improvement, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <span className="text-green-400 mt-1">•</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Hints */}
                      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-5 h-5 text-yellow-400" />
                          <h3 className="font-semibold text-white">Hints & Tips</h3>
                        </div>
                        <ul className="space-y-2">
                          {aiSuggestions.hints?.map((hint, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <span className="text-yellow-400 mt-1">💡</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Best Practices */}
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-cyan-400" />
                          <h3 className="font-semibold text-white">Best Practices</h3>
                        </div>
                        <ul className="space-y-2">
                          {aiSuggestions.best_practices?.map((practice, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <span className="text-cyan-400 mt-1">✓</span>
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

  // Determine current problems and loading state
  const currentProblems = activeCategory === 'cp' ? data?.problems : moduleProblems?.problems;
  const currentLoading = activeCategory === 'cp' ? isLoading : moduleLoading;

  // Problem list view
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Code className="text-blue-400" />
            Practice Problems
          </h1>
          <p className="text-gray-400">
            Master programming through hands-on coding challenges
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-3">
            {/* CP Tab */}
            <button
              onClick={() => handleCategoryChange('cp')}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all ${
                activeCategory === 'cp'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/20'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
              }`}
            >
              <Trophy size={20} />
              <div className="text-left">
                <div className="font-medium">Competitive Programming</div>
                <div className="text-xs opacity-80">Codeforces-style problems</div>
              </div>
            </button>

            {/* Module Tabs */}
            {Object.entries(MODULE_INFO).map(([key, info]) => {
              const Icon = info.icon;
              return (
                <button
                  key={key}
                  onClick={() => handleCategoryChange(key)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all ${
                    activeCategory === key
                      ? `bg-gradient-to-r ${info.color} text-white shadow-lg`
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <div className="text-left">
                    <div className="font-medium">{info.name}</div>
                    <div className="text-xs opacity-80">{info.description.substring(0, 30)}...</div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Search and Filter Bar (only for CP) */}
        {activeCategory === 'cp' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700/50"
          >
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search problems by name..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                  showFilters || selectedDifficulty || ratingMin || ratingMax
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
              </button>

              {/* Clear Filters */}
              {(selectedDifficulty || ratingMin || ratingMax || search) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-5 h-5" />
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
                  <div className="pt-4 mt-4 border-t border-gray-700">
                    {/* Rating Range */}
                    <div className="mb-4">
                      <label className="text-sm text-gray-400 mb-2 block">Rating Range</label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="number"
                          value={ratingMin}
                          onChange={(e) => { setRatingMin(e.target.value); setPage(1); }}
                          placeholder="Min (800)"
                          min="800"
                          max="3500"
                          step="100"
                          className="w-32 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="number"
                          value={ratingMax}
                          onChange={(e) => { setRatingMax(e.target.value); setPage(1); }}
                          placeholder="Max (3500)"
                          min="800"
                          max="3500"
                          step="100"
                          className="w-32 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                        />
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Difficulty</label>
                      <div className="flex flex-wrap gap-2">
                        {['easy', 'medium', 'hard', 'expert'].map(diff => (
                          <button
                            key={diff}
                            onClick={() => {
                              setSelectedDifficulty(selectedDifficulty === diff ? '' : diff);
                              setPage(1);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors capitalize ${
                              selectedDifficulty === diff
                                ? getDifficultyLabel(diff).color
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 bg-gradient-to-r ${MODULE_INFO[activeCategory].color} rounded-xl p-6`}
          >
            <div className="flex items-start gap-4">
              {(() => {
                const Icon = MODULE_INFO[activeCategory].icon;
                return <Icon size={32} className="text-white/80" />;
              })()}
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {MODULE_INFO[activeCategory].name}
                </h2>
                <p className="text-white/80">
                  {MODULE_INFO[activeCategory].description}
                </p>
                {activeCategory === 'oop' && (
                  <p className="text-white/90 text-sm mt-2 bg-white/10 px-3 py-1 rounded inline-block">
                    ⚠️ Solutions must follow proper OOP principles
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Info */}
        {activeCategory === 'cp' && data && (
          <div className="text-gray-400 text-sm mb-4">
            Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, data.total)} of {data.total} problems
          </div>
        )}

        {activeCategory !== 'cp' && moduleProblems && (
          <div className="text-gray-400 text-sm mb-4">
            {moduleProblems.total || moduleProblems.problems?.length || 0} problems available
          </div>
        )}

        {/* Problems List */}
        {currentLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (activeCategory === 'cp' && error) ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
            <p className="text-red-400">Failed to load problems. Please try again later.</p>
          </div>
        ) : !currentProblems?.length ? (
          <div className="bg-gray-800/50 rounded-xl p-10 text-center">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No problems found matching your criteria.</p>
            {activeCategory === 'cp' && (
              <button onClick={clearFilters} className="mt-4 text-primary hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {currentProblems.map((problem, index) => (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedProblem(problem)}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Solved indicator */}
                  {solvedProblemIds.has(problem.id) && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center" title="Solved">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  {/* Problem Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-medium truncate group-hover:text-primary transition-colors">
                        {problem.name}
                      </h3>
                      {problem.topic && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {problem.topic}
                        </span>
                      )}
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {problem.tags?.slice(0, 5).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Difficulty */}
                    <span className={`px-3 py-1 rounded-full text-xs ${getDifficultyLabel(problem.difficulty).color}`}>
                      {getDifficultyLabel(problem.difficulty).text}
                    </span>
                    
                    {/* Rating (only for CP) */}
                    {problem.rating && (
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getDifficultyColor(problem.rating)}`} />
                        <span className="text-white text-sm font-medium">
                          {problem.rating}
                        </span>
                      </div>
                    )}

                    <Code className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
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
            className="flex items-center justify-center gap-4 mt-8"
          >
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <span className="text-gray-400">
              Page {page} of {data.total_pages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
              disabled={page === data.total_pages}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Difficulty Legend (only for CP) */}
        {activeCategory === 'cp' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 bg-gray-800/30 rounded-xl p-4 border border-gray-700/50"
          >
            <h3 className="text-gray-400 text-sm mb-3">Difficulty Legend</h3>
            <div className="flex flex-wrap gap-4">
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
                  <div className={`w-3 h-3 rounded-full ${getDifficultyColor(level.rating)}`} />
                  <span className="text-gray-400 text-sm">{level.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
