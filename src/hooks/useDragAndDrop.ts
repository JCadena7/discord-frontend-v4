import { useState, useRef, useCallback, DragEvent } from 'react';
import { Category, Channel, Role } from '../types/discord';
import { moveChannelBetweenCategories, reorderCategories } from '../utils/dataUtils';

type DraggedType = 'channel' | 'category' | 'role' | null;
type DraggedItem = Channel | Category | Role | null;

interface UseDragAndDropProps {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
}

export const useDragAndDrop = ({ categories, setCategories }: UseDragAndDropProps) => {
  const [draggedItem, setDraggedItem] = useState<DraggedItem>(null);
  const [draggedType, setDraggedType] = useState<DraggedType>(null);
  const [draggedSource, setDraggedSource] = useState<{ categoryId: string; channelId?: string } | null>(null);
  const dragCounter = useRef<number>(0);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, item: DraggedItem, type: DraggedType, source?: { categoryId: string; channelId?: string }): void => {
    setDraggedItem(item);
    setDraggedType(type);
    setDraggedSource(source || null);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    dragCounter.current++;
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>): void => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      e.currentTarget.classList.remove('drag-over');
    }
  }, []);

  const handleChannelDrop = useCallback((targetCategoryId: string): Category[] => {
    if (!draggedItem) return categories;
    return moveChannelBetweenCategories(categories, (draggedItem as Channel).id, targetCategoryId);
  }, [categories, draggedItem]);

  const handleCategoryDrop = useCallback((targetCategoryId: string): Category[] => {
    if (!draggedItem) return categories;
    return reorderCategories(categories, (draggedItem as Category).id, targetCategoryId);
  }, [categories, draggedItem]);

  const handleRoleDrop = useCallback((targetCategoryId: string, targetChannelId?: string): Category[] => {
    if (!draggedItem || !draggedSource) return categories;

    const newCategories = [...categories];
    const sourceCategory = newCategories.find(cat => cat.id === draggedSource.categoryId);
    const targetCategory = newCategories.find(cat => cat.id === targetCategoryId);
    
    if (!sourceCategory || !targetCategory) return categories;

    let sourceRoles: Role[];
    let targetRoles: Role[];
    
    if (draggedSource.channelId) {
      // Desde canal
      const sourceChannel = sourceCategory.channels.find(ch => ch.id === draggedSource.channelId);
      sourceRoles = sourceChannel?.roles || [];
    } else {
      // Desde categoría
      sourceRoles = sourceCategory.roles;
    }
    
    if (targetChannelId) {
      // Hacia canal
      const targetChannel = targetCategory.channels.find(ch => ch.id === targetChannelId);
      targetRoles = targetChannel?.roles || [];
    } else {
      // Hacia categoría
      targetRoles = targetCategory.roles;
    }
    
    const roleIndex = sourceRoles.findIndex(role => role.id === (draggedItem as Role).id);
    if (roleIndex !== -1) {
      const [removedRole] = sourceRoles.splice(roleIndex, 1);
      targetRoles.push(removedRole);
    }

    return newCategories;
  }, [categories, draggedItem, draggedSource]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetCategoryId: string, targetChannelId?: string): void => {
    e.preventDefault();
    dragCounter.current = 0;
    e.currentTarget.classList.remove('drag-over');

    if (!draggedItem || !draggedType) return;

    let newCategories: Category[];

    switch (draggedType) {
      case 'channel':
        newCategories = handleChannelDrop(targetCategoryId);
        break;
      case 'category':
        newCategories = handleCategoryDrop(targetCategoryId);
        break;
      case 'role':
        newCategories = handleRoleDrop(targetCategoryId, targetChannelId);
        break;
      default:
        return;
    }

    setCategories(newCategories);
    setDraggedItem(null);
    setDraggedType(null);
    setDraggedSource(null);
  }, [draggedItem, draggedType, handleChannelDrop, handleCategoryDrop, handleRoleDrop, setCategories]);

  return {
    draggedItem,
    draggedType,
    draggedSource,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  };
};