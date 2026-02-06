import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Loader2,
  Bot,
  User,
  Sparkles
} from 'lucide-react';
import { aiAPI } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import toast from 'react-hot-toast';
import ttsService from '../services/ttsService';

const AITutor = ({
  context = '',
  lessonTitle = '',
  onClose,
  isOpen = true,
}) => {
  const { t, i18n } = useTranslation();
  const { instructionLanguage, voiceTutor } = useSettingsStore();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = instructionLanguage === 'ur'
        ? `السلام علیکم! میں آپ کا AI ٹیوٹر ہوں۔ ${lessonTitle ? `آپ "${lessonTitle}" سیکھ رہے ہیں۔` : ''} مجھ سے کوئی بھی سوال پوچھیں!`
        : `Hello! I'm your AI tutor. ${lessonTitle ? `You're learning "${lessonTitle}".` : ''} Feel free to ask me anything!`;
      
      setMessages([{
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      }]);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await aiAPI.chat({
        message: input,
        context: context,
        language: instructionLanguage,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      });
      
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-speak if voice tutor is enabled
      if (voiceTutor) {
        await handleSpeak(response.data.response);
      }
    } catch (error) {
      toast.error('Failed to get response');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text) => {
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
          toast.error('Voice playback failed');
        }
      });
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Transcribe audio
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob);
          formData.append('language', instructionLanguage);
          
          const response = await aiAPI.speechToText(formData);
          setInput(response.data.text);
        } catch (error) {
          toast.error('Failed to transcribe audio');
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`fixed bottom-4 right-4 z-50 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden ${
        isMinimized ? 'w-16 h-16' : 'w-96 h-[500px]'
      } transition-all duration-300`}
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 hover:opacity-90"
        >
          <Bot size={28} className="text-white" />
        </button>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI Tutor</h3>
                <p className="text-blue-100 text-xs">
                  {instructionLanguage === 'ur' ? 'اردو' : 'English'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded"
              >
                <MessageCircle size={16} />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 h-[360px] overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-200'
                  } rounded-2xl px-4 py-2`}>
                    <p className={`text-sm ${
                      instructionLanguage === 'ur' && message.role === 'assistant' 
                        ? 'font-urdu text-right' 
                        : ''
                    }`}>
                      {message.content}
                    </p>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => handleSpeak(message.content)}
                        disabled={isSpeaking}
                        className="mt-1 p-1 text-gray-400 hover:text-white"
                      >
                        {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-lg transition-colors ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={instructionLanguage === 'ur' ? 'سوال پوچھیں...' : 'Ask a question...'}
                className="flex-1 bg-gray-700 border-none rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default AITutor;
