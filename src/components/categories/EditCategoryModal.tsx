import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { DiscordCategory } from '../../types/discord';

interface EditCategoryModalProps {
  category?: DiscordCategory;
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Partial<DiscordCategory>) => Promise<void>;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  category,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<DiscordCategory>>({
    name: category?.name || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Create Category'}
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
            {category ? 'Save Changes' : 'Create Category'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Category Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </form>
    </Modal>
  );
};

export default EditCategoryModal;