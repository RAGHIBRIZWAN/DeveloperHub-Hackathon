import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  ChevronRight,
  Code,
  GitBranch,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { aiAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

/* ── Module config ─────────────────────────────────── */
const MODULE_CONFIG = {
  'programming-fundamentals': {
    name: 'Programming Fundamentals',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
  },
  oop: {
    name: 'Object-Oriented Programming',
    icon: GitBranch,
    color: 'from-purple-500 to-pink-500',
  },
  'data-structures': {
    name: 'Data Structures & Algorithms',
    icon: Database,
    color: 'from-green-500 to-emerald-500',
  },
};

/* ── Component ─────────────────────────────────────── */
export default function LearnLesson() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const moduleId = searchParams.get('module') || 'programming-fundamentals';
  const config = MODULE_CONFIG[moduleId] || MODULE_CONFIG['programming-fundamentals'];
  const ModuleIcon = config.icon;

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [lessonContent, setLessonContent] = useState(null);

  /* ── Fetch topic list ───────────────────────────── */
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['learn-topics', moduleId],
    queryFn: async () => {
      const { data } = await aiAPI.getLearnTopics(moduleId);
      return data;
    },
    staleTime: Infinity,        // topics never change at runtime
    cacheTime: 1000 * 60 * 60,  // cache 1 h
  });

  /* ── Fetch lesson content ───────────────────────── */
  const lessonMutation = useMutation({
    mutationFn: async (topic) => {
      const { data } = await aiAPI.getLesson({ module_id: moduleId, topic });
      return data;
    },
    onSuccess: (data) => setLessonContent(data),
    onError: () => toast.error('Failed to load lesson'),
  });

  const handleTopicSelect = (topic) => {
    if (!topic.available) {
      toast('Coming soon!', { icon: '🔒' });
      return;
    }
    setSelectedTopic(topic);
    setLessonContent(null);
    lessonMutation.mutate(topic.name);
  };

  const topics = topicsData?.topics || [];

  /* ── Lesson view ────────────────────────────────── */
  if (selectedTopic) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Back button */}
          <button
            onClick={() => { setSelectedTopic(null); setLessonContent(null); }}
            className="flex items-center gap-2 text-white/50 hover:text-white transition mb-6"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back to topics</span>
          </button>

          {/* Topic header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{selectedTopic.name}</h1>
            <p className="text-white/40 text-sm mt-1">{config.name}</p>
          </div>

          {/* Content */}
          {lessonMutation.isPending ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-indigo-400" size={32} />
            </div>
          ) : lessonContent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-invert prose-sm sm:prose-base max-w-none
                prose-headings:text-white prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                prose-p:text-white/80 prose-p:leading-relaxed
                prose-strong:text-white
                prose-code:text-indigo-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-[#12121a] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl
                prose-table:border-collapse
                prose-th:bg-white/5 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-white/70
                prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-white/5 prose-td:text-white/60
                prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                prose-li:text-white/70"
            >
              <ReactMarkdown>{lessonContent.content}</ReactMarkdown>
            </motion.div>
          ) : null}
        </div>
      </div>
    );
  }

  /* ── Topics list view ───────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back to courses */}
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to courses</span>
        </button>

        {/* Module header */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
            <ModuleIcon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{config.name}</h1>
            <p className="text-white/40 text-sm">{topics.length} lessons</p>
          </div>
        </div>

        {/* Loading state */}
        {topicsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-white/40" size={28} />
          </div>
        ) : (
          /* Topics grid */
          <div className="space-y-2">
            {topics.map((topic, idx) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => handleTopicSelect(topic)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                  ${topic.available
                    ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 cursor-pointer'
                    : 'border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed'
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                  ${topic.available ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-white/20'}`}>
                  {idx + 1}
                </div>
                <span className="flex-1 text-left text-sm text-white/80">{topic.name}</span>
                {topic.available ? (
                  <ChevronRight size={16} className="text-white/20" />
                ) : (
                  <span className="text-[10px] text-white/20 uppercase tracking-wider">Soon</span>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
