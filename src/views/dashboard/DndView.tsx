import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Grip, Hash, Folder, Plus, Trash2, Copy, Download, Upload, Code, EyeOff, Shield, Users, Edit2, Check, X, Palette } from 'lucide-react';

// Definición de tipos
interface Role {
  id: string;
  name: string;
  permissions: string[];
  color: string;
}

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  roles: Role[];
}

interface Category {
  id: string;
  name: string;
  channels: Channel[];
  roles: Role[];
}

type DraggedType = 'channel' | 'category' | 'role' | null;
type DraggedItem = Channel | Category | Role | null;

// Permisos disponibles
const AVAILABLE_PERMISSIONS = [
  'SendMessages',
  'ViewChannel',
  'ManageMessages',
  'ManageChannel',
  'VoiceConnect',
  'VoiceSpeak',
  'MentionEveryone',
  'UseExternalEmojis',
  'AddReactions',
  'AttachFiles'
];

// Colores predefinidos para roles
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
        { id: 'role-1', name: 'Admin', permissions: ['SendMessages', 'ViewChannel', 'ManageMessages'], color: '#FF6B6B' },
        { id: 'role-2', name: 'Moderator', permissions: ['SendMessages', 'ViewChannel'], color: '#4ECDC4' }
      ],
      channels: [
        { 
          id: 'ch-1', 
          name: 'general', 
          type: 'text',
          roles: [
            { id: 'role-ch-1', name: 'Member', permissions: ['SendMessages', 'ViewChannel'], color: '#45B7D1' }
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
            { id: 'role-ch-4', name: 'Developer', permissions: ['SendMessages', 'ViewChannel', 'AttachFiles'], color: '#96CEB4' }
          ]
        }
      ]
    }
  ]);

  const [draggedItem, setDraggedItem] = useState<DraggedItem>(null);
  const [draggedType, setDraggedType] = useState<DraggedType>(null);
  const [draggedSource, setDraggedSource] = useState<{ categoryId: string; channelId?: string } | null>(null);
  const [showJsonPanel, setShowJsonPanel] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [notification, setNotification] = useState<string>('');
  const [editingRole, setEditingRole] = useState<{ id: string; categoryId: string; channelId?: string } | null>(null);
  const [roleForm, setRoleForm] = useState<{ name: string; permissions: string[]; color: string }>({
    name: '',
    permissions: [],
    color: ROLE_COLORS[0]
  });
  const dragCounter = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, item: DraggedItem, type: DraggedType, source?: { categoryId: string; channelId?: string }): void => {
    setDraggedItem(item);
    setDraggedType(type);
    setDraggedSource(source || null);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    dragCounter.current++;
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      e.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetCategoryId: string, targetChannelId?: string): void => {
    e.preventDefault();
    dragCounter.current = 0;
    e.currentTarget.classList.remove('drag-over');

    if (!draggedItem || !draggedType) return;

    setCategories(prev => {
      const newCategories = [...prev];

      if (draggedType === 'channel') {
        // Mover canal entre categorías
        let sourceCategory: Category | null = null;
        let channelIndex = -1;
        
        for (let i = 0; i < newCategories.length; i++) {
          channelIndex = newCategories[i].channels.findIndex(ch => ch.id === (draggedItem as Channel).id);
          if (channelIndex !== -1) {
            sourceCategory = newCategories[i];
            break;
          }
        }
        
        if (sourceCategory && channelIndex !== -1) {
          const [removedChannel] = sourceCategory.channels.splice(channelIndex, 1);
          const targetCategory = newCategories.find(cat => cat.id === targetCategoryId);
          if (targetCategory) {
            targetCategory.channels.push(removedChannel);
          }
        }
      } else if (draggedType === 'category') {
        // Reordenar categorías
        const draggedIndex = newCategories.findIndex(cat => cat.id === (draggedItem as Category).id);
        const targetIndex = newCategories.findIndex(cat => cat.id === targetCategoryId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const [draggedCategory] = newCategories.splice(draggedIndex, 1);
          newCategories.splice(targetIndex, 0, draggedCategory);
        }
      } else if (draggedType === 'role' && draggedSource) {
        // Mover rol entre categorías/canales
        const sourceCategory = newCategories.find(cat => cat.id === draggedSource.categoryId);
        const targetCategory = newCategories.find(cat => cat.id === targetCategoryId);
        
        if (sourceCategory && targetCategory) {
          let sourceRoles: Role[];
          let targetRoles: Role[];
          
          if (draggedSource.channelId) {
            // Desde canal
            const sourceChannel = sourceCategory.channels.find(ch => ch.id === draggedSource.channelId);
            sourceRoles = sourceChannel?.roles || [];
          } else {
            // Desde categoría
            sourceRoles = sourceCategory.roles;
          }
          
          if (targetChannelId) {
            // Hacia canal
            const targetChannel = targetCategory.channels.find(ch => ch.id === targetChannelId);
            targetRoles = targetChannel?.roles || [];
          } else {
            // Hacia categoría
            targetRoles = targetCategory.roles;
          }
          
          const roleIndex = sourceRoles.findIndex(role => role.id === (draggedItem as Role).id);
          if (roleIndex !== -1) {
            const [removedRole] = sourceRoles.splice(roleIndex, 1);
            targetRoles.push(removedRole);
          }
        }
      }

      return newCategories;
    });

    setDraggedItem(null);
    setDraggedType(null);
    setDraggedSource(null);
  };

  const showNotification = (message: string): void => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const isValidCategoriesStructure = (data: any): data is Category[] => {
    return Array.isArray(data) && data.every(cat => 
      typeof cat.id === 'string' && 
      typeof cat.name === 'string' && 
      Array.isArray(cat.channels) &&
      Array.isArray(cat.roles) &&
      cat.channels.every((ch: any) => 
        typeof ch.id === 'string' && 
        typeof ch.name === 'string' && 
        (ch.type === 'text' || ch.type === 'voice') &&
        Array.isArray(ch.roles)
      ) &&
      cat.roles.every((role: any) =>
        typeof role.id === 'string' &&
        typeof role.name === 'string' &&
        Array.isArray(role.permissions) &&
        typeof role.color === 'string'
      )
    );
  };

  // Funciones JSON
  const copyToClipboard = async (): Promise<void> => {
    try {
      const jsonData = JSON.stringify(categories, null, 2);
      await navigator.clipboard.writeText(jsonData);
      showNotification('¡JSON copiado al portapapeles!');
    } catch (err) {
      showNotification('Error al copiar JSON');
    }
  };

  const pasteFromClipboard = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      
      if (isValidCategoriesStructure(parsed)) {
        setCategories(parsed);
        showNotification('¡JSON importado correctamente!');
      } else {
        showNotification('Formato JSON inválido');
      }
    } catch (err) {
      showNotification('Error al importar JSON - Verifica el formato');
    }
  };

  const downloadJSON = (): void => {
    const jsonData = JSON.stringify(categories, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'channels-roles-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('¡Archivo JSON descargado!');
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const parsed = JSON.parse(result);
            if (isValidCategoriesStructure(parsed)) {
              setCategories(parsed);
              showNotification('¡Archivo JSON cargado correctamente!');
            } else {
              showNotification('Formato de archivo inválido');
            }
          }
        } catch (err) {
          showNotification('Error al leer archivo JSON');
        }
      };
      reader.readAsText(file);
    } else {
      showNotification('Por favor selecciona un archivo JSON válido');
    }
    event.target.value = '';
  };

  const applyJsonInput = (): void => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (isValidCategoriesStructure(parsed)) {
        setCategories(parsed);
        setJsonInput('');
        setShowJsonPanel(false);
        showNotification('¡Configuración aplicada!');
      } else {
        showNotification('Formato JSON inválido');
      }
    } catch (err) {
      showNotification('JSON mal formateado');
    }
  };

  // Funciones CRUD
  const addCategory = (): void => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: `Nueva Categoría ${categories.length + 1}`,
      channels: [],
      roles: []
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const addChannel = (categoryId: string): void => {
    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      name: `nuevo-canal-${Math.floor(Math.random() * 100)}`,
      type: 'text',
      roles: []
    };
    
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, channels: [...cat.channels, newChannel] }
          : cat
      )
    );
  };

  const addRole = (categoryId: string, channelId?: string): void => {
    setEditingRole({ id: '', categoryId, channelId });
    setRoleForm({
      name: '',
      permissions: [],
      color: ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)]
    });
  };

  const editRole = (role: Role, categoryId: string, channelId?: string): void => {
    setEditingRole({ id: role.id, categoryId, channelId });
    setRoleForm({
      name: role.name,
      permissions: [...role.permissions],
      color: role.color
    });
  };

  const saveRole = (): void => {
    if (!editingRole || !roleForm.name.trim()) return;

    const newRole: Role = {
      id: editingRole.id || `role-${Date.now()}`,
      name: roleForm.name.trim(),
      permissions: roleForm.permissions,
      color: roleForm.color
    };

    setCategories(prev => 
      prev.map(cat => {
        if (cat.id === editingRole.categoryId) {
          if (editingRole.channelId) {
            // Rol de canal
            return {
              ...cat,
              channels: cat.channels.map(ch => {
                if (ch.id === editingRole.channelId) {
                  const existingIndex = ch.roles.findIndex(r => r.id === editingRole.id);
                  if (existingIndex !== -1) {
                    const newRoles = [...ch.roles];
                    newRoles[existingIndex] = newRole;
                    return { ...ch, roles: newRoles };
                  } else {
                    return { ...ch, roles: [...ch.roles, newRole] };
                  }
                }
                return ch;
              })
            };
          } else {
            // Rol de categoría
            const existingIndex = cat.roles.findIndex(r => r.id === editingRole.id);
            if (existingIndex !== -1) {
              const newRoles = [...cat.roles];
              newRoles[existingIndex] = newRole;
              return { ...cat, roles: newRoles };
            } else {
              return { ...cat, roles: [...cat.roles, newRole] };
            }
          }
        }
        return cat;
      })
    );

    setEditingRole(null);
    setRoleForm({ name: '', permissions: [], color: ROLE_COLORS[0] });
  };

  const deleteCategory = (categoryId: string): void => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  const deleteChannel = (categoryId: string, channelId: string): void => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, channels: cat.channels.filter(ch => ch.id !== channelId) }
          : cat
      )
    );
  };

  const deleteRole = (categoryId: string, roleId: string, channelId?: string): void => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          if (channelId) {
            return {
              ...cat,
              channels: cat.channels.map(ch =>
                ch.id === channelId
                  ? { ...ch, roles: ch.roles.filter(r => r.id !== roleId) }
                  : ch
              )
            };
          } else {
            return { ...cat, roles: cat.roles.filter(r => r.id !== roleId) };
          }
        }
        return cat;
      })
    );
  };

  const togglePermission = (permission: string): void => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

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
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded text-sm transition-colors" title="Cargar archivo JSON">
                <Upload size={14} />
                Cargar
              </button>
              <button onClick={() => setShowJsonPanel(!showJsonPanel)} className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${showJsonPanel ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`} title="Editor JSON">
                <Code size={14} />
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
                <EyeOff size={18} />
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
              <button onClick={applyJsonInput} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors">
                Aplicar JSON
              </button>
            </div>
          </div>
        )}

        {/* Modal de edición de rol */}
        {editingRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingRole.id ? 'Editar Rol' : 'Nuevo Rol'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del rol</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-700 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa el nombre del rol"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-600"
                      style={{ backgroundColor: roleForm.color }}
                    />
                    <select
                      value={roleForm.color}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, color: e.target.value }))}
                      className="bg-gray-700 text-white p-2 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ROLE_COLORS.map(color => (
                        <option key={color} value={color} style={{ backgroundColor: color }}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Permisos</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {AVAILABLE_PERMISSIONS.map(permission => (
                      <label key={permission} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="rounded"
                        />
                        <span className="text-sm">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button 
                  onClick={() => setEditingRole(null)}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded transition-colors"
                >
                  <X size={14} />
                  Cancelar
                </button>
                <button 
                  onClick={saveRole}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded transition-colors"
                  disabled={!roleForm.name.trim()}
                >
                  <Check size={14} />
                  Guardar
                </button>
              </div>
            </div>
          </div>
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
                          <button onClick={() => editRole(role, category.id)} className="text-blue-400 hover:text-blue-300">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => deleteRole(category.id, role.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 size={12} />
                          </button>
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
                                <button onClick={() => editRole(role, category.id, channel.id)} className="text-blue-400 hover:text-blue-300">
                                  <Edit2 size={10} />
                                </button>
                                <button onClick={() => deleteRole(category.id, role.id, channel.id)} className="text-red-400 hover:text-red-300">
                                  <Trash2 size={10} />
                                </button>
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