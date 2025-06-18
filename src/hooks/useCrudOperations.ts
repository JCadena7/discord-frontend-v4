import { Category, Channel, Role } from '../types/discord';

interface UseCrudOperationsProps {
  categories: Category[]; // DndView's category structure
  // setCategories is no longer used by the hook's public API but might be kept in props if DndView passes it
  // setCategories: (categories: Category[]) => void;
}

export const useCrudOperations = ({ categories }: UseCrudOperationsProps) => {

  function getEffectiveRolesForChannel(category: Category, channel: Channel): Role[] {
    const channelRoleIds = new Set(channel.roles.map(r => r.id));
    const categoryRolesToConsider = category.roles.filter(cr => !channelRoleIds.has(cr.id));

    // Ensure channel roles override category roles with the same ID if necessary,
    // though Set logic might handle this if IDs are consistent.
    // A Map can ensure unique roles by ID, prioritizing channel roles.
    const effectiveRolesMap = new Map<string, Role>();
    categoryRolesToConsider.forEach(role => effectiveRolesMap.set(role.id, role));
    channel.roles.forEach(role => effectiveRolesMap.set(role.id, role)); // Channel roles will overwrite category roles with same ID

    return Array.from(effectiveRolesMap.values());
  }

  return {
    getEffectiveRolesForChannel,
  };
};