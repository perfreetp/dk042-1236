import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';
import type {
  Prompt,
  CreatePromptRequest,
  RatePromptRequest,
  PaginatedResponse,
  ApiResponse,
} from '../../shared/types';

interface PromptFilters {
  purpose?: string;
  model?: string;
  language?: string;
  difficulty?: string;
  search?: string;
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  tags?: number[];
  status?: string;
  authorId?: number;
  isFeatured?: boolean;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface PromptState {
  prompts: Prompt[];
  featuredPrompts: Prompt[];
  currentPrompt: Prompt | null;
  loading: boolean;
  filters: PromptFilters;
  pagination: PaginationState;
}

interface PromptActions {
  fetchPrompts: (filters?: PromptFilters) => Promise<ApiResponse<PaginatedResponse<Prompt>>>;
  fetchFeatured: () => Promise<ApiResponse<Prompt[]>>;
  fetchById: (id: number) => Promise<ApiResponse<Prompt>>;
  createPrompt: (data: CreatePromptRequest) => Promise<ApiResponse<Prompt>>;
  updatePrompt: (id: number, data: Partial<CreatePromptRequest>) => Promise<ApiResponse<Prompt>>;
  deletePrompt: (id: number) => Promise<ApiResponse<void>>;
  copyPrompt: (id: number) => Promise<ApiResponse<{ copyCount: number }>>;
  forkPrompt: (id: number) => Promise<ApiResponse<Prompt>>;
  ratePrompt: (id: number, data: RatePromptRequest) => Promise<ApiResponse<{ rating: number; ratingCount: number }>>;
  setFilters: (filters: Partial<PromptFilters>) => void;
  clearCurrentPrompt: () => void;
  updateCurrentPrompt: (updates: Partial<Prompt>) => void;
}

type PromptStore = PromptState & PromptActions;

const initialState: PromptState = {
  prompts: [],
  featuredPrompts: [],
  currentPrompt: null,
  loading: false,
  filters: {
    page: 1,
    pageSize: 20,
    sort: 'createdAt',
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
};

export const usePromptStore = create<PromptStore>((set, get) => ({
  ...initialState,

  fetchPrompts: async (filters?: PromptFilters) => {
    const currentFilters = { ...get().filters, ...filters };
    set({ loading: true, filters: currentFilters });

    try {
      const params: Record<string, unknown> = {};
      if (currentFilters.purpose) params.purpose = currentFilters.purpose;
      if (currentFilters.model) params.model = currentFilters.model;
      if (currentFilters.language) params.language = currentFilters.language;
      if (currentFilters.difficulty) params.difficulty = currentFilters.difficulty;
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.q) params.q = currentFilters.q;
      if (currentFilters.sort) params.sort = currentFilters.sort;
      if (currentFilters.page) params.page = currentFilters.page;
      if (currentFilters.pageSize) params.pageSize = currentFilters.pageSize;
      if (currentFilters.tags?.length) params.tags = currentFilters.tags.join(',');
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.authorId) params.authorId = currentFilters.authorId;
      if (currentFilters.isFeatured !== undefined) params.isFeatured = currentFilters.isFeatured;

      const response = await apiClient.get<PaginatedResponse<Prompt>>('/prompts', params);

      if (response.success && response.data) {
        set({
          prompts: response.data.items,
          pagination: {
            page: response.data.page,
            pageSize: response.data.pageSize,
            total: response.data.total,
            totalPages: response.data.totalPages,
          },
          loading: false,
        });
      } else {
        set({ loading: false });
      }

      return response;
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prompts',
      };
    }
  },

  fetchFeatured: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get<PaginatedResponse<Prompt>>('/prompts', {
        isFeatured: true,
        sort: 'createdAt',
        pageSize: 10,
      });

      if (response.success && response.data) {
        set({
          featuredPrompts: response.data.items || [],
          loading: false,
        });
      } else {
        set({ loading: false });
      }

      return { success: true, data: response.data?.items || [] } as ApiResponse<Prompt[]>;
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch featured prompts',
      };
    }
  },

  fetchById: async (id: number) => {
    set({ loading: true });
    try {
      const response = await apiClient.get<Prompt>(`/prompts/${id}`);

      if (response.success && response.data) {
        set({
          currentPrompt: response.data,
          loading: false,
        });
      } else {
        set({ loading: false });
      }

      return response;
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prompt',
      };
    }
  },

  createPrompt: async (data: CreatePromptRequest) => {
    set({ loading: true });
    try {
      const response = await apiClient.post<Prompt>('/prompts', data);

      if (response.success && response.data) {
        set((state) => ({
          prompts: [response.data!, ...state.prompts],
          loading: false,
        }));
      } else {
        set({ loading: false });
      }

      return response;
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create prompt',
      };
    }
  },

  updatePrompt: async (id: number, data: Partial<CreatePromptRequest>) => {
    set({ loading: true });
    try {
      const response = await apiClient.put<Prompt>(`/prompts/${id}`, data);

      if (response.success && response.data) {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? response.data! : p
          ),
          currentPrompt: state.currentPrompt?.id === id ? response.data : state.currentPrompt,
          loading: false,
        }));
      } else {
        set({ loading: false });
      }

      return response;
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update prompt',
      };
    }
  },

  deletePrompt: async (id: number) => {
    set({ loading: true });
    try {
      const response = await apiClient.delete<void>(`/prompts/${id}`);

      if (response.success) {
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
          currentPrompt: state.currentPrompt?.id === id ? null : state.currentPrompt,
          loading: false,
        }));
      } else {
        set({ loading: false });
      }

      return response;
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete prompt',
      };
    }
  },

  copyPrompt: async (id: number) => {
    try {
      const response = await apiClient.post<{ copyCount: number }>(`/prompts/${id}/copy`);

      if (response.success && response.data) {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, copyCount: response.data!.copyCount } : p
          ),
          featuredPrompts: state.featuredPrompts.map((p) =>
            p.id === id ? { ...p, copyCount: response.data!.copyCount } : p
          ),
          currentPrompt:
            state.currentPrompt?.id === id
              ? { ...state.currentPrompt, copyCount: response.data!.copyCount }
              : state.currentPrompt,
        }));
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record copy',
      };
    }
  },

  forkPrompt: async (id: number) => {
    set({ loading: true });
    try {
      const response = await apiClient.post<Prompt>(`/prompts/${id}/fork`);

      if (response.success && response.data) {
        set((state) => ({
          prompts: [response.data!, ...state.prompts],
          loading: false,
        }));
      } else {
        set({ loading: false });
      }

      return response;
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fork prompt',
      };
    }
  },

  ratePrompt: async (id: number, data: RatePromptRequest) => {
    try {
      const response = await apiClient.post<{ rating: number; ratingCount: number }>(
        `/prompts/${id}/rate`,
        data
      );

      if (response.success && response.data) {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  rating: response.data!.rating,
                  ratingCount: response.data!.ratingCount,
                }
              : p
          ),
          featuredPrompts: state.featuredPrompts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  rating: response.data!.rating,
                  ratingCount: response.data!.ratingCount,
                }
              : p
          ),
          currentPrompt:
            state.currentPrompt?.id === id
              ? {
                  ...state.currentPrompt,
                  rating: response.data!.rating,
                  ratingCount: response.data!.ratingCount,
                }
              : state.currentPrompt,
        }));
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rate prompt',
      };
    }
  },

  setFilters: (filters: Partial<PromptFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearCurrentPrompt: () => {
    set({ currentPrompt: null });
  },

  updateCurrentPrompt: (updates: Partial<Prompt>) => {
    set((state) => ({
      currentPrompt: state.currentPrompt ? { ...state.currentPrompt, ...updates } : state.currentPrompt,
    }));
  },
}));

export default usePromptStore;
