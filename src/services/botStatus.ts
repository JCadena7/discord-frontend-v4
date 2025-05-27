import api from './api';

export const getBotStatus = async (guildId: string) => {
  const response = await api.get(`/discord-bot/${guildId}/bot-status`);
  return response.data; // { present: boolean }
};
