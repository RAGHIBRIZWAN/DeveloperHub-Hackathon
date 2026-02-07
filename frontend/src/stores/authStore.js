import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

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
            error: null,
          });
          
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.detail || 'Login failed',
            isAuthenticated: false,
            user: null,
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
            error: null,
          });
          
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.detail || 'Registration failed',
            isAuthenticated: false,
            user: null,
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
          error: null,
        });
        delete api.defaults.headers.common['Authorization'];
        sessionStorage.removeItem('codehub-auth');
        localStorage.removeItem('codehub-auth');
      },

      updateUser: (userData) => {
        set((state) => {
          if (!state.user) return state;
          return {
            user: { ...state.user, ...userData },
          };
        });
      },

      refreshTokens: async () => {
        const { refreshToken, isAuthenticated } = get();
        if (!refreshToken || !isAuthenticated) return false;

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
        const { accessToken, isAuthenticated, _hasHydrated } = get();
        if (!_hasHydrated) {
          set({ _hasHydrated: true });
        }
        if (accessToken && isAuthenticated) {
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
      },
    }),
    {
      name: 'codehub-auth',
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
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && state?.isAuthenticated) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
          state.setHasHydrated(true);
        }
      },
    }
  )
);
