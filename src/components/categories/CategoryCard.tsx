import React, { useState } from 'react';
import { MoreVertical, Edit, Trash, FolderTree } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { DiscordCategory } from '../../types/discord';
import EditCategoryModal from './EditCategoryModal';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal';

interface CategoryCardProps {
  category: DiscordCategory;
  onUpdate: (id: string, category: Partial<DiscordCategory>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  channelCount: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  onUpdate, 
  onDelete,
  channelCount 
}) => {
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

  return (
    <>
      <Card className="h-full">
        <div className="flex justify-between items-start">
          <div className="flex items-center mb-3">
            <div className="text-indigo-600 dark:text-indigo-400 mr-2">
              <FolderTree size={18} />
            </div>
            <h3 className="text-lg font-medium">{category.name}</h3>
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
                    Edit Category
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={handleDelete}
                  >
                    <Trash size={16} className="mr-2" />
                    Delete Category
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p>
            <span className="font-medium">Position:</span> {category.position}
          </p>
          <p>
            <span className="font-medium">Channels:</span> {channelCount}
          </p>
        </div>
      </Card>

      {isEditModalOpen && (
        <EditCategoryModal
          category={category}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (updatedCategory) => {
            await onUpdate(category.id, updatedCategory);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={async () => {
            await onDelete(category.id);
            setIsDeleteModalOpen(false);
          }}
          title="Delete Category"
          message={`Are you sure you want to delete the category "${category.name}"? This will not delete the channels inside, but they will no longer be grouped.`}
        />
      )}
    </>
  );
};

export default CategoryCard;