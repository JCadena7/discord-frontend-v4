import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { 
  Hash, Folder, Plus, Trash2, Download, Upload, Copy, 
  FileText, Edit2, Shield, Users, Grip
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { useAuthStore } from '../../store/authStore';
import {
    useServerStructureStore,
    useDndViewCategories,
    useServerInfo
} from '../../store/serverStructureStore';
import { useJsonOperations } from '../../hooks/useJsonOperations';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useCrudOperations } from '../../hooks/useCrudOperations'; // Primarily for getEffectiveRolesForChannel
import ActionButton from '../../components/common/ActionButton';
import RoleModal from '../../components/common/RoleEditModal';
import CategoryEditModal from '../../components/common/CategoryEditModal';
import ChannelEditModal from '../../components/common/ChannelEditModal';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';
import SelectRoleModal from '../../components/common/SelectRoleModal';
import { Category, Role, ServerStructureData } from '../../types/discord'; // DndView specific types

// Tipos para el modal de rol
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

type ModalMode = 'create' | 'edit' | 'view';

interface RoleModalState {
  isOpen: boolean;
  mode: ModalMode;
  editingRole?: EditingRole; // For context of what is being edited (e.g. role in category X)
  existingRole?: Role;      // The actual role data being edited
  roleForm: RoleForm;
  categoryId: string;       // Target categoryId for new role
  channelId?: string;      // Target channelId for new role
}

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
  '#F8C471', '#82E0AA', '#F1948A', '#D7DBDD'
];

