import React, { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import RoleCard from '../../components/roles/RoleCard';
import EditRoleModal from '../../components/roles/EditRoleModal';
import { useRolesStore } from '../../store/rolesStore';
import toast from 'react-hot-toast';

const RolesView: React.FC = () => {
  const { roles, fetchRoles, addRole, updateRole, deleteRole, isLoading } = useRolesStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateRole = async (roleData: any) => {
    try {
      await addRole(roleData);
      toast.success('Role created successfully');
    } catch (error) {
      toast.error('Failed to create role');
      console.error(error);
    }
  };

  const handleUpdateRole = async (id: string, roleData: any) => {
    try {
      await updateRole(id, roleData);
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error('Failed to update role');
      console.error(error);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await deleteRole(id);
      toast.success('Role deleted successfully');
    } catch (error) {
      toast.error('Failed to delete role');
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Roles</h1>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={<PlusCircle size={16} />}
        >
          Create Role
        </Button>
      </div>

      {isLoading && <div className="text-center py-8">Loading roles...</div>}

      {!isLoading && roles.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No roles found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get started by creating your first role.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={<PlusCircle size={16} />}
          >
            Create Role
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            onUpdate={handleUpdateRole}
            onDelete={handleDeleteRole}
          />
        ))}
      </div>

      {isCreateModalOpen && (
        <EditRoleModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={async (roleData) => {
            await handleCreateRole(roleData);
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default RolesView;