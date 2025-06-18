import { create } from 'zustand';
import {
  // Import new API response types
  ServerStructureApiResponse,
  ServerStructureData,
  ApiItem,
  ApiRole as ServerApiRole, // Alias to avoid conflict if any
  ApiChannel as ServerApiChannel,
  ApiCategoryItem as ServerApiCategoryItem,
  ApiItemPermission,
} from '../types/discord'; // Assuming new types are in discord.ts
import {
  Category as DndCategory, // This is the type DndView expects
  Channel as DndChannel,
  Role as DndRole
} from '../types/discord'; // Existing types for DndView
import { categoriesApi } from '../services/api';

interface ServerStructureState {
  serverData: ServerStructureData | null;
  isLoading: boolean;
  error: string | null;
  fetchServerStructure: (guildId: string) => Promise<void>;

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

// Helper function to transform ServerStructureData to DndCategory[]
const transformServerDataToDndCategories = (serverData: ServerStructureData | null): DndCategory[] => {
  if (!serverData) {
    return [];
  }

  const { items, roles: apiRoles } = serverData;

  const dndCategories: DndCategory[] = [];

  // Create a map of API roles for quick lookup
  const apiRolesMap = new Map<string, ServerApiRole>(apiRoles.map(r => [r.id, r]));

  // Function to transform API permissions to DndView Role permissions
  // This is a simplified transformation. DndView's Role.permissions is string[].
  // ApiItemPermission has allow/deny. ApiRole has a general permissions string[].
  // We'll use ApiItemPermission's 'allow' for now, or ApiRole's permissions if direct.
  const transformPermissions = (itemPermissions: ApiItemPermission[], roleIdToFilter?: string): DndRole[] => {
    return itemPermissions
      .map(p => {
        const apiRole = apiRolesMap.get(p.roleId);
        if (!apiRole) return null;
        // If roleIdToFilter is provided, only include that role
        if (roleIdToFilter && p.roleId !== roleIdToFilter) return null;

        return {
          id: apiRole.id,
          name: apiRole.name,
          color: apiRole.color, // API gives hex string, DndView expects string
          permissions: p.overwrites.allow || [], // Or combine with apiRole.permissions if needed
        };
      })
      .filter(Boolean) as DndRole[];
  };

  // More robust role transformation for categories/channels
  const getDndRoles = (itemApiPermissions: ApiItemPermission[]): DndRole[] => {
    return itemApiPermissions.map(apiPerm => {
      const roleDetail = apiRolesMap.get(apiPerm.roleId);
      return {
        id: apiPerm.roleId,
        name: roleDetail?.name || apiPerm.roleName || 'Unknown Role',
        color: roleDetail?.color || '#000000',
        permissions: apiPerm.overwrites.allow, // Or a combination if needed
      };
    });
  };


  // First pass: Create categories
  items.forEach(item => {
    if (item.type === 'category') {
      const categoryItem = item as ServerApiCategoryItem;
      dndCategories.push({
        id: categoryItem.id,
        name: categoryItem.name,
        // Transform category-specific roles. The example shows roles directly on categories.
        // The provided JSON has `permissions` on items, which are role-based.
        // The original DndView Category type has a `roles: Role[]`.
        // We need to decide how to populate this. If `categoryItem.permissions` are the category roles:
        roles: getDndRoles(categoryItem.permissions),
        channels: [], // Will be populated in the next pass
        description: categoryItem.description,
      });
    }
  });

  // Second pass: Populate channels within categories
  items.forEach(item => {
    if (item.type !== 'category' && item.parentId) {
      const channelItem = item as ServerApiChannel; // Or ApiChannelItem
      const parentCategory = dndCategories.find(cat => cat.id === channelItem.parentId);
      if (parentCategory) {
        parentCategory.channels.push({
          id: channelItem.id,
          name: channelItem.name,
          type: channelItem.type === 'voice' ? 'voice' : 'text', // Map API type to DndView type
          // Transform channel-specific roles
          roles: getDndRoles(channelItem.permissions),
          description: channelItem.description,
        });
      }
    }
  });

  // Sort channels within categories by position, similar to DndView example
  dndCategories.forEach(category => {
    const originalCategory = items.find(i => i.id === category.id) as ServerApiCategoryItem | undefined;
    if (originalCategory && originalCategory.channels) {
         // If API provides channels directly under category (as in example response's 'items' which has category with 'channels' array)
         category.channels = originalCategory.channels.map(apiCh => ({
            id: apiCh.id,
            name: apiCh.name,
            type: apiCh.type === 'voice' ? 'voice' : 'text',
            roles: getDndRoles(apiCh.permissions),
            description: apiCh.description,
         })).sort((a, b) => {
            const itemA = originalCategory.channels?.find(ch => ch.id === a.id);
            const itemB = originalCategory.channels?.find(ch => ch.id === b.id);
            return (itemA?.position || 0) - (itemB?.position || 0);
         });
    } else {
        // If channels are sourced from the flat 'items' list by parentId
        category.channels.sort((a,b) => {
            const itemA = items.find(i => i.id === a.id);
            const itemB = items.find(i => i.id === b.id);
            return (itemA?.position || 0) - (itemB?.position || 0);
        });
    }
  });


  // Sort categories by position
  dndCategories.sort((a,b) => {
    const itemA = items.find(i => i.id === a.id);
    const itemB = items.find(i => i.id === b.id);
    return (itemA?.position || 0) - (itemB?.position || 0);
  });

  return dndCategories;
};


export const useServerStructureStore = create<ServerStructureState>()((set, get) => ({
  serverData: null,
  isLoading: false,
  error: null,
  fetchServerStructure: async (guildId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Assuming categoriesApi.getCategoriesWithChannels returns the full ServerStructureApiResponse
      const response = await categoriesApi.getCategoriesWithChannels(guildId);
      // The actual server structure is in response.data.data based on the issue
      set({ serverData: response.data.data, isLoading: false });
    } catch (error) {
      let errorMessage = 'Failed to fetch server structure';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({ error: errorMessage, isLoading: false });
      console.error('Error fetching server structure:', error);
    }
  },

  // Add other actions like addCategory, updateCategory, deleteCategory later.
  // For now, focus on fetching and displaying.
  // These actions would need to manipulate the `serverData` state
  // and potentially call API endpoints.

  // Example of how a selector could be exposed if needed directly from store instance
  // (though typically you'd use a hook like `useStore(state => state.selectorName)` in the component)
  // getTransformedDndCategories: () => transformServerDataToDndCategories(get().serverData),

  // --- CRUD Actions Implementation ---
  addCategoryStore: (newCategoryData) => set(state => {
    if (!state.serverData) return state;
    const newCategory: ApiCategoryItem = {
      ...newCategoryData,
      id: generateId('cat'),
      position: state.serverData.items.filter(item => item.type === 'category').length,
      channels: [],
      permissions: [],
      type: 'category',
      parentId: null, // Categories are top-level
    };
    return {
      serverData: {
        ...state.serverData,
        items: [...state.serverData.items, newCategory],
      }
    };
  }),

  updateCategoryStore: (categoryId, updatedCategoryData) => set(state => {
    if (!state.serverData) return state;
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.map(item =>
          item.id === categoryId && item.type === 'category'
            ? { ...item, ...updatedCategoryData } as ApiCategoryItem
            : item
        ),
      }
    };
  }),

