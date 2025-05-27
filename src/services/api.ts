import axios from 'axios';
import { DiscordRole, DiscordChannel, DiscordCategory } from '../types/discord';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include the token in each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    // console.log("token: ",token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log("Authorization header set:", config.headers.Authorization);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('Response error:', error.response?.data);
    const originalRequest = error.config;
    console.log("originalRequest: ",originalRequest)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Token expired, refreshing...');
      originalRequest._retry = true;
      console.log("originalRequest._retry: ",originalRequest._retry)
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.log("vamos a eliminar los tokens de refreshToken y accessToken: ",refreshToken)
          console.log('No refresh token available');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('No refresh token available'));
        }
        const response = await api.post(`${API_URL}/auth/refresh-token`, { refreshToken }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Refresh token response:', response.data);
        const { accessToken } = response.data;
        console.log("accessToken: ",accessToken)
        localStorage.setItem('access_token', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        console.log("Authorization header set:", originalRequest.headers.Authorization);
        return api(originalRequest);
      } catch (refreshError: any) {
        console.log('Refresh token error:', refreshError);
        // Solo borra los tokens si el error es 401
        if (refreshError?.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Channels API
export const channelsApi = {
  getChannels: (guildId: string) => api.get<DiscordChannel[]>(`/discord-bot/${guildId}/channels`),
  getChannel: (guildId: string, id: string) => api.get<DiscordChannel>(`/discord-bot/${guildId}/channels/${id}`),
  createChannel: (guildId: string, data: Partial<DiscordChannel>) => 
    api.post<DiscordChannel>(`/discord-bot/${guildId}/channels`, data),
  updateChannel: (guildId: string, id: string, data: Partial<DiscordChannel>) => 
    api.put<DiscordChannel>(`/discord-bot/${guildId}/channels/${id}`, data),
  deleteChannel: (guildId: string, id: string) => 
    api.delete(`/discord-bot/${guildId}/channels/${id}`),
  deleteMultipleChannels: (guildId: string, channelIds: string[]) => 
    api.delete(`/discord-bot/${guildId}/delete-channels`, { data: { channelIds } }),
  getCategoryChannels: (guildId: string, categoryId: string) => 
    api.get<DiscordChannel[]>(`/discord-bot/${guildId}/categories/${categoryId}/channels`),
};

// Categories API
export const categoriesApi = {
  getCategories: (guildId: string) => 
    api.get<DiscordCategory[]>(`/discord-bot/${guildId}/categories`),
  getCategory: (guildId: string, id: string) => 
    api.get<DiscordCategory>(`/discord-bot/${guildId}/categories/${id}`),
  createCategory: (guildId: string, data: Partial<DiscordCategory>) => 
    api.post<DiscordCategory>(`/discord-bot/${guildId}/categories`, data),
  updateCategory: (guildId: string, id: string, data: Partial<DiscordCategory>) => 
    api.put<DiscordCategory>(`/discord-bot/${guildId}/categories/${id}`, data),
  deleteCategory: (guildId: string, id: string) => 
    api.delete(`/discord-bot/${guildId}/categories/${id}`),
};

// Bot Status API
// Roles API
export const rolesApi = {
  getRoles: (guildId: string) => api.get<DiscordRole[]>(`/discord-bot/${guildId}/roles`),
  createRole: (guildId: string, data: Partial<DiscordRole>) => api.post<DiscordRole>(`/discord-bot/${guildId}/roles`, data),
  updateRole: (guildId: string, id: string, data: Partial<DiscordRole>) => api.put<DiscordRole>(`/discord-bot/${guildId}/roles/${id}`, data),
  deleteRole: (guildId: string, id: string) => api.delete(`/discord-bot/${guildId}/roles/${id}`),
};

export const botApi = {
  getBotStatus: (guildId: string) => 
    api.get(`/discord-bot/${guildId}/bot-status`),
};

export default api;