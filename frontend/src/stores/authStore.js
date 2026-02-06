import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

// Generate unique tab ID for multi-tab support
const getTabId = () => {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
};

const TAB_ID = getTabId();

// Custom storage that combines localStorage with tab-specific sessionStorage
const createTabAwareStorage = () => ({
  getItem: (name) => {
    // First check sessionStorage for tab-specific data
    const tabSpecific = sessionStorage.getItem(`${name}_${TAB_ID}`);
    if (tabSpecific) {
      return tabSpecific;
    }
    // Fall back to localStorage for shared data
    return localStorage.getItem(name);
  },
  setItem: (name, value) => {
    // Store in both sessionStorage (tab-specific) and localStorage (backup)
    sessionStorage.setItem(`${name}_${TAB_ID}`, value);
    // Only store in localStorage if it's the first/main tab
    const mainTabData = localStorage.getItem(name);
    if (!mainTabData) {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    sessionStorage.removeItem(`${name}_${TAB_ID}`);
    // Don't remove from localStorage to preserve other tabs
  },
});

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tabId: TAB_ID,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { access_token, refresh_token, user } = response.data;
          
          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.detail || 'Login failed',
          });
          return { success: false, error: error.response?.data?.detail };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          const { access_token, refresh_token, user } = response.data;
          
          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.detail || 'Registration failed',
          });
          return { success: false, error: error.response?.data?.detail };
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        delete api.defaults.headers.common['Authorization'];
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await api.post('/auth/refresh', {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefreshToken } = response.data;
          
          set({
            accessToken: access_token,
            refreshToken: newRefreshToken,
          });
          
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      initializeAuth: () => {
        const { accessToken } = get();
        if (accessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
      },
    }),
    {
      name: 'codehub-auth',
      storage: createTabAwareStorage(),
      // Partition by tab ID to prevent cross-tab interference
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
