# 🎨 Responsive Components - Implementation Guide

## Quick Reference for Common Components

This guide provides **copy-paste ready patterns** for making your existing components fully responsive.

---

## 📱 Navigation Components

### Mobile Bottom Navigation Bar

```jsx
// components/MobileBottomNav.jsx
import { Home, BookOpen, Trophy, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function MobileBottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/courses', icon: BookOpen, label: 'Learn' },
    { path: '/compete', icon: Trophy, label: 'Compete' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];
  
  return (
    <nav className="
      md:hidden fixed bottom-0 left-0 right-0 z-40
      h-16 bg-surface-secondary border-t border-white/[0.06]
      backdrop-blur-2xl
      safe-area-inset-bottom
    ">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`
                flex flex-col items-center justify-center
                w-16 h-full gap-1
                transition-colors duration-200
                ${isActive 
                  ? 'text-primary-400' 
                  : 'text-white/50 active:text-white/70'
                }
              `}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### Responsive Sidebar with Drawer

```jsx
// Update your Layout.jsx sidebar section
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  return (
    <div className="min-h-screen bg-surface-primary text-white">
      {/* Mobile Header with Hamburger */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 
                         bg-surface-secondary border-b border-white/[0.06] 
                         backdrop-blur-2xl">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 flex items-center justify-center 
                       rounded-xl bg-white/[0.05] border border-white/[0.08]
                       hover:bg-white/[0.10] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="text-lg font-bold bg-gradient-to-r from-primary-400 to-violet-400 
                          bg-clip-text text-transparent">
            DeveloperHub
          </div>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>
      
      {/* Backdrop for mobile drawer */}
      <AnimatePresence>
        {!isLargeScreen && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar/Drawer */}
      <AnimatePresence>
        {(isLargeScreen || sidebarOpen) && (
          <motion.aside
            initial={isLargeScreen ? {} : { x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`
              fixed left-0 top-0 h-screen z-50
              ${isLargeScreen ? 'w-64' : 'w-[280px]'}
              bg-surface-secondary border-r border-white/[0.06]
              backdrop-blur-2xl
              ${!isLargeScreen && 'shadow-2xl'}
            `}
          >
            {/* Close button (mobile only) */}
            {!isLargeScreen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                           rounded-lg bg-white/[0.05] hover:bg-white/[0.10] 
                           transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            {/* Navigation content */}
            <nav className="p-4 space-y-2">
              {/* Your nav items */}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className={`
        ${isLargeScreen ? 'lg:ml-64' : 'ml-0'}
        pt-16 lg:pt-0 pb-20 lg:pb-6
        min-h-screen
        transition-all duration-300
      `}>
        <Outlet />
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
```

---

## 📊 Dashboard Components

### Responsive Stat Cards Grid

```jsx
// components/StatsGrid.jsx
import { motion } from 'framer-motion';

export default function StatsGrid({ stats }) {
  return (
    <div className="
      /* Mobile: horizontal scroll */
      flex md:grid gap-4
      overflow-x-auto md:overflow-visible
      snap-x snap-mandatory md:snap-none
      pb-4 md:pb-0
      -mx-4 md:mx-0 px-4 md:px-0
      
      /* Grid layout for larger screens */
      md:grid-cols-2 lg:grid-cols-4
    ">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="
            snap-center md:snap-align-none
            shrink-0 md:shrink
            w-[280px] md:w-auto
            
            /* Touch-friendly height */
            min-h-[120px] sm:min-h-[140px]
            
            /* Padding scales with viewport */
            p-4 sm:p-5 lg:p-6
            
            /* Glass effect */
            bg-white/[0.03] backdrop-blur-lg
            border border-white/[0.08]
            rounded-2xl
            
            /* Hover state (desktop) */
            hover:border-white/[0.15]
            hover:bg-white/[0.05]
            
            transition-all duration-300
            cursor-pointer
          "
        >
          {/* Icon */}
          <stat.icon className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 
                                 text-primary-400 mb-3" />
          
          {/* Value */}
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">
            {stat.value}
          </div>
          
          {/* Label */}
          <div className="text-sm sm:text-base text-white/60">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
```

### Responsive Course/Module Cards

```jsx
// components/ModuleGrid.jsx
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ModuleGrid({ modules }) {
  return (
    <div className="
      grid gap-4 sm:gap-5 lg:gap-6
      grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
    ">
      {modules.map((module) => (
        <Link
          key={module.id}
          to={`/courses/${module.id}`}
          className="group relative overflow-hidden
                     rounded-2xl border border-white/[0.08]
                     bg-white/[0.03] backdrop-blur-lg
                     
                     /* Responsive padding */
                     p-5 sm:p-6 lg:p-7
                     
                     /* Touch-friendly height */
                     min-h-[200px] sm:min-h-[240px]
                     
                     /* Hover effects (desktop) */
                     hover:border-white/[0.15]
                     hover:scale-[1.02]
                     
                     /* Active state (mobile) */
                     active:scale-[0.98]
                     
                     transition-all duration-300
                     cursor-pointer"
        >
          {/* Gradient background */}
          <div className={`
            absolute inset-0 bg-gradient-to-br ${module.color}
            opacity-0 group-hover:opacity-10
            transition-opacity duration-300
          `} />
          
          {/* Icon */}
          <div className="relative text-4xl sm:text-5xl lg:text-6xl mb-4">
            {module.icon}
          </div>
          
          {/* Title */}
          <h3 className="relative text-lg sm:text-xl lg:text-2xl font-semibold mb-2 
                         line-clamp-2">
            {module.name}
          </h3>
          
          {/* Description - hide on smallest screens */}
          <p className="relative hidden xs:block text-sm sm:text-base text-white/60 
                        mb-4 line-clamp-2">
            {module.description}
          </p>
          
          {/* Meta info */}
          <div className="relative flex items-center justify-between text-sm mt-auto">
            <span className="text-white/50">{module.lessons} lessons</span>
            <ArrowRight className="w-5 h-5 text-primary-400 
                                   group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      ))}
    </div>
  );
}
```

---

## 📋 Table Components

### Responsive Leaderboard

```jsx
// components/Leaderboard.jsx
import { Trophy, Medal } from 'lucide-react';

export default function Leaderboard({ users }) {
  return (
    <>
      {/* Desktop Table (hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left py-4 px-4 text-sm font-semibold text-white/60">
                Rank
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-white/60">
                Player
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-white/60">
                Level
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-white/60">
                XP
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-white/60 
                             hidden lg:table-cell">
                Streak
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} 
                  className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="py-4 px-4">
                  <RankBadge rank={index + 1} />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt="" 
                         className="w-10 h-10 rounded-full border border-white/[0.08]" />
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-white/50">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 font-semibold">{user.level}</td>
                <td className="py-4 px-4">
                  <span className="text-primary-400 font-semibold">
                    {user.xp.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4 hidden lg:table-cell">
                  <span className="flex items-center gap-1">
                    🔥 {user.streak} days
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card List */}
      <div className="md:hidden flex flex-col gap-3">
        {users.map((user, index) => (
          <div
            key={user.id}
            className="flex items-center gap-4 p-4
                       rounded-xl bg-white/[0.03] border border-white/[0.06]
                       hover:border-white/[0.10] active:scale-[0.98]
                       transition-all duration-200"
          >
            {/* Rank */}
            <div className="shrink-0">
              <RankBadge rank={index + 1} />
            </div>
            
            {/* Avatar */}
            <img 
              src={user.avatar} 
              alt=""
              className="w-12 h-12 rounded-full border-2 border-white/[0.08]"
            />
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{user.name}</div>
              <div className="text-sm text-white/60">Level {user.level}</div>
            </div>
            
            {/* XP */}
            <div className="text-right shrink-0">
              <div className="font-bold text-primary-400">
                {user.xp.toLocaleString()}
              </div>
              <div className="text-xs text-white/50">XP</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Helper component for rank badges
function RankBadge({ rank }) {
  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900';
    if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
    return 'bg-white/[0.08] text-white/60';
  };
  
  return (
    <div className={`
      w-8 h-8 sm:w-10 sm:h-10 rounded-lg
      flex items-center justify-center
      font-bold text-sm sm:text-base
      ${getRankStyle(rank)}
    `}>
      {rank <= 3 ? <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> : `#${rank}`}
    </div>
  );
}
```

---

## 📝 Form Components

### Responsive Form Layout

```jsx
// components/ResponsiveForm.jsx
export default function ResponsiveForm() {
  return (
    <form className="space-y-6">
      {/* Form fields container */}
      <div className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2">
        {/* Full-width field */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            type="email"
            className="
              w-full
              h-11 sm:h-12 lg:h-14
              px-4 sm:px-5
              
              /* CRITICAL: 16px minimum on mobile to prevent zoom */
              text-base
              
              rounded-xl
              bg-white/[0.05]
              border border-white/[0.08]
              
              placeholder:text-white/30
              
              focus:outline-none
              focus:ring-2 focus:ring-primary-500/50
              focus:border-primary-500
              
              transition-all duration-200
            "
            placeholder="your@email.com"
          />
        </div>
        
        {/* Half-width fields (stack on mobile) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            First Name
          </label>
          <input
            type="text"
            className="
              w-full h-11 sm:h-12 lg:h-14 px-4 sm:px-5
              text-base
              rounded-xl bg-white/[0.05] border border-white/[0.08]
              focus:outline-none focus:ring-2 focus:ring-primary-500/50
              transition-all duration-200
            "
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Last Name
          </label>
          <input
            type="text"
            className="
              w-full h-11 sm:h-12 lg:h-14 px-4 sm:px-5
              text-base
              rounded-xl bg-white/[0.05] border border-white/[0.08]
              focus:outline-none focus:ring-2 focus:ring-primary-500/50
              transition-all duration-200
            "
          />
        </div>
        
        {/* Textarea - full width */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-2">
            Bio
          </label>
          <textarea
            rows={4}
            className="
              w-full px-4 sm:px-5 py-3 sm:py-4
              text-base
              rounded-xl bg-white/[0.05] border border-white/[0.08]
              focus:outline-none focus:ring-2 focus:ring-primary-500/50
              transition-all duration-200
              resize-none
            "
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>
      
      {/* Submit button - full width on mobile */}
      <button
        type="submit"
        className="
          w-full sm:w-auto
          h-11 sm:h-12 lg:h-14
          px-8 sm:px-10 lg:px-12
          
          text-base sm:text-base lg:text-lg font-semibold
          
          rounded-xl
          bg-gradient-to-r from-primary-500 to-primary-600
          text-white
          
          hover:from-primary-600 hover:to-primary-700
          active:scale-[0.98]
          
          focus:outline-none focus:ring-2 focus:ring-primary-500/50
          
          transition-all duration-200
        "
      >
        Save Changes
      </button>
    </form>
  );
}
```

---

## 🎮 Code Editor Component

### Responsive Code Editor Layout

```jsx
// components/CodeEditor.jsx
import { useState } from 'react';
import { Code, Play, RotateCcw } from 'lucide-react';

export default function CodeEditorLayout() {
  const [activeTab, setActiveTab] = useState('code');
  
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 sm:p-4 
                      border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-primary-400" />
          <span className="font-semibold hidden sm:inline">Code Editor</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="
            h-9 sm:h-10 px-3 sm:px-4
            text-sm sm:text-base
            rounded-lg bg-white/[0.05] border border-white/[0.08]
            hover:bg-white/[0.10]
            transition-colors
            flex items-center gap-2
          ">
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          
          <button className="
            h-9 sm:h-10 px-4 sm:px-6
            text-sm sm:text-base font-semibold
            rounded-lg bg-gradient-to-r from-green-500 to-emerald-600
            hover:from-green-600 hover:to-emerald-700
            transition-all
            flex items-center gap-2
          ">
            <Play className="w-4 h-4" />
            <span>Run</span>
          </button>
        </div>
      </div>
      
      {/* Desktop: Side-by-side layout */}
      <div className="hidden lg:grid lg:grid-cols-2 flex-1 overflow-hidden">
        <div className="border-r border-white/[0.08]">
          <MonacoEditor />
        </div>
        <div className="flex flex-col">
          <OutputPanel />
        </div>
      </div>
      
      {/* Mobile/Tablet: Tabbed layout */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-white/[0.08] bg-white/[0.02]">
          {['code', 'output', 'input'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 h-12 capitalize font-medium
                ${activeTab === tab
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-white/60 hover:text-white/80'
                }
                transition-colors
              `}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'code' && <MonacoEditor />}
          {activeTab === 'output' && <OutputPanel />}
          {activeTab === 'input' && <InputPanel />}
        </div>
      </div>
    </div>
  );
}
```

---

## 💬 Modal/Dialog Components

### Responsive Modal

```jsx
// components/ResponsiveModal.jsx
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export default function ResponsiveModal({ isOpen, onClose, title, children }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="
              fixed z-50
              
              /* Mobile: full screen */
              inset-0
              
              /* Tablet+: centered modal */
              md:inset-auto
              md:top-1/2 md:left-1/2
              md:-translate-x-1/2 md:-translate-y-1/2
              
              /* Width */
              w-full md:w-[90%] lg:w-[600px] md:max-w-2xl
              
              /* Height */
              h-full md:h-auto md:max-h-[90vh]
              
              /* Rounded corners (not on mobile) */
              rounded-none md:rounded-2xl
              
              /* Background */
              bg-surface-secondary
              border-0 md:border md:border-white/[0.08]
              
              /* Shadow */
              md:shadow-2xl
              
              /* Scroll */
              overflow-y-auto
            "
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between 
                            p-4 sm:p-6 border-b border-white/[0.08]
                            bg-surface-secondary backdrop-blur-xl">
              <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
              <button
                onClick={onClose}
                className="
                  w-10 h-10 flex items-center justify-center
                  rounded-xl bg-white/[0.05] border border-white/[0.08]
                  hover:bg-white/[0.10]
                  transition-colors
                "
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 sm:p-6">
              {children}
            </div>
            
            {/* Footer (optional) */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 
                            p-4 sm:p-6 border-t border-white/[0.08]
                            bg-surface-secondary backdrop-blur-xl">
              <button
                onClick={onClose}
                className="
                  px-6 h-11 rounded-xl
                  bg-white/[0.05] border border-white/[0.08]
                  hover:bg-white/[0.10]
                  transition-colors
                "
              >
                Cancel
              </button>
              <button
                className="
                  px-6 h-11 rounded-xl
                  bg-gradient-to-r from-primary-500 to-primary-600
                  hover:from-primary-600 hover:to-primary-700
                  font-semibold
                  transition-all
                "
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## 🔧 Utility Hooks

### useBreakpoint Hook

```jsx
// hooks/useBreakpoint.js
import { useState, useEffect } from 'react';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useBreakpoint(breakpoint) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const query = `(min-width: ${breakpoints[breakpoint]}px)`;
    const media = window.matchMedia(query);
    
    const updateMatch = () => setMatches(media.matches);
    updateMatch();
    
    media.addEventListener('change', updateMatch);
    return () => media.removeEventListener('change', updateMatch);
  }, [breakpoint]);
  
  return matches;
}

// Usage:
// const isDesktop = useBreakpoint('lg'); // true if >= 1024px
// const isMobile = !useBreakpoint('md'); // true if < 768px
```

### useMediaQuery Hook

```jsx
// hooks/useMediaQuery.js
import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    
    const updateMatch = () => setMatches(media.matches);
    updateMatch();
    
    media.addEventListener('change', updateMatch);
    return () => media.removeEventListener('change', updateMatch);
  }, [query]);
  
  return matches;
}

// Usage:
// const isMobile = useMediaQuery('(max-width: 767px)');
// const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
```

---

## 🎨 Responsive Container Utilities

```jsx
// components/Container.jsx
export function Container({ children, className = '' }) {
  return (
    <div className={`
      w-full max-w-7xl mx-auto
      px-4 sm:px-6 lg:px-8 xl:px-12
      ${className}
    `}>
      {children}
    </div>
  );
}

export function Section({ children, className = '' }) {
  return (
    <section className={`
      py-8 sm:py-12 lg:py-16
      ${className}
    `}>
      {children}
    </section>
  );
}

export function PageHeader({ title, description }) {
  return (
    <div className="mb-8 sm:mb-12 lg:mb-16">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
        {title}
      </h1>
      {description && (
        <p className="text-base sm:text-lg text-white/60 max-w-3xl">
          {description}
        </p>
      )}
    </div>
  );
}
```

---

## ✅ Quick Implementation Checklist

When making a component responsive:

1. **Touch Targets**
   ```jsx
   // ✅ Good - 44px minimum
   <button className="h-11 w-11">
   
   // ❌ Bad - too small
   <button className="h-8 w-8">
   ```

2. **Input Font Size**
   ```jsx
   // ✅ Good - prevents iOS zoom
   <input className="text-base">
   
   // ❌ Bad - causes zoom on iOS
   <input className="text-sm">
   ```

3. **Responsive Spacing**
   ```jsx
   // ✅ Good - scales with breakpoint
   <div className="p-4 sm:p-6 lg:p-8">
   
   // ❌ Bad - fixed spacing
   <div className="p-6">
   ```

4. **Grid Layouts**
   ```jsx
   // ✅ Good - mobile-first grid
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
   
   // ❌ Bad - doesn't adapt
   <div className="grid grid-cols-3">
   ```

5. **Typography**
   ```jsx
   // ✅ Good - responsive sizing
   <h1 className="text-2xl sm:text-3xl lg:text-4xl">
   
   // ❌ Bad - static size
   <h1 className="text-4xl">
   ```

---

**Remember**: Start with mobile, then add breakpoint prefixes (`sm:`, `md:`, `lg:`) to enhance the experience on larger screens.
