import React from 'react';
import { X, Save } from 'lucide-react';

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

interface RoleEditModalProps {
  editingRole: EditingRole;
  roleForm: RoleForm;
  setRoleForm: React.Dispatch<React.SetStateAction<RoleForm>>;
  availablePermissions: string[];
  roleColors: string[];
  onSave: () => void;
  onCancel: () => void;
  onTogglePermission: (permission: string) => void;
}

const RoleEditModal: React.FC<RoleEditModalProps> = ({
  editingRole,
  roleForm,
  setRoleForm,
  availablePermissions,
  roleColors,
  onSave,
  onCancel,
  onTogglePermission
}) => {
  if (!editingRole) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Editar Rol</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del rol
            </label>
            <input
              type="text"
              value={roleForm.name}
              onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del rol"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {roleColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setRoleForm(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 ${
                    roleForm.color === color ? 'border-white' : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Permisos
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availablePermissions.map((permission) => (
                <label key={permission} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={roleForm.permissions.includes(permission)}
                    onChange={() => onTogglePermission(permission)}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">{permission}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={!roleForm.name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save size={16} />
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleEditModal;