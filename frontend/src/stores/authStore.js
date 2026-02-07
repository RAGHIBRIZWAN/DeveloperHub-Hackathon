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
      isVerifying: true, // true until we verify the stored token
      error: null,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      login: async (email, password) => {
        // Clear any stale auth state BEFORE making the request
        sessionStorage.removeItem('codehub-auth');
        localStorage.removeItem('codehub-auth');
        delete api.defaults.headers.common['Authorization'];

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: true,
          error: null,
        });

        try {
          const response = await api.post('/auth/login', { email, password });
          const { access_token, refresh_token, user } = response.data;
          
          // Set the auth header FIRST so persist writes the correct state
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
            isVerifying: false,
            error: null,
          });
          
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            isVerifying: false,
            error: error.response?.data?.detail || 'Login failed',
            isAuthenticated: false,
            user: null,
          });
          return { success: false, error: error.response?.data?.detail };
        }
      },

      register: async (userData) => {
        // Clear any stale auth state
        sessionStorage.removeItem('codehub-auth');
        localStorage.removeItem('codehub-auth');
        delete api.defaults.headers.common['Authorization'];

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: true,
          error: null,
        });

        try {
          const response = await api.post('/auth/register', userData);
          const { access_token, refresh_token, user } = response.data;
          
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
            isVerifying: false,
            error: null,
          });
          
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            isVerifying: false,
            error: error.response?.data?.detail || 'Registration failed',
            isAuthenticated: false,
            user: null,
          });
          return { success: false, error: error.response?.data?.detail };
        }
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        // Remove storage BEFORE setting state to prevent persist re-writing
        sessionStorage.removeItem('codehub-auth');
        localStorage.removeItem('codehub-auth');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isVerifying: false,
          error: null,
        });
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

      initializeAuth: async () => {
        const { accessToken, isAuthenticated, _hasHydrated } = get();
        if (!_hasHydrated) {
          set({ _hasHydrated: true });
        }

        // If we have a stored token, validate it by calling the server
        if (accessToken && isAuthenticated) {
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          try {
            const response = await api.get('/auth/me');
            const freshUser = response.data;
            // Update user with fresh data from the server
            set({
              user: freshUser,
              isVerifying: false,
              isAuthenticated: true,
            });
          } catch {
            // Token invalid or expired — force logout
            get().logout();
          }
        } else {
          set({ isVerifying: false });
        }
      },
    }),
    {
      name: 'codehub-auth',
      storage: createJSONStorage(() => sessionStorage),
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
