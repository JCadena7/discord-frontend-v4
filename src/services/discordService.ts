import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/';

export const getGuildData = async (guildId: string) => {
  try {
    const response = await axios.get(`${API_URL}/discord-bot/${guildId}/categories/with-channels`);
    return response.data;
  } catch (error) {
    console.error('Error fetching guild data:', error);
    throw error;
  }
};
