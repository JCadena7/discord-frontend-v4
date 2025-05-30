import { useState, useCallback, useRef } from 'react';
import { Category, Channel, Role } from '../types/discord';
import { updateRoleInCollection, removeRoleFromCollection, removeChannelFromCategory, addChannelToCategory } from '../utils/dataUtils';

const ROLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7DBDD'
];

interface UseCrudOperationsProps {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
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

export const useCrudOperations = ({ categories, setCategories }: UseCrudOperationsProps) => {
  const [editingRole, setEditingRole] = useState<EditingRole | null>(null);
  const [roleForm, setRoleForm] = useState<RoleForm>({
    name: '',
    permissions: [],
    color: ROLE_COLORS[0]
  });

  // Portapapeles local para copiar/pegar
  const clipboardRef = useRef<{ type: 'category' | 'channel' | null, data: Category | Channel | null }>({ type: null, data: null });

  // Operaciones de categorías
  const addCategory = useCallback((): void => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: `Nueva Categoría ${categories.length + 1}`,
      channels: [],
      roles: []
    };
    setCategories([...categories, newCategory]);
  }, [categories, setCategories]);

  const deleteCategory = useCallback((categoryId: string): void => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
  }, [categories, setCategories]);

  // Operaciones de canales
  const addChannel = useCallback((categoryId: string): void => {
    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      name: `nuevo-canal-${Math.floor(Math.random() * 100)}`,
      type: 'text',
      roles: []
    };
    
    setCategories(
      categories.map(cat => 
        cat.id === categoryId 
          ? addChannelToCategory(cat, newChannel)
          : cat
      )
    );
  }, [categories, setCategories]);

  const deleteChannel = useCallback((categoryId: string, channelId: string): void => {
    setCategories(
      categories.map(cat =>
        cat.id === categoryId
          ? removeChannelFromCategory(cat, channelId)
          : cat
      )
    );
  }, [categories, setCategories]);

  // Operaciones de roles
  const addRole = useCallback((categoryId: string, channelId?: string): void => {
    setEditingRole({ id: '', categoryId, channelId });
    setRoleForm({
      name: '',
      permissions: [],
      color: ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)]
    });
  }, []);

  const editRole = useCallback((role: Role, categoryId: string, channelId?: string): void => {
    setEditingRole({ id: role.id, categoryId, channelId });
    setRoleForm({
      name: role.name,
      permissions: [...role.permissions],
      color: role.color
    });
  }, []);

  const saveRole = useCallback((): void => {
    if (!editingRole || !roleForm.name.trim()) return;

    const newRole: Role = {
      id: editingRole.id || `role-${Date.now()}`,
      name: roleForm.name.trim(),
      permissions: roleForm.permissions,
      color: roleForm.color
    };

    setCategories(
      categories.map(cat => {
        if (cat.id === editingRole.categoryId) {
          if (editingRole.channelId) {
            // Rol de canal
            return {
              ...cat,
              channels: cat.channels.map(ch => {
                if (ch.id === editingRole.channelId) {
                  return {
                    ...ch,
                    roles: updateRoleInCollection(ch.roles, editingRole.id, newRole)
                  };
                }
                return ch;
              })
            };
          } else {
            // Rol de categoría: actualiza en la categoría y propaga a canales
            const updatedCategoryRoles = updateRoleInCollection(cat.roles, editingRole.id, newRole);
            const updatedChannels = cat.channels.map(ch => {
              // Si el canal NO tiene override para este rol, agrégalo o actualízalo
              if (!ch.roles.some(r => r.id === newRole.id)) {
                return {
                  ...ch,
                  roles: [...ch.roles, newRole]
                };
              }
              return ch;
            });
            return {
              ...cat,
              roles: updatedCategoryRoles,
              channels: updatedChannels
            };
          }
        }
        return cat;
      })
    );

    setEditingRole(null);
    setRoleForm({ name: '', permissions: [], color: ROLE_COLORS[0] });
  }, [editingRole, roleForm, categories, setCategories]);

  const deleteRole = useCallback((categoryId: string, roleId: string, channelId?: string): void => {
    setCategories(
      categories.map(cat => {
        if (cat.id === categoryId) {
          if (channelId) {
            return {
              ...cat,
              channels: cat.channels.map(ch =>
                ch.id === channelId
                  ? { ...ch, roles: removeRoleFromCollection(ch.roles, roleId) }
                  : ch
              )
            };
          } else {
            // Eliminar de la categoría y de todos los canales que no tengan override
            const updatedChannels = cat.channels.map(ch => ({
              ...ch,
              roles: ch.roles.filter(r => r.id !== roleId)
            }));
            return {
              ...cat,
              roles: removeRoleFromCollection(cat.roles, roleId),
              channels: updatedChannels
            };
          }
        }
        return cat;
      })
    );
  }, [categories, setCategories]);

  const togglePermission = useCallback((permission: string): void => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  }, []);

  const cancelRoleEdit = useCallback((): void => {
    setEditingRole(null);
    setRoleForm({ name: '', permissions: [], color: ROLE_COLORS[0] });
  }, []);

  // --- COPIAR Y PEGAR ---
  const copyCategory = useCallback((categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      clipboardRef.current = { type: 'category', data: category };
    }
  }, [categories]);

  const pasteCategory = useCallback(() => {
    if (clipboardRef.current.type === 'category' && clipboardRef.current.data) {
      const newCategory = cloneCategory(clipboardRef.current.data as Category);
      setCategories([...categories, newCategory]);
      clipboardRef.current = { type: null, data: null };
    }
  }, [categories, setCategories]);

  const copyChannel = useCallback((categoryId: string, channelId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    const channel = category?.channels.find(ch => ch.id === channelId);
    if (channel) {
      clipboardRef.current = { type: 'channel', data: channel };
    }
  }, [categories]);

  const pasteChannel = useCallback((targetCategoryId: string) => {
    if (clipboardRef.current.type === 'channel' && clipboardRef.current.data) {
      const newChannel = cloneChannel(clipboardRef.current.data as Channel);
      setCategories(categories.map(cat =>
        cat.id === targetCategoryId
          ? { ...cat, channels: [...cat.channels, newChannel] }
          : cat
      ));
      clipboardRef.current = { type: null, data: null };
    }
  }, [categories, setCategories]);

  // Helper para obtener los roles efectivos de un canal (heredados + overrides)
  function getEffectiveRolesForChannel(category: Category, channel: Channel): Role[] {
    // Roles heredados de la categoría que NO están sobreescritos en el canal
    const inheritedRoles = category.roles.filter(
      catRole => !channel.roles.some(chanRole => chanRole.id === catRole.id)
    );
    // Los roles del canal sobrescriben a los heredados si hay conflicto de ID
    return [...inheritedRoles, ...channel.roles];
  }

  return {
    getEffectiveRolesForChannel,
    // Estado
    editingRole,
    roleForm,
    setRoleForm,
    
    // Operaciones de categorías
    addCategory,
    deleteCategory,
    
    // Operaciones de canales
    addChannel,
    deleteChannel,
    
    // Operaciones de roles
    addRole,
    editRole,
    saveRole,
    deleteRole,
    togglePermission,
    cancelRoleEdit,

    // Copiar y pegar
    copyCategory,
    pasteCategory,
    copyChannel,
    pasteChannel
  };
};