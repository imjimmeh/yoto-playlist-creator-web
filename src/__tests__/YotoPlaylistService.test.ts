import { YotoPlaylistService } from '../services/YotoPlaylistService';

// Mock the YotoHttpClient
const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
};

describe('YotoPlaylistService', () => {
  let playlistService: YotoPlaylistService;

  beforeEach(() => {
    playlistService = new YotoPlaylistService(mockHttpClient as any);
    jest.clearAllMocks();
  });

  describe('getPlaylistById', () => {
    it('should throw an error if playlistId is not provided', async () => {
      await expect(playlistService.getPlaylistById('')).rejects.toThrow('Playlist ID is required');
    });

    it('should call httpClient.get with the correct URL', async () => {
      const mockPlaylist = { id: '123', title: 'Test Playlist' };
      mockHttpClient.get.mockResolvedValue(mockPlaylist);

      const result = await playlistService.getPlaylistById('123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('content/123', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockPlaylist);
    });

    it('should handle errors when fetching playlist', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      await expect(playlistService.getPlaylistById('123')).rejects.toThrow('Failed to fetch playlist: Network error');
    });
  });

  describe('validatePlaylistId', () => {
    it('should return trimmed playlistId when valid', () => {
      expect(playlistService.validatePlaylistId(' 123 ')).toBe('123');
    });

    it('should throw an error if playlistId is empty', () => {
      expect(() => playlistService.validatePlaylistId('')).toThrow('Invalid playlist ID');
    });

    it('should throw an error if playlistId is only whitespace', () => {
      expect(() => playlistService.validatePlaylistId('   ')).toThrow('Invalid playlist ID');
    });

    it('should throw an error if playlistId is not a string', () => {
      expect(() => playlistService.validatePlaylistId(null as any)).toThrow('Invalid playlist ID');
      expect(() => playlistService.validatePlaylistId(undefined as any)).toThrow('Invalid playlist ID');
      expect(() => playlistService.validatePlaylistId(123 as any)).toThrow('Invalid playlist ID');
    });
  });

  describe('getPlaylists', () => {
    it('should call httpClient.get with the correct URL', async () => {
      const mockPlaylists = { cards: [{ id: '1', title: 'Playlist 1' }] };
      mockHttpClient.get.mockResolvedValue(mockPlaylists);

      const result = await playlistService.getPlaylists();

      expect(mockHttpClient.get).toHaveBeenCalledWith('content/mine');
      expect(result).toEqual([{ id: '1', title: 'Playlist 1' }]);
    });

    it('should handle errors when fetching playlists', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      await expect(playlistService.getPlaylists()).rejects.toThrow('Failed to fetch playlists: Network error');
    });
  });

  describe('savePlaylist', () => {
    it('should call httpClient.post for creating a new playlist', async () => {
      const newPlaylistData = { card: { title: 'New Playlist' } };
      const mockResult = { id: '456', title: 'New Playlist' };
      mockHttpClient.post.mockResolvedValue(mockResult);

      const result = await playlistService.savePlaylist(newPlaylistData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('content', newPlaylistData.card);
      expect(result).toEqual({
        success: true,
        data: mockResult,
        isUpdate: false,
        uploadedAt: expect.any(String),
      });
    });

    it('should call httpClient.post for updating an existing playlist', async () => {
      const existingPlaylistData = { card: { cardId: '123', title: 'Updated Playlist' } };
      const mockResult = { id: '123', title: 'Updated Playlist' };
      mockHttpClient.post.mockResolvedValue(mockResult);

      const result = await playlistService.savePlaylist(existingPlaylistData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('content', existingPlaylistData.card);
      expect(result).toEqual({
        success: true,
        data: mockResult,
        isUpdate: true,
        uploadedAt: expect.any(String),
      });
    });

    it('should handle errors when saving (creating) playlist', async () => {
      const newPlaylistData = { card: { title: 'New Playlist' } };
      mockHttpClient.post.mockRejectedValue(new Error('Network error'));

      await expect(playlistService.savePlaylist(newPlaylistData)).rejects.toThrow('Failed to create playlist: Network error');
    });

    it('should handle errors when saving (updating) playlist', async () => {
      const existingPlaylistData = { card: { cardId: '123', title: 'Updated Playlist' } };
      mockHttpClient.post.mockRejectedValue(new Error('Network error'));

      await expect(playlistService.savePlaylist(existingPlaylistData)).rejects.toThrow('Failed to update playlist: Network error');
    });
  });

  describe('deletePlaylist', () => {
    it('should throw an error if playlistId is not provided', async () => {
      await expect(playlistService.deletePlaylist('')).rejects.toThrow('Playlist ID is required');
    });

    it('should call httpClient.delete with the correct URL', async () => {
      mockHttpClient.delete.mockResolvedValue(undefined);

      await playlistService.deletePlaylist('123');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('content/123');
    });

    it('should handle errors when deleting playlist', async () => {
      mockHttpClient.delete.mockRejectedValue(new Error('Network error'));

      await expect(playlistService.deletePlaylist('123')).rejects.toThrow('Failed to delete playlist: Network error');
    });
  });
});
