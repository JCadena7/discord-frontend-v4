import React, { useState } from 'react';
import { MoreVertical, Edit, Trash, Shield } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { DiscordRole } from '../../types/discord';
import { intToHex } from '../../utils/colors';
import EditRoleModal from './EditRoleModal';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal';
import RolePermissionsModal from './RolePermissionsModal';

interface RoleCardProps {
  role: DiscordRole;
  onUpdate: (id: string, role: Partial<DiscordRole>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, onUpdate, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  const handleEdit = () => {
    setIsMenuOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handlePermissions = () => {
    setIsMenuOpen(false);
    setIsPermissionsModalOpen(true);
  };

  const roleColor = role.color ? intToHex(role.color) : '#99AAB5';

  return (
    <>
      <Card className="h-full">
        <div className="flex justify-between items-start">
          <div className="flex items-center mb-3">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: roleColor }}
            />
            <h3 className="text-lg font-medium">{role.name}</h3>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MoreVertical size={18} />
            </Button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 animate-fadeIn">
                <div className="py-1">
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={handleEdit}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Role
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={handlePermissions}
                  >
                    <Shield size={16} className="mr-2" />
                    Manage Permissions
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={handleDelete}
                  >
                    <Trash size={16} className="mr-2" />
                    Delete Role
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p>
            <span className="font-medium">Position:</span> {role.position}
          </p>
          <p>
            <span className="font-medium">Hoisted:</span> {role.hoist ? 'Yes' : 'No'}
          </p>
          <p>
            <span className="font-medium">Mentionable:</span> {role.mentionable ? 'Yes' : 'No'}
          </p>
        </div>
      </Card>

      {isEditModalOpen && (
        <EditRoleModal
          role={role}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (updatedRole) => {
            await onUpdate(role.id, updatedRole);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={async () => {
            await onDelete(role.id);
            setIsDeleteModalOpen(false);
          }}
          title="Delete Role"
          message={`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`}
        />
      )}

      {isPermissionsModalOpen && (
        <RolePermissionsModal
          role={role}
          isOpen={isPermissionsModalOpen}
          onClose={() => setIsPermissionsModalOpen(false)}
          onSave={async (permissions) => {
            await onUpdate(role.id, { permissions });
            setIsPermissionsModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default RoleCard;