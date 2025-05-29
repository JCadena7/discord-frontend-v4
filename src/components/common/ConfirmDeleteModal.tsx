import React from 'react';

interface ConfirmDeleteModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-xs">
      <h2 className="text-lg font-semibold mb-4">Confirmar eliminación</h2>
      <p className="mb-6 text-gray-300">{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">Cancelar</button>
        <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">Eliminar</button>
      </div>
    </div>
  </div>
);

export default ConfirmDeleteModal;
