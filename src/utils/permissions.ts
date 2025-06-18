export const PERMISSION_MAP: Record<string, string> = {
  // General Permissions
  Administrator: 'Administrador',
  ManageGuild: 'Gestionar servidor',
  ManageRoles: 'Gestionar roles',
  ManageChannels: 'Gestionar canales',
  KickMembers: 'Expulsar miembros',
  BanMembers: 'Banear miembros',
  CreateInstantInvite: 'Crear invitaciones',
  ChangeNickname: 'Cambiar apodo',
  ManageNicknames: 'Gestionar apodos',
  ManageEmojisAndStickers: 'Gestionar emojis',
  ManageWebhooks: 'Gestionar webhooks',
  ViewAuditLog: 'Ver canales de auditoría',
  
  // Text Permissions
  ViewChannel: 'Ver canal',
  SendMessages: 'Enviar mensajes',
  SendTTSMessages: 'Enviar mensajes TTS',
  ManageMessages: 'Gestionar mensajes',
  EmbedLinks: 'Insertar enlaces',
  AttachFiles: 'Adjuntar archivos',
  ReadMessageHistory: 'Leer historial de mensajes',
  MentionEveryone: 'Mencionar @everyone',
  UseExternalEmojis: 'Usar emojis externos',
  AddReactions: 'Añadir reacciones',

  // Voice Permissions
  Connect: 'Conectar',
  Speak: 'Hablar',
  MuteMembers: 'Silenciar miembros',
  DeafenMembers: 'Ensordecer miembros',
  MoveMembers: 'Mover miembros',
  UseVAD: 'Usar actividad de voz',
  PrioritySpeaker: 'Prioridad al hablar',
};

/**
 * Translates a backend permission key to its UI display name.
 * @param backendKey The permission key from the API (e.g., 'ViewChannel').
 * @returns The UI display name (e.g., 'Ver canal') or the original key if not found.
 */
export const translatePermissionToUI = (backendKey: string): string => {
  return PERMISSION_MAP[backendKey] || backendKey;
};

/**
 * Translates an array of backend permission keys to their UI display names.
 * @param backendKeys Array of permission keys from the API.
 * @returns Array of UI display names.
 */
export const mapPermissionsToUI = (backendKeys: string[]): string[] => {
  return backendKeys.map(key => translatePermissionToUI(key));
};
