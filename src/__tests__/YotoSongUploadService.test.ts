import { YotoSongUploadService } from '../services/YotoSongUploadService';

// Mock the YotoHttpClient
const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockImplementation(async (_algorithm, _data) => {
        // Return a mock digest
        return new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      }),
    },
  },
});

// Mock fetch
global.fetch = jest.fn();

describe('YotoSongUploadService', () => {
  let songUploadService: YotoSongUploadService;
  let mockFile: File;

  beforeEach(() => {
    songUploadService = new YotoSongUploadService(mockHttpClient as any);
    mockFile = new File(['test content'], 'test.mp3', { type: 'audio/mpeg' });
    (mockFile as any).arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(12));
    jest.clearAllMocks();
  });

  describe('getUploadUrl', () => {
    it('should get upload URL for a file', async () => {
      const mockResponse = {
        upload: {
          uploadId: 'upload-123',
          uploadUrl: 'https://s3.amazonaws.com/upload-url',
        },
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await songUploadService.getUploadUrl(mockFile);

      expect(result).toEqual({
        uploadId: 'upload-123',
        uploadUrl: 'https://s3.amazonaws.com/upload-url',
        fileName: 'test.mp3',
        sha256Hash: 'AQIDBAUGBwgJCgsMDQ4PEA',
        alreadyExists: false,
      });
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'media/transcode/audio/uploadUrl?sha256=AQIDBAUGBwgJCgsMDQ4PEA&filename=test.mp3',
        {}
      );
    });

    it('should handle case when file already exists', async () => {
      const mockResponse = {
        upload: {
          uploadId: 'upload-123',
          uploadUrl: null,
        },
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await songUploadService.getUploadUrl(mockFile);

      expect(result).toEqual({
        uploadId: 'upload-123',
        uploadUrl: null,
        fileName: 'test.mp3',
        sha256Hash: 'AQIDBAUGBwgJCgsMDQ4PEA',
        alreadyExists: true,
      });
    });

    it('should throw an error if API response is missing upload ID', async () => {
      const mockResponse = {
        upload: {
          // missing uploadId
        },
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      await expect(songUploadService.getUploadUrl(mockFile)).rejects.toThrow('API response missing upload ID');
    });

    it('should handle errors when getting upload URL', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      await expect(songUploadService.getUploadUrl(mockFile)).rejects.toThrow('Failed to get upload URL: Network error');
    });
  });

  describe('uploadFileToS3', () => {
    it('should upload file to S3', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      const result = await songUploadService.uploadFileToS3(mockFile, 'https://s3.amazonaws.com/upload-url');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('https://s3.amazonaws.com/upload-url', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: mockFile,
      });
    });

    it('should throw an error if upload URL is missing', async () => {
      await expect(songUploadService.uploadFileToS3(mockFile, null as any)).rejects.toThrow('Upload URL is required but was null or undefined');
    });

    it('should handle errors when uploading to S3', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue('Invalid file'),
      });

      await expect(songUploadService.uploadFileToS3(mockFile, 'https://s3.amazonaws.com/upload-url'))
        .rejects
        .toThrow('Failed to upload file: HTTP error! status: 400 Bad Request - Invalid file');
    });
  });

  describe('checkTranscodingStatus', () => {
    it('should check transcoding status and return complete status', async () => {
      const mockResponse = {
        transcode: {
          transcodedAt: '2023-01-01T00:00:00Z',
          // other properties
        },
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await songUploadService.checkTranscodingStatus('upload-123');

      expect(result).toEqual({
        isComplete: true,
        transcode: mockResponse.transcode,
      });
      expect(mockHttpClient.get).toHaveBeenCalledWith('media/upload/upload-123/transcoded?loudnorm=false', {});
    });

    it('should check transcoding status and return incomplete status', async () => {
      const mockResponse = {
        transcode: {
          // missing transcodedAt
        },
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await songUploadService.checkTranscodingStatus('upload-123');

      expect(result).toEqual({
        isComplete: false,
        transcode: mockResponse.transcode,
      });
    });

    it('should handle errors when checking transcoding status', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      await expect(songUploadService.checkTranscodingStatus('upload-123'))
        .rejects
        .toThrow('Failed to check transcoding status: Network error');
    });
  });

  describe('waitForTranscoding', () => {
    it('should wait for transcoding to complete', async () => {
      const mockIncompleteResponse = {
        isComplete: false,
        transcode: {},
      };

      const mockCompleteResponse = {
        isComplete: true,
        transcode: {
          transcodedAt: '2023-01-01T00:00:00Z',
        },
      };

      // Mock the checkTranscodingStatus method to return incomplete first, then complete
      const checkTranscodingStatusSpy = jest.spyOn(songUploadService, 'checkTranscodingStatus')
        .mockResolvedValueOnce(mockIncompleteResponse)
        .mockResolvedValueOnce(mockCompleteResponse);

      const result = await songUploadService.waitForTranscoding('upload-123', false, 10000, 10);

      expect(result).toEqual({
        transcodedAt: '2023-01-01T00:00:00Z',
      });
      expect(checkTranscodingStatusSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if transcoding times out', async () => {
      const mockResponse = {
        isComplete: false,
        transcode: {},
      };

      jest.spyOn(songUploadService, 'checkTranscodingStatus').mockResolvedValue(mockResponse);

      await expect(songUploadService.waitForTranscoding('upload-123', false, 50, 10))
        .rejects
        .toThrow('Transcoding timeout after 50ms for upload: upload-123');
    });
  });

  describe('uploadSong', () => {
    it('should upload a song and wait for completion', async () => {
      const mockUploadDetails = {
        uploadId: 'upload-123',
        uploadUrl: 'https://s3.amazonaws.com/upload-url',
        fileName: 'test.mp3',
        sha256Hash: 'AQIDBAUGBwgJCgsMDQ4PEA',
        alreadyExists: false,
      };

      const mockTranscodeResult = {
        transcodedAt: '2023-01-01T00:00:00Z',
      };

      // Mock the methods
      const getUploadUrlSpy = jest.spyOn(songUploadService, 'getUploadUrl')
        .mockResolvedValue(mockUploadDetails);
      
      const uploadFileToS3Spy = jest.spyOn(songUploadService, 'uploadFileToS3')
        .mockResolvedValue(true);
      
      const waitForTranscodingSpy = jest.spyOn(songUploadService, 'waitForTranscoding')
        .mockResolvedValue(mockTranscodeResult);

      const result = await songUploadService.uploadSong(mockFile);

      expect(result).toEqual({
        success: true,
        uploadId: 'upload-123',
        fileName: 'test.mp3',
        sha256Hash: 'AQIDBAUGBwgJCgsMDQ4PEA',
        transcode: mockTranscodeResult,
        isTranscodingComplete: true,
        alreadyExists: false,
        message: 'File uploaded successfully',
      });

      expect(getUploadUrlSpy).toHaveBeenCalledWith(mockFile);
      expect(uploadFileToS3Spy).toHaveBeenCalledWith(mockFile, 'https://s3.amazonaws.com/upload-url');
      expect(waitForTranscodingSpy).toHaveBeenCalledWith('upload-123', false);
    });

    it('should handle case when file already exists', async () => {
      const mockUploadDetails = {
        uploadId: 'upload-123',
        uploadUrl: null,
        fileName: 'test.mp3',
        sha256Hash: 'AQIDBAUGBwgJCgsMDQ4PEA',
        alreadyExists: true,
      };

      const mockTranscodeResult = {
        transcodedAt: '2023-01-01T00:00:00Z',
      };

      // Mock the methods
      jest.spyOn(songUploadService, 'getUploadUrl').mockResolvedValue(mockUploadDetails);
      const checkTranscodingStatusSpy = jest.spyOn(songUploadService, 'checkTranscodingStatus')
        .mockResolvedValue({
          isComplete: true,
          transcode: mockTranscodeResult,
        });

      const result = await songUploadService.uploadSong(mockFile, false, false);

      expect(result).toEqual({
        success: true,
        uploadId: 'upload-123',
        fileName: 'test.mp3',
        sha256Hash: 'AQIDBAUGBwgJCgsMDQ4PEA',
        transcode: mockTranscodeResult,
        isTranscodingComplete: true,
        alreadyExists: true,
        message: 'File already exists in Yoto system',
      });

      expect(checkTranscodingStatusSpy).toHaveBeenCalledWith('upload-123', false);
    });

    it('should handle errors in the upload process', async () => {
      jest.spyOn(songUploadService, 'getUploadUrl').mockRejectedValue(new Error('Upload failed'));

      await expect(songUploadService.uploadSong(mockFile))
        .rejects
        .toThrow('Upload failed');
    });
  });
});