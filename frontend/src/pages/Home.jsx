import { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import {
  BookOpen,
  Code,
  Trophy,
  Gift,
  Sparkles,
  Play,
  Globe,
  ChevronDown,
  Zap,
  Brain,
  Shield,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useReducedMotion } from '../hooks/useReducedMotion';
import FloatingNav from '../components/three/FloatingNav';
import ThreeFooter from '../components/three/ThreeFooter';
import GlassCard from '../components/ui/GlassCard';
import GlowButton from '../components/ui/GlowButton';
import SectionWrapper from '../components/ui/SectionWrapper';
import MotionWrapper from '../components/ui/MotionWrapper';

// Dynamic import for the 3D scene (heavy Three.js bundle)
const Scene = lazy(() => import('../components/three/Scene'));

/* ─── Feature Card with 3D Perspective Tilt ─────────────────────── */
function FeatureCard({ icon: Icon, title, description, color, index }) {
  const cardRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  function handleMouseMove(e) {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <MotionWrapper delay={index * 0.08}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: reducedMotion ? 0 : rotateX,
          rotateY: reducedMotion ? 0 : rotateY,
          transformPerspective: 800,
        }}
        className="h-full"
      >
        <GlassCard className="h-full group" glow>
          <div className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center mb-5',
            'bg-gradient-to-br',
            color,
          )}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-card-title text-white mb-2 group-hover:text-gradient transition-colors duration-300">
            {title}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </GlassCard>
      </motion.div>
    </MotionWrapper>
  );
}

