import { create } from 'zustand';
import {
  ServerStructureData,
  ApiRole as ServerApiRole,
  ApiChannel, // Renamed from ServerApiChannel for clarity if used directly
  ApiCategoryItem, // Renamed from ServerApiCategoryItem
  ApiChannelItem, // Added for flat channel items
  ApiItemPermission,
  // ApiItem, // Removed, will use union type directly or specific types
} from '../types/discord';
import {
  Category as DndCategory,
  Channel as DndViewChannel, // Aliased to avoid conflict with ApiChannel if used in same scope
  Role as DndRole
} from '../types/discord';
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

  // More robust role transformation for categories/channels
  const getDndRoles = (itemApiPermissions: ApiItemPermission[] | undefined): DndRole[] => {
    if (!itemApiPermissions) return [];
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
      // item is ApiCategoryItem
      dndCategories.push({
        id: item.id,
        name: item.name,
        roles: getDndRoles(item.permissions),
        channels: (item.channels || []) // Handle if item.channels is undefined
          .map((apiCh: ApiChannel) => ({ // Explicitly type apiCh
            id: apiCh.id,
            name: apiCh.name,
            type: apiCh.type === 'text' ? 'text' : apiCh.type === 'voice' ? 'voice' : 'text', // Ensure valid DndViewChannel type
            roles: getDndRoles(apiCh.permissions),
            description: apiCh.description,
          }))
          .sort((a, b) => {
            // Find original positions from the source `item.channels`
            const originalChannels = (item as ApiCategoryItem).channels || [];
            const itemA_orig = originalChannels.find(ch => ch.id === a.id);
            const itemB_orig = originalChannels.find(ch => ch.id === b.id);
            return (itemA_orig?.position || 0) - (itemB_orig?.position || 0);
          }),
        description: item.description,
      });
    }
  });

  // If channels are also represented as flat items (ApiChannelItem) and need to be nested:
  items.forEach(item => {
    if (item.type !== 'category' && item.parentId) { // item is ApiChannelItem
      const parentDndCategory = dndCategories.find(cat => cat.id === item.parentId);
      if (parentDndCategory) {
        // Avoid duplicating if already processed from ApiCategoryItem.channels
        if (!parentDndCategory.channels.find(ch => ch.id === item.id)) {
          parentDndCategory.channels.push({
            id: item.id,
            name: item.name,
            type: item.type === 'text' ? 'text' : item.type === 'voice' ? 'voice' : 'text',
            roles: getDndRoles(item.permissions),
            description: item.description,
          });
          // Sort channels again if added this way
          parentDndCategory.channels.sort((a,b) => {
            const itemA_orig = items.find(i => i.id === a.id);
            const itemB_orig = items.find(i => i.id === b.id);
            return (itemA_orig?.position || 0) - (itemB_orig?.position || 0);
          });
        }
      }
    }
  });

  // Sort categories by position
  dndCategories.sort((a,b) => {
    const itemA = items.find(i => i.id === a.id && i.type === 'category') as ApiCategoryItem | undefined;
    const itemB = items.find(i => i.id === b.id && i.type === 'category') as ApiCategoryItem | undefined;
    return (itemA?.position || 0) - (itemB?.position || 0);
  });

  return dndCategories;
};


