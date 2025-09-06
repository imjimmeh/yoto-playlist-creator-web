import { selectFiles, selectImageFile } from '../utils/file-selection';

describe('file-selection utilities', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('selectFiles', () => {
    it('should create an input element and trigger click', async () => {
      // Mock document.createElement
      const mockInput = document.createElement('input');
      const mockClick = jest.fn();
      
      // Use jest.spyOn to mock the click method
      const clickSpy = jest.spyOn(mockInput, 'click').mockImplementation(mockClick);
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockInput);
      
      // Call the function
      const promise = selectFiles({ multiple: true, accept: 'audio/*' });
      
      // Simulate file selection
      const mockFiles = [
        new File([''], 'test1.mp3', { type: 'audio/mpeg' }),
        new File([''], 'test2.mp3', { type: 'audio/mpeg' }),
      ] as any as FileList;
      
      // Create a proper Event object
      const event = new Event('change');
      Object.defineProperty(event, 'target', {
        writable: false,
        value: { files: mockFiles }
      });
      
      mockInput.onchange!(event);
      
      // Wait for the promise to resolve
      const result = await promise;
      
      // Assertions
      expect(createElementSpy).toHaveBeenCalledWith('input');
      expect(mockInput.type).toBe('file');
      expect(mockInput.multiple).toBe(true);
      expect(mockInput.accept).toBe('audio/*');
      expect(clickSpy).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(mockFiles[0]);
      expect(result[1]).toBe(mockFiles[1]);
      
      createElementSpy.mockRestore();
      clickSpy.mockRestore();
    });

    it('should resolve with empty array when no files are selected', async () => {
      const mockInput = document.createElement('input');
      const mockClick = jest.fn();
      
      // Use jest.spyOn to mock the click method
      const clickSpy = jest.spyOn(mockInput, 'click').mockImplementation(mockClick);
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockInput);
      
      const promise = selectFiles({ multiple: false, accept: 'audio/*' });
      
      // Simulate no file selection
      const event = new Event('change');
      Object.defineProperty(event, 'target', {
        writable: false,
        value: { files: null }
      });
      
      mockInput.onchange!(event);
      
      const result = await promise;
      
      expect(result).toEqual([]);
      
      createElementSpy.mockRestore();
      clickSpy.mockRestore();
    });
  });

  describe('selectImageFile', () => {
    it('should create an input element for images and trigger click', async () => {
      const mockInput = document.createElement('input');
      const mockClick = jest.fn();
      
      // Use jest.spyOn to mock the click method
      const clickSpy = jest.spyOn(mockInput, 'click').mockImplementation(mockClick);
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockInput);
      
      const promise = selectImageFile();
      
      // Simulate image selection
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const event = new Event('change');
      Object.defineProperty(event, 'target', {
        writable: false,
        value: { files: [mockFile] }
      });
      
      mockInput.onchange!(event);
      
      const result = await promise;
      
      expect(createElementSpy).toHaveBeenCalledWith('input');
      expect(mockInput.type).toBe('file');
      expect(mockInput.accept).toBe('image/*');
      expect(clickSpy).toHaveBeenCalled();
      expect(result).toBe(mockFile);
      
      createElementSpy.mockRestore();
      clickSpy.mockRestore();
    });

    it('should resolve with null when no image is selected', async () => {
      const mockInput = document.createElement('input');
      const mockClick = jest.fn();
      
      // Use jest.spyOn to mock the click method
      const clickSpy = jest.spyOn(mockInput, 'click').mockImplementation(mockClick);
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockInput);
      
      const promise = selectImageFile();
      
      // Simulate no image selection
      const event = new Event('change');
      Object.defineProperty(event, 'target', {
        writable: false,
        value: { files: null }
      });
      
      mockInput.onchange!(event);
      
      const result = await promise;
      
      expect(result).toBeNull();
      
      createElementSpy.mockRestore();
      clickSpy.mockRestore();
    });
  });
});