/* ─── Showcase Card with Scroll Parallax ────────────────────────── */
function ShowcaseCard({ title, description, icon: Icon, parallaxRange, scrollYProgress }) {
  const reducedMotion = useReducedMotion();
  const y = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : parallaxRange);

  return (
    <motion.div style={{ y }}>
      <GlassCard className="group">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-subtle flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-accent-indigo" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gradient transition-colors duration-300">
              {title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HOME PAGE — Full 3D Interactive Experience
   ═══════════════════════════════════════════════════════════════════ */
const Home = () => {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  // Scroll progress for showcase parallax
  const showcaseRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: showcaseRef,
    offset: ['start end', 'end start'],
  });

  /* ── Data ────────────────────────────────────────────── */
  const features = [
    {
      icon: BookOpen,
      title: t('home.features.learn'),
      description: 'Interactive lessons in C++, Python & JavaScript with AI-powered guidance',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Code,
      title: t('home.features.practice'),
      description: 'Solve coding challenges with real-time feedback and intelligent hints',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Trophy,
      title: t('home.features.compete'),
      description: 'Join live contests, climb leaderboards, and prove your skills',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Gift,
      title: t('home.features.reward'),
      description: 'Earn coins, collect badges, and unlock exclusive themes',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Brain,
      title: 'AI Tutoring',
      description: 'Bilingual AI tutor in English & Urdu with voice explanations',
      color: 'from-indigo-500 to-violet-500',
    },
    {
      icon: Shield,
      title: 'Proctored Exams',
      description: 'Fair, AI-monitored assessments with anti-cheating safeguards',
      color: 'from-rose-500 to-red-500',
    },
  ];

  const stats = [
    { value: '1000+', label: 'Coding Challenges' },
    { value: '50+', label: 'Interactive Lessons' },
    { value: '10k+', label: 'Active Learners' },
    { value: '24/7', label: 'AI Tutor Support' },
  ];

  const showcaseItems = [
    { icon: Zap, title: 'Real-Time Code Execution', description: 'Write, run, and debug code in our built-in editor with instant feedback from Judge0.', parallax: [30, -30] },
    { icon: Globe, title: 'Bilingual Experience', description: 'Full English & Urdu interface with AI-powered voice explanations in both languages.', parallax: [60, -60] },
    { icon: Users, title: 'Community Contests', description: 'Compete in live programming contests, earn XP, and rise through the ranks.', parallax: [20, -20] },
  ];

  const trustSignals = [
    'AI-Powered Learning',
    'Bilingual Support',
    'Gamified Experience',
    'Real-Time Feedback',
  ];

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* ── Background 3D Scene (fixed, behind everything) ── */}
      <Suspense fallback={null}>
        <Scene />
      </Suspense>

      {/* ── Floating Navigation ──────────────────────────── */}
      <FloatingNav />

      {/* ── Scrollable Content ───────────────────────────── */}
      <main id="main-content" className="relative z-10">

        {/* ═══ HERO SECTION ═══════════════════════════════ */}
        <section id="hero" className="relative min-h-screen flex items-center justify-center px-6 pt-24">
          <div className="mx-auto max-w-5xl text-center">
            {/* Badge */}
            <MotionWrapper delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
                <Sparkles className="w-4 h-4 text-accent-indigo" />
                <span className="text-sm font-medium text-slate-300">
                  AI-Powered Learning Platform
                </span>
              </div>
            </MotionWrapper>

            {/* Heading */}
            <MotionWrapper delay={0.2}>
              <h1 className="text-hero mb-6">
                <span className="text-white">Learn to Code with </span>
                <span className="text-gradient">AI Intelligence</span>
              </h1>
            </MotionWrapper>

            {/* Subheading */}
            <MotionWrapper delay={0.3}>
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Master C++, Python, and JavaScript through gamified lessons, 
                live contests, and bilingual AI tutoring — in English & Urdu.
              </p>
            </MotionWrapper>

            {/* CTA Buttons */}
            <MotionWrapper delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <GlowButton variant="primary" size="lg" icon={<Play className="w-5 h-5" />}>
                    Start Learning Free
                  </GlowButton>
                </Link>
                <Link to="/login">
                  <GlowButton variant="secondary" size="lg" icon={<Globe className="w-5 h-5" />}>
                    Explore Platform
                  </GlowButton>
                </Link>
              </div>
            </MotionWrapper>

            {/* Stats Row */}
            <MotionWrapper delay={0.6}>
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </MotionWrapper>

            {/* Scroll indicator */}
            <motion.div
              className="mt-16 flex justify-center"
              animate={reducedMotion ? {} : { y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <a href="#features" className="text-slate-600 hover:text-slate-400 transition-colors cursor-pointer" aria-label="Scroll to features">
                <ChevronDown className="w-6 h-6" />
              </a>
            </motion.div>
          </div>
        </section>

        {/* ═══ FEATURES SECTION ═══════════════════════════ */}
        <SectionWrapper id="features">
          <div className="text-center mb-16">
            <MotionWrapper>
              <span className="inline-block text-sm font-semibold text-accent-indigo uppercase tracking-wider mb-3">
                Everything You Need
              </span>
            </MotionWrapper>
            <MotionWrapper delay={0.1}>
              <h2 className="text-section text-white mb-4">
                Learn &rarr; Practice &rarr; Compete &rarr; Earn
              </h2>
            </MotionWrapper>
            <MotionWrapper delay={0.15}>
              <p className="text-slate-400 max-w-xl mx-auto">
                A complete gamified learning cycle designed to take you from beginner to pro.
              </p>
            </MotionWrapper>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </SectionWrapper>

        {/* ═══ SHOWCASE SECTION (Scroll Parallax) ════════ */}
        <SectionWrapper id="showcase">
          <div ref={showcaseRef} className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <MotionWrapper>
                <span className="inline-block text-sm font-semibold text-accent-indigo uppercase tracking-wider mb-3">
                  Why CodeHub?
                </span>
              </MotionWrapper>
              <MotionWrapper delay={0.1}>
                <h2 className="text-section text-white mb-6">
                  Built for the Next Generation of{' '}
                  <span className="text-gradient">Pakistani Developers</span>
                </h2>
              </MotionWrapper>
              <MotionWrapper delay={0.15}>
                <p className="text-slate-400 leading-relaxed mb-8">
                  CodeHub combines AI tutoring, gamification, and bilingual support 
                  to create an immersive learning experience unique to Pakistan's tech ecosystem.
                </p>
              </MotionWrapper>
              <MotionWrapper delay={0.2}>
                <Link to="/register">
                  <GlowButton variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                    Join Now
                  </GlowButton>
                </Link>
              </MotionWrapper>
            </div>

            {/* Right: Parallax Cards */}
            <div className="flex flex-col gap-6">
              {showcaseItems.map((item) => (
                <ShowcaseCard
                  key={item.title}
                  {...item}
                  parallaxRange={item.parallax}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>
          </div>
        </SectionWrapper>

        {/* ═══ AI TUTOR SECTION ═══════════════════════════ */}
        <SectionWrapper>
          <MotionWrapper>
            <GlassCard hover={false} className="p-8 md:p-12 overflow-hidden relative">
              {/* Background gradient orb */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-accent-indigo/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent-violet/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="inline-block text-sm font-semibold text-accent-indigo uppercase tracking-wider mb-3">
                    AI-Powered
                  </span>
                  <h2 className="text-section text-white mb-6">
                    Your Personal{' '}
                    <span className="text-gradient">AI Tutor</span>
                  </h2>
                  <ul className="space-y-4">
                    {[
                      'Bilingual support (English & Urdu)',
                      'Voice explanation of concepts',
                      'Real-time code error detection',
                      'Simple explanations for beginners',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Chat preview */}
                <div className="glass-strong rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center shrink-0">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 bg-white/5 rounded-lg p-4 border border-white/5">
                      <p className="text-white text-sm">
                        Great question! Let me explain how loops work in Python...
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2.5 text-sm font-medium rounded-lg glass text-accent-indigo hover:bg-white/5 transition-colors cursor-pointer">
                      Ask by Voice
                    </button>
                    <button className="flex-1 py-2.5 text-sm font-medium rounded-lg glass text-accent-violet hover:bg-white/5 transition-colors cursor-pointer">
                      Listen
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </MotionWrapper>
        </SectionWrapper>

        {/* ═══ CTA SECTION ════════════════════════════════ */}
        <SectionWrapper id="cta" className="pb-12">
          <MotionWrapper>
            <div className="text-center relative">
              {/* Glow orbs */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-indigo/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <h2 className="text-section text-white mb-4">
                  Ready to Start Your{' '}
                  <span className="text-gradient">Coding Journey</span>?
                </h2>
                <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">
                  Join thousands of students learning to code with AI-powered tools,
                  gamified challenges, and bilingual support.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                  <Link to="/register">
                    <GlowButton variant="primary" size="lg" icon={<Play className="w-5 h-5" />}>
                      Start Learning for Free
                    </GlowButton>
                  </Link>
                </div>

                {/* Trust signals */}
                <div className="flex flex-wrap justify-center gap-4">
                  {trustSignals.map((signal) => (
                    <div
                      key={signal}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-slate-400"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {signal}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </MotionWrapper>
        </SectionWrapper>
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <ThreeFooter />
    </div>
  );
};

export default Home;