const DragDropChannelsRoles: React.FC = () => {
  const [roleModal, setRoleModal] = useState<RoleModalState>({
    isOpen: false,
    mode: 'create',
    roleForm: { name: '', permissions: [], color: ROLE_COLORS[0] },
    categoryId: '',
    channelId: undefined
  });

  const selectedGuild = useAuthStore((state) => state.selectedGuild);
  const guildId = selectedGuild?.id;
  const { serverId, serverName } = useServerInfo();

  const {
    fetchServerStructure,
    isLoading: serverStructureLoading,
    error: serverStructureError,
    addCategoryStore,
    updateCategoryStore,
    deleteCategoryStore,
    addChannelStore,
    updateChannelStore,
    deleteChannelStore,
    addRoleToItemStore,
    updateRoleInItemStore,
    deleteRoleFromItemStore,
    applyJsonToStore,
    moveCategoryStore,
    moveChannelStore,
    moveRoleStore,
  } = useServerStructureStore();

  useEffect(() => {
    if (guildId) {
      fetchServerStructure(guildId);
    }
  }, [guildId, fetchServerStructure]);

  const categoriesData = useDndViewCategories();
  const { notification, showNotification } = useNotification();

  const handleEditRole = (role: Role, categoryId: string, channelId?: string) => {
    setRoleModal({
      isOpen: true,
      mode: 'edit',
      editingRole: { id: role.id, categoryId, channelId: channelId },
      existingRole: { ...role },
      roleForm: { name: role.name, permissions: role.permissions, color: role.color },
      categoryId, // These are context for where the role is being edited
      channelId
    });
  };

  const handleViewRole = (role: Role, categoryId: string, channelId?: string) => {
    setRoleModal({
      isOpen: true,
      mode: 'view',
      editingRole: { id: role.id, categoryId, channelId: channelId },
      existingRole: { ...role },
      roleForm: { name: role.name, permissions: role.permissions, color: role.color },
      categoryId,
      channelId
    });
  };

  const [selectRoleModal, setSelectRoleModal] = useState<{
    open: boolean, targetType: 'category' | 'channel' | null, categoryId: string | null, channelId?: string | null
  }>({ open: false, targetType: null, categoryId: null, channelId: null });

  const getAllServerRoles = useServerStructureStore(state => state.serverData?.roles || []);

  const assignRolesToItem = (itemId: string, itemType: 'category' | 'channel', roles: Role[]) => {
    roles.forEach(role => {
      addRoleToItemStore({ name: role.name, permissions: role.permissions, color: role.color }, itemId, itemType);
    });
    showNotification(`${roles.length} role(s) assigned to ${itemType}.`);
  };

  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editChannel, setEditChannel] = useState<{categoryId: string, channelId: string} | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'category' | 'channel' | 'role', categoryId: string, channelId?: string, roleId?: string, name: string} | null>(null);
  const [showJsonPanel, setShowJsonPanel] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    jsonInput, setJsonInput, copyToClipboard, pasteFromClipboard, downloadJSON, handleFileUpload, applyJsonInput: hookApplyJsonInput
  } = useJsonOperations({
    // categories: categoriesData, // No longer needed by the refactored hook
    setCategories: applyJsonToStore, // Pass the store action directly
    showNotification,
    getServerData: () => useServerStructureStore.getState().serverData
  });
  
  const {
    handleDragStart: dndHandleDragStart, handleDragOver, handleDragEnter, handleDragLeave,
    draggedItem, draggedType,
    handleDrop: dndHandleDrop // Get the refactored handleDrop from the hook
  } = useDragAndDrop({
    categories: categoriesData,
    setCategories: () => { /* No-op: actual moves via store actions on drop */ }
  });

  const { getEffectiveRolesForChannel } = useCrudOperations({ categories: categoriesData, setCategories: () => {} });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { type, categoryId, channelId, roleId, name } = deleteTarget;
    if (type === 'category') {
      deleteCategoryStore(categoryId);
    } else if (type === 'channel' && channelId) {
      deleteChannelStore(channelId);
    } else if (type === 'role' && roleId) {
      const itemId = channelId || categoryId;
      const itemType = channelId ? 'channel' : 'category';
      deleteRoleFromItemStore(roleId, itemId, itemType);
    }
    setDeleteTarget(null);
    showNotification(`${type} "${name}" deleted.`);
  };

  const handleSaveCategoryEdit = (name: string, description?: string) => {
    if (editCategoryId) {
      updateCategoryStore(editCategoryId, { name, description });
      setEditCategoryId(null);
      showNotification(`Category "${name}" updated.`);
    }
  };

  const handleSaveChannelEdit = (name: string, type: 'text' | 'voice', description?: string) => {
    if (editChannel) {
      updateChannelStore(editChannel.channelId, { name, type, description });
      setEditChannel(null);
      showNotification(`Channel "${name}" updated.`);
    }
  };

  const handleActualDrop = (targetItemId: string, targetItemType: 'category' | 'channel', targetIndex?: number) => {
    if (!draggedItem || !draggedType) return;

    const sourceContext = draggedItem.context || {}; // Assuming context is attached in dndHandleDragStart

    if (draggedType === 'category' && targetItemType === 'category') {
      moveCategoryStore(draggedItem.id, targetItemId);
    } else if (draggedType === 'channel') {
      if (targetItemType === 'category') { // Dropping channel into a category (potentially new one)
        moveChannelStore(draggedItem.id, targetItemId, targetIndex, sourceContext.categoryId);
      } else if (targetItemType === 'channel' && sourceContext.categoryId) { // Reordering channels within same category
         moveChannelStore(draggedItem.id, sourceContext.categoryId, targetIndex, sourceContext.categoryId);
      }
    } else if (draggedType === 'role') {
      moveRoleStore(draggedItem.id, sourceContext.categoryId, sourceContext.channelId ? 'channel' : 'category', targetItemId, targetItemType, targetIndex);
    }
    showNotification(`${draggedType} moved successfully.`);
  };


  if (serverStructureLoading) return <div className="min-h-screen bg-gray-900 text-white p-6 flex justify-center items-center"><p>Loading server structure...</p></div>;
  if (serverStructureError) return <div className="min-h-screen bg-gray-900 text-white p-6 flex justify-center items-center"><p>Error: {serverStructureError}</p></div>;
  if (!guildId) return <div className="min-h-screen bg-gray-900 text-white p-6 flex justify-center items-center"><p>No guild selected.</p></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Canales, Categorías y Roles</h1>
            {serverName && serverId && (
              <div className="text-sm text-gray-400 mt-1">
                <p>Servidor: <span className="font-semibold text-gray-300">{serverName}</span> (ID: <span className="font-semibold text-gray-300">{serverId}</span>)</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
              <button onClick={copyToClipboard} title="Copiar JSON" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"><Copy size={14} /> Copiar</button>
              <button onClick={pasteFromClipboard} title="Pegar JSON" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"><Upload size={14} /> Pegar</button>
              <button onClick={downloadJSON} title="Descargar JSON" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm"><Download size={14} /> Descargar</button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={(e) => handleFileUpload(e.target.files?.[0])} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} title="Cargar JSON" className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded text-sm"><Upload size={14} /> Cargar</button>
              <button onClick={() => setShowJsonPanel(!showJsonPanel)} title="Editor JSON" className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${showJsonPanel ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`}><FileText size={14} /> Editor</button>
            </div>
            <button onClick={() => addCategoryStore({ name: 'Nueva Categoría', description: '' })} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"><Plus size={16} /> Nueva Categoría</button>
            <button onClick={() => setRoleModal({ isOpen: true, mode: 'create', roleForm: { name: 'Nuevo Rol Global', permissions: [], color: ROLE_COLORS[0] }, categoryId: '', channelId: undefined })}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"><Plus size={16} /> Nuevo Rol Global</button>
          </div>
        </div>

        {showJsonPanel && (
          <div className="mb-6 bg-gray-800 rounded-lg p-4">
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder="Pegar JSON aquí..."
              className="w-full h-40 bg-gray-900 text-white p-3 rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setJsonInput(JSON.stringify(useServerStructureStore.getState().serverData, null, 2))} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">Cargar Actual</button>
              <button onClick={() => {
                if (hookApplyJsonInput(jsonInput)) { // Use applyJsonInput from the hook
                  setJsonInput('');
                  setShowJsonPanel(false);
                  // showNotification is handled by the hook's applyJsonInput
                }
              }} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm">Aplicar JSON</button>
            </div>
          </div>
        )}

        {roleModal.isOpen && (
          <RoleModal isOpen={roleModal.isOpen} mode={roleModal.mode} editingRole={roleModal.editingRole} existingRole={roleModal.existingRole} roleForm={roleModal.roleForm}
            setRoleForm={formUpdate => setRoleModal(prev => ({ ...prev, roleForm: typeof formUpdate === 'function' ? formUpdate(prev.roleForm) : formUpdate }))}
            availablePermissions={AVAILABLE_PERMISSIONS} roleColors={ROLE_COLORS}
            onSave={async () => {
              const { categoryId, channelId, editingRole, roleForm, mode } = roleModal;
              const roleDetails = { name: roleForm.name, permissions: roleForm.permissions, color: roleForm.color };
              if (mode === 'create') {
                const itemId = channelId || categoryId; // If channelId is present, it's for a channel
                const itemType = channelId ? 'channel' : (categoryId ? 'category' : 'server'); // 'server' for global role
                const createdRole = addRoleToItemStore(roleDetails, itemId || '@@GLOBAL@@', itemType); // Pass '@@GLOBAL@@' if no item context
                if (createdRole) showNotification(`Rol "${createdRole.name}" creado.`);
              } else if (mode === 'edit' && editingRole) {
                const itemId = editingRole.channelId || editingRole.categoryId;
                const itemType = editingRole.channelId ? 'channel' : 'category';
                updateRoleInItemStore(editingRole.id, roleDetails, itemId, itemType);
                showNotification(`Rol "${roleForm.name}" actualizado.`);
              }
              setRoleModal(prev => ({ ...prev, isOpen: false, roleForm: { name: '', permissions: [], color: ROLE_COLORS[0] } }));
            }}
            onCancel={() => setRoleModal(prev => ({ ...prev, isOpen: false, roleForm: { name: '', permissions: [], color: ROLE_COLORS[0] } }))}
            onTogglePermission={perm => setRoleModal(prev => ({ ...prev, roleForm: { ...prev.roleForm, permissions: prev.roleForm.permissions.includes(perm) ? prev.roleForm.permissions.filter(p => p !== perm) : [...prev.roleForm.permissions, perm] } }))}
            isLoading={false} onEdit={() => setRoleModal(prev => ({ ...prev, mode: 'edit' }))}
          />
        )}

        {selectRoleModal.open && (
          <SelectRoleModal roles={getAllServerRoles()}
            onConfirm={(selectedRoles) => {
              if (selectRoleModal.targetType && selectRoleModal.categoryId) {
                const itemId = selectRoleModal.channelId || selectRoleModal.categoryId;
                assignRolesToItem(itemId, selectRoleModal.targetType, selectedRoles);
              }
              setSelectRoleModal({ open: false, targetType: null, categoryId: null, channelId: null });
            }}
            onCancel={() => setSelectRoleModal({ open: false, targetType: null, categoryId: null, channelId: null })}
            title={`Agregar roles a ${selectRoleModal.targetType}`}
          />
        )}

        <div className="space-y-6">
          {categoriesData.map((category, catIndex) => (
            <div key={category.id} draggable={true} onDragStart={(e) => dndHandleDragStart(e, category, 'category', { /* No specific context needed for category itself */ })}
                 onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                 onDrop={(e) => {
                   e.stopPropagation();
                   handleActualDrop(category.id, 'category', catIndex);
                   (e.currentTarget as HTMLElement).classList.remove('drag-over');
                   dndHandleDrop(); // Reset hook's drag state
                  }}
                 className={`bg-gray-800 rounded-lg p-4 transition-all duration-200 ${draggedType === 'category' && draggedItem?.id === category.id ? 'opacity-50 scale-95' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Grip className="text-gray-500 cursor-grab" size={16} />
                  <Folder className="text-yellow-500" size={18} />
                  <span className="font-semibold text-lg">{category.name}</span>
                  <ActionButton onClick={() => setEditCategoryId(category.id)} icon={Edit2} size="xs" title="Editar Categoría"/>
                  <ActionButton onClick={() => setDeleteTarget({type: 'category', categoryId: category.id, name: category.name})} icon={Trash2} variant="delete" size="xs" title="Eliminar Categoría"/>
                  <span className="text-xs text-gray-400">({category.channels.length} canales, {category.roles.length} roles)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => addChannelStore(category.id, { name: 'Nuevo Canal', type: 'text', description:'' })} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"><Plus size={14} />Canal</button>
                  <button onClick={() => setRoleModal({ isOpen: true, mode: 'create', roleForm: { name: 'Nuevo Rol Cat.', permissions: [], color: ROLE_COLORS[1] }, categoryId: category.id, channelId: undefined })}
                          className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"><Shield size={14} />Rol</button>
                  <button onClick={() => setSelectRoleModal({ open: true, targetType: 'category', categoryId: category.id, channelId: null})} className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"><Users size={14} />Rol Existente</button>
                </div>
              </div>

              {category.roles.length > 0 && (
                <div className="mb-4 ml-6 pl-2 border-l-2 border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><Users size={14} />Roles de Categoría</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.roles.map((role, roleIndex) => (
                      <div key={role.id} draggable={true} onDragStart={(e) => dndHandleDragStart(e, role, 'role', { categoryId: category.id })}
                           onDrop={(e) => {
                             e.stopPropagation();
                             handleActualDrop(category.id, 'category', roleIndex); // Target is category, index is role's for potential reorder
                             (e.currentTarget as HTMLElement).classList.remove('drag-over');
                             dndHandleDrop();
                            }}
                           className={`flex items-center gap-2 bg-gray-700 rounded px-3 py-1 cursor-move hover:bg-gray-600 group ${draggedType === 'role' && draggedItem?.id === role.id ? 'opacity-50' : ''}`}>
                        <Grip className="text-gray-500" size={12} /><div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                        <span className="text-sm">{role.name}</span><span className="text-xs text-gray-400">({role.permissions.length})</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <ActionButton onClick={() => handleEditRole(role, category.id)} icon={Edit2} variant="edit" size="xs"/>
                          <ActionButton onClick={() => setDeleteTarget({type:'role', categoryId: category.id, roleId: role.id, name: role.name})} icon={Trash2} variant="delete" size="xs"/>
                          <ActionButton onClick={() => handleViewRole(role, category.id)} icon={Shield} variant="secondary" size="xs"/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 ml-6 pl-2 border-l-2 border-gray-700"
                   onDrop={(e) => {
                     e.stopPropagation();
                     handleActualDrop(category.id, 'category', category.channels.length);
                     (e.currentTarget as HTMLElement).classList.remove('drag-over');
                     dndHandleDrop();
                    }}
                   onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}>
                {category.channels.map((channel, chIndex) => {
                  const effectiveRoles = getEffectiveRolesForChannel(category, channel);
                  return (
                    <div key={channel.id} draggable={true} onDragStart={(e) => dndHandleDragStart(e, channel, 'channel', { categoryId: category.id })}
                         onDrop={(e) => {
                           e.stopPropagation();
                           handleActualDrop(channel.id, 'channel', chIndex);
                           (e.currentTarget as HTMLElement).classList.remove('drag-over');
                           dndHandleDrop();
                          }}
                         className={`bg-gray-700 rounded-lg p-3 group ${draggedType === 'channel' && draggedItem?.id === channel.id ? 'opacity-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Grip className="text-gray-500 cursor-grab" size={14} /><Hash className="text-gray-400" size={16} />
                          <span className="font-medium">{channel.name}</span><span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">{channel.type}</span>
                          {effectiveRoles.length > 0 && <span className="text-xs text-gray-400">{effectiveRoles.length} roles</span>}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <ActionButton onClick={() => setEditChannel({categoryId: category.id, channelId: channel.id})} icon={Edit2} variant="edit" size="xs" title="Editar Canal"/>
                          <button onClick={() => setRoleModal({ isOpen: true, mode: 'create', roleForm: { name: 'Nuevo Rol Canal', permissions: [], color: ROLE_COLORS[2] }, categoryId: category.id, channelId: channel.id })}
                                  className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"><Shield size={12}/>Rol</button>
                          <button onClick={() => setSelectRoleModal({ open: true, targetType: 'channel', categoryId: category.id, channelId: channel.id })}
                                  className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded text-xs"><Users size={12}/>Rol Existente</button>
                          <ActionButton onClick={() => setDeleteTarget({type: 'channel', categoryId: category.id, channelId: channel.id, name: channel.name})} icon={Trash2} variant="delete" size="xs" title="Eliminar Canal"/>
                        </div>
                      </div>
                      {channel.roles.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-600"
                             onDrop={(e) => {
                               e.stopPropagation();
                               handleActualDrop(channel.id, 'channel', channel.roles.length);
                               (e.currentTarget as HTMLElement).classList.remove('drag-over');
                               dndHandleDrop();
                              }}
                             onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}>
                          <h5 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1"><Shield size={12} />Roles del Canal</h5>
                          <div className="flex flex-wrap gap-2">
                            {channel.roles.map((role, roleChIndex) => (
                              <div key={role.id} draggable={true} onDragStart={(e) => dndHandleDragStart(e, role, 'role', { categoryId: category.id, channelId: channel.id })}
                                   onDrop={(e) => {
                                     e.stopPropagation();
                                     handleActualDrop(channel.id, 'channel', roleChIndex);
                                     (e.currentTarget as HTMLElement).classList.remove('drag-over');
                                     dndHandleDrop();
                                    }}
                                   className={`flex items-center gap-2 bg-gray-600 rounded px-2 py-1 cursor-move hover:bg-gray-500 group ${draggedType === 'role' && draggedItem?.id === role.id ? 'opacity-50' : ''}`}>
                                <Grip className="text-gray-500" size={10} /><div className="w-2 h-2 rounded-full" style={{backgroundColor: role.color}}/>
                                <span className="text-xs">{role.name}</span><span className="text-xs text-gray-400">({role.permissions.length})</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                  <ActionButton onClick={() => handleEditRole(role, category.id, channel.id)} icon={Edit2} variant="edit" size="xs"/>
                                  <ActionButton onClick={() => setDeleteTarget({type:'role', categoryId: category.id, channelId: channel.id, roleId: role.id, name: role.name})} icon={Trash2} variant="delete" size="xs"/>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {category.channels.length === 0 && <div className="text-gray-500 text-center py-4 border-2 border-dashed border-gray-600 rounded">Arrastra canales aquí o crea uno nuevo</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg"> {/* Instructions */} </div>
      </div>

      {editCategoryId && <CategoryEditModal initialName={categoriesData.find(cat => cat.id === editCategoryId)?.name || ''} initialDescription={categoriesData.find(cat => cat.id === editCategoryId)?.description || ''} onSave={handleSaveCategoryEdit} onCancel={() => setEditCategoryId(null)} />}
      {editChannel && <ChannelEditModal
        initialName={categoriesData.flatMap(c => c.channels).find(ch => ch.id === editChannel.channelId)?.name || ''}
        initialType={categoriesData.flatMap(c => c.channels).find(ch => ch.id === editChannel.channelId)?.type as 'text'|'voice' || 'text'}
        initialDescription={categoriesData.flatMap(c => c.channels).find(ch => ch.id === editChannel.channelId)?.description || ''}
        onSave={handleSaveChannelEdit} onCancel={() => setEditChannel(null)} />
      }
      {deleteTarget && <ConfirmDeleteModal message={`¿Seguro que quieres eliminar ${deleteTarget.type} "${deleteTarget.name}"?`} onConfirm={handleConfirmDelete} onCancel={() => setDeleteTarget(null)} />}
      <style>{`.drag-over { background-color: rgb(37,99,235) !important; transform: scale(1.02); } .group:hover .opacity-0 { opacity: 1 !important; }`}</style>
    </div>
  );
};

export default DragDropChannelsRoles;