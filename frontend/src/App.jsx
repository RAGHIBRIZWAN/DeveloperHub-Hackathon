import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from './stores/authStore';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Eager load critical pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Lazy load other pages for code splitting
const Courses = lazy(() => import('./pages/Courses'));
const Lesson = lazy(() => import('./pages/Lesson'));
const Challenge = lazy(() => import('./pages/Challenge'));
const Compete = lazy(() => import('./pages/Compete'));
const Contest = lazy(() => import('./pages/Contest'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Shop = lazy(() => import('./pages/Shop'));
const Admin = lazy(() => import('./pages/Admin'));
const Practice = lazy(() => import('./pages/Practice'));
const Exam = lazy(() => import('./pages/Exam'));
const Quiz = lazy(() => import('./pages/Quiz'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
    {/* Ambient glow orbs */}
    <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] animate-pulse delay-500" />

    <div className="relative flex flex-col items-center gap-6">
      {/* Gradient spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 animate-spin" style={{ maskImage: 'conic-gradient(transparent 60%, black)', WebkitMaskImage: 'conic-gradient(transparent 60%, black)' }} />
        <div className="absolute inset-[3px] rounded-full bg-[#0a0a0f]" />
      </div>
      {/* Label */}
      <p className="text-sm text-white/30 tracking-widest uppercase font-medium">Loading</p>
    </div>
  </div>
);

/* ── Admin-only route wrapper ── */
const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

/* ── User-only route wrapper (blocks admins) ── */
const UserRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

function App() {
  const { isAuthenticated, isVerifying, initializeAuth, user } = useAuthStore();
  const homeRedirect = user?.role === 'admin' ? '/admin' : '/dashboard';

  // Initialize auth once on mount — validates stored token with the server
  useEffect(() => {
    initializeAuth();
  }, []); // Empty dependency array - run only once

  // Show full-screen loader while verifying stored token
  if (isVerifying) {
    return <PageLoader />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={homeRedirect} /> : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to={homeRedirect} /> : <Register />
      } />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* User routes — admin is redirected to /admin */}
        <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />
        <Route path="/courses" element={<UserRoute><Suspense fallback={<PageLoader />}><Courses /></Suspense></UserRoute>} />
        <Route path="/lesson/:slug" element={<UserRoute><Suspense fallback={<PageLoader />}><Lesson /></Suspense></UserRoute>} />
        <Route path="/challenge/:slug" element={<UserRoute><Suspense fallback={<PageLoader />}><Challenge /></Suspense></UserRoute>} />
        <Route path="/compete" element={<UserRoute><Suspense fallback={<PageLoader />}><Compete /></Suspense></UserRoute>} />
        <Route path="/contest/:id" element={<UserRoute><Suspense fallback={<PageLoader />}><Contest /></Suspense></UserRoute>} />
        <Route path="/profile" element={<UserRoute><Suspense fallback={<PageLoader />}><Profile /></Suspense></UserRoute>} />
        <Route path="/leaderboard" element={<UserRoute><Suspense fallback={<PageLoader />}><Leaderboard /></Suspense></UserRoute>} />
        <Route path="/shop" element={<UserRoute><Suspense fallback={<PageLoader />}><Shop /></Suspense></UserRoute>} />
        <Route path="/practice" element={<UserRoute><Suspense fallback={<PageLoader />}><Practice /></Suspense></UserRoute>} />
        <Route path="/exam" element={<UserRoute><Suspense fallback={<PageLoader />}><Exam /></Suspense></UserRoute>} />
        <Route path="/quiz" element={<UserRoute><Suspense fallback={<PageLoader />}><Quiz /></Suspense></UserRoute>} />

        {/* Admin-only route */}
        <Route path="/admin" element={<AdminRoute><Suspense fallback={<PageLoader />}><Admin /></Suspense></AdminRoute>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
