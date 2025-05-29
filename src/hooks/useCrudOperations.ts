import { useState, useCallback } from 'react';
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

export const useCrudOperations = ({ categories, setCategories }: UseCrudOperationsProps) => {
  const [editingRole, setEditingRole] = useState<EditingRole | null>(null);
  const [roleForm, setRoleForm] = useState<RoleForm>({
    name: '',
    permissions: [],
    color: ROLE_COLORS[0]
  });

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
            // Rol de categoría
            return {
              ...cat,
              roles: updateRoleInCollection(cat.roles, editingRole.id, newRole)
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
            return { ...cat, roles: removeRoleFromCollection(cat.roles, roleId) };
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

  return {
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
    cancelRoleEdit
  };
};