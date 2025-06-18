import { create } from 'zustand';
import {
  ServerStructureData,
  ApiRole as ServerApiRole,
  ApiChannel,
  ApiCategoryItem,
  ApiChannelItem,
  ApiItemPermission,
  Category as DndCategory,
  Channel as DndChannel,
  Role as DndRole,
} from '../types/discord';
import { categoriesApi } from '../services/api';
import { mapPermissionsToUI } from '../utils/permissions';

interface ServerStructureState {
  serverData: ServerStructureData | null;
  isDirty: boolean; // To track unsaved changes
  isLoading: boolean;
  error: string | null;
  fetchServerStructure: (guildId: string) => Promise<void>;
  updateServerStructure: (guildId: string) => Promise<void>; // To save all changes

  // CRUD Actions - Local Updates Only
  addCategoryStore: (newCategoryData: Omit<ApiCategoryItem, 'id' | 'position' | 'channels' | 'permissions'>) => void;
  updateCategoryStore: (categoryId: string, updatedCategoryData: Partial<ApiCategoryItem>) => void;
  deleteCategoryStore: (categoryId: string) => void;

  addChannelStore: (categoryId: string, newChannelData: Omit<ApiChannel, 'id' | 'position' | 'permissions'>) => void;
  updateChannelStore: (channelId: string, updatedChannelData: Partial<ApiChannel>) => void;
  deleteChannelStore: (channelId: string) => void;

  addRoleToItemStore: (roleData: Omit<ServerApiRole, 'id' | 'position' | 'managed' | 'mentionable'>, itemId: string, itemType: 'category' | 'channel') => ServerApiRole | null;
  updateRoleInItemStore: (roleId: string, updatedRoleData: Partial<ServerApiRole>, itemId: string, itemType: 'category' | 'channel') => void;
  deleteRoleFromItemStore: (roleId: string, itemId: string, itemType: 'category' | 'channel') => void;

  // DND Actions - Local Updates Only
  moveCategoryStore: (draggedCategoryId: string, targetCategoryId: string | null) => void;
  moveChannelStore: (draggedChannelId: string, targetCategoryId: string, newPositionInCategory?: number, oldCategoryId?: string) => void;
  moveRoleStore: (roleId: string, sourceItemId: string, sourceType: 'category' | 'channel', targetItemId: string, targetType: 'category' | 'channel', newPositionInItem?: number) => void;

  // JSON Import Action
  applyJsonToStore: (newServerData: ServerStructureData) => void;
}

