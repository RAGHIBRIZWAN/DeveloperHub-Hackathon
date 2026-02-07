import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Sparkles, Code2, Terminal } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import PageBackground from '../components/ui/PageBackground';
import GlassInput from '../components/ui/GlassInput';

/* ──────────── floating code snippets ──────────── */
const codeSnippets = [
  { code: 'const app = express();', top: '12%', left: '5%', delay: 0 },
  { code: 'import React from "react";', top: '25%', right: '4%', delay: 1.2 },
  { code: 'git commit -m "init"', bottom: '18%', left: '8%', delay: 2.4 },
  { code: 'npm run build', bottom: '30%', right: '6%', delay: 0.8 },
  { code: 'async function main() {}', top: '60%', left: '3%', delay: 1.8 },
];

/* ──────────── tiny floating shapes ──────────── */
const shapes = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  size: 4 + Math.random() * 8,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: 6 + Math.random() * 6,
  delay: Math.random() * 4,
}));

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('Welcome back! 🎉');
      // Redirect admin to admin panel, regular users to dashboard
      const currentUser = useAuthStore.getState().user;
      navigate(currentUser?.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
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
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
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
          className="pointer-events-none absolute hidden md:block font-mono text-[11px] text-indigo-400/20 select-none whitespace-nowrap"
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
          className="pointer-events-none absolute rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/20"
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* ────── main card ────── */}
      <motion.div
        className="relative z-10 w-full max-w-[420px] mx-4"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={fadeUp} className="flex flex-col items-center mb-8">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow duration-500">
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
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          <div className="px-8 pt-10 pb-9">
            {/* Heading */}
            <motion.div variants={fadeUp} className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                {t('auth.login')}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Welcome back! Let's continue learning.
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="••••••••"
                />
              </motion.div>

              {/* Submit */}
              <motion.div variants={fadeUp} className="pt-2">
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
                        {t('auth.login')}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
            </div>

            {/* Register link */}
            <motion.p variants={fadeUp} className="text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {t('auth.register')}
              </Link>
            </motion.p>
          </div>
        </motion.div>

        {/* Bottom decorative element */}
        <motion.div
          variants={fadeUp}
          className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-600"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Secure authentication · End-to-end encrypted</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
