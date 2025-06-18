import { vi } from 'vitest'; // Or jest if that's the project's choice
import { useServerStructureStore } from './serverStructureStore';
// Assuming transformServerDataToDndCategories is exported for testing, if not, test via selectors.
// For direct testing of the transformer, it needs to be exported.
// If it's not, we can test its effect by observing the output of a selector like useDndViewCategories after setting serverData.
// Let's assume it's NOT exported for now and we test its effects indirectly or skip its direct unit test here.
import { categoriesApi } from '../services/api';
import { ServerStructureData, ServerStructureApiResponse, ApiRole, ApiItem, ApiCategoryItem, ApiChannelItem, ApiChannel } from '../types/discord';

// Helper function (if not exported from store, replicate or test via selectors)
// For this test, let's assume we can't import transformServerDataToDndCategories directly
// and will test its effects where applicable through selectors or by checking raw data.

// Mock the API module
vi.mock('../services/api', () => ({
  categoriesApi: {
    getCategoriesWithChannels: vi.fn(),
  },
}));

// Reset store before each test
beforeEach(() => {
  useServerStructureStore.setState({
    serverData: null,
    isLoading: false,
    error: null,
  }, true); // `true` replaces the entire state
  // Reset mocks
  vi.resetAllMocks();
});

describe('useServerStructureStore', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { serverData, isLoading, error } = useServerStructureStore.getState();
      expect(serverData).toBeNull();
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });
  });

  describe('fetchServerStructure', () => {
    const guildId = 'test-guild-id';
    const mockApiData: ServerStructureData = { // This is ServerStructureData
      serverId: guildId,
      serverName: 'Test Server',
      roles: [{ id: 'role1', name: 'Test Role', color: '#FF0000', position: 0, permissions: ['VIEW_CHANNEL'], mentionable: false, managed: false }],
      items: [
        {
          id: 'cat1', name: 'Category 1', type: 'category', position: 0, parentId: null, permissions: [], channels: [
            { id: 'ch1', name: 'Channel 1', type: 'text', position: 0, parentId: 'cat1', permissions: [], description: 'Test Channel 1' }
          ], description: 'Test Category 1'
        } as ApiCategoryItem
      ],
    };
    const mockApiResponse: ServerStructureApiResponse = { // This is the wrapper
        status: 200,
        message: 'OK',
        data: mockApiData // The actual data is nested here
    };


    it('should fetch and set serverData on successful API call', async () => {
      (categoriesApi.getCategoriesWithChannels as vi.Mock).mockResolvedValue({ data: mockApiResponse }); // API returns { data: ServerStructureApiResponse }

      await useServerStructureStore.getState().fetchServerStructure(guildId);

      const { serverData, isLoading, error } = useServerStructureStore.getState();
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
      expect(serverData).toEqual(mockApiData); // serverData should be ServerStructureData
      expect(categoriesApi.getCategoriesWithChannels).toHaveBeenCalledWith(guildId);
    });

    it('should set error state on API call failure', async () => {
      const errorMessage = 'Failed to fetch';
      (categoriesApi.getCategoriesWithChannels as vi.Mock).mockRejectedValue(new Error(errorMessage));

      await useServerStructureStore.getState().fetchServerStructure(guildId);

      const { serverData, isLoading, error } = useServerStructureStore.getState();
      expect(isLoading).toBe(false);
      expect(serverData).toBeNull();
      expect(error).toBe(errorMessage);
    });

    it('should set isLoading to true while fetching', () => {
      (categoriesApi.getCategoriesWithChannels as vi.Mock).mockReturnValue(new Promise(() => {})); // Pending promise

      // Call action without await to check intermediate state
      useServerStructureStore.getState().fetchServerStructure(guildId);

      expect(useServerStructureStore.getState().isLoading).toBe(true);
    });
  });

  // Tests for transformServerDataToDndCategories would ideally be in their own file if complex,
  // or tested here if the store exports it or via a selector.
  // Since the prompt implies testing the store, and transform is a key part of its selectors,
  // we can test the selector's output or the transformer if we assume it's exported.
  // For now, let's assume we might need to test the effect of this transformation via selectors,
  // or if `transformServerDataToDndCategories` was exported, we could test it directly.
  // The original prompt had `transformServerDataToDndCategories` imported, so let's assume it's exported for testing.
  // If not, these tests would need to be adapted or removed.

  // Re-add direct import if transformServerDataToDndCategories is actually exported from the store file
  // For now, I'll comment out direct transform tests as it's an internal helper currently.
  // We will test its effects via the actions that modify serverData and could be observed by useDndViewCategories if needed.

  describe('Local CRUD Actions', () => {
    const guildId = 'test-guild-id';
    const initialServerData: ServerStructureData = {
      serverId: guildId,
      serverName: 'Test Server',
      roles: [{ id: 'role1', name: 'Existing Role', color: '#123456', position: 0, permissions: [], mentionable: false, managed: false }],
      items: [
        { id: 'cat1', name: 'Category 1', type: 'category', position: 0, parentId: null, permissions: [], channels: [], description: 'Cat 1 Desc' } as ApiCategoryItem
      ],
    };

    beforeEach(() => {
      // Deep copy to avoid issues between tests modifying the same object reference
      useServerStructureStore.setState({ serverData: JSON.parse(JSON.stringify(initialServerData)), isLoading: false, error: null }, true);
    });

    it('addCategoryStore should add a new category', () => {
      useServerStructureStore.getState().addCategoryStore({ name: 'New Category', description: 'New Desc' });
      const { serverData } = useServerStructureStore.getState();
      const newCategory = serverData?.items.find(item => item.name === 'New Category' && item.type === 'category') as ApiCategoryItem | undefined;
      expect(newCategory).toBeDefined();
      expect(newCategory?.position).toBe(1); // initial has 1 category at pos 0
      expect(serverData?.items.filter(i => i.type === 'category').length).toBe(2);
    });

    it('addChannelStore should add a new channel to a category and flat list', () => {
      useServerStructureStore.getState().addChannelStore('cat1', { name: 'New Channel', type: 'text', description: 'New Ch Desc' });
      const { serverData } = useServerStructureStore.getState();

      // Check in flat list
      const newChannelFlat = serverData?.items.find(item => item.name === 'New Channel' && item.type === 'text') as ApiChannelItem | undefined;
      expect(newChannelFlat).toBeDefined();
      expect(newChannelFlat?.parentId).toBe('cat1');

      // Check in category's channels array (if structure still uses it for transformation)
      const parentCategory = serverData?.items.find(item => item.id === 'cat1' && item.type === 'category') as ApiCategoryItem | undefined;
      expect(parentCategory?.channels?.find(ch => ch.name === 'New Channel')).toBeDefined();
    });

    it('addRoleToItemStore should add a role to an item and to global roles if new', () => {
        const store = useServerStructureStore.getState();
        // Ensure description is provided if the type expects it. For roles, it's not typical.
        const newRoleData = { name: 'Super User', permissions: ['ALL'], color: '#ABCDEF' };

        store.addRoleToItemStore(newRoleData, 'cat1', 'category');

        const finalServerData = useServerStructureStore.getState().serverData;
        const category = finalServerData?.items.find(i => i.id === 'cat1') as ApiCategoryItem | undefined;

        expect(category?.permissions.some(p => p.roleName === 'Super User')).toBe(true);
        const globalRole = finalServerData?.roles.find(r => r.name === 'Super User');
        expect(globalRole).toBeDefined();
        expect(globalRole?.color).toBe('#ABCDEF');
        expect(finalServerData?.roles.length).toBe(initialServerData.roles.length + 1);

        // Test adding existing role by name (should not add to global roles again)
        const existingRoleData = { name: 'Existing Role', permissions: ['KICK'], color: '#654321' }; // color might differ, but name matches
        store.addRoleToItemStore(existingRoleData, 'cat1', 'category');

        const categoryAfterAddingExisting = useServerStructureStore.getState().serverData?.items.find(i => i.id === 'cat1') as ApiCategoryItem | undefined;
        // Check if the specific permission for 'Existing Role' is there.
        // The current addRoleToItemStore logic uses roleId from newRole, which would be the ID of 'Existing Role'
        const existingGlobalRoleDetails = initialServerData.roles.find(r => r.name === 'Existing Role');
        expect(categoryAfterAddingExisting?.permissions.some(p => p.roleId === existingGlobalRoleDetails?.id)).toBe(true);
        expect(useServerStructureStore.getState().serverData?.roles.length).toBe(initialServerData.roles.length + 1); // Global roles count should still be +1 from 'Super User'
    });

    it('applyJsonToStore should replace serverData', () => {
        const newJsonData: ServerStructureData = {
            serverId: 'new-guild',
            serverName: 'New Server from JSON',
            roles: [],
            items: [{ id: 'jsonCat1', name: 'JSON Category', type: 'category', position: 0, parentId: null, permissions: [], channels: [], description: 'JSON cat' } as ApiCategoryItem],
        };
        useServerStructureStore.getState().applyJsonToStore(newJsonData);
        expect(useServerStructureStore.getState().serverData).toEqual(newJsonData);
        expect(useServerStructureStore.getState().error).toBeNull();
        expect(useServerStructureStore.getState().isLoading).toBe(false);
    });

    // Example for deleteCategoryStore
    it('deleteCategoryStore should remove a category and its channels', () => {
        // Add a channel to cat1 first to test cascade deletion
        useServerStructureStore.getState().addChannelStore('cat1', { name: 'ChannelToDelete', type: 'text', description: 'Ch Desc' });
        const channelAddedState = useServerStructureStore.getState().serverData;
        const channelId = channelAddedState?.items.find(i => i.name === 'ChannelToDelete')?.id;
        expect(channelId).toBeDefined();

        useServerStructureStore.getState().deleteCategoryStore('cat1');
        const { serverData } = useServerStructureStore.getState();

        expect(serverData?.items.find(item => item.id === 'cat1')).toBeUndefined();
        expect(serverData?.items.find(item => item.id === channelId)).toBeUndefined(); // Check channel is also gone
        expect(serverData?.items.filter(i => i.type === 'category').length).toBe(0);
    });
  });

  // TODO: Add more tests for other CRUD actions (update, delete for channel/role, move actions) and edge cases.
  // Consider testing selectors like useDndViewCategories by setting serverData and then calling the selector.
});
