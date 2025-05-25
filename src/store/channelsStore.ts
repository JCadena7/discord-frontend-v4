import { create } from 'zustand';
import { DiscordChannel } from '../types/discord';
import { channelsApi } from '../services/api';
import { useAuthStore } from './authStore';

interface ChannelsState {
  channels: DiscordChannel[];
  isLoading: boolean;
  error: string | null;
  fetchChannels: () => Promise<void>;
  addChannel: (channel: Partial<DiscordChannel>) => Promise<DiscordChannel>;
  updateChannel: (id: string, channel: Partial<DiscordChannel>) => Promise<DiscordChannel>;
  deleteChannel: (id: string) => Promise<void>;
  deleteMultipleChannels: (channelIds: string[]) => Promise<void>;
  fetchCategoryChannels: (categoryId: string) => Promise<void>;
}

export const useChannelsStore = create<ChannelsState>()((set) => ({
  channels: [],
  isLoading: false,
  error: null,
  
  fetchChannels: async () => {
    const selectedGuild = useAuthStore.getState().selectedGuild;
    if (!selectedGuild) return;

    set({ isLoading: true, error: null });
    try {
      const response = await channelsApi.getChannels(selectedGuild.id);
      set({ channels: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch channels', isLoading: false });
    }
  },

  addChannel: async (channel) => {
    const selectedGuild = useAuthStore.getState().selectedGuild;
    if (!selectedGuild) throw new Error('No guild selected');

    set({ isLoading: true, error: null });
    try {
      const response = await channelsApi.createChannel(selectedGuild.id, channel);
      set((state) => ({
        channels: [...state.channels, response.data],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to add channel', isLoading: false });
      throw error;
    }
  },

  updateChannel: async (id, channel) => {
    const selectedGuild = useAuthStore.getState().selectedGuild;
    if (!selectedGuild) throw new Error('No guild selected');

    set({ isLoading: true, error: null });
    try {
      const response = await channelsApi.updateChannel(selectedGuild.id, id, channel);
      set((state) => ({
        channels: state.channels.map((c) => (c.id === id ? response.data : c)),
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update channel', isLoading: false });
      throw error;
    }
  },

  deleteChannel: async (id) => {
    const selectedGuild = useAuthStore.getState().selectedGuild;
    if (!selectedGuild) throw new Error('No guild selected');

    set({ isLoading: true, error: null });
    try {
      await channelsApi.deleteChannel(selectedGuild.id, id);
      set((state) => ({
        channels: state.channels.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete channel', isLoading: false });
      throw error;
    }
  },

  deleteMultipleChannels: async (channelIds) => {
    const selectedGuild = useAuthStore.getState().selectedGuild;
    if (!selectedGuild) throw new Error('No guild selected');

    set({ isLoading: true, error: null });
    try {
      await channelsApi.deleteMultipleChannels(selectedGuild.id, channelIds);
      set((state) => ({
        channels: state.channels.filter((c) => !channelIds.includes(c.id)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete channels', isLoading: false });
      throw error;
    }
  },

  fetchCategoryChannels: async (categoryId) => {
    const selectedGuild = useAuthStore.getState().selectedGuild;
    if (!selectedGuild) throw new Error('No guild selected');

    set({ isLoading: true, error: null });
    try {
      const response = await channelsApi.getCategoryChannels(selectedGuild.id, categoryId);
      set((state) => ({
        channels: state.channels.map(c => 
          c.parent_id === categoryId ? response.data.find(newC => newC.id === c.id) || c : c
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to fetch category channels', isLoading: false });
      throw error;
    }
  },
}));