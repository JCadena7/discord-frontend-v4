import { create } from 'zustand';
import { getGuildData } from '../services/discordService';
import { Category, Role, Channel } from '../types/discord';
import { convertFromBackendFormat } from '../utils/dataUtils';

interface DiscordState {
  serverName: string;
  roles: Role[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchGuildData: (guildId: string) => Promise<void>;
  setCategories: (categories: Category[]) => void;
  setRoles: (roles: Role[]) => void;
}

const useDiscordStore = create<DiscordState>((set) => ({
  serverName: '',
  roles: [],
  categories: [],
  loading: false,
  error: null,
  fetchGuildData: async (guildId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await getGuildData(guildId);
      const { serverName, roles, items } = response.data;

      // Convertimos los datos del backend al formato del frontend
      const { categories: convertedCategories, roles: convertedRoles } = convertFromBackendFormat({ roles, items });

      set({
        serverName,
        roles: convertedRoles,
        categories: convertedCategories,
        loading: false,
      });
    } catch (error) {
      set({ error: 'Failed to fetch guild data', loading: false });
    }
  },
  setCategories: (categories: Category[]) => set({ categories }),
  setRoles: (roles: Role[]) => set({ roles }),
}));

export default useDiscordStore;
