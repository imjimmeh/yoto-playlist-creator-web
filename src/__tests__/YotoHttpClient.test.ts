import { YotoHttpClient } from '../services/YotoHttpClient';
import type { Settings } from '../types/app';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock logger
jest.mock('../services/Logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

describe('YotoHttpClient', () => {
  let client: YotoHttpClient;
  let mockSettingsProvider: { getSettings: jest.Mock };
  let mockAuthFailureCallback: jest.Mock;

  beforeEach(() => {
    client = new YotoHttpClient();
    mockFetch.mockClear();
    
    mockSettingsProvider = {
      getSettings: jest.fn(),
    };
    
    mockAuthFailureCallback = jest.fn();
    
    client.setSettingsProvider(mockSettingsProvider);
    client.setAuthFailureCallback(mockAuthFailureCallback);
  });

  describe('authentication', () => {
    it('should throw error when no auth token available', async () => {
      mockSettingsProvider.getSettings.mockReturnValue({} as Settings);

      await expect(client.get('/test')).rejects.toThrow('No authentication token available');
      expect(mockAuthFailureCallback).toHaveBeenCalled();
    });

    it('should use Bearer token from settings', async () => {
      const token = 'test-token-123';
      mockSettingsProvider.getSettings.mockReturnValue({
        yotoAuthToken: token,
      } as Settings);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          }),
        })
      );
    });

    it('should not add Bearer prefix if already present', async () => {
      const token = 'Bearer test-token-123';
      mockSettingsProvider.getSettings.mockReturnValue({
        yotoAuthToken: token,
      } as Settings);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: token,
          }),
        })
      );
    });
  });

  describe('URL handling', () => {
    beforeEach(() => {
      mockSettingsProvider.getSettings.mockReturnValue({
        yotoAuthToken: 'test-token',
      } as Settings);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('should handle relative paths', async () => {
      await client.get('test/path');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test/path',
        expect.any(Object)
      );
    });

    it('should handle paths with leading slash', async () => {
      await client.get('/test/path');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test/path',
        expect.any(Object)
      );
    });

    it('should handle absolute URLs', async () => {
      await client.get('https://external.api.com/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://external.api.com/test',
        expect.any(Object)
      );
    });

    it('should return base URL', () => {
      expect(client.getBaseUrl()).toBe('https://api.yotoplay.com');
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      mockSettingsProvider.getSettings.mockReturnValue({
        yotoAuthToken: 'test-token',
      } as Settings);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('should make GET requests', async () => {
      await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should make POST requests with JSON body', async () => {
      const data = { name: 'test' };
      await client.post('/test', data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json;charset=utf-8',
          }),
          body: JSON.stringify(data),
        })
      );
    });

    it('should make PUT requests', async () => {
      const data = { name: 'updated' };
      await client.put('/test', data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data),
        })
      );
    });

    it('should make DELETE requests', async () => {
      await client.delete('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('body types', () => {
    beforeEach(() => {
      mockSettingsProvider.getSettings.mockReturnValue({
        yotoAuthToken: 'test-token',
      } as Settings);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('should handle JSON body type', async () => {
      const data = { name: 'test' };
      await client.post('/test', data, { bodyType: 'json' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json;charset=utf-8',
          }),
          body: JSON.stringify(data),
        })
      );
    });

    it('should handle binary body type', async () => {
      const data = new Uint8Array([1, 2, 3]);
      await client.post('/test', data, { bodyType: 'binary' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test',
        expect.objectContaining({
          body: data,
        })
      );
    });

    it('should handle form data body type', async () => {
      const formData = new FormData();
      formData.append('file', 'test');
      await client.post('/test', formData, { bodyType: 'form' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test',
        expect.objectContaining({
          body: formData,
        })
      );
    });
  });

  describe('custom headers', () => {
    beforeEach(() => {
      mockSettingsProvider.getSettings.mockReturnValue({
        yotoAuthToken: 'test-token',
      } as Settings);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('should merge custom headers with defaults', async () => {
      await client.get('/test', {
        headers: { 'X-Custom': 'value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            Accept: 'application/json',
            'X-Custom': 'value',
          }),
        })
      );
    });

    it('should allow custom headers to override defaults', async () => {
      await client.get('/test', {
        headers: { Accept: 'text/plain' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yotoplay.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'text/plain',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockSettingsProvider.getSettings.mockReturnValue({
        yotoAuthToken: 'test-token',
      } as Settings);
    });

    it('should throw error for HTTP 4xx responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid data',
      });

      await expect(client.get('/test')).rejects.toThrow(
        'HTTP error! status: 400 Bad Request - Invalid data'
      );
    });

    it('should throw error for HTTP 5xx responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      await expect(client.get('/test')).rejects.toThrow(
        'HTTP error! status: 500 Internal Server Error - Server error'
      );
    });

    it('should handle auth failures (401)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid token',
      });

      await expect(client.get('/test')).rejects.toThrow(
        'HTTP error! status: 401 Unauthorized - Invalid token'
      );

      expect(mockAuthFailureCallback).toHaveBeenCalled();
    });

    it('should handle auth failures (403)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Access denied',
      });

      await expect(client.get('/test')).rejects.toThrow(
        'HTTP error! status: 403 Forbidden - Access denied'
      );

      expect(mockAuthFailureCallback).toHaveBeenCalled();
    });
  });

  describe('response parsing', () => {
    beforeEach(() => {
      mockSettingsProvider.getSettings.mockReturnValue({
        yotoAuthToken: 'test-token',
      } as Settings);
    });

    it('should parse JSON responses', async () => {
      const responseData = { id: 1, name: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseData,
      });

      const result = await client.get('/test');
      expect(result).toEqual(responseData);
    });
  });

  describe('settings provider', () => {
    it('should work without settings provider but call auth failure callback', async () => {
      const clientWithoutProvider = new YotoHttpClient();
      clientWithoutProvider.setAuthFailureCallback(mockAuthFailureCallback);

      await expect(clientWithoutProvider.get('/test')).rejects.toThrow(
        'No authentication token available'
      );
      
      expect(mockAuthFailureCallback).toHaveBeenCalled();
    });

    it('should work without auth failure callback', async () => {
      const clientWithoutCallback = new YotoHttpClient();
      mockSettingsProvider.getSettings.mockReturnValue({} as Settings);
      clientWithoutCallback.setSettingsProvider(mockSettingsProvider);

      await expect(clientWithoutCallback.get('/test')).rejects.toThrow(
        'No authentication token available'
      );
    });
  });
});