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
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

function App() {
  const { isAuthenticated, initializeAuth } = useAuthStore();

  // Initialize auth once on mount only
  useEffect(() => {
    initializeAuth();
  }, []); // Empty dependency array - run only once

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/dashboard" /> : <Register />
      } />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Suspense fallback={<PageLoader />}><Courses /></Suspense>} />
        <Route path="/lesson/:slug" element={<Suspense fallback={<PageLoader />}><Lesson /></Suspense>} />
        <Route path="/challenge/:slug" element={<Suspense fallback={<PageLoader />}><Challenge /></Suspense>} />
        <Route path="/compete" element={<Suspense fallback={<PageLoader />}><Compete /></Suspense>} />
        <Route path="/contest/:id" element={<Suspense fallback={<PageLoader />}><Contest /></Suspense>} />
        <Route path="/profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
        <Route path="/leaderboard" element={<Suspense fallback={<PageLoader />}><Leaderboard /></Suspense>} />
        <Route path="/shop" element={<Suspense fallback={<PageLoader />}><Shop /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><Admin /></Suspense>} />
        <Route path="/practice" element={<Suspense fallback={<PageLoader />}><Practice /></Suspense>} />
        <Route path="/exam" element={<Suspense fallback={<PageLoader />}><Exam /></Suspense>} />
        <Route path="/quiz" element={<Suspense fallback={<PageLoader />}><Quiz /></Suspense>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
