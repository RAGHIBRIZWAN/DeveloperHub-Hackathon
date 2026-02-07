import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  BookOpen, 
  Code, 
  MessageCircle, 
  Play,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Award,
  Mic,
  Volume2,
  Sparkles,
  Terminal,
  Send
} from 'lucide-react';
import { lessonsAPI, aiAPI, codeAPI } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import { useGamificationStore } from '../stores/gamificationStore';
import toast from 'react-hot-toast';
import ttsService from '../services/ttsService';

const Lesson = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { programmingLanguage, instructionLanguage } = useSettingsStore();
  const { addXP, addCoins } = useGamificationStore();
  
  const [activeTab, setActiveTab] = useState('content');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Fetch lesson data
  const { data: lessonData, isLoading } = useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => lessonsAPI.getLesson(slug),
  });

  const lesson = lessonData?.data?.lesson;
  const progress = lessonData?.data?.progress;

  useEffect(() => {
    if (lesson?.examples?.[0]?.code) {
      setCode(lesson.examples[0].code);
    }
  }, [lesson]);

  // Start lesson when loaded
  useEffect(() => {
    if (lesson && !progress) {
      lessonsAPI.startLesson(slug).catch(console.error);
    }
  }, [lesson, progress, slug]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    
    try {
      const response = await codeAPI.runCode({
        code,
        language: programmingLanguage,
        stdin: '',
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

  const handleAskTutor = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiThinking(true);
    
    try {
      const response = await aiAPI.chat({
        message: chatInput,
        context: `Lesson: ${lesson?.title}\nCode: ${code}`,
        language: instructionLanguage,
        history: chatMessages.slice(-10),
      });
      
      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
      };
      setChatMessages(prev => [...prev, aiMessage]);
      
      // Auto-speak AI response
      handleSpeakMessage(response.data.response);
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSpeakMessage = async (text) => {
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

  const handleCompleteLesson = async () => {
    try {
      const response = await lessonsAPI.completeLesson(slug);
      const rewards = response.data.rewards;
      
      if (rewards) {
        addXP(rewards.xp);
        addCoins(rewards.coins);
        toast.success(`🎉 +${rewards.xp} XP, +${rewards.coins} coins!`);
        if (rewards.leveled_up) {
          toast.success(`🌟 Level Up! You're now level ${rewards.new_level}!`);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      
      navigate('/courses');
    } catch (error) {
      toast.error('Failed to complete lesson');
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

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <p className="text-slate-400">Lesson not found</p>
      </div>
    );
  }

  const tabs = [
    { id: 'content', icon: BookOpen, label: 'Content' },
    { id: 'code', icon: Code, label: 'Practice' },
    { id: 'tutor', icon: MessageCircle, label: 'AI Tutor' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      {/* Header with gradient accent line */}
      <div className="relative bg-white/[0.03] backdrop-blur-2xl border-b border-white/[0.06]">
        {/* Top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        
        <div className="px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/courses')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BookOpen size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-white tracking-tight">{lesson.title}</h1>
                {lesson.title_ur && (
                  <p className="text-slate-500 text-xs font-urdu">{lesson.title_ur}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Sparkles size={13} className="text-amber-400" />
              <span className="text-amber-300 text-xs font-medium">+{lesson.xp_reward} XP</span>
            </div>
            <button
              onClick={handleCompleteLesson}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02]"
            >
              <CheckCircle size={16} />
              Complete Lesson
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation - glass pill style */}
      <div className="relative bg-white/[0.02] border-b border-white/[0.06] px-6">
        <div className="flex gap-1 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="lesson-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-auto"
            >
              {/* Subtle top glow */}
              <div className="sticky top-0 h-16 bg-gradient-to-b from-[#0a0a0f] to-transparent pointer-events-none z-10" />
              
              <div className="max-w-3xl mx-auto px-6 pb-12 -mt-8">
                <div className="prose prose-invert prose-slate max-w-none
                  prose-headings:text-white prose-headings:font-semibold
                  prose-p:text-slate-300 prose-p:leading-relaxed
                  prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:text-indigo-300
                  prose-strong:text-white prose-code:text-indigo-300
                  prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
                ">
                  {lesson.content_blocks?.map((block, index) => (
                    <div key={index} className="mb-6">
                      {block.type === 'text' && (
                        <div>
                          <ReactMarkdown>{block.content}</ReactMarkdown>
                          {block.language === 'ur' && lesson.content_ur && (
                            <p className="text-slate-500 font-urdu mt-2">
                              {block.content}
                            </p>
                          )}
                        </div>
                      )}
                      {block.type === 'code' && (
                        <div className="relative group rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
                          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                          <SyntaxHighlighter
                            language={block.code_language || 'python'}
                            style={vscDarkPlus}
                            customStyle={{ background: 'transparent', margin: 0, padding: '1.25rem' }}
                          >
                            {block.content}
                          </SyntaxHighlighter>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Examples */}
                  {lesson.examples?.length > 0 && (
                    <div className="mt-10">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                        <h2 className="text-xl font-bold text-white m-0">Examples</h2>
                      </div>
                      {lesson.examples.map((example, index) => (
                        <div key={index} className="mb-8 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                          <h3 className="text-lg font-semibold text-white mb-2 mt-0">
                            {example.title}
                          </h3>
                          <p className="text-slate-400 mb-3">{example.description}</p>
                          <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                            <SyntaxHighlighter
                              language={example.language}
                              style={vscDarkPlus}
                              customStyle={{ background: 'rgba(255,255,255,0.02)', margin: 0, padding: '1rem' }}
                            >
                              {example.code}
                            </SyntaxHighlighter>
                          </div>
                          {example.expected_output && (
                            <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/[0.12]">
                              <span className="text-emerald-400/60 text-xs font-medium uppercase tracking-wider">Output</span>
                              <pre className="text-emerald-300 text-sm mt-1.5 m-0">
                                {example.expected_output}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full flex"
            >
              {/* Editor */}
              <div className="flex-1 flex flex-col">
                <div className="bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06] px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500/60" />
                    <span className="text-slate-400 text-xs font-medium tracking-wider uppercase">
                      {programmingLanguage}
                    </span>
                  </div>
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:hover:shadow-none transition-all duration-200"
                  >
                    <Play size={14} className={isRunning ? 'animate-spin' : ''} />
                    {isRunning ? 'Running...' : 'Run Code'}
                  </button>
                </div>
                <div className="flex-1 relative">
                  <div className="absolute inset-0 rounded-none overflow-hidden">
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
              </div>
              
              {/* Output Panel */}
              <div className="w-96 bg-white/[0.02] border-l border-white/[0.06] flex flex-col">
                <div className="bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-2">
                  <Terminal size={14} className="text-slate-500" />
                  <span className="text-slate-400 text-xs font-medium tracking-wider uppercase">Output</span>
                </div>
                <pre className="p-4 text-sm text-slate-300 overflow-auto flex-1 font-mono leading-relaxed">
                  {output || (
                    <span className="text-slate-600 italic">Run your code to see output here</span>
                  )}
                </pre>
              </div>
            </motion.div>
          )}

          {activeTab === 'tutor' && (
            <motion.div
              key="tutor"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {/* Chat Messages */}
              <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center mb-5">
                      <Sparkles size={28} className="text-indigo-400" />
                    </div>
                    <p className="text-slate-300 text-lg font-medium">Ask me anything about this lesson!</p>
                    <p className="font-urdu mt-2 text-slate-500">اس سبق کے بارے میں مجھ سے کچھ بھی پوچھیں!</p>
                    <div className="flex flex-wrap gap-2 mt-6 max-w-md justify-center">
                      {['Explain this concept', 'Show me an example', 'Why is this useful?'].map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => { setChatInput(prompt); }}
                          className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 text-sm hover:bg-white/[0.08] hover:text-white transition-all duration-200"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {chatMessages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xl px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-slate-200'
                    }`}>
                      <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleSpeakMessage(msg.content)}
                          className={`mt-2.5 p-1.5 rounded-lg transition-all duration-200 ${
                            isSpeaking
                              ? 'text-indigo-400 bg-indigo-500/10'
                              : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
                          }`}
                          title={isSpeaking ? "Stop speaking" : "Listen"}
                        >
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {isAiThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] px-5 py-3.5 rounded-2xl">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4">
                <div className="flex gap-2.5 max-w-3xl mx-auto">
                  <button className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-200">
                    <Mic size={18} />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskTutor()}
                      placeholder={t('ai.askQuestion')}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={handleAskTutor}
                    disabled={!chatInput.trim() || isAiThinking}
                    className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-40 disabled:hover:shadow-none transition-all duration-300 hover:scale-[1.02]"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Lesson;
