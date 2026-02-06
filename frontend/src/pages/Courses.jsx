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
  ArrowLeft
} from 'lucide-react';
import { lessonsAPI } from '../services/api';
import api from '../services/api';

// New module definitions
const MODULES = [
  {
    id: 'programming-fundamentals',
    name: 'Programming Fundamentals',
    description: 'Master the basics of programming with variables, loops, conditions, and functions.',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
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
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    topics: ['Sorting & Searching', 'Dynamic Programming', 'Greedy Algorithms', 'Graph Algorithms', 'Number Theory', 'Bit Manipulation'],
    totalLessons: 30,
  }
];

// Learning modes
const MODES = [
  {
    id: 'practice',
    name: 'Practice',
    description: 'Learn concepts with guided lessons',
    icon: Target,
    color: 'from-blue-500 to-blue-600',
    route: 'lesson'
  },
  {
    id: 'quiz',
    name: 'Quiz',
    description: 'Test your knowledge with MCQs',
    icon: FileQuestion,
    color: 'from-purple-500 to-purple-600',
    route: 'quiz'
  },
  {
    id: 'exam',
    name: 'Exam',
    description: 'Take a proctored assessment',
    icon: GraduationCap,
    color: 'from-green-500 to-green-600',
    route: 'exam'
  },
  {
    id: 'contest',
    name: 'Contest',
    description: 'Compete with other learners',
    icon: Swords,
    color: 'from-yellow-500 to-orange-500',
    route: 'contest'
  }
];

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
    } else if (mode.id === 'practice' && ['programming-fundamentals', 'oop', 'data-structures'].includes(selectedModule?.id)) {
      // Redirect to Practice page with module ID
      navigate(`/practice?module=${selectedModule.id}`);
    } else if (mode.id === 'exam' && ['programming-fundamentals', 'oop', 'data-structures'].includes(selectedModule?.id)) {
      // Redirect to exam page with module ID
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

  return (
    <div className="p-6 min-h-screen">
      <AnimatePresence mode="wait">
        {/* Module Selection View */}
        {!selectedModule ? (
          <motion.div
            key="modules"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Learning Modules
              </h1>
              <p className="text-gray-400">
                Choose a module and start your learning journey
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {MODULES.map((module, index) => {
                const IconComponent = module.icon;
                const modProgress = moduleProgress[module.id]?.progress || 0;
                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedModule(module)}
                    className={`relative overflow-hidden bg-gray-800/50 border ${module.borderColor} rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-all group`}
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 ${module.bgColor} rounded-xl flex items-center justify-center`}>
                          <IconComponent 
                            className="w-7 h-7" 
                            style={{color: module.color.includes('blue') ? '#3b82f6' : module.color.includes('purple') ? '#a855f7' : module.color.includes('green') ? '#22c55e' : '#eab308'}} 
                          />
                        </div>
                        <ChevronRight className="text-gray-500 group-hover:text-white transition-colors" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-white mb-1">
                        {module.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        {module.description}
                      </p>

                      {/* Topics */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {module.topics.slice(0, 4).map((topic, i) => (
                          <span 
                            key={i}
                            className="text-xs px-2 py-1 bg-gray-700/50 rounded-full text-gray-300"
                          >
                            {topic}
                          </span>
                        ))}
                        {module.topics.length > 4 && (
                          <span className="text-xs px-2 py-1 bg-gray-700/50 rounded-full text-gray-400">
                            +{module.topics.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${module.color} rounded-full transition-all`}
                            style={{ width: `${modProgress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">{modProgress}%</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen size={16} />
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
          /* Mode Selection View */
          <motion.div
            key="modes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Modules</span>
            </button>

            {/* Module Header */}
            <div className={`${selectedModule.bgColor} border ${selectedModule.borderColor} rounded-2xl p-6 mb-8`}>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center`}>
                  <selectedModule.icon 
                    size={32} 
                    style={{color: selectedModule.color.includes('blue') ? '#3b82f6' : selectedModule.color.includes('purple') ? '#a855f7' : selectedModule.color.includes('green') ? '#22c55e' : '#eab308'}}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {selectedModule.name}
                  </h1>
                  <p className="text-gray-400">
                    Select a learning mode
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MODES
                // Filter out 'contest' mode for non-CP modules
                .filter(mode => {
                  if (mode.id === 'contest' && selectedModule?.id !== 'competitive-programming') {
                    return false;
                  }
                  return true;
                })
                .map((mode, index) => {
                const IconComponent = mode.icon;
                return (
                  <motion.div
                    key={mode.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleModeSelect(mode)}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-6 cursor-pointer hover:border-gray-500 hover:scale-[1.02] transition-all text-center group"
                  >
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComponent className="text-white" size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {mode.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {mode.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* Lessons View */
          <motion.div
            key="lessons"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Modes</span>
            </button>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {selectedModule.name} - {selectedMode.name}
                </h1>
                <p className="text-gray-400">
                  {lessonsLoading ? 'Loading...' : `${lessons.length} items available`}
                </p>
              </div>
            </div>

            {/* Lessons List */}
            {lessonsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : lessons.length > 0 ? (
              <div className="space-y-3">
                {lessons.map((lesson, index) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={
                        lesson.type === 'coding' 
                          ? `/practice?module=${selectedModule.id}&problem=${lesson.id}`
                          : lesson.type === 'mcq'
                          ? `/quiz?module=${selectedModule.id}&mcq=${lesson.id}`
                          : `/${selectedMode.route}/${lesson.slug}`
                      }
                      className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        lesson.completed 
                          ? 'bg-green-500/20' 
                          : 'bg-blue-500/20'
                      }`}>
                        {lesson.completed ? (
                          <Check className="text-green-400" size={20} />
                        ) : (
                          <Play className="text-blue-400" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{lesson.title}</h3>
                        {lesson.title_ur && (
                          <span className="text-gray-500 text-sm font-urdu">
                            {lesson.title_ur}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {lesson.estimated_minutes}m
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          lesson.difficulty === 'beginner' 
                            ? 'bg-green-500/20 text-green-400'
                            : lesson.difficulty === 'intermediate'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {lesson.difficulty}
                        </span>
                        <span className="text-yellow-400">
                          +{lesson.xp_reward} XP
                        </span>
                      </div>
                      <ChevronRight className="text-gray-500" size={20} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-800/50 rounded-2xl border border-gray-700">
                <BookOpen size={48} className="mx-auto mb-4 text-gray-500 opacity-50" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Content Yet
                </h3>
                <p className="text-gray-400">
                  Content for this section is coming soon!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Courses;
