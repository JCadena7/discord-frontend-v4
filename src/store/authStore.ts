import { create } from 'zustand';
import { DiscordGuild } from '../types/discord';
import api from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  selectedGuild: DiscordGuild | null;
  isLoading: boolean;
  error: string | null;
  guilds: DiscordGuild[];
  login: () => void;
  logout: () => Promise<void>;
  fetchGuilds: () => Promise<void>;
  selectGuild: (guild: DiscordGuild) => void;
  checkAuthStatus: () => Promise<void>;
  handleAuthCallback: (code: string) => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: !!localStorage.getItem('access_token'),
  selectedGuild: JSON.parse(localStorage.getItem('selected_guild') || 'null'),
  isLoading: false,
  error: null,
  guilds: [],
  
  login: () => {
    window.location.href = `${API_URL}/auth/discord`;
  },
  
  logout: async () => {
    try {
      await api.post(`${API_URL}/auth/logout`);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('selected_guild');
      set({ 
        isAuthenticated: false,
        selectedGuild: null,
        guilds: [] 
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  fetchGuilds: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`${API_URL}/auth/guilds`);
      console.log("response de el fetchGuilds: ",response)
      console.log("response de el fetchGuilds de la data: ",response.data)
      set({ guilds: response.data, isLoading: false });
    } catch (error) {
      set({ 
        error: 'Failed to fetch guilds',
        isLoading: false 
      });
    }
  },
  
  selectGuild: (guild: DiscordGuild) => {
    localStorage.setItem('selected_guild', JSON.stringify(guild));
    set({ selectedGuild: guild });
  },

  checkAuthStatus: async () => {
    try {
      const validacionauth = api.get(`${API_URL}/auth/status`)
      console.log("validacion del auth: ulr :",validacionauth)
      const response = await validacionauth;
      console.log('Auth status response:', response.data);
      const isAuthenticated = response.data.authenticated;
      console.log("isAuthenticated: ",isAuthenticated)
      set({ isAuthenticated });
      if (isAuthenticated) {
        get().fetchGuilds();
      }
    } catch (error: any) {
      set({ isAuthenticated: false });
      // Solo borra los tokens si el error es 401
      if (error?.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      // Si es error de red, solo muestra mensaje o maneja el error, pero NO borres los tokens
    }
  },

  handleAuthCallback: async (code: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`${API_URL}/auth/discord/redirect?code=${code}`);
      console.log("response de el auth callback: ",response)
      console.log("response de el auth callback de la data: ",response.data)
      const { accessToken, refreshToken } = response.data;
      console.log("accessToken: ",accessToken)
      console.log("refreshToken: ",refreshToken)
      localStorage.setItem('access_token', accessToken);
      console.log("accessToken guardado: ",accessToken)
      localStorage.setItem('refresh_token', refreshToken);
      console.log("refreshToken guardado: ",refreshToken)
      
      set({ 
        isAuthenticated: true,
        isLoading: false 
      });
      
      await get().fetchGuilds();
    } catch (error) {
      set({ 
        error: 'Authentication failed',
        isLoading: false,
        isAuthenticated: false 
      });
      throw error;
    }
  }
}));