import React, { useState, useRef, ChangeEvent } from 'react';
import { 
  Hash, Folder, Plus, Trash2, Download, Upload, Copy, 
  FileText, Edit2, Shield, Users, Grip
} from 'lucide-react';
import { Category } from '../../types/discord';
import { useNotification } from '../../hooks/useNotification';
import { useJsonOperations } from '../../hooks/useJsonOperations';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useCrudOperations } from '../../hooks/useCrudOperations';
import ActionButton from '../../components/common/ActionButton';
import RoleEditModal from '../../components/common/RoleEditModal';

// Constantes
const AVAILABLE_PERMISSIONS = [
  'Administrador', 'Gestionar servidor', 'Gestionar roles', 'Gestionar canales',
  'Expulsar miembros', 'Banear miembros', 'Crear invitaciones', 'Cambiar apodo',
  'Gestionar apodos', 'Gestionar emojis', 'Gestionar webhooks', 'Ver canales de auditoría',
  'Ver canal', 'Enviar mensajes', 'Enviar mensajes TTS', 'Gestionar mensajes',
  'Insertar enlaces', 'Adjuntar archivos', 'Leer historial de mensajes',
  'Mencionar @everyone', 'Usar emojis externos', 'Añadir reacciones',
  'Conectar', 'Hablar', 'Silenciar miembros', 'Ensordecer miembros',
  'Mover miembros', 'Usar actividad de voz', 'Prioridad al hablar'
];

const ROLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7DBDD'
];