export const useServerStructureStore = create<ServerStructureState>()((set) => ({ // Removed 'get' as it's unused
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
      ...newCategoryData, // Should include name, description (optional)
      id: generateId('cat'),
      position: state.serverData.items.filter(item => item.type === 'category').length,
      channels: [],
      permissions: [],
      type: 'category', // Explicitly set type
      parentId: null,
      rawPosition: 0, // Assuming default rawPosition
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
            ? { ...item, ...updatedCategoryData } // item is already ApiCategoryItem due to type check
            : item
        ),
      }
    };
  }),

  deleteCategoryStore: (categoryId) => set(state => {
    if (!state.serverData) return state;
    const categoryToDelete = state.serverData.items.find(item => item.id === categoryId && item.type === 'category') as ApiCategoryItem | undefined;
    let channelIdsToDeleteInCat: string[] = [];
    if (categoryToDelete && categoryToDelete.channels) {
      channelIdsToDeleteInCat = categoryToDelete.channels.map(ch => ch.id);
    }
    const flatChildChannelIds = state.serverData.items
        .filter(item => item.parentId === categoryId && item.type !== 'category')
        .map(item => item.id);
    const allIdsToDelete = new Set([categoryId, ...channelIdsToDeleteInCat, ...flatChildChannelIds]);
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.filter(item => !allIdsToDelete.has(item.id)),
      }
    };
  }),

  addChannelStore: (categoryId, newChannelData) => set(state => {
    if (!state.serverData) return state;
    const parentCategoryIndex = state.serverData.items.findIndex(item => item.id === categoryId && item.type === 'category');
    if (parentCategoryIndex === -1) return state;

    const parentCategoryItem = state.serverData.items[parentCategoryIndex] as ApiCategoryItem;
    const newChannelId = generateId('ch');
    const newChannelPosition = (parentCategoryItem.channels || []).length;

    const newFlatChannel: ApiChannelItem = {
      name: newChannelData.name, // name and type are required
      type: newChannelData.type,
      description: newChannelData.description, // optional
      id: newChannelId,
      position: newChannelPosition,
      parentId: categoryId,
      permissions: [],
      rawPosition: 0, // Assuming default
    };

    const newApiChannelForNesting: ApiChannel = { ...newFlatChannel }; // ApiChannel and ApiChannelItem are structurally similar enough here

    const updatedParentCategoryItem: ApiCategoryItem = {
      ...parentCategoryItem,
      channels: [...(parentCategoryItem.channels || []), newApiChannelForNesting]
    };

    const newItems = [...state.serverData.items];
    newItems[parentCategoryIndex] = updatedParentCategoryItem; // Update the category in place
    newItems.push(newFlatChannel); // Add the new channel as a flat item

    return {
      serverData: { ...state.serverData, items: newItems }
    };
  }),

  updateChannelStore: (channelId, updatedChannelData) => set(state => {
    if (!state.serverData) return state;
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.map(item => {
          if (item.id === channelId && item.type !== 'category') { // item is ApiChannelItem
            return { ...item, ...updatedChannelData };
          }
          if (item.type === 'category') { // item is ApiCategoryItem
            const catItem = item as ApiCategoryItem;
            if (catItem.channels && catItem.channels.some(ch => ch.id === channelId)) {
              return {
                ...catItem,
                channels: catItem.channels.map(ch =>
                  ch.id === channelId ? { ...ch, ...updatedChannelData } : ch
                )
              };
            }
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
            if (item.type === 'category') {
              const catItem = item as ApiCategoryItem;
              if (catItem.channels && catItem.channels.some(ch => ch.id === channelId)) {
                return {
                  ...catItem,
                  channels: catItem.channels.filter(ch => ch.id !== channelId)
                };
              }
            }
            return item;
          }),
      }
    };
  }),

  addRoleToItemStore: (roleData, itemId, itemType) => {
    let newOrExistingRole: ServerApiRole | null = null;
    set(state => {
      if (!state.serverData) return state;

      let existingGlobalRole = state.serverData.roles.find(r => r.name === roleData.name);

      if (existingGlobalRole) {
        newOrExistingRole = existingGlobalRole;
      } else {
        newOrExistingRole = {
          name: roleData.name, // name, permissions, color are from Omit<ServerApiRole, 'id' | ...>
          permissions: roleData.permissions,
          color: roleData.color,
          id: generateId('role'),
          position: state.serverData.roles.length,
          managed: false,
          mentionable: false,
        };
      }

      const updatedItems = state.serverData.items.map(item => {
        // Ensure item is not undefined and has a 'type' and 'permissions'
        if (item && item.id === itemId && (item.type === itemType || (itemType === 'channel' && (item.type === 'text' || item.type === 'voice')))) {
          const typedItem = item as ApiCategoryItem | ApiChannelItem;
          const currentPermissions = typedItem.permissions || [];
          if (!currentPermissions.some(p => p.roleId === newOrExistingRole!.id)) {
            const newPermission: ApiItemPermission = {
              roleId: newOrExistingRole!.id,
              roleName: newOrExistingRole!.name,
              allow: newOrExistingRole!.permissions,
              overwrites: { allow: newOrExistingRole!.permissions, deny: [] }
            };
            return { ...typedItem, permissions: [...currentPermissions, newPermission] };
          }
        }
        return item;
      });

      let updatedGlobalRoles = state.serverData.roles;
      if (!existingGlobalRole && newOrExistingRole) {
         updatedGlobalRoles = [...state.serverData.roles, newOrExistingRole];
      }

      return {
        serverData: { ...state.serverData, items: updatedItems, roles: updatedGlobalRoles }
      };
    });
    return newOrExistingRole;
  },

  updateRoleInItemStore: (roleId, updatedRoleData, itemId, itemType) => set(state => {
    if (!state.serverData) return state;

    const updatedGlobalRoles = state.serverData.roles.map(role =>
      role.id === roleId ? { ...role, ...updatedRoleData } : role
    );

    const updatedItems = state.serverData.items.map(item => {
      if (item && item.id === itemId && (item.type === itemType || (itemType === 'channel' && (item.type === 'text' || item.type === 'voice')))) {
        const typedItem = item as ApiCategoryItem | ApiChannelItem;
        return {
          ...typedItem,
          permissions: (typedItem.permissions || []).map(perm => {
            if (perm.roleId === roleId) {
              const updatedPerm: ApiItemPermission = {...perm};
              if(updatedRoleData.name) updatedPerm.roleName = updatedRoleData.name;
              if(updatedRoleData.permissions) {
                updatedPerm.allow = updatedRoleData.permissions;
                updatedPerm.overwrites = { ...updatedPerm.overwrites, allow: updatedRoleData.permissions};
              }
              return updatedPerm;
            }
            return perm;
          })
        };
      }
      return item;
    });
    return { serverData: { ...state.serverData, items: updatedItems, roles: updatedGlobalRoles }};
  }),

  deleteRoleFromItemStore: (roleId, itemId, itemType) => set(state => {
    if (!state.serverData) return state;
    return {
      serverData: {
        ...state.serverData,
        items: state.serverData.items.map(item => {
          if (item && item.id === itemId && (item.type === itemType || (itemType === 'channel' && (item.type === 'text' || item.type === 'voice')))) {
            const typedItem = item as ApiCategoryItem | ApiChannelItem;
            return {
              ...typedItem,
              permissions: (typedItem.permissions || []).filter(perm => perm.roleId !== roleId)
            };
          }
          return item;
        }),
      }
    };
  }),

  moveCategoryStore: (draggedCategoryId, targetCategoryId) => set(state => {
    if (!state.serverData) return state;
    let items = [...state.serverData.items];
    const draggedItemIndex = items.findIndex(item => item.id === draggedCategoryId && item.type === 'category');
    if (draggedItemIndex === -1) return state;

    const draggedItem = items[draggedItemIndex] as ApiCategoryItem;
    items.splice(draggedItemIndex, 1); // Remove item from its original position

    let targetIndexInFullArray = -1;
    if (targetCategoryId) {
        // Find the actual index of the target category in the 'items' array
        const actualTargetIndex = items.findIndex(item => item.id === targetCategoryId && item.type === 'category');
        if (actualTargetIndex !== -1) {
            // Determine if the dragged item was before or after the target
            targetIndexInFullArray = actualTargetIndex > draggedItemIndex ? actualTargetIndex : actualTargetIndex;
        } else {
             // If targetCategoryId is null (drop at the end of categories), or target not found (should not happen)
            targetIndexInFullArray = items.filter(i => i.type === 'category').length;
        }
    } else { // Dropping at the end of all categories
        targetIndexInFullArray = items.filter(i => i.type === 'category').length;
    }

    // Find the correct splice index in the possibly modified 'items' array
    let currentCategoryCount = 0;
    let finalSpliceIndex = items.length; // Default to end if no categories or target is end
    for(let i=0; i < items.length; i++) {
        if(items[i].type === 'category') {
            if(currentCategoryCount === targetIndexInFullArray) {
                finalSpliceIndex = i;
                break;
            }
            currentCategoryCount++;
        }
    }
     if (targetCategoryId === null) { // If dropping at the very end of categories list
        let lastCatIdx = -1;
        for(let i = items.length -1; i >=0; i--) {
            if(items[i].type === 'category') {
                lastCatIdx = i;
                break;
            }
        }
        finalSpliceIndex = lastCatIdx + 1;
    }


    items.splice(finalSpliceIndex, 0, draggedItem);

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
    const draggedChannelFlat = items.find(item => item.id === draggedChannelId && item.type !== 'category') as ApiChannelItem | undefined;
    if (!draggedChannelFlat) return state;

    if (oldCategoryId && oldCategoryId !== targetCategoryId) {
      items = items.map(item => {
        if (item.id === oldCategoryId && item.type === 'category') {
          const catItem = item as ApiCategoryItem;
          return { ...catItem, channels: (catItem.channels || []).filter(ch => ch.id !== draggedChannelId) };
        }
        return item;
      });
    }

    items = items.filter(item => item.id !== draggedChannelId);
    const updatedDraggedChannelFlat: ApiChannelItem = { ...draggedChannelFlat, parentId: targetCategoryId };

    items = items.map(item => {
      if (item.id === targetCategoryId && item.type === 'category') {
        const catItem = item as ApiCategoryItem;
        let channels = (catItem.channels || []).filter(ch => ch.id !== draggedChannelId);

        const channelForNesting: ApiChannel = {
            id: updatedDraggedChannelFlat.id, name: updatedDraggedChannelFlat.name, type: updatedDraggedChannelFlat.type,
            position: newPositionInCategory !== undefined ? newPositionInCategory : channels.length,
            parentId: targetCategoryId, description: updatedDraggedChannelFlat.description, permissions: updatedDraggedChannelFlat.permissions,
        };

        if (newPositionInCategory !== undefined) channels.splice(newPositionInCategory, 0, channelForNesting);
        else channels.push(channelForNesting);

        channels = channels.map((ch, index) => ({ ...ch, position: index }));
        return { ...catItem, channels };
      }
      return item;
    });

    items.push(updatedDraggedChannelFlat);
    return { serverData: { ...state.serverData, items } };
  }),

  moveRoleStore: (roleId, sourceItemId, sourceType, targetItemId, targetType, newPositionInItem) => set(state => {
    if (!state.serverData) return state;
    let items = [...state.serverData.items];
    let rolePermissionToMove: ApiItemPermission | undefined;

    items = items.map(item => {
      if (item.id === sourceItemId && (item.type === sourceType || (sourceType === 'channel' && item.type !== 'category'))) {
        const typedItem = item as ApiCategoryItem | ApiChannelItem;
        rolePermissionToMove = (typedItem.permissions || []).find(p => p.roleId === roleId);
        if (rolePermissionToMove) {
          return { ...typedItem, permissions: (typedItem.permissions || []).filter(p => p.roleId !== roleId) };
        }
      }
      return item;
    });

    if (!rolePermissionToMove) return state;

    items = items.map(item => {
      if (item.id === targetItemId && (item.type === targetType || (targetType === 'channel' && item.type !== 'category'))) {
        const typedItem = item as ApiCategoryItem | ApiChannelItem;
        let permissions = [...(typedItem.permissions || [])].filter(p => p.roleId !== roleId);

        if (newPositionInItem !== undefined) permissions.splice(newPositionInItem, 0, rolePermissionToMove!);
        else permissions.push(rolePermissionToMove!);
        return { ...typedItem, permissions };
      }
      return item;
    });

    return { serverData: { ...state.serverData, items } };
  }),

  applyJsonToStore: (newServerData) => set(_ => { // `state` was unused, replaced with `_`
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