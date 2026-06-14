import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from './authStore';
import { usePromptStore } from './promptStore';
import type { Favorite, ApiResponse } from '../../shared/types';

interface FavoriteState {
  favoritePromptIds: Set<number>;
  loading: boolean;
  initialized: boolean;
}

interface FavoriteActions {
  fetchFavorites: () => Promise<void>;
  addFavorite: (promptId: number) => Promise<void>;
  removeFavorite: (promptId: number) => Promise<void>;
  toggleFavorite: (promptId: number) => Promise<boolean>;
  isFavorited: (promptId: number) => boolean;
  reset: () => void;
}

type FavoriteStore = FavoriteState & FavoriteActions;

const initialState: FavoriteState = {
  favoritePromptIds: new Set(),
  loading: false,
  initialized: false,
};

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  ...initialState,

  fetchFavorites: async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      set({ initialized: true });
      return;
    }

    set({ loading: true });
    try {
      const response = await apiClient.get<Favorite[]>('/favorites');
      if (response.success && response.data) {
        const ids = new Set(response.data.map((f) => f.promptId));
        set({ favoritePromptIds: ids, initialized: true, loading: false });
      } else {
        set({ initialized: true, loading: false });
      }
    } catch {
      set({ initialized: true, loading: false });
    }
  },

  addFavorite: async (promptId: number) => {
    if (!useAuthStore.getState().isAuthenticated) return;

    try {
      const response = await apiClient.post<{ favorited: boolean }>('/favorites', { promptId });
      if (response.success) {
        set((state) => ({
          favoritePromptIds: new Set(state.favoritePromptIds).add(promptId),
        }));
        usePromptStore.setState((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === promptId ? { ...p, favoriteCount: p.favoriteCount + 1 } : p
          ),
          featuredPrompts: state.featuredPrompts.map((p) =>
            p.id === promptId ? { ...p, favoriteCount: p.favoriteCount + 1 } : p
          ),
          currentPrompt:
            state.currentPrompt?.id === promptId
              ? { ...state.currentPrompt, favoriteCount: state.currentPrompt.favoriteCount + 1 }
              : state.currentPrompt,
        }));
      }
    } catch {
      // ignore
    }
  },

  removeFavorite: async (promptId: number) => {
    if (!useAuthStore.getState().isAuthenticated) return;

    try {
      const response = await apiClient.delete<void>(`/favorites/${promptId}`);
      if (response.success) {
        set((state) => {
          const newSet = new Set(state.favoritePromptIds);
          newSet.delete(promptId);
          return { favoritePromptIds: newSet };
        });
        usePromptStore.setState((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === promptId ? { ...p, favoriteCount: Math.max(0, p.favoriteCount - 1) } : p
          ),
          featuredPrompts: state.featuredPrompts.map((p) =>
            p.id === promptId ? { ...p, favoriteCount: Math.max(0, p.favoriteCount - 1) } : p
          ),
          currentPrompt:
            state.currentPrompt?.id === promptId
              ? { ...state.currentPrompt, favoriteCount: Math.max(0, state.currentPrompt.favoriteCount - 1) }
              : state.currentPrompt,
        }));
      }
    } catch {
      // ignore
    }
  },

  toggleFavorite: async (promptId: number): Promise<boolean> => {
    const isCurrentlyFavorited = get().favoritePromptIds.has(promptId);
    if (isCurrentlyFavorited) {
      await get().removeFavorite(promptId);
      return false;
    } else {
      await get().addFavorite(promptId);
      return true;
    }
  },

  isFavorited: (promptId: number): boolean => {
    return get().favoritePromptIds.has(promptId);
  },

  reset: () => {
    set({
      favoritePromptIds: new Set(),
      loading: false,
      initialized: false,
    });
  },
}));

let previousAuthState = useAuthStore.getState().isAuthenticated;

useAuthStore.subscribe((state) => {
  const currentAuthState = state.isAuthenticated;
  if (previousAuthState && !currentAuthState) {
    useFavoriteStore.getState().reset();
  } else if (!previousAuthState && currentAuthState) {
    useFavoriteStore.getState().fetchFavorites();
  }
  previousAuthState = currentAuthState;
});

export default useFavoriteStore;
