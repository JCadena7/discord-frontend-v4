import React, { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import ChannelCard from '../../components/channels/ChannelCard';
import EditChannelModal from '../../components/channels/EditChannelModal';
import { useChannelsStore } from '../../store/channelsStore';
import { useCategoriesStore } from '../../store/categoriesStore';
import toast from 'react-hot-toast';

const ChannelsView: React.FC = () => {
  const { channels, fetchChannels, addChannel, updateChannel, deleteChannel, isLoading } = useChannelsStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create a map of category IDs to names for easier lookup
  const categoryNames = categories.reduce((acc, category) => {
    acc[category.id] = category.name;
    return acc;
  }, {} as { [key: string]: string });

  useEffect(() => {
    fetchChannels();
    fetchCategories();
  }, [fetchChannels, fetchCategories]);

  const handleCreateChannel = async (channelData: any) => {
    try {
      await addChannel(channelData);
      toast.success('Channel created successfully');
    } catch (error) {
      toast.error('Failed to create channel');
      console.error(error);
    }
  };

  const handleUpdateChannel = async (id: string, channelData: any) => {
    try {
      await updateChannel(id, channelData);
      toast.success('Channel updated successfully');
    } catch (error) {
      toast.error('Failed to update channel');
      console.error(error);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await deleteChannel(id);
      toast.success('Channel deleted successfully');
    } catch (error) {
      toast.error('Failed to delete channel');
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Channels</h1>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={<PlusCircle size={16} />}
        >
          Create Channel
        </Button>
      </div>

      {isLoading && <div className="text-center py-8">Loading channels...</div>}

      {!isLoading && channels.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No channels found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get started by creating your first channel.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={<PlusCircle size={16} />}
          >
            Create Channel
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {channels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            onUpdate={handleUpdateChannel}
            onDelete={handleDeleteChannel}
            categoryNames={categoryNames}
          />
        ))}
      </div>

      {isCreateModalOpen && (
        <EditChannelModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={async (channelData) => {
            await handleCreateChannel(channelData);
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ChannelsView;