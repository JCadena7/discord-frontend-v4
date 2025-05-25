import React, { useState } from 'react';
import { MoreVertical, Edit, Trash, Hash, Volume2 } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { DiscordChannel, ChannelType } from '../../types/discord';
import EditChannelModal from './EditChannelModal';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal';

interface ChannelCardProps {
  channel: DiscordChannel;
  onUpdate: (id: string, channel: Partial<DiscordChannel>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categoryNames: { [key: string]: string };
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onUpdate, onDelete, categoryNames }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleEdit = () => {
    setIsMenuOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const getChannelIcon = () => {
    switch (channel.type) {
      case ChannelType.GUILD_TEXT:
        return <Hash size={18} />;
      case ChannelType.GUILD_VOICE:
        return <Volume2 size={18} />;
      default:
        return <Hash size={18} />;
    }
  };

  const getChannelTypeName = () => {
    switch (channel.type) {
      case ChannelType.GUILD_TEXT:
        return 'Text Channel';
      case ChannelType.GUILD_VOICE:
        return 'Voice Channel';
      default:
        return 'Unknown Channel';
    }
  };

  return (
    <>
      <Card className="h-full">
        <div className="flex justify-between items-start">
          <div className="flex items-center mb-3">
            <div className="text-indigo-600 dark:text-indigo-400 mr-2">
              {getChannelIcon()}
            </div>
            <h3 className="text-lg font-medium">{channel.name}</h3>
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
                    Edit Channel
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={handleDelete}
                  >
                    <Trash size={16} className="mr-2" />
                    Delete Channel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p>
            <span className="font-medium">Type:</span> {getChannelTypeName()}
          </p>
          <p>
            <span className="font-medium">Category:</span> {channel.parent_id ? categoryNames[channel.parent_id] || 'Unknown' : 'None'}
          </p>
          <p>
            <span className="font-medium">Position:</span> {channel.position}
          </p>
        </div>
      </Card>

      {isEditModalOpen && (
        <EditChannelModal
          channel={channel}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (updatedChannel) => {
            await onUpdate(channel.id, updatedChannel);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={async () => {
            await onDelete(channel.id);
            setIsDeleteModalOpen(false);
          }}
          title="Delete Channel"
          message={`Are you sure you want to delete the channel "${channel.name}"? This action cannot be undone.`}
        />
      )}
    </>
  );
};

export default ChannelCard;