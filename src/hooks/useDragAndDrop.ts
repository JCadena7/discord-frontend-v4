import { useState, useCallback, DragEvent, useRef } from 'react';
import { Category, Channel, Role } from '../types/discord'; // These are DndView types

export type DraggableItemData = Category | Channel | Role; // Renamed from DraggableItem to avoid conflict with the state variable
export type DraggableType = 'category' | 'channel' | 'role';

export interface DraggedSourceContext { // Added export
  categoryId: string;
  channelId?: string;
}
interface UseDragAndDropProps {
  categories: Category[]; // DndView categories
  // setCategories is no longer directly used by this hook to commit state changes.
  // DndView.tsx will handle the actual state update via store actions in its onDrop handlers.
  setCategories: (categoriesUpdater: Category[] | ((prevCategories: Category[]) => Category[])) => void;
}

export const useDragAndDrop = ({ categories, setCategories }: UseDragAndDropProps) => {
  const [draggedItem, setDraggedItem] = useState<DraggableItemData | null>(null);
  const [draggedType, setDraggedType] = useState<DraggableType | null>(null);
  const [draggedSource, setDraggedSource] = useState<DraggedSourceContext | null>(null);
  const dragCounter = useRef<number>(0); // To handle nested drag enter/leave events

  const handleDragStart = useCallback((
    e: DragEvent<HTMLDivElement>,
    item: DraggableItemData,
    type: DraggableType,
    sourceContext?: DraggedSourceContext // e.g., { categoryId: 'cat1', channelId: 'ch1'} for a role in a channel
  ): void => {
    setDraggedItem(item);
    setDraggedType(type);
    setDraggedSource(sourceContext || null); // Store where the item came from
    // Optional: Add a class to the dragged element itself
    e.currentTarget.classList.add('dragging');
    // Set data for inter-component communication (though primarily using state here)
    e.dataTransfer.setData('application/json', JSON.stringify({
      item: { id: item.id, name: (item as any).name }, // Pass only necessary item info
      type,
      sourceContext
    }));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    dragCounter.current++;
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      e.currentTarget.classList.remove('drag-over');
    }
  }, []);

  const handleDrop = useCallback((): void => {
    // This function's body is now significantly reduced.
    // The actual data manipulation logic (moving items in the store)
    // will be triggered by `handleActualDrop` in DndView.tsx, which calls Zustand store actions.
    // This `handleDrop` in the hook is now primarily responsible for resetting local drag state.
    // The `dragCounter.current = 0;` and `e.currentTarget.classList.remove('drag-over');`
    // would typically be here, but since `e` (event) is not passed, DndView needs to handle this UI aspect.
    // DndView's onDrop handlers should call these for UI cleanup.
    
    setDraggedItem(null);
    setDraggedType(null);
    setDraggedSource(null);
    // Note: setCategories is NOT called here anymore for actual data updates.
  }, []); // Dependencies removed as setCategories is no longer used for state update here.

  return {
    draggedItem,
    draggedType,
    draggedSource, // Expose this so DndView can use it in handleActualDrop
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop, // This is the modified, minimal handleDrop
    // dragCounter can be exposed if DndView needs to manage it, but typically internal.
  };
};