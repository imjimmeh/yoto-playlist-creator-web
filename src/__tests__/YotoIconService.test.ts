import { YotoIconService } from '../services/YotoIconService';
import { YotoHttpClient } from '../services/YotoHttpClient';
import { YotoCacheService } from '../services/YotoCacheService';
import { IconFetcher } from '../services/IconFetcher';
import { YotoPublicIcon } from '../types/yoto-api';

// Mock dependencies
const mockHttpClient = {
  get: jest.fn(),
} as unknown as YotoHttpClient;

const mockCacheService = {
  getCachedIcons: jest.fn(),
  setCachedIcons: jest.fn(),
  clearCache: jest.fn(),
  getCacheStats: jest.fn(),
} as unknown as YotoCacheService;

// Mock the IconFetcher
jest.mock('../services/IconFetcher');

const mockIconFetcher = {
  fetchIcons: jest.fn(),
} as unknown as IconFetcher;

describe('YotoIconService', () => {
  let yotoIconService: YotoIconService;

  beforeEach(() => {
    // Manually inject the mocked IconFetcher into the service
    // This is necessary because IconFetcher is instantiated inside YotoIconService
    // and not passed as a constructor argument.
    // A better design would be to inject IconFetcher directly.
    yotoIconService = new YotoIconService(mockHttpClient);
    (yotoIconService as any).iconFetcher = mockIconFetcher;
    (yotoIconService as any).cacheService = mockCacheService;
    jest.clearAllMocks();
  });

  describe('getIcons', () => {
    const mockApiIcons: YotoPublicIcon[] = [
      {
        mediaId: 'icon1',
        title: 'Icon One',
        publicTags: ['tag1'],
      },
      {
        mediaId: 'icon2',
        title: 'Icon Two',
        publicTags: ['tag2'],
      },
    ];

    it('should return cached icons if available and not forced refresh', async () => {
      (mockCacheService.getCachedIcons as jest.Mock).mockReturnValue({
        icons: mockApiIcons,
        embeddings: [], // Not relevant for this test
      });

      const icons = await yotoIconService.getIcons();

      expect(mockCacheService.getCachedIcons).toHaveBeenCalled();
      expect(mockIconFetcher.fetchIcons).not.toHaveBeenCalled();
      expect(icons).toEqual(mockApiIcons);
    });

    it('should fetch icons from API if cache is not available', async () => {
      (mockCacheService.getCachedIcons as jest.Mock).mockReturnValue(null);
      (mockIconFetcher.fetchIcons as jest.Mock).mockResolvedValue(mockApiIcons);

      const icons = await yotoIconService.getIcons();

      expect(mockCacheService.getCachedIcons).toHaveBeenCalled();
      expect(mockIconFetcher.fetchIcons).toHaveBeenCalledWith('media/displayIcons/user/yoto');
      expect(icons).toEqual(mockApiIcons);
    });

    it('should fetch icons from API if forced refresh', async () => {
      (mockCacheService.getCachedIcons as jest.Mock).mockReturnValue({
        icons: [/* some cached data */],
        embeddings: [],
      });
      (mockIconFetcher.fetchIcons as jest.Mock).mockResolvedValue(mockApiIcons);

      const icons = await yotoIconService.getIcons(true);

      expect(mockCacheService.getCachedIcons).not.toHaveBeenCalled(); // Should not check cache if forced refresh
      expect(mockIconFetcher.fetchIcons).toHaveBeenCalledWith('media/displayIcons/user/yoto');
      expect(icons).toEqual(mockApiIcons);
    });

    it('should handle errors when fetching from API', async () => {
      (mockCacheService.getCachedIcons as jest.Mock).mockReturnValue(null);
      (mockIconFetcher.fetchIcons as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(yotoIconService.getIcons()).rejects.toThrow('API Error'); // IconFetcher re-throws the error as is
    });
  });

  describe('getCacheStats', () => {
    it('should return cache stats from cache service', () => {
      const mockStats = { hasCache: true, iconCount: 5 };
      (mockCacheService.getCacheStats as jest.Mock).mockReturnValue(mockStats);

      const stats = yotoIconService.getCacheStats();

      expect(mockCacheService.getCacheStats).toHaveBeenCalled();
      expect(stats).toEqual(mockStats);
    });
  });

  describe('clearCache', () => {
    it('should clear cache using cache service', () => {
      yotoIconService.clearCache();

      expect(mockCacheService.clearCache).toHaveBeenCalled();
    });
  });
});