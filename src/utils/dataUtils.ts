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

// Funciones de conversión de formato

// Esta función convierte la estructura de datos del frontend a la que espera el backend.
export const convertToBackendFormat = (categories: Category[]): any[] => {
  const createPermissionOverwrite = (role: Role) => {
    const overwrite: any = { id: role.id };

    // Aplica la regla: solo incluir 'allow' si tiene permisos.
    // El modelo de frontend actual no tiene 'deny', por lo que se omite, 
    // cumpliendo la regla de no incluir 'deny' si está vacío.
    if (role.permissions && role.permissions.length > 0) {
      overwrite.allow = role.permissions;
    }

    return overwrite;
  };

  return categories.map(category => {
    const categoryPermissions = category.roles.map(createPermissionOverwrite);

    return {
      name: category.name,
      description: category.description || '',
      color: category.color || '#FFFFFF',
      permissions: categoryPermissions,
      channels: category.channels.map(channel => {
        const channelData: any = {
          name: channel.name,
          type: channel.type,
          description: channel.description || '',
          color: channel.color || '#FFFFFF',
          isMultiple: channel.isMultiple || false,
        };

        // Solo añadir 'permissions' si el canal NO hereda los de la categoría.
        if (channel.inheritPermissions === false) {
          channelData.permissions = channel.roles.map(createPermissionOverwrite);
        }

        return channelData;
      }),
    };
  });
};

// Esta función convierte la estructura de datos del backend a la que usa el frontend.
export const convertFromBackendFormat = (backendData: any[]): Category[] => {
  return backendData.map((category, index) => {
    // Convierte las sobrescrituras de permisos a roles de categoría
    const categoryRoles = (category.permissions || []).map((p: any) => ({
      id: p.id,
      name: `Rol (ID: ${p.id})`, // Nombre genérico, se puede mejorar si hay más datos
      permissions: p.allow || [],
      color: '#888888',
    }));

    return {
      id: `cat-${Date.now()}-${index}`,
      name: category.name,
      description: category.description,
      color: category.color,
      roles: categoryRoles,
      channels: (category.channels || []).map((channel: any, chIndex: number) => {
        // Convierte las sobrescrituras de permisos a roles de canal
        const channelRoles = (channel.permissions || []).map((p: any) => ({
          id: p.id,
          name: `Rol (ID: ${p.id})`,
          permissions: p.allow || [],
          color: '#888888',
        }));

        return {
          id: `ch-${Date.now()}-${index}-${chIndex}`,
          name: channel.name,
          type: channel.type,
          description: channel.description,
          color: channel.color,
          isMultiple: channel.isMultiple,
          roles: channelRoles,
          inheritPermissions: channelRoles.length === 0,
        };
      }),
    };
  });
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