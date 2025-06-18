import { useState, useRef, useCallback, DragEvent } from 'react';
// Category, Channel, Role types might still be useful for DraggedItem type, or use more generic types from store if available
import { Category as DndCategory, Channel as DndChannel, Role as DndRole } from '../types/discord';

export type DraggedType = 'channel' | 'category' | 'role' | null;
// Make DraggedItem more specific to what the store actions expect, or keep general for now
export type DraggedItem = DndChannel | DndCategory | DndRole | { id: string; [key: string]: any } | null;


export interface DraggedSourceInfo {
  categoryId: string;
  channelId?: string;
}

export interface DropTargetInfo {
  targetCategoryId: string;
  targetChannelId?: string;
  // newPosition?: number; // Store actions can calculate this or accept it
}

export interface DropDetails {
  draggedItem: DraggedItem;
  draggedType: DraggedType;
  draggedSource: DraggedSourceInfo | null;
  dropTarget: DropTargetInfo;
}

interface UseDragAndDropProps {
  // categories: Category[]; // No longer needed for local manipulation
  // setCategories: (categories: Category[]) => void; // No longer needed
  onPerformDrop: (details: DropDetails) => void;
}

export const useDragAndDrop = ({ onPerformDrop }: UseDragAndDropProps) => {
  const [draggedItem, setDraggedItem] = useState<DraggedItem>(null);
  const [draggedType, setDraggedType] = useState<DraggedType>(null);
  const [draggedSource, setDraggedSource] = useState<DraggedSourceInfo | null>(null);
  const dragCounter = useRef<number>(0);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, item: DraggedItem, type: DraggedType, source?: DraggedSourceInfo): void => {
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

  // Removed handleChannelDrop, handleCategoryDrop, handleRoleDrop as their logic moves to store actions via onPerformDrop

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetCategoryId: string, targetChannelId?: string): void => {
    e.preventDefault();
    dragCounter.current = 0;
    e.currentTarget.classList.remove('drag-over');

    if (!draggedItem || !draggedType) {
      console.warn("Drop attempted with no dragged item or type.");
      return;
    }

    const dropTarget: DropTargetInfo = { targetCategoryId, targetChannelId };

    onPerformDrop({
      draggedItem,
      draggedType,
      draggedSource,
      dropTarget
    });

    // Reset drag state
    setDraggedItem(null);
    setDraggedType(null);
    setDraggedSource(null);
  }, [draggedItem, draggedType, draggedSource, onPerformDrop]);

  return {
    draggedItem, // Still useful for UI feedback (e.g., styling the dragged element)
    draggedType,
    draggedSource,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  };
};