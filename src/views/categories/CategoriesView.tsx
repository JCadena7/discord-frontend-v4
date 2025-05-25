import React, { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import CategoryCard from '../../components/categories/CategoryCard';
import EditCategoryModal from '../../components/categories/EditCategoryModal';
import { useCategoriesStore } from '../../store/categoriesStore';
import { useChannelsStore } from '../../store/channelsStore';
import toast from 'react-hot-toast';

const CategoriesView: React.FC = () => {
  const { categories, fetchCategories, addCategory, updateCategory, deleteCategory, isLoading } = useCategoriesStore();
  const { channels, fetchChannels } = useChannelsStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchChannels();
  }, [fetchCategories, fetchChannels]);

  // Count channels per category
  const channelCounts = categories.reduce((counts, category) => {
    counts[category.id] = channels.filter(channel => channel.parent_id === category.id).length;
    return counts;
  }, {} as { [key: string]: number });

  const handleCreateCategory = async (categoryData: any) => {
    try {
      await addCategory(categoryData);
      toast.success('Category created successfully');
    } catch (error) {
      toast.error('Failed to create category');
      console.error(error);
    }
  };

  const handleUpdateCategory = async (id: string, categoryData: any) => {
    try {
      await updateCategory(id, categoryData);
      toast.success('Category updated successfully');
    } catch (error) {
      toast.error('Failed to update category');
      console.error(error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={<PlusCircle size={16} />}
        >
          Create Category
        </Button>
      </div>

      {isLoading && <div className="text-center py-8">Loading categories...</div>}

      {!isLoading && categories.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No categories found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get started by creating your first category.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={<PlusCircle size={16} />}
          >
            Create Category
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onUpdate={handleUpdateCategory}
            onDelete={handleDeleteCategory}
            channelCount={channelCounts[category.id] || 0}
          />
        ))}
      </div>

      {isCreateModalOpen && (
        <EditCategoryModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={async (categoryData) => {
            await handleCreateCategory(categoryData);
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default CategoriesView;