import { CustomIconService } from '../services/CustomIconService';
import { YotoHttpClient } from '../services/YotoHttpClient';
import { YotoUserIcon } from '../types/yoto-api';
import { IconFetcher } from '../services/IconFetcher';

// Mock the YotoHttpClient
const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
} as unknown as YotoHttpClient;

// Mock the IconFetcher
jest.mock('../services/IconFetcher');

const mockIconFetcher = {
  fetchIcons: jest.fn(),
} as unknown as IconFetcher;

describe('CustomIconService', () => {
  let customIconService: CustomIconService;
  let mockFile: File;

  beforeEach(() => {
    customIconService = new CustomIconService(mockHttpClient);
    (customIconService as any).iconFetcher = mockIconFetcher; // Inject mock
    mockFile = new File(['test content'], 'test.png', { type: 'image/png' });
    jest.clearAllMocks();
  });

  describe('getCustomIcons', () => {
    it('should fetch and return custom icons', async () => {
      const mockApiResponse: YotoUserIcon[] = [
        {
          displayIconId: '1',
          mediaId: 'media-1',
          userId: 'user-1',
          public: false,
          url: 'http://example.com/icon1.png',
          createdAt: new Date().toISOString(),
        },
      ];
      (mockIconFetcher.fetchIcons as jest.Mock).mockResolvedValue(mockApiResponse);

      const icons = await customIconService.getCustomIcons();

      expect(mockIconFetcher.fetchIcons).toHaveBeenCalledWith('/media/displayIcons/user/me');
      expect(icons).toHaveLength(1);
      expect(icons[0].id).toBe('1');
      expect(icons[0].mediaId).toBe('media-1');
    });

    it('should return an empty array if fetching fails', async () => {
      (mockIconFetcher.fetchIcons as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const icons = await customIconService.getCustomIcons();

      expect(icons).toEqual([]);
    });
  });

  describe('uploadCustomIcon', () => {
    it('should upload a custom icon', async () => {
      const mockApiResponse = {
        displayIcon: {
          displayIconId: '2',
          mediaId: 'media-2',
          userId: 'user-1',
          public: false,
          url: 'http://example.com/icon2.png',
          createdAt: new Date().toISOString(),
        },
      };
      (mockHttpClient.post as jest.Mock).mockResolvedValue(mockApiResponse);

      const icon = await customIconService.uploadCustomIcon(mockFile, 'My Icon');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/media/displayIcons/user/me/upload?filename=My%20Icon&autoConvert=true',
        mockFile,
        { bodyType: 'binary', headers: { 'Content-Type': 'image/png' } }
      );
      expect(icon.id).toBe('2');
      expect(icon.title).toBe('My Icon');
    });

    it('should throw an error if upload fails', async () => {
      (mockHttpClient.post as jest.Mock).mockRejectedValue(new Error('Upload Failed'));

      await expect(customIconService.uploadCustomIcon(mockFile, 'My Icon')).rejects.toThrow('Failed to upload custom icon.');
    });
  });

  describe('deleteCustomIcon', () => {
    it('should return false since delete is not supported', async () => {
      const result = await customIconService.deleteCustomIcon('1');
      expect(result).toBe(false);
    });
  });

  describe('getCustomIconsAsYotoIcons', () => {
    it('should return custom icons in YotoIcon format', async () => {
      const mockIcons = [
        {
          id: '1',
          mediaId: 'media-1',
          title: 'Icon 1',
          imageUrl: 'http://example.com/icon1.png',
          uploadedAt: new Date().toISOString(),
          tags: ['tag1', 'tag2'],
        },
      ];
      jest.spyOn(customIconService, 'getCustomIcons').mockResolvedValue(mockIcons);

      const yotoIcons = await customIconService.getCustomIconsAsYotoIcons();

      expect(yotoIcons).toHaveLength(1);
      expect(yotoIcons[0].mediaId).toBe('media-1');
      expect(yotoIcons[0].title).toBe('Icon 1');
      expect(yotoIcons[0].imageUrl).toBe('http://example.com/icon1.png');
      expect(yotoIcons[0].tags).toEqual(['tag1', 'tag2']);
    });
  });
});