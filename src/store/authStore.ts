import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../lib/apiClient';
import type { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../../shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<ApiResponse<AuthResponse>>;
  register: (data: RegisterRequest) => Promise<ApiResponse<AuthResponse>>;
  logout: () => void;
  fetchProfile: () => Promise<ApiResponse<User>>;
  setToken: (token: string | null) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
          return response;
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Login failed',
          };
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post<AuthResponse>('/auth/register', data);
          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
          return response;
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        localStorage.removeItem('authToken');
      },

      fetchProfile: async () => {
        set({ isLoading: true });
        try {
          const response = await apiClient.get<User>('/auth/profile');
          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
          return response;
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch profile',
          };
        }
      },

      setToken: (token: string | null) => {
        set({ token });
        if (token) {
          localStorage.setItem('authToken', token);
        } else {
          localStorage.removeItem('authToken');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.isAuthenticated = true;
          state.fetchProfile();
        }
      },
    }
  )
);

useAuthStore.subscribe((state) => {
  if (state.token) {
    localStorage.setItem('authToken', state.token);
  } else {
    localStorage.removeItem('authToken');
  }
});

export default useAuthStore;
