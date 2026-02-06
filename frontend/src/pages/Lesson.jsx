import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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
  Volume2
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
  
  const [activeTab, setActiveTab] = useState('content'); // content, code, quiz
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
        // Update gamification store immediately for responsive UI
        addXP(rewards.xp);
        addCoins(rewards.coins);
        toast.success(`🎉 +${rewards.xp} XP, +${rewards.coins} coins!`);
        if (rewards.leveled_up) {
          toast.success(`🌟 Level Up! You're now level ${rewards.new_level}!`);
        }
      }
      
      // Invalidate cached queries so sidebar/dashboard reflect new data
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      
      navigate('/courses');
    } catch (error) {
      toast.error('Failed to complete lesson');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Lesson not found</p>
      </div>
    );
  }

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
              <h1 className="text-lg font-bold text-white">{lesson.title}</h1>
              {lesson.title_ur && (
                <p className="text-gray-400 text-sm font-urdu">{lesson.title_ur}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-yellow-400 text-sm">+{lesson.xp_reward} XP</span>
            <button
              onClick={handleCompleteLesson}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
            >
              <CheckCircle size={18} />
              Complete Lesson
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex gap-4">
          {[
            { id: 'content', icon: BookOpen, label: 'Content' },
            { id: 'code', icon: Code, label: 'Practice' },
            { id: 'tutor', icon: MessageCircle, label: 'AI Tutor' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'content' && (
          <div className="h-full overflow-auto p-6">
            <div className="max-w-3xl mx-auto prose prose-invert">
              {lesson.content_blocks?.map((block, index) => (
                <div key={index} className="mb-6">
                  {block.type === 'text' && (
                    <div>
                      <ReactMarkdown>{block.content}</ReactMarkdown>
                      {block.language === 'ur' && lesson.content_ur && (
                        <p className="text-gray-400 font-urdu mt-2">
                          {block.content}
                        </p>
                      )}
                    </div>
                  )}
                  {block.type === 'code' && (
                    <SyntaxHighlighter
                      language={block.code_language || 'python'}
                      style={vscDarkPlus}
                      className="rounded-lg"
                    >
                      {block.content}
                    </SyntaxHighlighter>
                  )}
                </div>
              ))}
              
              {/* Examples */}
              {lesson.examples?.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-white mb-4">Examples</h2>
                  {lesson.examples.map((example, index) => (
                    <div key={index} className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {example.title}
                      </h3>
                      <p className="text-gray-400 mb-2">{example.description}</p>
                      <SyntaxHighlighter
                        language={example.language}
                        style={vscDarkPlus}
                        className="rounded-lg"
                      >
                        {example.code}
                      </SyntaxHighlighter>
                      {example.expected_output && (
                        <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                          <span className="text-gray-500 text-sm">Output:</span>
                          <pre className="text-green-400 text-sm mt-1">
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
        )}

        {activeTab === 'code' && (
          <div className="h-full flex">
            {/* Editor */}
            <div className="flex-1 flex flex-col">
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  {programmingLanguage.toUpperCase()}
                </span>
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
                >
                  <Play size={16} />
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
              </div>
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
            </div>
            
            {/* Output */}
            <div className="w-96 bg-gray-900 border-l border-gray-700">
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
                <span className="text-gray-400 text-sm">Output</span>
              </div>
              <pre className="p-4 text-sm text-gray-300 overflow-auto h-full">
                {output || 'Run your code to see output here'}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'tutor' && (
          <div className="h-full flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Ask me anything about this lesson!</p>
                  <p className="font-urdu mt-2">اس سبق کے بارے میں مجھ سے کچھ بھی پوچھیں!</p>
                </div>
              )}
              
              {chatMessages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xl p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-200'
                  }`}>
                    <p>{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleSpeakMessage(msg.content)}
                        className="mt-2 p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title={isSpeaking ? "Stop speaking" : "Listen"}
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isAiThinking && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 p-4 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="border-t border-gray-700 p-4">
              <div className="flex gap-2">
                <button className="p-3 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700">
                  <Mic size={20} />
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskTutor()}
                  placeholder={t('ai.askQuestion')}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAskTutor}
                  disabled={!chatInput.trim() || isAiThinking}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lesson;
