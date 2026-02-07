import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AtSign, ArrowRight, Loader2, Sparkles, Code2, Shield } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import PageBackground from '../components/ui/PageBackground';
import GlassInput from '../components/ui/GlassInput';

/* ──────────── floating code snippets ──────────── */
const codeSnippets = [
  { code: 'function solve(n) { }', top: '10%', left: '4%', delay: 0 },
  { code: 'export default App;', top: '22%', right: '5%', delay: 1.4 },
  { code: 'docker compose up', bottom: '20%', left: '6%', delay: 2 },
  { code: 'SELECT * FROM users;', bottom: '32%', right: '4%', delay: 0.6 },
  { code: 'console.log("hello");', top: '55%', left: '2%', delay: 1.8 },
  { code: 'pip install flask', top: '70%', right: '7%', delay: 3 },
];

/* ──────────── tiny floating shapes ──────────── */
const shapes = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  size: 4 + Math.random() * 8,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: 6 + Math.random() * 6,
  delay: Math.random() * 4,
}));

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const result = await register(formData);

    if (result.success) {
      toast.success('Welcome to CodeHub! 🎉');
      const currentUser = useAuthStore.getState().user;
      navigate(currentUser?.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  /* ── animation variants ── */
  const card = {
    hidden: { opacity: 0, y: 40, scale: 0.96, rotateX: 4 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#06060e]">
      {/* Immersive background */}
      <PageBackground variant="auth" />

      {/* Floating code snippets */}
      {codeSnippets.map((s, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute hidden md:block font-mono text-[11px] text-violet-400/20 select-none whitespace-nowrap"
          style={{ top: s.top, left: s.left, right: s.right, bottom: s.bottom }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 0.35, 0], y: [10, -14, 10] }}
          transition={{ duration: 8, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        >
          {s.code}
        </motion.span>
      ))}

      {/* Floating particles / shapes */}
      {shapes.map((s) => (
        <motion.div
          key={s.id}
          className="pointer-events-none absolute rounded-full bg-gradient-to-br from-violet-500/30 to-pink-500/20"
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* ────── main card ────── */}
      <motion.div
        className="relative z-10 w-full max-w-[440px] mx-4 my-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={fadeUp} className="flex flex-col items-center mb-7">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow duration-500">
                <Code2 className="w-7 h-7 text-white" />
              </div>
              {/* Glow ring */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-500" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              CodeHub
            </span>
          </Link>
        </motion.div>

        {/* Glass Card */}
        <motion.div
          variants={card}
          className="relative rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden"
        >
          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

          <div className="px-8 pt-9 pb-8">
            {/* Heading */}
            <motion.div variants={fadeUp} className="text-center mb-7">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                {t('auth.register')}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Start your coding journey today!
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <motion.div variants={fadeUp}>
                <GlassInput
                  icon={User}
                  label={t('auth.fullName')}
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  placeholder="Ahmed Khan"
                />
              </motion.div>

              {/* Username */}
              <motion.div variants={fadeUp}>
                <GlassInput
                  icon={AtSign}
                  label={t('auth.username')}
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="coder123"
                />
              </motion.div>

              {/* Email */}
              <motion.div variants={fadeUp}>
                <GlassInput
                  icon={Mail}
                  label={t('auth.email')}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={fadeUp}>
                <GlassInput
                  icon={Lock}
                  label={t('auth.password')}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  placeholder="••••••••"
                />
              </motion.div>

              {/* Password hint */}
              <motion.p variants={fadeUp} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Shield className="w-3 h-3" />
                Minimum 8 characters required
              </motion.p>

              {/* Submit */}
              <motion.div variants={fadeUp} className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Button gradient bg */}
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600" />
                  {/* Hover brighten */}
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 transition-opacity duration-300" />
                  {/* Glow */}
                  <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500" />

                  <span className="relative flex items-center gap-2">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Create Account
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
            </div>

            {/* Login link */}
            <motion.p variants={fadeUp} className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {t('auth.login')}
              </Link>
            </motion.p>
          </div>
        </motion.div>

        {/* Bottom decorative element */}
        <motion.div
          variants={fadeUp}
          className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-600"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Your data is safe · Encrypted & secure</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;
