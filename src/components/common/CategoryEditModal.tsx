import React, { useState } from 'react';

interface CategoryEditModalProps {
  initialName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

const CategoryEditModal: React.FC<CategoryEditModalProps> = ({ initialName, onSave, onCancel }) => {
  const [name, setName] = useState(initialName);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-xs">
        <h2 className="text-lg font-semibold mb-4">Editar Categoría</h2>
        <input
          className="w-full p-2 rounded bg-gray-900 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre de la categoría"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">Cancelar</button>
          <button onClick={() => onSave(name)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm" disabled={!name.trim()}>Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default CategoryEditModal;