// Helper to generate simple unique IDs (for local use)
const generateId = (prefix: string = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper function to check if a role has actual permission overwrites
const hasPermissionOverwrites = (permission: ApiItemPermission): boolean => {
  const { overwrites } = permission;
  return (overwrites.allow && overwrites.allow.length > 0) || 
         (overwrites.deny && overwrites.deny.length > 0);
};

// Helper function to transform ServerStructureData to DndCategory[]
const transformServerDataToDndCategories = (serverData: ServerStructureData | null): DndCategory[] => {
  if (!serverData) {
    return [];
  }

  const { items, roles: apiRoles } = serverData;

  const dndCategories: DndCategory[] = [];

  // Create a map of API roles for quick lookup
  const apiRolesMap = new Map<string, ServerApiRole>(apiRoles.map(r => [r.id, r]));

  // More robust role transformation for categories/channels - ONLY include roles with actual overwrites
  const getDndRoles = (itemApiPermissions: ApiItemPermission[]): DndRole[] => {
    return itemApiPermissions
      .filter(apiPerm => hasPermissionOverwrites(apiPerm)) // Filter out roles without overwrites
      .map(apiPerm => {
        const roleDetail = apiRolesMap.get(apiPerm.roleId);
        return {
          id: apiPerm.roleId,
          name: roleDetail?.name || apiPerm.roleName || 'Unknown Role',
          color: roleDetail?.color || '#000000',
          // Mapea los permisos específicos de esta categoría/canal
          permissions: mapPermissionsToUI(apiPerm.overwrites.allow), // Traduce las claves de permiso a etiquetas de UI
          // Si necesitas también los permisos denegados, podrías agregar:
          // deniedPermissions: mapPermissionsToUI(apiPerm.overwrites.deny),
        };
      });
  };

  // First pass: Create categories
  items.forEach(item => {
    if (item.type === 'category') {
      const categoryItem = item as ApiCategoryItem;
      dndCategories.push({
        id: categoryItem.id,
        name: categoryItem.name,
        // Transform category-specific roles - only those with actual overwrites
        roles: getDndRoles(categoryItem.permissions),
        channels: [], // Will be populated in the next pass
        description: categoryItem.description,
      });
    }
  });

  // Second pass: Populate channels within categories
  items.forEach(item => {
    if (item.type !== 'category' && item.parentId) {
      const channelItem = item as ApiChannelItem; // This is a flat channel item
      const parentCategory = dndCategories.find(cat => cat.id === channelItem.parentId);
      if (parentCategory) {
        parentCategory.channels.push({
          id: channelItem.id,
          name: channelItem.name,
          type: (channelItem.type === 'voice' ? 'voice' : 'text') as 'text' | 'voice', // Map API type to DndView type
          // Transform channel-specific roles - only those with actual overwrites
          roles: getDndRoles(channelItem.permissions),
          description: channelItem.description,
        });
      }
    }
  });

  // Sort channels within categories by position, similar to DndView example
  dndCategories.forEach(category => {
    const originalCategory = items.find(i => i.id === category.id) as ApiCategoryItem | undefined;
    if (originalCategory && originalCategory.channels) {
         // If API provides channels directly under category (as in example response's 'items' which has category with 'channels' array)
         category.channels = originalCategory.channels.map((apiCh: ApiChannel) => ({
            id: apiCh.id,
            name: apiCh.name,
            type: (apiCh.type === 'voice' ? 'voice' : 'text') as 'text' | 'voice',
            roles: getDndRoles(apiCh.permissions),
            description: apiCh.description,
         })).sort((a: DndChannel, b: DndChannel) => {
            const itemA = originalCategory.channels?.find((ch: ApiChannel) => ch.id === a.id);
            const itemB = originalCategory.channels?.find((ch: ApiChannel) => ch.id === b.id);
            return (itemA?.position || 0) - (itemB?.position || 0);
         });
    } else {
        // If channels are sourced from the flat 'items' list by parentId
        category.channels.sort((a: DndChannel, b: DndChannel) => {
            const itemA = items.find(i => i.id === a.id);
            const itemB = items.find(i => i.id === b.id);
            return (itemA?.position || 0) - (itemB?.position || 0);
        });
    }
  });

  // Sort categories by position
  dndCategories.sort((a: DndCategory, b: DndCategory) => {
    const itemA = items.find(i => i.id === a.id);
    const itemB = items.find(i => i.id === b.id);
    return (itemA?.position || 0) - (itemB?.position || 0);
  });

  return dndCategories;
};

export const useServerStructureStore = create<ServerStructureState>()((set, get) => ({
  serverData: null,
  isDirty: false,
  isLoading: false,
  error: null,

  fetchServerStructure: async (guildId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoriesApi.getCategoriesWithChannels(guildId);
      set({ serverData: response.data.data, isLoading: false, isDirty: false }); // Reset dirty flag on fetch
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch server structure';
      set({ error: errorMessage, isLoading: false });
      console.error('Error fetching server structure:', error);
    }
  },

  updateServerStructure: async (guildId: string) => {
    set({ isLoading: true, error: null });
    const serverData = get().serverData;
    if (!serverData) {
      set({ isLoading: false, error: 'No server data to save.' });
      return;
    }
    try {
      await categoriesApi.updateServerStructure(guildId, serverData);
      set({ isLoading: false, isDirty: false }); // Reset dirty flag on successful save
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save server structure';
      set({ error: errorMessage, isLoading: false });
      console.error('Error saving server structure:', error);
    }
  },

  applyJsonToStore: (newServerData: ServerStructureData) => {
    set({ serverData: newServerData, isDirty: true });
  },

  // --- CRUD Actions Implementation ---
  addCategoryStore: (newCategoryData: Omit<ApiCategoryItem, 'id' | 'position' | 'channels' | 'permissions'>) => set(state => {
    if (!state.serverData) return state;
    const newCategory: ApiCategoryItem = {
      ...newCategoryData,
      id: generateId('cat'),
      position: state.serverData.items.filter(item => item.type === 'category').length,
      channels: [],
      permissions: [],
      type: 'category',
      parentId: null,
    };
    return {
      serverData: {
        ...state.serverData,
        items: [...state.serverData.items, newCategory],
      },
      isDirty: true
    };
  }),

  updateCategoryStore: (categoryId: string, updatedCategoryData: Partial<ApiCategoryItem>) => set(state => {
    if (!state.serverData) return state;
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.map(item =>
          item.id === categoryId && item.type === 'category'
            ? { ...item, ...updatedCategoryData } as ApiCategoryItem
            : item
        ),
      },
      isDirty: true
    };
  }),

  deleteCategoryStore: (categoryId: string) => set(state => {
    if (!state.serverData) return state;
    const channelsInCategory = state.serverData.items.filter(item => item.parentId === categoryId);
    const channelIdsInCategory = channelsInCategory.map(ch => ch.id);
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.filter(item => item.id !== categoryId && !channelIdsInCategory.includes(item.id)),
      },
      isDirty: true
    };
  }),

  addChannelStore: (categoryId: string, newChannelData: Omit<ApiChannel, 'id' | 'position' | 'permissions'>) => set(state => {
    if (!state.serverData) return state;
    const parentCategory = state.serverData.items.find(item => item.id === categoryId && item.type === 'category') as ApiCategoryItem | undefined;
    if (!parentCategory) return state;

    const newChannel: ApiChannel = {
      ...newChannelData,
      id: generateId('ch'),
      position: parentCategory.channels?.length || 0,
      permissions: [],
      parentId: categoryId,
    };

    const updatedItems = state.serverData.items.map(item => {
      if (item.id === categoryId && item.type === 'category') {
        const category = item as ApiCategoryItem;
        return {
          ...category,
          channels: [...(category.channels || []), newChannel]
        } as ApiCategoryItem;
      }
      return item;
    });

    const newFlatChannel: ApiChannelItem = {
      id: newChannel.id,
      name: newChannel.name,
      type: newChannel.type,
      position: newChannel.position,
      parentId: newChannel.parentId,
      description: newChannel.description,
      permissions: newChannel.permissions,
    };

    return {
      serverData: {
        ...state.serverData,
        items: [...updatedItems, newFlatChannel],
      },
      isDirty: true
    };
  }),

  updateChannelStore: (channelId: string, updatedChannelData: Partial<ApiChannel>) => set(state => {
    if (!state.serverData) return state;
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.map(item => {
          if (item.id === channelId && (item.type === 'text' || item.type === 'voice')) {
            return { ...item, ...updatedChannelData } as ApiChannelItem;
          }
          if (item.type === 'category') {
            const category = item as ApiCategoryItem;
            const channelIndex = (category.channels || []).findIndex((ch: ApiChannel) => ch.id === channelId);
            if (channelIndex !== -1 && category.channels) {
              const updatedChannels = [...category.channels];
              updatedChannels[channelIndex] = { ...updatedChannels[channelIndex], ...updatedChannelData };
              return { ...category, channels: updatedChannels } as ApiCategoryItem;
            }
          }
          return item;
        }),
      },
      isDirty: true
    };
  }),

  deleteChannelStore: (channelId: string) => set(state => {
    if (!state.serverData) return state;
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.filter(item => item.id !== channelId)
          .map(item => {
            if (item.type === 'category') {
              const category = item as ApiCategoryItem;
              return {
                ...category,
                channels: (category.channels || []).filter((ch: ApiChannel) => ch.id !== channelId)
              } as ApiCategoryItem;
            }
            return item;
          }),
      },
      isDirty: true
    };
  }),

  addRoleToItemStore: (roleData: Omit<ServerApiRole, 'id' | 'position' | 'managed' | 'mentionable'>, itemId: string, itemType: 'category' | 'channel') => {
    let newRole: ServerApiRole | null = null;
    set(state => {
      if (!state.serverData) return state;

      let existingGlobalRole = state.serverData.roles.find(r => r.name === roleData.name);

      if (existingGlobalRole) {
        newRole = existingGlobalRole;
      } else {
        newRole = {
          ...roleData,
          id: generateId('role'),
          position: state.serverData.roles.length,
          managed: false,
          mentionable: false,
        };
      }

      const updatedItems = state.serverData.items.map(item => {
        if (item.id === itemId && (item.type === itemType || (itemType === 'channel' && (item.type === 'text' || item.type === 'voice')))) {
          const currentPermissions = item.permissions || [];
          if (!currentPermissions.some(p => p.roleId === newRole!.id)) {
            // Ensure newPermissionEntry strictly follows the nested overwrites structure
            const newPermissionEntry: ApiItemPermission = {
              roleId: newRole!.id,
              roleName: newRole!.name, // roleName is part of ApiItemPermission
              overwrites: {
                allow: newRole!.permissions, // newRole.permissions is string[] (permission names)
                deny: [] // Default deny to empty array
              }
              // Do not include a top-level 'allow' here if ApiItemPermission is strictly for the array
            };
            return { ...item, permissions: [...currentPermissions, newPermissionEntry] };
          }
        }
        return item;
      });

      let updatedGlobalRoles = state.serverData.roles;
      if (!existingGlobalRole && newRole) {
         updatedGlobalRoles = [...state.serverData.roles, newRole];
      }

      return {
        serverData: {
          ...state.serverData,
          items: updatedItems,
          roles: updatedGlobalRoles,
        },
        isDirty: true
      };
    });
    return newRole;
  },

  updateRoleInItemStore: (roleId: string, updatedRoleData: Partial<ServerApiRole>, itemId: string, itemType: 'category' | 'channel') => set(state => {
    if (!state.serverData) return state;

    const updatedGlobalRoles = state.serverData.roles.map(role =>
      role.id === roleId ? { ...role, ...updatedRoleData } : role
    );

    const updatedItems = state.serverData.items.map(item => {
      if (item.id === itemId && (item.type === itemType || (itemType === 'channel' && (item.type === 'text' || item.type === 'voice')))) {
        const updatedPermissions = (item.permissions || []).map(perm => {
          if (perm.roleId === roleId) {
            const updatedPerm = { ...perm };
            if (updatedRoleData.name) {
              updatedPerm.roleName = updatedRoleData.name;
            }
            if (updatedRoleData.permissions) {
              updatedPerm.overwrites.allow = updatedRoleData.permissions;
            }
            return updatedPerm;
          }
          return perm;
        });
        return { ...item, permissions: updatedPermissions };
      }
      return item;
    });

    return {
      serverData: {
        ...state.serverData,
        items: updatedItems,
        roles: updatedGlobalRoles,
      },
      isDirty: true
    };
  }),

  deleteRoleFromItemStore: (roleId: string, itemId: string, itemType: 'category' | 'channel') => set(state => {
    if (!state.serverData) return state;
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.map(item => {
          if (item.id === itemId && (item.type === itemType || (itemType === 'channel' && (item.type === 'text' || item.type === 'voice')))) {
            return { ...item, permissions: (item.permissions || []).filter(p => p.roleId !== roleId) };
          }
          return item;
        }),
      },
      isDirty: true
    };
  }),

  // --- DND Actions Implementation ---
  moveCategoryStore: (draggedCategoryId: string, targetCategoryId: string | null) => set(state => {
    if (!state.serverData) return state;
    let items = [...state.serverData.items];
    const draggedItem = items.find(item => item.id === draggedCategoryId);
    if (!draggedItem || draggedItem.type !== 'category') return state;

    const draggedIndex = items.findIndex(item => item.id === draggedCategoryId);
    items.splice(draggedIndex, 1);

    if (targetCategoryId) {
      const targetIndex = items.findIndex(item => item.id === targetCategoryId);
      items.splice(targetIndex, 0, draggedItem);
    } else {
      items.push(draggedItem);
    }

    items.filter(item => item.type === 'category').forEach((item, index) => {
      item.position = index;
    });

    return { serverData: { ...state.serverData, items }, isDirty: true };
  }),

  moveChannelStore: (draggedChannelId: string, targetCategoryId: string, newPositionInCategory?: number, oldCategoryId?: string) => set(state => {
    if (!state.serverData) return state;
    let items = [...state.serverData.items];
    const draggedChannel = items.find(item => item.id === draggedChannelId && (item.type === 'text' || item.type === 'voice')) as ApiChannelItem | undefined;
    if (!draggedChannel) return state;

    // Remove from old category's channel list and flat list
    if (oldCategoryId) {
      const oldCategoryIndex = items.findIndex(item => item.id === oldCategoryId);
      if (oldCategoryIndex !== -1) {
        const oldCategory = items[oldCategoryIndex] as ApiCategoryItem;
        oldCategory.channels = (oldCategory.channels || []).filter(ch => ch.id !== draggedChannelId);
      }
    }
    const draggedItemIndex = items.findIndex(item => item.id === draggedChannelId);
    if (draggedItemIndex !== -1) {
      items.splice(draggedItemIndex, 1);
    }

    // Add to new category's channel list and update parentId
    draggedChannel.parentId = targetCategoryId;
    const targetCategoryIndex = items.findIndex(item => item.id === targetCategoryId);
    if (targetCategoryIndex !== -1) {
      const targetCategory = items[targetCategoryIndex] as ApiCategoryItem;
      const channelForCategory : ApiChannel = {
          id: draggedChannel.id,
          name: draggedChannel.name,
          type: draggedChannel.type,
          position: newPositionInCategory ?? (targetCategory.channels?.length || 0),
          permissions: draggedChannel.permissions,
          parentId: targetCategoryId,
          description: draggedChannel.description
      };
      
      if (newPositionInCategory !== undefined) {
        targetCategory.channels?.splice(newPositionInCategory, 0, channelForCategory);
      } else {
        targetCategory.channels = [...(targetCategory.channels || []), channelForCategory];
      }

      // Re-position channels in target category
      targetCategory.channels?.forEach((ch, index) => { ch.position = index; });
    }
    
    // Add channel back to flat list with updated parentId
    items.push(draggedChannel);

    // Re-position channels in old category if it exists
    if (oldCategoryId && oldCategoryId !== targetCategoryId) {
        const oldCategoryIndex = items.findIndex(item => item.id === oldCategoryId);
        if(oldCategoryIndex !== -1){
            const oldCategory = items[oldCategoryIndex] as ApiCategoryItem;
            oldCategory.channels?.forEach((ch, index) => { ch.position = index; });
        }
    }
    
    return { serverData: { ...state.serverData, items }, isDirty: true };
  }),

  moveRoleStore: (roleId, sourceItemId, _sourceType, targetItemId, _targetType, newPositionInItem) => set(state => {
    if (!state.serverData) return state;
    let items = [...state.serverData.items];
    let roleToMove: ApiItemPermission | undefined;
  
    // Find and remove role from source item
    const sourceItemIndex = items.findIndex(item => item.id === sourceItemId);
    if (sourceItemIndex !== -1) {
      const sourceItem = items[sourceItemIndex];
      const permIndex = (sourceItem.permissions || []).findIndex(p => p.roleId === roleId);
      if (permIndex !== -1) {
        roleToMove = sourceItem.permissions![permIndex];
        sourceItem.permissions!.splice(permIndex, 1);
      }
    }
  
    if (!roleToMove) return state;
  
    // Add role to target item
    const targetItemIndex = items.findIndex(item => item.id === targetItemId);
    if (targetItemIndex !== -1) {
      const targetItem = items[targetItemIndex];
      if (!targetItem.permissions) {
        targetItem.permissions = [];
      }
      if (newPositionInItem !== undefined) {
        targetItem.permissions.splice(newPositionInItem, 0, roleToMove);
      } else {
        targetItem.permissions.push(roleToMove);
      }
    }
  
    // ✅ AGREGAR EL RETURN DEL NUEVO ESTADO
    return { 
      serverData: { ...state.serverData, items }, 
      isDirty: true 
    };
  }),

}));

// Selector hook to get transformed categories for DndView
export const useDndViewCategories = () => {
  const serverData = useServerStructureStore((state) => state.serverData);
  // Memoize the transformation if serverData is large or transformation is complex
  // For now, direct call:
  return transformServerDataToDndCategories(serverData);
};

// Selector for top-level roles (if DndView needs them separately)
export const useServerRoles = () => {
  return useServerStructureStore((state) => state.serverData?.roles || []);
}

// Selector hook for server ID and name
export const useServerInfo = () => {
  return useServerStructureStore((state) => ({
    serverId: state.serverData?.serverId,
    serverName: state.serverData?.serverName,
  }));
};