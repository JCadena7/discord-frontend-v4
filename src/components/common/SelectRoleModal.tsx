import React, { useState } from 'react';
import { Role } from '../../types/discord';

interface SelectRoleModalProps {
  roles: Role[];
  selectedRoleIds?: string[];
  onConfirm: (selectedRoles: Role[]) => void;
  onCancel: () => void;
  title?: string;
}

const SelectRoleModal: React.FC<SelectRoleModalProps> = ({ roles, selectedRoleIds = [], onConfirm, onCancel, title }) => {
  const [selected, setSelected] = useState<string[]>(selectedRoleIds);

  const toggleRole = (roleId: string) => {
    setSelected(sel => sel.includes(roleId) ? sel.filter(id => id !== roleId) : [...sel, roleId]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{title || 'Seleccionar roles'}</h2>
        <div className="max-h-64 overflow-y-auto mb-4">
          {roles.length === 0 && <div className="text-gray-400">No hay roles disponibles.</div>}
          <ul className="space-y-2">
            {roles.map(role => (
              <li key={role.id} className="flex items-center gap-3 bg-gray-700 rounded px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="accent-blue-600"
                />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: role.color }} />
                <span className="font-medium">{role.name}</span>
                <span className="text-xs text-gray-400">({role.permissions.length} permisos)</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">Cancelar</button>
          <button
            onClick={() => onConfirm(roles.filter(role => selected.includes(role.id)))}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            disabled={selected.length === 0}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectRoleModal;
