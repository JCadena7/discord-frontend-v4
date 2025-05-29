import React, { useState } from 'react';

interface ChannelEditModalProps {
  initialName: string;
  initialType: 'text' | 'voice';
  onSave: (name: string, type: 'text' | 'voice') => void;
  onCancel: () => void;
}

const ChannelEditModal: React.FC<ChannelEditModalProps> = ({ initialName, initialType, onSave, onCancel }) => {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<'text' | 'voice'>(initialType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-xs">
        <h2 className="text-lg font-semibold mb-4">Editar Canal</h2>
        <input
          className="w-full p-2 rounded bg-gray-900 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre del canal"
        />
        <div className="flex gap-2 mb-4">
          <button onClick={() => setType('text')} className={`px-3 py-1 rounded ${type === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>Texto</button>
          <button onClick={() => setType('voice')} className={`px-3 py-1 rounded ${type === 'voice' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>Voz</button>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">Cancelar</button>
          <button onClick={() => onSave(name, type)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm" disabled={!name.trim()}>Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default ChannelEditModal;
