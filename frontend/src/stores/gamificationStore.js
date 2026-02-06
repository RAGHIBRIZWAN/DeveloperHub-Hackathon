import { create } from 'zustand';

export const useGamificationStore = create((set, get) => ({
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
  updateGamification: (data) => set({
    level: data.level ?? get().level,
    xp: data.xp ?? get().xp,
    xpToNextLevel: data.xp_to_next_level ?? (data.level ? data.level * 100 : get().xpToNextLevel),
    coins: data.coins ?? get().coins,
    currentStreak: data.current_streak ?? get().currentStreak,
    badges: data.badges ?? get().badges,
    achievements: data.achievements ?? get().achievements,
    unlockedThemes: data.unlocked_themes ?? get().unlockedThemes,
    activeTheme: data.active_theme ?? get().activeTheme,
    rankTitle: data.rank_title ?? get().rankTitle,
    rating: data.rating ?? get().rating,
  }),
  
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
}));
