import { create } from 'zustand';
import { DiscordCategory } from '../types/discord';
import { categoriesApi } from '../services/api';

interface CategoriesState {
  categories: DiscordCategory[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Partial<DiscordCategory>) => Promise<DiscordCategory>;
  updateCategory: (id: string, category: Partial<DiscordCategory>) => Promise<DiscordCategory>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>()((set) => ({
  categories: [],
  isLoading: false,
  error: null,
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoriesApi.getCategories();
      set({ categories: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch categories', isLoading: false });
    }
  },
  addCategory: async (category) => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoriesApi.createCategory(category);
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
  updateCategory: async (id, category) => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoriesApi.updateCategory(id, category);
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
  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await categoriesApi.deleteCategory(id);
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