const DragDropChannelsRoles: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'cat-1',
      name: 'General',
      roles: [
        { id: 'role-1', name: 'Admin', permissions: ['Enviar mensajes', 'Ver canal', 'Gestionar mensajes'], color: '#FF6B6B' },
        { id: 'role-2', name: 'Moderator', permissions: ['Enviar mensajes', 'Ver canal'], color: '#4ECDC4' }
      ],
      channels: [
        { 
          id: 'ch-1', 
          name: 'general', 
          type: 'text',
          roles: [
            { id: 'role-ch-1', name: 'Member', permissions: ['Enviar mensajes', 'Ver canal'], color: '#45B7D1' }
          ]
        },
        { 
          id: 'ch-2', 
          name: 'random', 
          type: 'text',
          roles: []
        }
      ]
    },
    {
      id: 'cat-2',
      name: 'Desarrollo',
      roles: [],
      channels: [
        { 
          id: 'ch-4', 
          name: 'frontend', 
          type: 'text',
          roles: [
            { id: 'role-ch-4', name: 'Developer', permissions: ['Enviar mensajes', 'Ver canal', 'Adjuntar archivos'], color: '#96CEB4' }
          ]
        }
      ]
    }
  ]);

  const [showJsonPanel, setShowJsonPanel] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks personalizados
  const { notification, showNotification } = useNotification();
  const {
    jsonInput,
    setJsonInput,
    copyToClipboard,
    pasteFromClipboard,
    downloadJSON,
    handleFileUpload,
    applyJsonInput
  } = useJsonOperations({ categories, setCategories, showNotification });
  
  const {
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    draggedItem,
    draggedType
  } = useDragAndDrop({ categories, setCategories });
  
  const {
    editingRole,
    roleForm,
    setRoleForm,
    addCategory,
    deleteCategory,
    addChannel,
    deleteChannel,
    addRole,
    editRole,
    saveRole,
    deleteRole,
    togglePermission,
    cancelRoleEdit
  } = useCrudOperations({ categories, setCategories });





  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Gestión de Canales, Categorías y Roles</h1>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
              <button onClick={copyToClipboard} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition-colors" title="Copiar JSON">
                <Copy size={14} />
                Copiar
              </button>
              <button onClick={pasteFromClipboard} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm transition-colors" title="Pegar JSON">
                <Upload size={14} />
                Pegar
              </button>
              <button onClick={downloadJSON} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm transition-colors" title="Descargar JSON">
                <Download size={14} />
                Descargar
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded text-sm transition-colors" title="Cargar archivo JSON">
                <Upload size={14} />
                Cargar
              </button>
              <button onClick={() => setShowJsonPanel(!showJsonPanel)} className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${showJsonPanel ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`} title="Editor JSON">
                <FileText size={14} />
                Editor
              </button>
            </div>
            
            <button onClick={addCategory} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
              <Plus size={16} />
              Nueva Categoría
            </button>
          </div>
        </div>

        {/* Panel JSON */}
        {showJsonPanel && (
          <div className="mb-6 bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Editor JSON</h3>
              <button onClick={() => setShowJsonPanel(false)} className="text-gray-400 hover:text-white">
                <FileText size={18} />
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setJsonInput(e.target.value)}
              placeholder={JSON.stringify(categories, null, 2)}
              className="w-full h-40 bg-gray-900 text-white p-3 rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setJsonInput(JSON.stringify(categories, null, 2))} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors">
                Cargar actual
              </button>
              <button onClick={() => {
                if (applyJsonInput(jsonInput)) {
                  setJsonInput('');
                  setShowJsonPanel(false);
                }
              }} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm transition-colors">
                Aplicar JSON
              </button>
            </div>
          </div>
        )}

        {/* Modal de edición de rol */}
        {editingRole && (
          <RoleEditModal
            editingRole={editingRole}
            roleForm={roleForm}
            setRoleForm={setRoleForm}
            availablePermissions={AVAILABLE_PERMISSIONS}
            roleColors={ROLE_COLORS}
            onSave={saveRole}
            onCancel={cancelRoleEdit}
            onTogglePermission={togglePermission}
          />
        )}

        {/* Notificaciones */}
        {notification && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-40">
            {notification}
          </div>
        )}

        {/* Lista de categorías */}
        <div className="space-y-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`bg-gray-800 rounded-lg p-4 transition-all duration-200 ${
                draggedType === 'category' && draggedItem?.id === category.id ? 'opacity-50 scale-95' : ''
              }`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, category, 'category')}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, category.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Grip className="text-gray-500 cursor-grab" size={16} />
                  <Folder className="text-yellow-500" size={18} />
                  <h2 className="text-xl font-semibold">{category.name}</h2>
                  <span className="text-sm text-gray-400">
                    ({category.channels.length} canales, {category.roles.length} roles)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => addChannel(category.id)} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors">
                    <Plus size={14} />
                    Canal
                  </button>
                  <button onClick={() => addRole(category.id)} className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors">
                    <Shield size={14} />
                    Rol
                  </button>
                  <button onClick={() => deleteCategory(category.id)} className="text-red-400 hover:text-red-300 p-1 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Roles de categoría */}
              {category.roles.length > 0 && (
                <div className="mb-4 ml-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Users size={14} />
                    Roles de Categoría
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {category.roles.map((role) => (
                      <div
                        key={role.id}
                        className={`flex items-center gap-2 bg-gray-700 rounded px-3 py-1 cursor-move hover:bg-gray-600 transition-colors group ${
                          draggedType === 'role' && draggedItem?.id === role.id ? 'opacity-50 scale-95' : ''
                        }`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, role, 'role', { categoryId: category.id })}
                      >
                        <Grip className="text-gray-500" size={12} />
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="text-sm font-medium">{role.name}</span>
                        <span className="text-xs text-gray-400">({role.permissions.length})</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ActionButton
                            onClick={() => editRole(role, category.id)}
                            variant="edit"
                            size="sm"
                            icon={Edit2}
                          />
                          <ActionButton
                            onClick={() => deleteRole(category.id, role.id)}
                            variant="delete"
                            size="sm"
                            icon={Trash2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Canales */}
              <div className="space-y-2 ml-6">
                {category.channels.map((channel) => (
                  <div key={channel.id} className="bg-gray-700 rounded p-3">
                    <div
                      className={`flex items-center justify-between cursor-move hover:bg-gray-600 transition-colors group rounded p-2 -m-2 ${
                        draggedType === 'channel' && draggedItem?.id === channel.id ? 'opacity-50 scale-95' : ''
                      }`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, channel, 'channel')}
                    >
                      <div className="flex items-center gap-3">
                        <Grip className="text-gray-500" size={14} />
                        <Hash className="text-gray-400" size={16} />
                        <span className="font-medium">{channel.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          channel.type === 'text' 
                            ? 'bg-blue-600 text-blue-100' 
                            : 'bg-green-600 text-green-100'
                        }`}>
                          {channel.type === 'text' ? 'Texto' : 'Voz'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => addRole(category.id, channel.id)} className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors">
                          <Shield size={12} />
                          Rol
                        </button>
                        <button onClick={() => deleteChannel(category.id, channel.id)} className="text-red-400 hover:text-red-300 p-1 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Roles del canal */}
                    {channel.roles.length > 0 && (
                      <div 
                        className="mt-3 pt-3 border-t border-gray-600"
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, category.id, channel.id)}
                      >
                        <h5 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                          <Shield size={12} />
                          Roles del Canal
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {channel.roles.map((role) => (
                            <div
                              key={role.id}
                              className={`flex items-center gap-2 bg-gray-600 rounded px-2 py-1 cursor-move hover:bg-gray-500 transition-colors group ${
                                draggedType === 'role' && draggedItem?.id === role.id ? 'opacity-50 scale-95' : ''
                              }`}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, role, 'role', { categoryId: category.id, channelId: channel.id })}
                            >
                              <Grip className="text-gray-500" size={10} />
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: role.color }}
                              />
                              <span className="text-xs font-medium">{role.name}</span>
                              <span className="text-xs text-gray-400">({role.permissions.length})</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ActionButton
                                  onClick={() => editRole(role, category.id, channel.id)}
                                  variant="edit"
                                  size="xs"
                                  icon={Edit2}
                                />
                                <ActionButton
                                  onClick={() => deleteRole(category.id, role.id, channel.id)}
                                  variant="delete"
                                  size="xs"
                                  icon={Trash2}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {category.channels.length === 0 && (
                  <div className="text-gray-500 text-center py-4 border-2 border-dashed border-gray-600 rounded">
                    Arrastra canales aquí o crea uno nuevo
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instrucciones */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Instrucciones:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-1">Arrastrar y soltar:</h4>
              <ul className="space-y-1">
                <li>• Arrastra categorías para reordenarlas</li>
                <li>• Arrastra canales entre categorías</li>
                <li>• Arrastra roles entre categorías y canales</li>
                <li>• Los roles pueden moverse libremente</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-1">Gestión de roles:</h4>
              <ul className="space-y-1">
                <li>• Crea roles a nivel de categoría o canal</li>
                <li>• Asigna permisos específicos a cada rol</li>
                <li>• Personaliza colores para identificación</li>
                <li>• Edita roles haciendo clic en el ícono de lápiz</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-1">Funciones JSON:</h4>
              <ul className="space-y-1">
                <li>• <strong>Copiar:</strong> Exporta configuración completa</li>
                <li>• <strong>Pegar:</strong> Importa desde portapapeles</li>
                <li>• <strong>Descargar:</strong> Guarda como archivo</li>
                <li>• <strong>Cargar:</strong> Importa desde archivo</li>
                <li>• <strong>Editor:</strong> Edición manual de JSON</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .drag-over {
            background-color: rgb(37, 99, 235) !important;
            transform: scale(1.02);
          }
          
          .group:hover .opacity-0 {
            opacity: 1 !important;
          }
        `}
      </style>
    </div>
  );
};

export default DragDropChannelsRoles;