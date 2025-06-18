import { useState, useCallback, useRef } from 'react';
import { Category, Channel, Role } from '../types/discord';
import { updateRoleInCollection, removeRoleFromCollection, removeChannelFromCategory, addChannelToCategory } from '../utils/dataUtils';

const ROLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7DBDD'
];

import { ServerStructureData, ApiCategoryItem, ApiChannel } from '../types/discord'; // For store action payloads

interface UseCrudOperationsProps {
  categories: Category[]; // Still needed for copy operations and getEffectiveRoles
  // setCategories: (categories: Category[]) => void; // No longer used for paste
  addCategoryStore: (newCategoryData: Omit<ApiCategoryItem, 'id' | 'position' | 'channels' | 'permissions'>) => void;
  addChannelStore: (categoryId: string, newChannelData: Omit<ApiChannel, 'id' | 'position' | 'permissions'>) => void;
}

interface RoleForm {
  name: string;
  permissions: string[];
  color: string;
}

interface EditingRole {
  id: string;
  categoryId: string;
  channelId?: string;
}

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
  // const [editingRole, setEditingRole] = useState<EditingRole | null>(null); // Unused
  // const [roleForm, setRoleForm] = useState<RoleForm>({ // Unused
  // name: '',
  // permissions: [],
  // color: ROLE_COLORS[0]
  // });

  // Portapapeles local para copiar/pegar
  const clipboardRef = useRef<{ type: 'category' | 'channel' | null, data: Category | Channel | null }>({ type: null, data: null });

  // Deprecated CRUD operations - Handled by DndView.tsx directly with store actions
  // const addCategory = useCallback((): void => { ... });
  // const deleteCategory = useCallback((categoryId: string): void => { ... });
  // const addChannel = useCallback((categoryId: string): void => { ... });
  // const deleteChannel = useCallback((categoryId: string, channelId: string): void => { ... });
  // const addRole = useCallback((categoryId: string, channelId?: string): void => { ... });
  // const editRole = useCallback((role: Role, categoryId: string, channelId?: string): void => { ... });
  // const saveRole = useCallback((): void => { ... });
  // const deleteRole = useCallback((categoryId: string, roleId: string, channelId?: string): void => { ... });
  // const togglePermission = useCallback((permission: string): void => { ... });
  // const cancelRoleEdit = useCallback((): void => { ... });

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
      addCategoryStore({ name: clonedCategoryData.name, type: 'category' });
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
      addChannelStore(targetCategoryId, { name: clonedChannelData.name, type: clonedChannelData.type });
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