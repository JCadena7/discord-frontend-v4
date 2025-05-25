import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { DiscordRole } from '../../types/discord';
import { hexToInt, intToHex } from '../../utils/colors';

interface EditRoleModalProps {
  role?: DiscordRole;
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Partial<DiscordRole>) => Promise<void>;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  role,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<DiscordRole>>({
    name: role?.name || '',
    color: role?.color || 0,
    hoist: role?.hoist || false,
    mentionable: role?.mentionable || false,
  });
  const [colorHex, setColorHex] = useState(role?.color ? intToHex(role.color) : '#99AAB5');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setColorHex(hex);
    setFormData({
      ...formData,
      color: hexToInt(hex),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={role ? 'Edit Role' : 'Create Role'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {role ? 'Save Changes' : 'Create Role'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Role Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              name="color"
              value={colorHex}
              onChange={handleColorChange}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <Input
              type="text"
              name="colorHex"
              value={colorHex}
              onChange={(e) => {
                setColorHex(e.target.value);
                setFormData({
                  ...formData,
                  color: hexToInt(e.target.value),
                });
              }}
              className="w-28"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hoist"
              name="hoist"
              checked={formData.hoist}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="hoist"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Display separately from online members
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="mentionable"
              name="mentionable"
              checked={formData.mentionable}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="mentionable"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Allow anyone to mention this role
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditRoleModal;