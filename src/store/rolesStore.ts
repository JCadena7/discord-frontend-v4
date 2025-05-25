import { create } from 'zustand';
import { DiscordRole } from '../types/discord';
import { rolesApi } from '../services/api';

interface RolesState {
  roles: DiscordRole[];
  isLoading: boolean;
  error: string | null;
  fetchRoles: () => Promise<void>;
  addRole: (role: Partial<DiscordRole>) => Promise<DiscordRole>;
  updateRole: (id: string, role: Partial<DiscordRole>) => Promise<DiscordRole>;
  deleteRole: (id: string) => Promise<void>;
}

export const useRolesStore = create<RolesState>()((set, get) => ({
  roles: [],
  isLoading: false,
  error: null,
  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await rolesApi.getRoles();
      set({ roles: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch roles', isLoading: false });
    }
  },
  addRole: async (role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await rolesApi.createRole(role);
      set((state) => ({ 
        roles: [...state.roles, response.data], 
        isLoading: false 
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to add role', isLoading: false });
      throw error;
    }
  },
  updateRole: async (id, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await rolesApi.updateRole(id, role);
      set((state) => ({
        roles: state.roles.map((r) => (r.id === id ? response.data : r)),
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update role', isLoading: false });
      throw error;
    }
  },
  deleteRole: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await rolesApi.deleteRole(id);
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete role', isLoading: false });
      throw error;
    }
  },
}));