import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useGamificationStore = create(
  persist(
    (set, get) => ({
  // User gamification data
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  coins: 0,
  currentStreak: 0,
  badges: [],
  achievements: [],
  unlockedThemes: ['default'],
  activeTheme: 'default',
  rankTitle: 'Beginner',
  rating: 1000,
  
  // Notifications
  notifications: [],
  
  // Actions
  updateGamification: (data) => {
    const current = get();
    // Only update if data has actually changed
    const hasChanged = 
      data.level !== current.level ||
      data.xp !== current.xp ||
      data.coins !== current.coins ||
      data.current_streak !== current.currentStreak;
    
    if (!hasChanged && !data.badges && !data.achievements) {
      return; // Skip update if nothing changed
    }
    
    set({
      level: data.level ?? current.level,
      xp: data.xp ?? current.xp,
      xpToNextLevel: data.xp_to_next_level ?? (data.level ? data.level * 100 : current.xpToNextLevel),
      coins: data.coins ?? current.coins,
      currentStreak: data.current_streak ?? current.currentStreak,
      badges: data.badges ?? current.badges,
      achievements: data.achievements ?? current.achievements,
      unlockedThemes: data.unlocked_themes ?? current.unlockedThemes,
      activeTheme: data.active_theme ?? current.activeTheme,
      rankTitle: data.rank_title ?? current.rankTitle,
      rating: data.rating ?? current.rating,
    });
  },
  
  addCoins: (amount) => set((state) => ({
    coins: state.coins + amount,
  })),
  
  spendCoins: (amount) => set((state) => ({
    coins: Math.max(0, state.coins - amount),
  })),
  
  addXP: (amount) => {
    const { xp, xpToNextLevel, level } = get();
    const newXP = xp + amount;
    
    if (newXP >= xpToNextLevel) {
      // Level up!
      set({
        level: level + 1,
        xp: newXP - xpToNextLevel,
        xpToNextLevel: (level + 1) * 100,
      });
      get().addNotification({
        type: 'level_up',
        title: `Level Up! You're now level ${level + 1}`,
      });
    } else {
      set({ xp: newXP });
    }
  },
  
  addBadge: (badge) => set((state) => ({
    badges: [...state.badges, badge],
  })),
  
  unlockTheme: (themeId) => set((state) => ({
    unlockedThemes: [...state.unlockedThemes, themeId],
  })),
  
  setActiveTheme: (themeId) => set({ activeTheme: themeId }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, {
      id: Date.now(),
      ...notification,
      timestamp: new Date(),
    }],
  })),
  
  clearNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  
  clearAllNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'codehub-gamification',
      storage: createJSONStorage(() => {
        return {
          getItem: (name) => {
            // Try sessionStorage first, fallback to localStorage for persistence
            const sessionValue = sessionStorage.getItem(name);
            if (sessionValue) return sessionValue;
            const localValue = localStorage.getItem(name);
            if (localValue) {
              // Restore to sessionStorage
              sessionStorage.setItem(name, localValue);
              return localValue;
            }
            return null;
          },
          setItem: (name, value) => {
            // Save to both for persistence
            sessionStorage.setItem(name, value);
            localStorage.setItem(name, value);
          },
          removeItem: (name) => {
            sessionStorage.removeItem(name);
            localStorage.removeItem(name);
          },
        };
      }),
      partialize: (state) => ({
        level: state.level,
        xp: state.xp,
        xpToNextLevel: state.xpToNextLevel,
        coins: state.coins,
        currentStreak: state.currentStreak,
        badges: state.badges,
        achievements: state.achievements,
        unlockedThemes: state.unlockedThemes,
        activeTheme: state.activeTheme,
        rankTitle: state.rankTitle,
        rating: state.rating,
        // Don't persist notifications
      }),
    }
  )
);
