import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  Clock, 
  Star, 
  ChevronRight,
  Check,
  Play,
  Code,
  GitBranch,
  Database,
  Trophy,
  Target,
  FileQuestion,
  GraduationCap,
  Swords,
  ArrowLeft,
  Sparkles,
  Zap
} from 'lucide-react';
import { lessonsAPI } from '../services/api';
import api from '../services/api';
import PageBackground from '../components/ui/PageBackground';

// ─── Module definitions ────────────────────────────────────────────────
const MODULES = [
  {
    id: 'programming-fundamentals',
    name: 'Programming Fundamentals',
    description: 'Master the basics of programming with variables, loops, conditions, and functions.',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    accentHex: '#3b82f6',
    glowColor: 'shadow-blue-500/25',
    ringColor: 'ring-blue-500/20',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    topics: ['Variables & Data Types', 'Operators', 'Control Flow', 'Loops', 'Functions', 'Arrays'],
    totalLessons: 24,
  },
  {
    id: 'oop',
    name: 'Object-Oriented Programming',
    description: 'Learn classes, objects, inheritance, polymorphism and encapsulation.',
    icon: GitBranch,
    color: 'from-purple-500 to-pink-500',
    accentHex: '#a855f7',
    glowColor: 'shadow-purple-500/25',
    ringColor: 'ring-purple-500/20',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    topics: ['Classes & Objects', 'Constructors', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'],
    totalLessons: 18,
  },
  {
    id: 'data-structures',
    name: 'Data Structures',
    description: 'Understand arrays, linked lists, trees, graphs, and more.',
    icon: Database,
    color: 'from-green-500 to-emerald-500',
    accentHex: '#22c55e',
    glowColor: 'shadow-green-500/25',
    ringColor: 'ring-green-500/20',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    topics: ['Arrays & Strings', 'Linked Lists', 'Stacks & Queues', 'Trees', 'Graphs', 'Hash Tables'],
    totalLessons: 22,
  },
  {
    id: 'competitive-programming',
    name: 'Competitive Programming',
    description: 'Advanced algorithms and problem-solving techniques for contests.',
    icon: Trophy,
    color: 'from-yellow-500 to-orange-500',
    accentHex: '#eab308',
    glowColor: 'shadow-yellow-500/25',
    ringColor: 'ring-yellow-500/20',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    topics: ['Sorting & Searching', 'Dynamic Programming', 'Greedy Algorithms', 'Graph Algorithms', 'Number Theory', 'Bit Manipulation'],
    totalLessons: 30,
  }
];

// ─── Learning modes ────────────────────────────────────────────────────
const MODES = [
  {
    id: 'practice',
    name: 'Practice',
    description: 'Learn concepts with guided lessons',
    icon: Target,
    color: 'from-blue-500 to-blue-600',
    accentHex: '#3b82f6',
    glowColor: 'shadow-blue-500/30',
    route: 'lesson'
  },
  {
    id: 'quiz',
    name: 'Quiz',
    description: 'Test your knowledge with MCQs',
    icon: FileQuestion,
    color: 'from-purple-500 to-purple-600',
    accentHex: '#a855f7',
    glowColor: 'shadow-purple-500/30',
    route: 'quiz'
  },
  {
    id: 'exam',
    name: 'Exam',
    description: 'Take a proctored assessment',
    icon: GraduationCap,
    color: 'from-green-500 to-green-600',
    accentHex: '#22c55e',
    glowColor: 'shadow-green-500/30',
    route: 'exam'
  },
  {
    id: 'contest',
    name: 'Contest',
    description: 'Compete with other learners',
    icon: Swords,
    color: 'from-yellow-500 to-orange-500',
    accentHex: '#eab308',
    glowColor: 'shadow-yellow-500/30',
    route: 'contest'
  }
];

// ─── Animation variants ────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

// ─── Difficulty config ─────────────────────────────────────────────────
const difficultyConfig = {
  beginner: { label: 'Easy', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' },
  easy: { label: 'Easy', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' },
  intermediate: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/20', glow: 'shadow-yellow-500/20' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/20', glow: 'shadow-yellow-500/20' },
  advanced: { label: 'Hard', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', glow: 'shadow-red-500/20' },
  hard: { label: 'Hard', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', glow: 'shadow-red-500/20' },
};

const getDifficultyStyle = (d) => difficultyConfig[d] || difficultyConfig.easy;

// ═══════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════
const Courses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);

  // Fetch per-module progress
  const { data: moduleProgressData } = useQuery({
    queryKey: ['moduleProgress'],
    queryFn: () => lessonsAPI.getModuleProgress(),
  });
  const moduleProgress = moduleProgressData?.data?.module_progress || {};

  // Handle URL params for direct navigation (from Dashboard)
  useEffect(() => {
    const moduleParam = searchParams.get('module');
    const modeParam = searchParams.get('mode');
    
    if (moduleParam) {
      const module = MODULES.find(m => m.id === moduleParam);
      if (module) {
        setSelectedModule(module);
        if (modeParam) {
          const mode = MODES.find(m => m.id === modeParam);
          if (mode) {
            setSelectedMode(mode);
          }
        }
      }
    }
  }, [searchParams]);

  // Fetch lessons/problems for selected module and mode
  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', selectedModule?.id, selectedMode?.id],
    queryFn: async () => {
      // For Practice mode on PF, OOP, DSA modules, fetch coding problems
      if (selectedMode?.id === 'practice' && ['programming-fundamentals', 'oop', 'data-structures'].includes(selectedModule?.id)) {
        const response = await api.get(`/problems/modules/${selectedModule.id}/coding`);
        return { data: { lessons: response.data.problems.map(p => ({
          id: p.id,
          title: p.name,
          slug: p.id,
          difficulty: p.difficulty,
          estimated_minutes: 15,
          xp_reward: 50,
          completed: false,
          type: 'coding'
        })) }};
      }
      // For Quiz mode on PF, OOP, DSA modules, fetch MCQs
      if (selectedMode?.id === 'quiz' && ['programming-fundamentals', 'oop', 'data-structures'].includes(selectedModule?.id)) {
        const response = await api.get(`/problems/modules/${selectedModule.id}/mcqs`);
        return { data: { lessons: response.data.questions.map(mcq => ({
          id: mcq.id,
          title: mcq.question,
          slug: mcq.id,
          difficulty: mcq.difficulty,
          estimated_minutes: 2,
          xp_reward: 10,
          completed: false,
          type: 'mcq'
        })) }};
      }
      // For Exam mode, just redirect or show message
      if (selectedMode?.id === 'exam') {
        return { data: { lessons: [] }};
      }
      // Otherwise, fetch regular lessons
      return lessonsAPI.getLessons({ 
        course_id: selectedModule?.id, 
        mode: selectedMode?.id 
      });
    },
    enabled: !!selectedModule && !!selectedMode,
  });

  const lessons = lessonsData?.data?.lessons || [];

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    if (mode.id === 'contest') {
      navigate('/compete');
    } else if (mode.id === 'practice') {
      // For competitive programming, redirect to Practice page with CP problems
      if (selectedModule?.id === 'competitive-programming') {
        navigate('/practice'); // Default to 'cp' category
      } else if (['programming-fundamentals', 'oop', 'data-structures'].includes(selectedModule?.id)) {
        // For other modules, redirect to Practice page with module parameter
        navigate(`/practice?module=${selectedModule.id}`);
      }
    } else if (mode.id === 'exam' && ['programming-fundamentals', 'oop', 'data-structures'].includes(selectedModule?.id)) {
      navigate(`/exam?module=${selectedModule.id}`);
    }
  };

  const handleBack = () => {
    if (selectedMode) {
      setSelectedMode(null);
    } else if (selectedModule) {
      setSelectedModule(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen">
      <PageBackground />

      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* MODULE SELECTION                                           */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {!selectedModule ? (
            <motion.div
              key="modules"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Heading */}
              <motion.div variants={cardVariants} className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                    Learning Modules
                  </h1>
                </div>
                <p className="text-slate-400 text-lg ml-[52px]">
                  Choose a module and start your learning journey
                </p>
              </motion.div>

              {/* Module grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {MODULES.map((module) => {
                  const IconComponent = module.icon;
                  const modProgress = moduleProgress[module.id]?.progress || 0;
                  return (
                    <motion.div
                      key={module.id}
                      variants={cardVariants}
                      onClick={() => setSelectedModule(module)}
                      whileHover={{ scale: 1.025, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative overflow-hidden cursor-pointer bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl transition-shadow duration-500 hover:shadow-2xl hover:border-white/[0.12]"
                    >
                      {/* ── Gradient accent line on top ── */}
                      <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${module.color} opacity-60 group-hover:opacity-100 transition-opacity`} />

                      {/* ── Hover glow background ── */}
                      <div
                        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                        style={{
                          background: `radial-gradient(600px circle at 50% 50%, ${module.accentHex}08, transparent 40%)`,
                        }}
                      />

                      {/* ── Corner glow orb ── */}
                      <div
                        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"
                        style={{ background: module.accentHex }}
                      />

                      <div className="relative z-10 p-6">
                        {/* Header row */}
                        <div className="flex items-start justify-between mb-5">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center ring-1 transition-all duration-300 group-hover:shadow-lg"
                            style={{
                              background: `${module.accentHex}15`,
                              boxShadow: `0 0 0 1px ${module.accentHex}20`,
                            }}
                          >
                            <IconComponent
                              className="w-7 h-7 transition-transform duration-300 group-hover:scale-110"
                              style={{ color: module.accentHex }}
                            />
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] group-hover:border-white/[0.1] transition-all">
                            <ChevronRight size={16} className="text-slate-500 group-hover:text-white/70 transition-colors group-hover:translate-x-0.5 transform duration-300" />
                          </div>
                        </div>

                        {/* Title & description */}
                        <h3 className="text-xl font-bold text-white mb-1.5 group-hover:text-white transition-colors">
                          {module.name}
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-5">
                          {module.description}
                        </p>

                        {/* Topic pills */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {module.topics.slice(0, 4).map((topic, i) => (
                            <span
                              key={i}
                              className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 group-hover:text-white/55 group-hover:border-white/[0.1] transition-all"
                            >
                              {topic}
                            </span>
                          ))}
                          {module.topics.length > 4 && (
                            <span className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-500">
                              +{module.topics.length - 4} more
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full bg-gradient-to-r ${module.color} rounded-full`}
                              initial={{ width: 0 }}
                              animate={{ width: `${modProgress}%` }}
                              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500 tabular-nums min-w-[32px] text-right">
                            {modProgress}%
                          </span>
                        </div>

                        {/* Footer stats */}
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <BookOpen size={13} />
                            {module.totalLessons} lessons
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

          ) : !selectedMode ? (
            /* ═══════════════════════════════════════════════════════════ */
            /* MODE SELECTION                                             */
            /* ═══════════════════════════════════════════════════════════ */
            <motion.div
              key="modes"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Back button */}
              <motion.button
                variants={cardVariants}
                onClick={handleBack}
                className="group flex items-center gap-2.5 text-slate-500 hover:text-white mb-8 transition-colors duration-300"
              >
                <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] group-hover:border-white/[0.1] transition-all">
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transform transition-transform" />
                </div>
                <span className="text-sm font-medium">Back to Modules</span>
              </motion.button>

              {/* Module header card */}
              <motion.div
                variants={cardVariants}
                className="relative overflow-hidden bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 mb-8"
              >
                {/* Top accent line */}
                <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${selectedModule.color}`} />
                {/* Glow orb */}
                <div
                  className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ background: selectedModule.accentHex }}
                />

                <div className="relative z-10 flex items-center gap-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center ring-1 shadow-lg"
                    style={{
                      background: `${selectedModule.accentHex}15`,
                      boxShadow: `0 8px 32px ${selectedModule.accentHex}20`,
                      ringColor: `${selectedModule.accentHex}20`,
                    }}
                  >
                    <selectedModule.icon
                      size={30}
                      style={{ color: selectedModule.accentHex }}
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                      {selectedModule.name}
                    </h1>
                    <p className="text-slate-500 mt-1">Select a learning mode</p>
                  </div>
                </div>
              </motion.div>

              {/* Mode cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {MODES
                  .filter(mode => {
                    // For competitive programming: show only Practice and Contest
                    if (selectedModule?.id === 'competitive-programming') {
                      return mode.id === 'practice' || mode.id === 'contest';
                    }
                    // For other modules: show Practice, Quiz, Exam (no Contest)
                    return mode.id !== 'contest';
                  })
                  .map((mode) => {
                  const IconComponent = mode.icon;
                  return (
                    <motion.div
                      key={mode.id}
                      variants={cardVariants}
                      whileHover={{ scale: 1.04, y: -6 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleModeSelect(mode)}
                      className="group relative overflow-hidden cursor-pointer text-center bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 transition-shadow duration-500 hover:shadow-2xl hover:border-white/[0.12]"
                    >
                      {/* Top accent line */}
                      <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${mode.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                      {/* Glow orb */}
                      <div
                        className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none"
                        style={{ background: mode.accentHex }}
                      />

                      <div className="relative z-10">
                        <div
                          className={`w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg`}
                          style={{ boxShadow: `0 8px 32px ${mode.accentHex}30` }}
                        >
                          <IconComponent className="text-white" size={26} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1.5">
                          {mode.name}
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                          {mode.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

          ) : (
            /* ═══════════════════════════════════════════════════════════ */
            /* LESSONS VIEW                                               */
            /* ═══════════════════════════════════════════════════════════ */
            <motion.div
              key="lessons"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Back button */}
              <motion.button
                variants={cardVariants}
                onClick={handleBack}
                className="group flex items-center gap-2.5 text-slate-500 hover:text-white mb-8 transition-colors duration-300"
              >
                <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] group-hover:border-white/[0.1] transition-all">
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transform transition-transform" />
                </div>
                <span className="text-sm font-medium">Back to Modes</span>
              </motion.button>

              {/* Section header */}
              <motion.div variants={cardVariants} className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                    {selectedModule.name}
                    <span className="text-white/20 mx-3">&middot;</span>
                    <span
                      className="bg-clip-text text-transparent"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${selectedMode.accentHex}, ${selectedMode.accentHex}99)`,
                      }}
                    >
                      {selectedMode.name}
                    </span>
                  </h1>
                  <p className="text-slate-500 mt-1.5">
                    {lessonsLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      `${lessons.length} items available`
                    )}
                  </p>
                </div>
              </motion.div>

              {/* Lessons list */}
              {lessonsLoading ? (
                <motion.div variants={cardVariants} className="flex justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-slate-600 text-sm">Loading content...</span>
                  </div>
                </motion.div>
              ) : lessons.length > 0 ? (
                <div className="space-y-3">
                  {lessons.map((lesson) => {
                    const diff = getDifficultyStyle(lesson.difficulty);
                    return (
                      <motion.div
                        key={lesson.id}
                        variants={cardVariants}
                      >
                        <Link
                          to={
                            lesson.type === 'coding'
                              ? `/practice?module=${selectedModule.id}&problem=${lesson.id}`
                              : lesson.type === 'mcq'
                              ? `/quiz?module=${selectedModule.id}&mcq=${lesson.id}`
                              : `/${selectedMode.route}/${lesson.slug}`
                          }
                          className="group relative flex items-center gap-4 p-4 lg:p-5 bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.1] hover:shadow-lg hover:shadow-black/10 hover:scale-[1.01]"
                        >
                          {/* Left accent line */}
                          <div
                            className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: `linear-gradient(to bottom, ${selectedModule.accentHex}, transparent)` }}
                          />

                          {/* Status icon */}
                          <div
                            className={`
                              relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                              transition-all duration-300 group-hover:scale-105
                              ${lesson.completed
                                ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
                                : 'bg-white/[0.04] ring-1 ring-white/[0.06] group-hover:ring-white/[0.1]'
                              }
                            `}
                          >
                            {lesson.completed ? (
                              <>
                                <Check className="text-emerald-400" size={18} />
                                {/* Completion glow */}
                                <div className="absolute inset-0 rounded-xl bg-emerald-500/10 blur-md opacity-60" />
                              </>
                            ) : (
                              <Play className="text-slate-400 group-hover:text-white/70 transition-colors" size={16} />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white/80 font-medium group-hover:text-white transition-colors truncate">
                              {lesson.title}
                            </h3>
                            {lesson.title_ur && (
                              <span className="text-white/20 text-sm font-urdu">
                                {lesson.title_ur}
                              </span>
                            )}
                          </div>

                          {/* Meta info */}
                          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                            {/* Duration */}
                            <span className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Clock size={12} />
                              {lesson.estimated_minutes}m
                            </span>

                            {/* Difficulty badge */}
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-medium ${diff.bg} ${diff.color} ${diff.border} border backdrop-blur-sm`}>
                              {diff.label}
                            </span>

                            {/* XP reward */}
                            <span className="flex items-center gap-1 text-xs font-medium text-yellow-400/70">
                              <Zap size={12} className="text-yellow-400/50" />
                              +{lesson.xp_reward} XP
                            </span>
                          </div>

                          {/* Arrow */}
                          <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.05] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.06] group-hover:border-white/[0.1] transition-all">
                            <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transform transition-all" />
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* Empty state */
                <motion.div
                  variants={cardVariants}
                  className="relative overflow-hidden text-center py-16 bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.06]"
                >
                  {/* Subtle glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl bg-indigo-500/5 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <BookOpen size={28} className="text-white/15" />
                    </div>
                    <h3 className="text-lg font-semibold text-white/60 mb-2">
                      No Content Yet
                    </h3>
                    <p className="text-slate-600 max-w-sm mx-auto">
                      Content for this section is coming soon!
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Courses;
