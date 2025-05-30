import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Edit, UserPlus, Shield } from 'lucide-react';

interface RoleForm {
  name: string;
  permissions: string[];
  color: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  color: string;
}

interface EditingRole {
  id: string;
  categoryId: string;
  channelId?: string;
}

type ModalMode = 'create' | 'view' | 'edit';

interface PermissionGroup {
  name: string;
  permissions: string[];
  description?: string;
}

interface RoleModalProps {
  isOpen: boolean;
  mode: ModalMode;
  editingRole?: EditingRole;
  existingRole?: Role;
  roleForm: RoleForm;
  setRoleForm: React.Dispatch<React.SetStateAction<RoleForm>>;
  availablePermissions: string[];
  permissionGroups?: PermissionGroup[]; // Permisos agrupados por categorías
  roleColors: string[];
  onSave: (roleData: RoleForm & { categoryId: string; channelId?: string }) => Promise<void>;
  onCancel: () => void;
  onTogglePermission: (permission: string) => void;
  onEdit?: () => void;
  isLoading?: boolean;
}

const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  mode,
  editingRole,
  existingRole,
  roleForm,
  setRoleForm,
  availablePermissions,
  permissionGroups,
  roleColors,
  onSave,
  onCancel,
  onTogglePermission,
  onEdit,
  isLoading = false
}) => {
  const [currentMode, setCurrentMode] = useState<ModalMode>(mode);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    // Expandir todos los grupos por defecto al abrir el modal
    if (isOpen && permissionGroups) {
      setExpandedGroups(permissionGroups.map(group => group.name));
    }
  }, [isOpen, permissionGroups]);

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (currentMode) {
      case 'create':
        return 'Crear Nuevo Rol';
      case 'view':
        return 'Ver Rol';
      case 'edit':
        return 'Editar Rol';
      default:
        return 'Rol';
    }
  };

  const getModalIcon = () => {
    switch (currentMode) {
      case 'create':
        return <UserPlus size={20} className="text-green-400" />;
      case 'view':
        return <Eye size={20} className="text-blue-400" />;
      case 'edit':
        return <Edit size={20} className="text-yellow-400" />;
      default:
        return null;
    }
  };

  const handleEditClick = () => {
    setCurrentMode('edit');
    if (onEdit) onEdit();
  };

  const handleSave = async () => {
    if (!roleForm.name.trim() || !editingRole) return;
    
    setIsSaving(true);
    try {
      await onSave({
        ...roleForm,
        categoryId: editingRole.categoryId,
        channelId: editingRole.channelId
      });
    } catch (error) {
      console.error('Error al guardar el rol:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGroupExpansion = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  const toggleAllPermissionsInGroup = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every(perm => roleForm.permissions.includes(perm));
    
    if (allSelected) {
      // Desmarcar todos los permisos del grupo
      groupPermissions.forEach(permission => {
        if (roleForm.permissions.includes(permission)) {
          onTogglePermission(permission);
        }
      });
    } else {
      // Marcar todos los permisos del grupo
      groupPermissions.forEach(permission => {
        if (!roleForm.permissions.includes(permission)) {
          onTogglePermission(permission);
        }
      });
    }
  };

  const getRoleContext = () => {
    if (!editingRole) return null;
    
    return (
      <div className="bg-gray-700 rounded-md p-3 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Shield size={16} className="text-blue-400" />
          <h4 className="text-sm font-medium text-gray-300">Contexto del rol</h4>
        </div>
        <div className="text-xs text-gray-400 space-y-1">
          <p><span className="font-medium">Categoría:</span> {editingRole.categoryId}</p>
          {editingRole.channelId ? (
            <p><span className="font-medium">Canal específico:</span> {editingRole.channelId}</p>
          ) : (
            <p><span className="font-medium">Ámbito:</span> Toda la categoría</p>
          )}
          {currentMode === 'create' && (
            <p className="text-green-400 mt-2">
              <span className="font-medium">→</span> El rol se creará y aplicará automáticamente a este contexto
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderPermissionGroups = () => {
    if (!permissionGroups || permissionGroups.length === 0) {
      return renderBasicPermissions();
    }

    return (
      <div className="space-y-3">
        {permissionGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.name);
          const groupPermissions = group.permissions.filter(perm => 
            availablePermissions.includes(perm)
          );
          const selectedCount = groupPermissions.filter(perm => 
            roleForm.permissions.includes(perm)
          ).length;
          const allSelected = selectedCount === groupPermissions.length && selectedCount > 0;
          const someSelected = selectedCount > 0 && selectedCount < groupPermissions.length;

          return (
            <div key={group.name} className="border border-gray-600 rounded-md">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => !isReadOnly && toggleGroupExpansion(group.name)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      isReadOnly ? 'text-gray-400' : 'text-gray-200'
                    }`}>
                      {group.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      allSelected ? 'bg-green-600 text-white' :
                      someSelected ? 'bg-yellow-600 text-white' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {selectedCount}/{groupPermissions.length}
                    </span>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAllPermissionsInGroup(groupPermissions);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {allSelected ? 'Desmarcar todo' : 'Marcar todo'}
                    </button>
                  )}
                </div>
                <span className={`transform transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}>
                  ▼
                </span>
              </div>
              
              {group.description && (
                <div className="px-3 pb-2">
                  <p className="text-xs text-gray-500">{group.description}</p>
                </div>
              )}

              {isExpanded && (
                <div className="border-t border-gray-600 p-3 space-y-2 max-h-40 overflow-y-auto">
                  {groupPermissions.map((permission) => {
                    const isChecked = isReadOnly 
                      ? existingRole?.permissions.includes(permission) 
                      : roleForm.permissions.includes(permission);
                    
                    return (
                      <label key={permission} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => !isReadOnly && onTogglePermission(permission)}
                          disabled={isReadOnly}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className={`text-sm ${
                          isReadOnly ? 'text-gray-400' : 'text-gray-300'
                        }`}>
                          {permission}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderBasicPermissions = () => (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {availablePermissions.map((permission) => {
        const isChecked = isReadOnly 
          ? existingRole?.permissions.includes(permission) 
          : roleForm.permissions.includes(permission);
        
        return (
          <label key={permission} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => !isReadOnly && onTogglePermission(permission)}
              disabled={isReadOnly}
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className={`text-sm ${
              isReadOnly ? 'text-gray-400' : 'text-gray-300'
            }`}>
              {permission}
            </span>
          </label>
        );
      })}
    </div>
  );

  const isReadOnly = currentMode === 'view';
  const canSave = roleForm.name.trim() && !isSaving && !isLoading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[500px] max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            {getModalIcon()}
            <h3 className="text-lg font-semibold text-white">{getModalTitle()}</h3>
          </div>
          <div className="flex items-center space-x-2">
            {currentMode === 'view' && (
              <button
                onClick={handleEditClick}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
                title="Editar rol"
              >
                <Edit size={18} />
              </button>
            )}
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Mostrar contexto del rol */}
        {editingRole && currentMode !== 'view' && getRoleContext()}
        
        <div className="space-y-4">
          {/* Nombre del rol */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del rol *
            </label>
            {isReadOnly ? (
              <div className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                {existingRole?.name || roleForm.name}
              </div>
            ) : (
              <input
                type="text"
                value={roleForm.name}
                onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Moderador, Admin, Usuario VIP..."
                disabled={isLoading}
              />
            )}
          </div>
          
          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Color del rol
            </label>
            <div className="flex flex-wrap gap-2">
              {roleColors.map((color) => {
                const isSelected = isReadOnly 
                  ? existingRole?.color === color 
                  : roleForm.color === color;
                
                return (
                  <button
                    key={color}
                    onClick={() => !isReadOnly && !isLoading && setRoleForm(prev => ({ ...prev, color }))}
                    disabled={isReadOnly || isLoading}
                    className={`w-8 h-8 rounded-full border-2 ${
                      isSelected ? 'border-white' : 'border-gray-600'
                    } ${isReadOnly || isLoading ? 'cursor-default' : 'cursor-pointer hover:border-gray-400'} transition-colors`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Permisos */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Permisos del rol
            </label>
            {renderPermissionGroups()}
            {isReadOnly && (
              <p className="text-xs text-gray-400 mt-2">
                {existingRole?.permissions.length || 0} permisos asignados
              </p>
            )}
          </div>

          {/* Información adicional en modo view */}
          {isReadOnly && existingRole && (
            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Información del rol</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <p><span className="font-medium">ID:</span> {existingRole.id}</p>
                {editingRole && (
  <>
    <p><span className="font-medium">Categoría:</span> {editingRole.categoryId}</p>
    {editingRole.channelId && (
      <p><span className="font-medium">Canal:</span> {editingRole.channelId}</p>
    )}
  </>
)}
              </div>
            </div>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            disabled={isLoading || isSaving}
          >
            {isReadOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          
          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{currentMode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleModal;