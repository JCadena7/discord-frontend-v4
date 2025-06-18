import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { 
  Hash, Folder, Plus, Trash2, Download, Upload, Copy, 
  FileText, Edit2, Shield, Users, Grip
} from 'lucide-react';
// import { Category, Role } from '../../types/discord'; // Category and Role types for DndView are still used by hooks
import { useNotification } from '../../hooks/useNotification';
import { useAuthStore } from '../../store/authStore'; // Added
import {
  useServerStructureStore,
  useDndViewCategories,
  useServerInfo
} from '../../store/serverStructureStore'; // Added useServerInfo
import { useJsonOperations } from '../../hooks/useJsonOperations';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useCrudOperations } from '../../hooks/useCrudOperations';
import ActionButton from '../../components/common/ActionButton';
import RoleModal from '../../components/common/RoleEditModal';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';
import SelectRoleModal from '../../components/common/SelectRoleModal';
import ChannelEditModal from '../../components/common/ChannelEditModal';
import CategoryEditModal from '../../components/common/CategoryEditModal';
import { Role } from '../../types/discord';

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
  editingRole?: EditingRole;
  existingRole?: Role;
  roleForm: RoleForm;
  categoryId: string;
  channelId?: string;
}

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
  '#F8C471', '#82E0AA', '#F1948A', '#D7DBDD'
];

const DragDropChannelsRoles: React.FC = () => {
  // Estado para edición secuencial de roles recién asignados
  const [pendingRoleEdits, setPendingRoleEdits] = useState<Array<Role & { categoryId: string; channelId?: string }>>([]);
  // Estado para el modal de rol
  const [roleModal, setRoleModal] = useState<RoleModalState>({
    isOpen: false,
    mode: 'create',
    roleForm: { name: '', permissions: [], color: '' },
    categoryId: '',
    channelId: undefined
  });

  const selectedGuild = useAuthStore((state) => state.selectedGuild);
  const guildId = selectedGuild?.id;
  const { serverId, serverName } = useServerInfo(); // Added

  // Destructure all required states and actions from the store
  const {
    fetchServerStructure,
    updateServerStructure,
    isDirty,
    isLoading: serverStructureLoading, // Already aliased
    error: serverStructureError, // Already aliased
    addCategoryStore,
    updateCategoryStore,
    deleteCategoryStore,
    addChannelStore,
    updateChannelStore,
    deleteChannelStore,
    addRoleToItemStore,
    updateRoleInItemStore,
    deleteRoleFromItemStore,
    moveCategoryStore,
    moveChannelStore,
    moveRoleStore,
    applyJsonToStore,
  } = useServerStructureStore((state) => ({
    fetchServerStructure: state.fetchServerStructure,
    updateServerStructure: state.updateServerStructure,
    isDirty: state.isDirty,
    isLoading: state.isLoading,
    error: state.error,
    addCategoryStore: state.addCategoryStore,
    updateCategoryStore: state.updateCategoryStore,
    deleteCategoryStore: state.deleteCategoryStore,
    addChannelStore: state.addChannelStore,
    updateChannelStore: state.updateChannelStore,
    deleteChannelStore: state.deleteChannelStore,
    addRoleToItemStore: state.addRoleToItemStore,
    updateRoleInItemStore: state.updateRoleInItemStore,
    deleteRoleFromItemStore: state.deleteRoleFromItemStore,
    moveCategoryStore: state.moveCategoryStore,
    moveChannelStore: state.moveChannelStore,
    moveRoleStore: state.moveRoleStore,
    applyJsonToStore: state.applyJsonToStore,
  }));

  useEffect(() => {
    if (guildId) {
      fetchServerStructure(guildId);
    }
  }, [guildId, fetchServerStructure]); // Added

  // Handlers para abrir el modal de rol en modo crear, editar y ver
  const handleEditRole = (role: Role, categoryId: string, channelId?: string) => {
    const storeRole = categoriesData.flatMap(c => c.roles).find(r => r.id === role.id) ||
                      categoriesData.flatMap(c => c.channels).flatMap(ch => ch.roles).find(r => r.id === role.id);

    setRoleModal({
      isOpen: true,
      mode: 'edit',
      editingRole: { id: role.id, categoryId, channelId },
      existingRole: storeRole ? { ...storeRole, permissions: storeRole.permissions || [] } : undefined, // Ensure permissions is an array
      roleForm: {
        name: storeRole?.name || '',
        permissions: storeRole?.permissions || [], // Ensure permissions is an array
        color: storeRole?.color || ROLE_COLORS[0]
      },
      categoryId,
      channelId
    });
  };

  const handleViewRole = (role: Role, categoryId: string, channelId?: string) => {
    const storeRole = categoriesData.flatMap(c => c.roles).find(r => r.id === role.id) ||
                      categoriesData.flatMap(c => c.channels).flatMap(ch => ch.roles).find(r => r.id === role.id);
    setRoleModal({
      isOpen: true,
      mode: 'view',
      editingRole: { id: role.id, categoryId, channelId },
      existingRole: storeRole ? { ...storeRole, permissions: storeRole.permissions || [] } : undefined, // Ensure permissions is an array
      roleForm: {
        name: storeRole?.name || '',
        permissions: storeRole?.permissions || [], // Ensure permissions is an array
        color: storeRole?.color || ROLE_COLORS[0]
      },
      categoryId,
      channelId
    });
  };

  // Estado para modal de selección de roles
  const [selectRoleModal, setSelectRoleModal] = useState<{
    open: boolean,
    targetType: 'category' | 'channel' | null,
    categoryId: string | null,
    channelId?: string | null
  }>({ open: false, targetType: null, categoryId: null, channelId: null });

  // Obtener todos los roles existentes en el servidor (de todas las categorías y canales, únicos por id)
  const getAllRoles = (): Role[] => {
    const roleMap: Record<string, Role> = {};
    categoriesData.forEach(cat => { // Use categoriesData (from store)
      cat.roles.forEach(role => { roleMap[role.id] = role; });
      cat.channels.forEach(ch => {
        ch.roles.forEach(role => { roleMap[role.id] = role; });
      });
    });
    return Object.values(roleMap);
  };

    const placeholderSetCategories = (_dataUpdater: any) => { // Added placeholder
      console.warn('setCategories via DnD/CRUD/JSON is not implemented with Zustand yet. Data will not persist.');
      showNotification('Operation is temporarily disabled pending store integration. Data will not persist.');
  };

  // Asignar roles existentes (referencia) a categoría
    const assignRolesToCategory = (_categoryId: string, _roles: Role[]) => {
    // setCategories(categories.map(cat => // Old local state
    // This will be a store action
    placeholderSetCategories(null);
    // ));
  };

  // Asignar roles existentes (referencia) a canal
    const assignRolesToChannel = (_categoryId: string, _channelId: string, _roles: Role[]) => {
    // setCategories(categories.map(cat => // Old local state
    // This will be a store action
    placeholderSetCategories(null);
    // ));
  };

  // Estado para modales
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editChannel, setEditChannel] = useState<{categoryId: string, channelId: string} | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'category' | 'channel' | 'role', categoryId: string, channelId?: string, roleId?: string, name: string} | null>(null);

  const categoriesData = useDndViewCategories(); // Use selector for categories - Renamed to categoriesData
  // const serverRoles = useServerRoles(); // If needed for top-level role operations

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
    // applyJsonInput // This is now handled directly by calling applyJsonToStore
  } = useJsonOperations({ categories: categoriesData, setCategories: placeholderSetCategories, showNotification }); // Use categoriesData
  
  // Define the onPerformDrop callback for useDragAndDrop
  const onPerformDrop = (details: import('../../hooks/useDragAndDrop').DropDetails) => {
    const { draggedItem, draggedType, draggedSource, dropTarget } = details;

    if (!draggedItem || !draggedType) {
      console.warn("onPerformDrop called with no dragged item or type.");
      return;
    }

    switch (draggedType) {
      case 'category':
        // Ensure draggedItem has an id.
        if (draggedItem.id) {
          moveCategoryStore(draggedItem.id, dropTarget.targetCategoryId);
        } else {
          console.error("Dragged category is missing an ID.");
        }
        break;
      case 'channel':
        // Ensure draggedItem has an id and draggedSource has categoryId.
        if (draggedItem.id && draggedSource?.categoryId) {
          moveChannelStore(
            draggedItem.id,
            dropTarget.targetCategoryId,
            undefined, // newPositionInCategory - store will handle appending or specific logic
            draggedSource.categoryId // oldCategoryId
          );
        } else {
          console.error("Dragged channel is missing an ID or original category ID.");
        }
        break;
      case 'role':
        // Ensure draggedItem has an id and draggedSource has categoryId.
        if (draggedItem.id && draggedSource?.categoryId) {
          const sourceItemId = draggedSource.channelId || draggedSource.categoryId;
          const sourceType = draggedSource.channelId ? 'channel' : 'category';
          const targetItemId = dropTarget.targetChannelId || dropTarget.targetCategoryId;
          const targetType = dropTarget.targetChannelId ? 'channel' : 'category';
          moveRoleStore(
            draggedItem.id,
            sourceItemId,
            sourceType,
            targetItemId,
            targetType,
            undefined // newPositionInItem - store will handle appending
          );
        } else {
          console.error("Dragged role is missing an ID or source item ID.");
        }
        break;
      default:
        console.warn(`Unknown dragged type: ${draggedType}`);
        return;
    }
  };

  const {
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop, // This is the function from the hook that will call onPerformDrop
    draggedItem, // From hook, for UI feedback
    draggedType // From hook, for UI feedback
  } = useDragAndDrop({ onPerformDrop });

  const crudOps = useCrudOperations({
    categories: categoriesData,
    // setCategories: placeholderSetCategories, // No longer needed by useCrudOperations for paste
    addCategoryStore, // Pass store action
    addChannelStore   // Pass store action
  });
const {
    // addCategory, // Was store action, now this mapping is not needed as DndView calls addCategoryStore directly
    // deleteCategory, // Was store action, now this mapping is not needed
    // addChannel, // Will be store action
    // deleteChannel, // Will be store action
    // deleteRole, // Will be store action - Now directly using deleteRoleFromItemStore
    // copyCategory, // Will be store action (or local if clipboard is purely local) - Stays with useCrudOperations for now
    // pasteCategory, // Will be store action - Stays with useCrudOperations for now, but will use addCategoryStore
    // copyChannel, // Will be store action (or local) - Stays with useCrudOperations for now
    // pasteChannel, // Will be store action - Stays with useCrudOperations for now, but will use addChannelStore
    getEffectiveRolesForChannel // This can remain as it reads data
  } = crudOps;

// Remove mock crud operations that are now replaced by store actions
// const addCategory = () => { console.warn("addCategory not implemented with Zustand yet"); showNotification("Add category is temporarily disabled."); };
// const deleteCategory = (_id: string) => { console.warn("deleteCategory not implemented with Zustand yet"); showNotification("Delete category is temporarily disabled."); };
// const addChannel = (_catId: string) => { console.warn("addChannel not implemented with Zustand yet"); showNotification("Add channel is temporarily disabled."); };
// const deleteChannel = (_catId: string, _chId: string) => { ... }; // Not needed
// const deleteRole = (_catId: string, _roleId: string, _chId?: string) => { ... }; // Not needed

// Use copy/paste functions directly from crudOps
const { copyCategory, pasteCategory, copyChannel, pasteChannel, clipboardRef, getEffectiveRolesForChannel: getEffectiveRolesFromCrud } = crudOps;

// const clipboardRef = (crudOps as any).clipboardRef || { current: { type: null, data: null } }; // Now directly from crudOps
const isCategoryInClipboard = () => clipboardRef.current?.type === 'category'; // Make it a function to get latest value
const isChannelInClipboard = () => clipboardRef.current?.type === 'channel'; // Make it a function to get latest value


  // Helpers para edición y borrado
  const handleEditCategory = (categoryId: string) => setEditCategoryId(categoryId);
  const handleEditChannel = (categoryId: string, channelId: string) => setEditChannel({ categoryId, channelId });
  const handleDeleteCategory = (categoryId: string, name: string) => setDeleteTarget({ type: 'category', categoryId, name });
  const handleDeleteChannel = (categoryId: string, channelId: string, name: string) => setDeleteTarget({ type: 'channel', categoryId, channelId, name });
  const handleDeleteRole = (categoryId: string, roleId: string, channelId: string | undefined, name: string) => setDeleteTarget({ type: 'role', categoryId, channelId, roleId, name });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'category') {
      deleteCategoryStore(deleteTarget.categoryId);
    } else if (deleteTarget.type === 'channel' && deleteTarget.channelId) {
      deleteChannelStore(deleteTarget.channelId); // Assuming channelId is unique
    } else if (deleteTarget.type === 'role' && deleteTarget.roleId) {
      const itemType = deleteTarget.channelId ? 'channel' : 'category';
      const itemId = deleteTarget.channelId || deleteTarget.categoryId;
      deleteRoleFromItemStore(deleteTarget.roleId, itemId, itemType);
    }
    setDeleteTarget(null);
  };

  const handleSaveCategoryEdit = (name: string) => {
    if (editCategoryId) {
      updateCategoryStore(editCategoryId, { name });
      setEditCategoryId(null);
    }
  };

  const handleSaveChannelEdit = (name: string, type: 'text' | 'voice') => {
    if (editChannel) {
      updateChannelStore(editChannel.channelId, { name, type });
      setEditChannel(null);
    }
  };

  const handleCancelEdit = () => {
    setEditCategoryId(null);
    setEditChannel(null);
  };

  // Loading and error states
  if (serverStructureLoading) {
    return <div className="min-h-screen bg-gray-900 text-white p-6 flex justify-center items-center"><p>Loading server structure...</p></div>;
  }

  if (serverStructureError) {
    return <div className="min-h-screen bg-gray-900 text-white p-6 flex justify-center items-center"><p>Error loading server structure: {serverStructureError}</p></div>;
  }

  if (!guildId) {
      return <div className="min-h-screen bg-gray-900 text-white p-6 flex justify-center items-center"><p>No guild selected. Please select a guild from the sidebar.</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div> {/* Added a div to group title and server info */}
            <h1 className="text-3xl font-bold">Gestión de Canales, Categorías y Roles</h1>
            {serverName && serverId && (
              <div className="text-sm text-gray-400 mt-1"> {/* Adjusted margin */}
                <p>Servidor: <span className="font-semibold text-gray-300">{serverName}</span> (ID: <span className="font-semibold text-gray-300">{serverId}</span>)</p>
              </div>
            )}
          </div>
          
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
             {/* Save Changes Button */}
             <ActionButton
              onClick={async () => {
                if (guildId) {
                  await updateServerStructure(guildId);
                  showNotification('Cambios guardados exitosamente!');
                }
              }}
              disabled={!isDirty || serverStructureLoading}
              variant="primary" // Assuming you have a 'primary' variant for save
              isLoading={serverStructureLoading} // Show loading state on button
            >
              Guardar Cambios
            </ActionButton>
            
            <button onClick={() => addCategoryStore({ name: 'Nueva Categoría', type: 'category' })} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
              <Plus size={16} />
              Nueva Categoría
            </button>
            <button
              onClick={() => setRoleModal({
                isOpen: true,
                mode: 'create',
                roleForm: { name: '', permissions: [], color: '' },
                categoryId: '',
                channelId: undefined
              })}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Nuevo Rol
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
              placeholder={JSON.stringify(categoriesData, null, 2)} // Use categoriesData
              className="w-full h-40 bg-gray-900 text-white p-3 rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setJsonInput(JSON.stringify(categoriesData, null, 2))} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors">
                Cargar actual
              </button>
              <button onClick={() => {
                try {
                  const parsedData = JSON.parse(jsonInput); // Basic validation
                  applyJsonToStore(parsedData); // Use store action
                  setJsonInput('');
                  setShowJsonPanel(false);
                  showNotification('JSON aplicado exitosamente!');
                } catch (error) {
                  showNotification('Error al aplicar JSON: Formato inválido.', 'error');
                  console.error("Error parsing JSON input:", error);
                }
              }} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm transition-colors">
                Aplicar JSON
              </button>
            </div>
          </div>
        )}

        {/* Modal de edición de rol */}
        {roleModal.isOpen && (
          <RoleModal
            isOpen={roleModal.isOpen}
            mode={roleModal.mode}
            editingRole={roleModal.editingRole}
            existingRole={roleModal.existingRole}
            roleForm={roleModal.roleForm}
            setRoleForm={(form) => setRoleModal(prev => ({ ...prev, roleForm: typeof form === 'function' ? form(prev.roleForm) : form }))}
            availablePermissions={AVAILABLE_PERMISSIONS}
            roleColors={ROLE_COLORS}
            onSave={async (roleData) => {
              const itemId = roleModal.channelId || roleModal.categoryId;
              const itemType = roleModal.channelId ? 'channel' : 'category';

              if (roleModal.mode === 'create' || !roleModal.editingRole?.id) {
                // Ensure roleData has all necessary fields for a new ServerApiRole, excluding id, position etc.
                const newServerRoleData = {
                  name: roleData.name,
                  permissions: roleData.permissions, // This is an array of strings (permission names)
                  color: roleData.color,
                  // 'managed' and 'mentionable' are not part of RoleForm, default in store if needed
                };
                addRoleToItemStore(newServerRoleData, itemId, itemType);
              } else if (roleModal.mode === 'edit' && roleModal.editingRole?.id) {
                // Ensure roleData has all necessary fields for a partial ServerApiRole
                const updatedServerRoleData = {
                  name: roleData.name,
                  permissions: roleData.permissions,
                  color: roleData.color,
                };
                updateRoleInItemStore(roleModal.editingRole.id, updatedServerRoleData, itemId, itemType);
              }
              setRoleModal(prev => ({ ...prev, isOpen: false }));
            }}
            onCancel={() => setRoleModal({ isOpen: false, mode: 'create', roleForm: { name: '', permissions: [], color: '' }, categoryId: '', channelId: undefined })}
            onTogglePermission={(permission: string) => {
              setRoleModal(prev => ({
                ...prev,
                roleForm: {
                  ...prev.roleForm,
                  permissions: prev.roleForm.permissions.includes(permission)
                    ? prev.roleForm.permissions.filter(p => p !== permission)
                    : [...prev.roleForm.permissions, permission]
                }
              }));
            }}
            onEdit={() => setRoleModal(prev => ({ ...prev, mode: 'edit' }))}
          />
        )}


        {/* Modal para agregar roles existentes */}
        {selectRoleModal.open && (
          <SelectRoleModal
            roles={getAllRoles().filter(role => { // Uses categoriesData via getAllRoles
              // Excluir roles ya asignados a la categoría/canal actual
              if (selectRoleModal.targetType === 'category') {
                const cat = categoriesData.find(c => c.id === selectRoleModal.categoryId); // Use categoriesData
                return cat ? !cat.roles.some(r => r.id === role.id) : true;
              } else if (selectRoleModal.targetType === 'channel') {
                const cat = categoriesData.find(c => c.id === selectRoleModal.categoryId); // Use categoriesData
                const ch = cat?.channels.find(ch => ch.id === selectRoleModal.channelId);
                return ch ? !ch.roles.some(r => r.id === role.id) : true;
              }
              return true;
            })}
            onConfirm={(selectedRoles) => {
              // Asignar roles y preparar edición de permisos secuencial
              if (selectRoleModal.targetType === 'category' && typeof selectRoleModal.categoryId === 'string') {
                assignRolesToCategory(selectRoleModal.categoryId, selectedRoles);
                setPendingRoleEdits(selectedRoles.map(role => ({
                  ...role,
                  categoryId: selectRoleModal.categoryId as string,
                  channelId: undefined
                })));
              } else if (selectRoleModal.targetType === 'channel' && typeof selectRoleModal.categoryId === 'string' && typeof selectRoleModal.channelId === 'string') {
                assignRolesToChannel(selectRoleModal.categoryId, selectRoleModal.channelId, selectedRoles);
                setPendingRoleEdits(selectedRoles.map(role => ({
                  ...role,
                  categoryId: selectRoleModal.categoryId as string,
                  channelId: selectRoleModal.channelId as string
                })));
              }
              setSelectRoleModal({ open: false, targetType: null, categoryId: null, channelId: null });
            }}
            onCancel={() => setSelectRoleModal({ open: false, targetType: null, categoryId: null, channelId: null })}
            title={selectRoleModal.targetType === 'category' ? 'Agregar roles a la categoría' : 'Agregar roles al canal'}
          />
        )}

        {/* Edición secuencial de permisos de roles recién asignados */}
        {pendingRoleEdits.length > 0 && (
          <RoleModal
            isOpen={true}
            mode="edit"
            editingRole={{
              id: pendingRoleEdits[0].id,
              categoryId: pendingRoleEdits[0].categoryId,
              channelId: pendingRoleEdits[0].channelId
            }}
            existingRole={pendingRoleEdits[0]}
            roleForm={{
              name: pendingRoleEdits[0].name,
              permissions: pendingRoleEdits[0].permissions,
              color: pendingRoleEdits[0].color
            }}
            setRoleForm={() => { /* No-op */ }}
            availablePermissions={AVAILABLE_PERMISSIONS}
            roleColors={ROLE_COLORS}
            onSave={async (roleData) => {
              const currentRole = pendingRoleEdits[0];
              const itemId = currentRole.channelId || currentRole.categoryId;
              const itemType = currentRole.channelId ? 'channel' : 'category';
              const updatedServerRoleData = {
                name: roleData.name,
                permissions: roleData.permissions,
                color: roleData.color,
              };
              updateRoleInItemStore(currentRole.id, updatedServerRoleData, itemId, itemType);
              setPendingRoleEdits((edits: Array<Role & { categoryId: string; channelId?: string }>) => edits.slice(1));
            }}
            onCancel={() => setPendingRoleEdits((edits: Array<Role & { categoryId: string; channelId?: string }>) => edits.slice(1))}
            onTogglePermission={(permission: string) => {
              // Logic to update permissions in pendingRoleEdits[0] if live editing is desired before save
              // For now, this modal might be more of a display of current state + save
              // Or, implement a local state for this modal instance if needed
              setPendingRoleEdits(prevEdits => {
                const currentEdit = { ...prevEdits[0] };
                if (currentEdit.permissions.includes(permission)) {
                  currentEdit.permissions = currentEdit.permissions.filter(p => p !== permission);
                } else {
                  currentEdit.permissions = [...currentEdit.permissions, permission];
                }
                return [currentEdit, ...prevEdits.slice(1)];
              });
            }}
            onEdit={() => {}}
          />
        )}


        {/* Notificaciones */}
        {notification && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-40">
            {notification}
          </div>
        )}

        {/* Lista de categorías */}
        {/* Lista de categorías */}
<div className="space-y-6">
  {categoriesData.map((category) => ( // Use categoriesData
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
          <span className="font-semibold text-lg group-hover:text-blue-400 transition-colors flex items-center gap-2">
            <Folder className="inline-block mr-1 text-gray-400" size={18} />
            {category.name}
            <button
              className="ml-2 text-blue-400 hover:text-blue-600 p-1 rounded"
              title="Editar categoría"
              onClick={() => handleEditCategory(category.id)}
            >
              <Edit2 size={14} />
            </button>
            <button
              className="ml-1 text-red-400 hover:text-red-600 p-1 rounded"
              title="Eliminar categoría"
              onClick={() => handleDeleteCategory(category.id, category.name)}
            >
              <Trash2 size={14} />
            </button>
            <span className="ml-2 text-xs text-gray-400 font-normal">({category.channels.length} canales, {category.roles.length} roles)</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton
            onClick={() => { copyCategory(category.id); showNotification('Categoría copiada'); }}
            icon={Copy}
            variant="secondary"
            size="sm"
            title="Copiar categoría"
          />
          <ActionButton
            onClick={() => { pasteCategory(); showNotification('Categoría pegada'); }}
            icon={Upload}
            variant="success"
            size="sm"
            title="Pegar categoría"
            disabled={!isCategoryInClipboard()}
          />
          <button onClick={() => addChannelStore(category.id, { name: 'Nuevo Canal', type: 'text' })} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors">
            <Plus size={14} />
            Canal
          </button>
          <button onClick={() => {
            setRoleModal({
              isOpen: true,
              mode: 'create',
              roleForm: { name: '', permissions: [], color: '' },
              categoryId: category.id,
              channelId: undefined
            });
          }} className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors">
            <Shield size={14} />
            Rol
          </button>
          <button
            onClick={() => setSelectRoleModal({ open: true, targetType: 'category', categoryId: category.id })}
            className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm transition-colors"
          >
            <Users size={14} />
            Agregar rol existente
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
                    onClick={() => handleEditRole(role, category.id)}
                    variant="edit"
                    size="xs"
                    icon={Edit2}
                  />
                  <ActionButton
                    onClick={() => handleDeleteRole(category.id, role.id, undefined, role.name)}
                    variant="delete"
                    size="xs"
                    icon={Trash2}
                  />
                  <ActionButton
                    onClick={() => handleViewRole(role, category.id)}
                    variant="secondary"
                    size="xs"
                    icon={Shield}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Canales */}
      <div 
        className="space-y-3 ml-6"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, category.id)}
      >
        {category.channels.map((channel) => {
          // Mostrar roles efectivos (heredados + overrides)
          const effectiveRoles = getEffectiveRolesFromCrud(category, channel);
          return (
            <div
              key={channel.id}
              className={`bg-gray-700 rounded-lg p-3 transition-all duration-200 group ${
                draggedType === 'channel' && draggedItem?.id === channel.id ? 'opacity-50 scale-95' : ''
              }`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, channel, 'channel', { categoryId: category.id })}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Grip className="text-gray-500 cursor-grab" size={14} />
                  <Hash className="text-gray-400" size={16} />
                  <span className="text-white font-medium">{channel.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                    {channel.type}
                  </span>
                  {effectiveRoles.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {effectiveRoles.length} roles: {effectiveRoles.map(r => r.name).join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionButton
                    onClick={() => handleEditChannel(category.id, channel.id)}
                    icon={Edit2}
                    variant="edit"
                    size="xs"
                    title="Editar canal"
                  />
                  <ActionButton
                    onClick={() => { copyChannel(category.id, channel.id); showNotification('Canal copiado'); }}
                    icon={Copy}
                    variant="secondary"
                    size="xs"
                    title="Copiar canal"
                  />
                  <ActionButton
                    onClick={() => { pasteChannel(category.id); showNotification('Canal pegado'); }}
                    icon={Upload}
                    variant="success"
                    size="xs"
                    title="Pegar canal"
                    disabled={!isChannelInClipboard()}
                  />
                  <button onClick={() => {
                    setRoleModal({
                      isOpen: true,
                      mode: 'create',
                      roleForm: { name: '', permissions: [], color: '' },
                      categoryId: category.id,
                      channelId: channel.id
                    });
                  }} className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors">
                    <Shield size={12} />
                    Rol
                  </button>
                  <button
                    onClick={() => setSelectRoleModal({ open: true, targetType: 'channel', categoryId: category.id, channelId: channel.id })}
                    className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded text-xs transition-colors"
                  >
                    <Users size={12} />
                    Agregar rol existente
                  </button>
                  <button onClick={() => handleDeleteChannel(category.id, channel.id, channel.name)} className="text-red-400 hover:text-red-300 p-1 transition-colors">
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
                            onClick={() => handleEditRole(role, category.id, channel.id)}
                            variant="edit"
                            size="xs"
                            icon={Edit2}
                          />
                          <ActionButton
                            onClick={() => handleDeleteRole(category.id, role.id, channel.id, role.name)}
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
          );
        })}

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

      {/* Modales de edición, selección de roles y confirmación */}
      {editCategoryId && (
        <CategoryEditModal
          initialName={categoriesData.find(cat => cat.id === editCategoryId)?.name || ''}
          onSave={handleSaveCategoryEdit}
          onCancel={handleCancelEdit}
        />
      )}
      {/* Modal de rol: crear, editar, ver */}
      {roleModal.isOpen && (
        <RoleModal
          isOpen={roleModal.isOpen}
          mode={roleModal.mode}
          editingRole={roleModal.editingRole}
          existingRole={roleModal.existingRole}
          roleForm={roleModal.roleForm}
          setRoleForm={value =>
            setRoleModal(prev => ({
              ...prev,
              roleForm: typeof value === 'function' ? value(prev.roleForm) : value
            }))
          }
          availablePermissions={AVAILABLE_PERMISSIONS}
          roleColors={ROLE_COLORS}
          onSave={async (_roleData) => {
            // Create or update the role
            const _newRole: Role = {
              id: roleModal.editingRole?.id || `role-${Date.now()}`,
              name: _roleData.name,
              permissions: _roleData.permissions,
              color: _roleData.color
            };
            
            // Update categories with the new/updated role
            // setCategories(prev => prev.map(cat => { // Old local state
            // This will be a store action
            placeholderSetCategories(null);
            // }));
            
            // Close the modal
            setRoleModal(prev => ({ ...prev, isOpen: false }));
          }}
          onCancel={() => setRoleModal(prev => ({ ...prev, isOpen: false }))}
          onTogglePermission={(permission: string) => {
            setRoleModal(prev => ({
              ...prev,
              roleForm: {
                ...prev.roleForm,
                permissions: prev.roleForm.permissions.includes(permission)
                  ? prev.roleForm.permissions.filter((p: string) => p !== permission)
                  : [...prev.roleForm.permissions, permission]
              }
            }));
          }}
          isLoading={false}
        />
      )}
      {editChannel && (
        <ChannelEditModal
          initialName={(() => {
            const cat = categoriesData.find(c => c.id === editChannel.categoryId); // Use categoriesData
            const ch = cat?.channels.find(ch => ch.id === editChannel.channelId);
            return ch?.name || '';
          })()}
          initialType={(() => {
            const cat = categoriesData.find(c => c.id === editChannel.categoryId); // Use categoriesData
            const ch = cat?.channels.find(ch => ch.id === editChannel.channelId);
            return (ch?.type as 'text' | 'voice') || 'text';
          })()}
          onSave={handleSaveChannelEdit}
          onCancel={handleCancelEdit}
        />
      )}
      {selectRoleModal.open && (
        <SelectRoleModal
          roles={getAllRoles()} // Uses categoriesData via getAllRoles
          onCancel={() => setSelectRoleModal({ open: false, targetType: null, categoryId: null, channelId: null })}
          onConfirm={(selectedRoles) => {
            if (selectRoleModal.targetType === 'category' && selectRoleModal.categoryId) {
              selectedRoles.forEach(role => {
                // Assuming addRoleToItemStore handles adding existing roles correctly
                // Need to ensure the role data passed is just the essential part if it's an existing role
                // or if addRoleToItemStore can find and link existing global roles.
                // For now, let's assume we pass the full role object, and the store handles it.
                // The store's addRoleToItemStore might need adjustment if it always creates a *new* global role.
                // It should ideally find an existing global role by ID if one is passed or by name.
                const roleToAdd = getAllRoles().find(r => r.id === role.id);
                if (roleToAdd) {
                    const { id, name, permissions, color } = roleToAdd; // Pass only necessary data
                    addRoleToItemStore({ name, permissions, color }, selectRoleModal.categoryId!, 'category');
                }
              });
              // The setPendingRoleEdits logic might need to be re-evaluated or simplified
              // if adding roles directly updates them in the store.
            } else if (selectRoleModal.targetType === 'channel' && selectRoleModal.categoryId && selectRoleModal.channelId) {
              selectedRoles.forEach(role => {
                const roleToAdd = getAllRoles().find(r => r.id === role.id);
                if (roleToAdd) {
                    const { id, name, permissions, color } = roleToAdd;
                    addRoleToItemStore({ name, permissions, color }, selectRoleModal.channelId!, 'channel');
                }
              });
            }
            setSelectRoleModal({ open: false, targetType: null, categoryId: null, channelId: null });
            showNotification('Roles asignados. Edita sus permisos específicos si es necesario.');
          }}
          title={selectRoleModal.targetType === 'category' ? 'Agregar roles a categoría' : 'Agregar roles a canal'}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          message={`¿Seguro que quieres eliminar ${deleteTarget.type === 'category' ? 'la categoría' : deleteTarget.type === 'channel' ? 'el canal' : 'el rol'} "${deleteTarget.name}"? Esta acción no se puede deshacer.`}
          onConfirm={handleConfirmDelete} // Already updated to use store actions
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Display Server Structure Error (if any, especially after save) */}
      {serverStructureError && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Error: {serverStructureError}
        </div>
      )}

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