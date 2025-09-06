import { renderHook } from '@testing-library/react';
import { useServices } from '../contexts/useServices';
import { ServicesContext } from '../contexts/ServicesContext';

// Mock services
const mockServices = {
  yotoAuthService: {},
  yotoPlaylistService: {},
  yotoSongUploadService: {},
  yotoPlaylistCreationService: {},
  jobQueueService: {},
  yotoIconService: {},
  hybridIconMapper: {},
};

describe('useServices', () => {
  it('should return services when used within ServicesProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ServicesContext.Provider value={mockServices as any}>
        {children}
      </ServicesContext.Provider>
    );

    const { result } = renderHook(() => useServices(), { wrapper });

    expect(result.current).toBe(mockServices);
  });

  it('should throw an error when used outside of ServicesProvider', () => {
    // We expect this to throw an error, so we'll catch it
    try {
      renderHook(() => useServices());
    } catch (error) {
      expect(error).toEqual(
        new Error('useServices must be used within a ServicesProvider')
      );
    }
  });
});