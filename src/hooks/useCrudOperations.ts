import { useCallback, useRef } from 'react';
import { Category, Channel, Role } from '../types/discord';
// Removed: import { updateRoleInCollection, removeRoleFromCollection, removeChannelFromCategory, addChannelToCategory } from '../utils/dataUtils';

// Removed: const ROLE_COLORS = [ ... ];

import { ApiCategoryItem, ApiChannel } from '../types/discord'; // For store action payloads, removed ServerStructureData

interface UseCrudOperationsProps {
  categories: Category[]; // Still needed for copy operations and getEffectiveRoles
  // setCategories: (categories: Category[]) => void; // No longer used for paste
  addCategoryStore: (newCategoryData: Omit<ApiCategoryItem, 'id' | 'position' | 'channels' | 'permissions'>) => void;
  addChannelStore: (categoryId: string, newChannelData: Omit<ApiChannel, 'id' | 'position' | 'permissions'>) => void;
}

// Removed: interface RoleForm { ... }
// Removed: interface EditingRole { ... }

// Utilidad para clonar un canal con nuevos IDs para canal y roles
function cloneChannel(channel: Channel): Channel {
  return {
    ...channel,
    id: `ch-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    roles: channel.roles.map(role => ({
      ...role,
      id: `role-ch-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    }))
  };
}

// Utilidad para clonar una categoría con nuevos IDs para categoría, canales y roles
function cloneCategory(category: Category): Category {
  return {
    ...category,
    id: `cat-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    channels: category.channels.map(cloneChannel),
    roles: category.roles.map(role => ({
      ...role,
      id: `role-cat-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    }))
  };
}

export const useCrudOperations = ({ categories, addCategoryStore, addChannelStore }: UseCrudOperationsProps) => {
  // Removed: const [editingRole, setEditingRole] = useState<EditingRole | null>(null);
  // Removed: const [roleForm, setRoleForm] = useState<RoleForm>({ ... });

  // Portapapeles local para copiar/pegar
  const clipboardRef = useRef<{ type: 'category' | 'channel' | null, data: Category | Channel | null }>({ type: null, data: null });

  // Removed all deprecated CRUD function comments

  // --- COPIAR Y PEGAR ---
  const copyCategory = useCallback((categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      clipboardRef.current = { type: 'category', data: category };
    }
  }, [categories]);

  const pasteCategory = useCallback(() => {
    if (clipboardRef.current.type === 'category' && clipboardRef.current.data) {
      const clonedCategoryData = cloneCategory(clipboardRef.current.data as Category);
      // Note: This simple paste will not include channels/roles from the copied category.
      // A more complex "deep paste" would require a different store action or enhancement.
      addCategoryStore({
        name: clonedCategoryData.name,
        type: 'category',
        parentId: null,
        description: clonedCategoryData.description || undefined
      });
      clipboardRef.current = { type: null, data: null };
    }
  }, [addCategoryStore]);

  const copyChannel = useCallback((categoryId: string, channelId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    const channel = category?.channels.find(ch => ch.id === channelId);
    if (channel) {
      clipboardRef.current = { type: 'channel', data: channel };
    }
  }, [categories]);

  const pasteChannel = useCallback((targetCategoryId: string) => {
    if (clipboardRef.current.type === 'channel' && clipboardRef.current.data) {
      const clonedChannelData = cloneChannel(clipboardRef.current.data as Channel);
      // Note: This simple paste will not include roles from the copied channel.
      addChannelStore(targetCategoryId, {
        name: clonedChannelData.name,
        type: clonedChannelData.type,
        parentId: targetCategoryId,
        description: clonedChannelData.description || undefined
      });
      clipboardRef.current = { type: null, data: null };
    }
  }, [addChannelStore]);

  // Helper para obtener los roles efectivos de un canal (heredados + overrides)
  function getEffectiveRolesForChannel(category: Category, channel: Channel): Role[] {
    // Roles heredados de la categoría que NO están sobreescritos en el canal
    const inheritedRoles = category.roles.filter(
      catRole => !channel.roles.some(chanRole => chanRole.id === catRole.id)
    );
    // Los roles del canal sobrescriben a los heredados si hay conflicto de ID
    return [...inheritedRoles, ...channel.roles];
  }

  // Return only the functions that are still relevant
  return {
    getEffectiveRolesForChannel,
    clipboardRef, // Expose ref if DndView needs to check clipboard state
    
    // Copiar y pegar
    copyCategory,
    pasteCategory,
    copyChannel,
    pasteChannel,
  };
};