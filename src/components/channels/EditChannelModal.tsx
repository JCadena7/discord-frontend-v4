import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { DiscordChannel, ChannelType } from '../../types/discord';
import { useCategoriesStore } from '../../store/categoriesStore';

interface EditChannelModalProps {
  channel?: DiscordChannel;
  isOpen: boolean;
  onClose: () => void;
  onSave: (channel: Partial<DiscordChannel>) => Promise<void>;
}

const EditChannelModal: React.FC<EditChannelModalProps> = ({
  channel,
  isOpen,
  onClose,
  onSave,
}) => {
  const { categories, fetchCategories } = useCategoriesStore();
  
  const [formData, setFormData] = useState<Partial<DiscordChannel>>({
    name: channel?.name || '',
    type: channel?.type || ChannelType.GUILD_TEXT,
    parent_id: channel?.parent_id || null,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTypeChange = (value: string) => {
    setFormData({
      ...formData,
      type: parseInt(value) as ChannelType,
    });
  };

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      parent_id: value === 'none' ? null : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving channel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const channelTypeOptions = [
    { value: ChannelType.GUILD_TEXT.toString(), label: 'Text Channel' },
    { value: ChannelType.GUILD_VOICE.toString(), label: 'Voice Channel' },
  ];

  const categoryOptions = [
    { value: 'none', label: 'No Category' },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={channel ? 'Edit Channel' : 'Create Channel'}
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
            {channel ? 'Save Changes' : 'Create Channel'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Channel Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        
        <Select
          label="Channel Type"
          options={channelTypeOptions}
          value={formData.type?.toString()}
          onChange={handleTypeChange}
        />
        
        <Select
          label="Category"
          options={categoryOptions}
          value={formData.parent_id || 'none'}
          onChange={handleCategoryChange}
        />
      </form>
    </Modal>
  );
};

export default EditChannelModal;