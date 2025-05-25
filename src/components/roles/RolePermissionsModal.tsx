import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { DiscordRole } from '../../types/discord';

interface Permission {
  name: string;
  value: bigint;
  description: string;
  category: string;
}

interface RolePermissionsModalProps {
  role: DiscordRole;
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissions: string) => Promise<void>;
}

const RolePermissionsModal: React.FC<RolePermissionsModalProps> = ({
  role,
  isOpen,
  onClose,
  onSave,
}) => {
  const [currentPermissions, setCurrentPermissions] = useState<bigint>(BigInt(role.permissions || '0'));
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('General');

  // Simplified permissions list for demo purposes
  const permissions: Permission[] = [
    // General
    { name: 'Administrator', value: BigInt(1) << BigInt(3), description: 'Members with this permission have every permission and bypass channel specific permissions.', category: 'General' },
    { name: 'View Audit Log', value: BigInt(1) << BigInt(7), description: 'Allows members to view the server\'s audit logs.', category: 'General' },
    { name: 'View Server Insights', value: BigInt(1) << BigInt(19), description: 'Allows members to view the server\'s insights.', category: 'General' },
    { name: 'Manage Server', value: BigInt(1) << BigInt(5), description: 'Allows members to change the server\'s name and region.', category: 'General' },
    { name: 'Manage Roles', value: BigInt(1) << BigInt(28), description: 'Allows members to create, edit, and delete roles lower than their highest role.', category: 'General' },
    
    // Membership
    { name: 'Create Instant Invite', value: BigInt(1) << BigInt(0), description: 'Allows members to invite new people to this server.', category: 'Membership' },
    { name: 'Kick Members', value: BigInt(1) << BigInt(1), description: 'Allows members to remove members from the server.', category: 'Membership' },
    { name: 'Ban Members', value: BigInt(1) << BigInt(2), description: 'Allows members to permanently ban members from the server.', category: 'Membership' },
    
    // Channel Management
    { name: 'Manage Channels', value: BigInt(1) << BigInt(4), description: 'Allows members to create, edit, and delete channels.', category: 'Channel Management' },
    { name: 'Manage Webhooks', value: BigInt(1) << BigInt(29), description: 'Allows members to create, edit, and delete webhooks.', category: 'Channel Management' },
    
    // Text Channels
    { name: 'Send Messages', value: BigInt(1) << BigInt(11), description: 'Allows members to send messages in text channels.', category: 'Text Channels' },
    { name: 'Send Messages in Threads', value: BigInt(1) << BigInt(17), description: 'Allows members to send messages in threads.', category: 'Text Channels' },
    { name: 'Create Public Threads', value: BigInt(1) << BigInt(15), description: 'Allows members to create threads that everyone can see.', category: 'Text Channels' },
    { name: 'Create Private Threads', value: BigInt(1) << BigInt(16), description: 'Allows members to create private threads.', category: 'Text Channels' },
    { name: 'Embed Links', value: BigInt(1) << BigInt(14), description: 'Links sent by members with this permission will be auto-embedded.', category: 'Text Channels' },
  ];

  const categories = [...new Set(permissions.map(p => p.category))];

  const handleTogglePermission = (value: bigint) => {
    setCurrentPermissions((prev) => {
      if ((prev & value) === value) {
        return prev & ~value; // Remove permission
      } else {
        return prev | value; // Add permission
      }
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSave(currentPermissions.toString());
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Permissions - ${role.name}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Save Permissions
          </Button>
        </>
      }
    >
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/4 mb-4 md:mb-0">
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category}>
                <button
                  onClick={() => setActiveCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:w-3/4 md:pl-4 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-0 md:pl-4">
          <ul className="space-y-4">
            {permissions
              .filter((p) => p.category === activeCategory)
              .map((permission) => (
                <li key={permission.name} className="flex items-start">
                  <div className="flex items-center h-5 mt-1">
                    <input
                      id={permission.name}
                      type="checkbox"
                      checked={(currentPermissions & permission.value) === permission.value}
                      onChange={() => handleTogglePermission(permission.value)}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={permission.name} className="font-medium text-gray-700 dark:text-gray-300">
                      {permission.name}
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">{permission.description}</p>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default RolePermissionsModal;