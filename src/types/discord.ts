export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
}

export interface DiscordChannel {
  id: string;
  type: ChannelType;
  name: string;
  position: number;
  parent_id: string | null;
  permission_overwrites: PermissionOverwrite[];
}

export interface DiscordCategory {
  id: string;
  type: ChannelType.GUILD_CATEGORY;
  name: string;
  position: number;
  permission_overwrites: PermissionOverwrite[];
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface PermissionOverwrite {
  id: string;
  type: number; // 0 for role, 1 for member
  allow: string;
  deny: string;
}

export enum ChannelType {
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_NEWS = 5,
  GUILD_STORE = 6,
  GUILD_NEWS_THREAD = 10,
  GUILD_PUBLIC_THREAD = 11,
  GUILD_PRIVATE_THREAD = 12,
  GUILD_STAGE_VOICE = 13,
  GUILD_FORUM = 15
}

// Interfaces para el componente DndView
export interface Role {
  id: string;
  name: string;
  permissions: string[];
  color: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  roles: Role[];
  description?: string;
  color?: string;
  isMultiple?: boolean;
  inheritPermissions?: boolean;
}

export interface Category {
  id: string;
  name: string;
  channels: Channel[];
  roles: Role[];
  description?: string;
  color?: string;
}

// Tipos para drag and drop
export type DraggedType = 'channel' | 'category' | 'role' | null;
export type DraggedItem = Channel | Category | Role | null;

// --- START: API Response Types for /discord-bot/:guildId/categories/with-channels ---

export interface ApiPermissionOverwrite {
  allow: string[];
  deny: string[];
}

export interface ApiItemPermission {
  roleId: string;
  roleName: string; // Included for convenience, though might not be in all API versions
  allow: string[]; // Assuming this is what 'allow' from the example means
  overwrites: ApiPermissionOverwrite; // Assuming this structure for overwrites
}

export interface ApiChannel { // Represents a channel within a category's 'channels' array
  id: string;
  name: string;
  type: 'text' | 'voice' | 'category' | string; // Allow for other types too
  position: number;
  rawPosition?: number; // As seen in example
  parentId: string | null;
  description?: string;
  permissions: ApiItemPermission[];
}

export interface ApiCategoryItem { // Represents a category item from the main 'items' array
  id: string;
  name: string;
  type: 'category';
  position: number;
  rawPosition?: number;
  parentId: string | null;
  description?: string;
  permissions: ApiItemPermission[];
  channels?: ApiChannel[]; // Channels nested under a category
}

export interface ApiChannelItem { // Represents a channel item from the main 'items' array (not nested)
  id: string;
  name: string;
  type: 'text' | 'voice' | string; // Not 'category'
  position: number;
  rawPosition?: number;
  parentId: string | null;
  description?: string;
  permissions: ApiItemPermission[];
}

// A union type for items in the 'items' array
export type ApiItem = ApiCategoryItem | ApiChannelItem;

export interface ApiRole {
  id: string;
  name: string;
  color: string; // Example shows hex color
  position: number;
  permissions: string[];
  mentionable: boolean;
  managed: boolean;
}

export interface ServerStructureData {
  serverId: string;
  serverName: string;
  roles: ApiRole[];
  items: ApiItem[]; // This will contain both categories and channels not parented
}

export interface ServerStructureApiResponse {
  status: number;
  message: string;
  data: ServerStructureData;
  meta?: { // Optional meta field
    totalCategories?: number;
    totalChannels?: number;
    lastUpdated?: string;
    version?: string;
  };
}

// --- END: API Response Types ---