  deleteCategoryStore: (categoryId) => set(state => {
    if (!state.serverData) return state;
    // Also delete channels within this category
    const channelsInCategory = state.serverData.items.filter(item => item.parentId === categoryId);
    const channelIdsInCategory = channelsInCategory.map(ch => ch.id);
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.filter(item => item.id !== categoryId && !channelIdsInCategory.includes(item.id)),
      }
    };
  }),

  addChannelStore: (categoryId, newChannelData) => set(state => {
    if (!state.serverData) return state;
    const parentCategory = state.serverData.items.find(item => item.id === categoryId && item.type === 'category') as ApiCategoryItem | undefined;
    if (!parentCategory) return state;

    const newChannel: ApiChannel = {
      ...newChannelData,
      id: generateId('ch'),
      position: parentCategory.channels?.length || 0, // Position within the category
      permissions: [],
      parentId: categoryId,
      // type is part of newChannelData
    };

    const updatedItems = state.serverData.items.map(item => {
      if (item.id === categoryId && item.type === 'category') {
        return {
          ...item,
          channels: [...(item.channels || []), newChannel]
        } as ApiCategoryItem;
      }
      return item;
    });
    // Also add to flat list if structure requires it (current DndView uses nested, but API might be flat)
    // For now, assuming channels are primarily managed within category.channels for DndView
    // If the main `items` list needs to be flat, newChannel should also be added there.
    // Based on current transform, `items` is the source of truth.
    // So, we add the channel to items array directly.
    const newFlatChannel: ApiChannelItem = {
      id: newChannel.id,
      name: newChannel.name,
      type: newChannel.type, // 'text' | 'voice' | string
      position: newChannel.position, // This might need to be global position or category relative
      parentId: newChannel.parentId,
      description: newChannel.description,
      permissions: newChannel.permissions,
    };


    return {
      serverData: {
        ...state.serverData,
        items: [...state.serverData.items, newFlatChannel], // Add as a flat item
      }
    };
  }),

  updateChannelStore: (channelId, updatedChannelData) => set(state => {
    if (!state.serverData) return state;
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.map(item => {
          if (item.id === channelId && (item.type === 'text' || item.type === 'voice')) { // ApiChannelItem
            return { ...item, ...updatedChannelData } as ApiChannelItem;
          }
          if (item.type === 'category' && item.channels) { // ApiCategoryItem
            return {
              ...item,
              channels: item.channels.map(ch =>
                ch.id === channelId ? { ...ch, ...updatedChannelData } : ch
              )
            } as ApiCategoryItem;
          }
          return item;
        }),
      }
    };
  }),

  deleteChannelStore: (channelId) => set(state => {
    if (!state.serverData) return state;
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.filter(item => item.id !== channelId)
          .map(item => {
            if (item.type === 'category' && item.channels) {
              return {
                ...item,
                channels: item.channels.filter(ch => ch.id !== channelId)
              } as ApiCategoryItem;
            }
            return item;
          }),
      }
    };
  }),

  addRoleToItemStore: (roleData, itemId, itemType) => {
    let newRole: ServerApiRole | null = null;
    set(state => {
      if (!state.serverData) return state;

      // Check if role with same name already exists globally, if so, use that one's ID
      let existingGlobalRole = state.serverData.roles.find(r => r.name === roleData.name);

      if (existingGlobalRole) {
        newRole = existingGlobalRole;
      } else {
        newRole = {
          ...roleData,
          id: generateId('role'),
          position: state.serverData.roles.length, // Or manage position more carefully
          managed: false, // Default for new roles
          mentionable: false, // Default for new roles
        };
      }

      const updatedItems = state.serverData.items.map(item => {
        if (item.id === itemId && (item.type === itemType || (itemType === 'channel' && (item.type === 'text' || item.type === 'voice')))) {
          const currentPermissions = item.permissions || [];
          // Avoid adding duplicate role permissions
          if (!currentPermissions.some(p => p.roleId === newRole!.id)) {
            const newPermission: ApiItemPermission = {
              roleId: newRole!.id,
              roleName: newRole!.name,
              allow: newRole!.permissions, // Assuming newRole.permissions are 'allow'
              overwrites: { allow: newRole!.permissions, deny: [] } // Default deny to empty
            };
            return { ...item, permissions: [...currentPermissions, newPermission] };
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
        }
      };
    });
    return newRole; // Return the created/found role
  },

  updateRoleInItemStore: (roleId, updatedRoleData, itemId, itemType) => set(state => {
    if (!state.serverData) return state;

    // Update in global roles list
    const updatedGlobalRoles = state.serverData.roles.map(role =>
      role.id === roleId ? { ...role, ...updatedRoleData } : role
    );

    const updatedItems = state.serverData.items.map(item => {
      if (item.id === itemId && (item.type === itemType || (itemType === 'channel' && (item.type === 'text' || item.type === 'voice')))) {
        return {
          ...item,
          permissions: (item.permissions || []).map(perm => {
            if (perm.roleId === roleId) {
              const updatedPerm: ApiItemPermission = {...perm};
              if(updatedRoleData.name) updatedPerm.roleName = updatedRoleData.name;
              if(updatedRoleData.permissions) { // Assuming updatedRoleData.permissions is string[] for allow
                updatedPerm.allow = updatedRoleData.permissions;
                updatedPerm.overwrites = { ...updatedPerm.overwrites, allow: updatedRoleData.permissions};
              }
              // Note: Deny permissions are not handled in this simplified update.
              return updatedPerm;
            }
            return perm;
          })
        };
      }
      return item;
    });

    return {
      serverData: {
        ...state.serverData,
        items: updatedItems,
        roles: updatedGlobalRoles,
      }
    };
  }),

  deleteRoleFromItemStore: (roleId, itemId, itemType) => set(state => {
    if (!state.serverData) return state;
    // Note: This only removes the role's permission from the item, not from the global roles list.
    // Global role deletion would be a separate action if needed.
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.map(item => {
          if (item.id === itemId && (item.type === itemType || (itemType === 'channel' && (item.type === 'text' || item.type === 'voice')))) {
            return {
              ...item,
              permissions: (item.permissions || []).filter(perm => perm.roleId !== roleId)
            };
          }
          return item;
        }),
      }
    };
  }),

  // --- DND Actions Implementation ---
  moveCategoryStore: (draggedCategoryId, targetCategoryId) => set(state => {
    if (!state.serverData) return state;
    let items = [...state.serverData.items];
    const draggedItem = items.find(item => item.id === draggedCategoryId);
    if (!draggedItem || draggedItem.type !== 'category') return state;

    items = items.filter(item => item.id !== draggedCategoryId);

    let targetIndex = -1;
    if (targetCategoryId) {
      targetIndex = items.findIndex(item => item.id === targetCategoryId && item.type === 'category');
    } else { // Dropping at the end
      targetIndex = items.filter(i => i.type === 'category').length;
    }

    if (targetIndex === -1 && targetCategoryId) return state; // Target not found

    // Insert draggedItem at targetIndex among categories
    let categoryCount = 0;
    let finalIndex = -1;
    for(let i=0; i<items.length; i++){
      if(items[i].type === 'category') {
        if(categoryCount === targetIndex){
          finalIndex = i;
          break;
        }
        categoryCount++;
      }
    }
    if(finalIndex === -1) finalIndex = items.length; // If target is end or not found in loop

    items.splice(finalIndex, 0, draggedItem);

    // Re-assign positions for all categories
    let currentPosition = 0;
    items = items.map(item => {
      if (item.type === 'category') {
        return { ...item, position: currentPosition++ } as ApiCategoryItem;
      }
      return item;
    });

    return { serverData: { ...state.serverData, items } };
  }),

  moveChannelStore: (draggedChannelId, targetCategoryId, newPositionInCategory, oldCategoryId) => set(state => {
    if (!state.serverData) return state;
    let items = [...state.serverData.items];
    const draggedChannel = items.find(item => item.id === draggedChannelId && (item.type === 'text' || item.type === 'voice')) as ApiChannelItem | undefined;
    if (!draggedChannel) return state;

    // Remove from old category's list (if applicable, for nested structures)
    if (oldCategoryId && oldCategoryId !== targetCategoryId) {
      items = items.map(item => {
        if (item.id === oldCategoryId && item.type === 'category') {
          return { ...item, channels: (item.channels || []).filter(ch => ch.id !== draggedChannelId) } as ApiCategoryItem;
        }
        return item;
      });
    }

    // Remove from flat list to re-insert later
    items = items.filter(item => item.id !== draggedChannelId);

    // Update parentId and add to new category's list (for nested structures)
    draggedChannel.parentId = targetCategoryId;

    items = items.map(item => {
      if (item.id === targetCategoryId && item.type === 'category') {
        let channels = [...(item.channels || [])];
        // Remove if it exists (e.g. if only position changed within same category)
        channels = channels.filter(ch => ch.id !== draggedChannelId);

        const targetApiChannel: ApiChannel = { // Construct the ApiChannel for category's list
            id: draggedChannel.id,
            name: draggedChannel.name,
            type: draggedChannel.type,
            position: newPositionInCategory !== undefined ? newPositionInCategory : channels.length,
            parentId: targetCategoryId,
            description: draggedChannel.description,
            permissions: draggedChannel.permissions, // Ensure this is correct type
        };

        if (newPositionInCategory !== undefined) {
          channels.splice(newPositionInCategory, 0, targetApiChannel);
        } else {
          channels.push(targetApiChannel);
        }
        // Re-position channels within this category
        channels = channels.map((ch, index) => ({ ...ch, position: index }));
        return { ...item, channels } as ApiCategoryItem;
      }
      return item;
    });

    // Add/update in flat list with new parentId and re-calculate global position if necessary
    // For now, position in DndView is category-relative, so global position might not be critical here.
    // The flat list `items` should reflect the new parentId.
    // We already filtered it out, now add it back.
    const updatedDraggedChannelFlat : ApiChannelItem = {
        ...draggedChannel,
        parentId: targetCategoryId,
        // position might need adjustment if it's global. For now, assume it's updated correctly for category-relative.
    };
    items.push(updatedDraggedChannelFlat);


    return { serverData: { ...state.serverData, items } };
  }),

  moveRoleStore: (roleId, sourceItemId, sourceType, targetItemId, targetType, newPositionInItem) => set(state => {
    if (!state.serverData) return state;
    let items = [...state.serverData.items];
    let roleToMove: ApiItemPermission | undefined;

    // Find and remove role from source item
    items = items.map(item => {
      if (item.id === sourceItemId && (item.type === sourceType || (sourceType === 'channel' && (item.type === 'text' || item.type === 'voice')))) {
        roleToMove = (item.permissions || []).find(p => p.roleId === roleId);
        if (roleToMove) {
          return { ...item, permissions: (item.permissions || []).filter(p => p.roleId !== roleId) };
        }
      }
      return item;
    });

    if (!roleToMove) return state; // Role not found in source

    // Add role to target item
    items = items.map(item => {
      if (item.id === targetItemId && (item.type === targetType || (targetType === 'channel' && (item.type === 'text' || item.type === 'voice')))) {
        let permissions = [...(item.permissions || [])];
        // Remove if it already exists (e.g. if only reordering)
        permissions = permissions.filter(p => p.roleId !== roleId);

        if (newPositionInItem !== undefined) {
          permissions.splice(newPositionInItem, 0, roleToMove!);
        } else {
          permissions.push(roleToMove!);
        }
        return { ...item, permissions };
      }
      return item;
    });

    return { serverData: { ...state.serverData, items } };
  }),

  applyJsonToStore: (newServerData) => set(state => {
    // Basic validation (can be more extensive)
    if (!newServerData || !newServerData.items || !newServerData.roles) {
      console.error("Invalid data structure for JSON import.");
      return { ...state, error: "Invalid data structure for JSON import." };
    }
    return { serverData: newServerData, error: null, isLoading: false };
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