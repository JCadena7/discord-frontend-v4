import { create } from 'zustand';
import { DiscordCategory } from '../types/discord';
import { categoriesApi } from '../services/api';

interface CategoriesState {
  categories: DiscordCategory[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: (guildId: string) => Promise<void>;
  /**
   * Obtiene las categorías con canales usando la ruta protegida
   */
  fetchCategoriesWithChannels: (guildId: string) => Promise<void>;
  addCategory: (guildId: string, category: Partial<DiscordCategory>) => Promise<DiscordCategory>;
  updateCategory: (guildId: string, id: string, category: Partial<DiscordCategory>) => Promise<DiscordCategory>;
  deleteCategory: (guildId: string, id: string) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>()((set) => ({
  categories: [],
  isLoading: false,
  error: null,
  fetchCategoriesWithChannels: async (guildId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoriesApi.getCategoriesWithChannels(guildId);
      set({ categories: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch categories with channels', isLoading: false });
    }
  },
  fetchCategories: async (guildId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoriesApi.getCategories(guildId);
      set({ categories: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch categories', isLoading: false });
    }
  },
  addCategory: async (guildId: string, category: Partial<DiscordCategory>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoriesApi.createCategory(guildId, category);
      set((state) => ({
        categories: [...state.categories, response.data],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to add category', isLoading: false });
      throw error;
    }
  },
  updateCategory: async (guildId: string, id: string, category: Partial<DiscordCategory>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoriesApi.updateCategory(guildId, id, category);
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? response.data : c)),
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update category', isLoading: false });
      throw error;
    }
  },
  deleteCategory: async (guildId: string, id: string) => {
    set({ isLoading: true, error: null });
    try {
      await categoriesApi.deleteCategory(guildId, id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete category', isLoading: false });
      throw error;
    }
  },
}));