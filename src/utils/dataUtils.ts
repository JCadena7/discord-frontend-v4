import { Role, Category, Channel } from '../types/discord';

// Utilidades para operaciones con roles
export const updateRoleInCollection = (roles: Role[], roleId: string, newRole: Role): Role[] => {
  const existingIndex = roles.findIndex(r => r.id === roleId);
  if (existingIndex !== -1) {
    const newRoles = [...roles];
    newRoles[existingIndex] = newRole;
    return newRoles;
  }
  return [...roles, newRole];
};

export const removeRoleFromCollection = (roles: Role[], roleId: string): Role[] => {
  return roles.filter(r => r.id !== roleId);
};

// Utilidades para operaciones con canales
export const removeChannelFromCategory = (category: Category, channelId: string): Category => {
  return {
    ...category,
    channels: category.channels.filter(ch => ch.id !== channelId)
  };
};

export const addChannelToCategory = (category: Category, channel: Channel): Category => {
  return {
    ...category,
    channels: [...category.channels, channel]
  };
};

// Utilidades para validación
export const isValidRole = (role: any): role is Role => {
  return (
    typeof role.id === 'string' &&
    typeof role.name === 'string' &&
    Array.isArray(role.permissions) &&
    typeof role.color === 'string'
  );
};

export const isValidChannel = (channel: any): channel is Channel => {
  return (
    typeof channel.id === 'string' &&
    typeof channel.name === 'string' &&
    (channel.type === 'text' || channel.type === 'voice') &&
    Array.isArray(channel.roles) &&
    channel.roles.every(isValidRole)
  );
};

export const isValidCategory = (category: any): category is Category => {
  return (
    typeof category.id === 'string' &&
    typeof category.name === 'string' &&
    Array.isArray(category.channels) &&
    Array.isArray(category.roles) &&
    category.channels.every(isValidChannel) &&
    category.roles.every(isValidRole)
  );
};

export const isValidCategoriesStructure = (data: any): data is Category[] => {
  return Array.isArray(data) && data.every(isValidCategory);
};

// Utilidades para drag and drop
export const findChannelInCategories = (categories: Category[], channelId: string): { category: Category; channelIndex: number } | null => {
  for (const category of categories) {
    const channelIndex = category.channels.findIndex(ch => ch.id === channelId);
    if (channelIndex !== -1) {
      return { category, channelIndex };
    }
  }
  return null;
};

export const moveChannelBetweenCategories = (
  categories: Category[],
  channelId: string,
  targetCategoryId: string
): Category[] => {
  const newCategories = [...categories];
  const sourceInfo = findChannelInCategories(newCategories, channelId);
  
  if (!sourceInfo) return newCategories;
  
  const { category: sourceCategory, channelIndex } = sourceInfo;
  const [removedChannel] = sourceCategory.channels.splice(channelIndex, 1);
  
  const targetCategory = newCategories.find(cat => cat.id === targetCategoryId);
  if (targetCategory) {
    targetCategory.channels.push(removedChannel);
  }
  
  return newCategories;
};

export const reorderCategories = (
  categories: Category[],
  draggedCategoryId: string,
  targetCategoryId: string
): Category[] => {
  const newCategories = [...categories];
  const draggedIndex = newCategories.findIndex(cat => cat.id === draggedCategoryId);
  const targetIndex = newCategories.findIndex(cat => cat.id === targetCategoryId);
  
  if (draggedIndex !== -1 && targetIndex !== -1) {
    const [draggedCategory] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedCategory);
  }
  
  return newCategories;
};