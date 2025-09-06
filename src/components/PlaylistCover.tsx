import { pickRandomCoverUrl } from "@/utils/random-cover";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";
import React, { useMemo } from "react";

interface PlaylistCoverProps {
  coverUrl?: string;
  title: string;
  onUploadCover: () => void;
  isUploadingCover: boolean;
}

const PlaylistCover: React.FC<PlaylistCoverProps> = ({
  coverUrl,
  title,
  onUploadCover,
  isUploadingCover,
}) => {
  const defaultCover =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZmY2YjM1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNGE5MGUyIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjZ3JhZCkiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxNTAiIHI9IjQwIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC45Ii8+PHRleHQgeD0iMTUwIiB5PSIxNjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iNTAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjkiPuOAveKZqeOAgTwvdGV4dD48L3N2Zz4K";

  const fallbackCover = useMemo(
    () => coverUrl ?? pickRandomCoverUrl(),
    [coverUrl]
  );
  const { authenticatedImageUrl } = useAuthenticatedImage(coverUrl);

  const cover = authenticatedImageUrl || fallbackCover;
  return (
    <div className="playlist-cover-section">
      <div className="cover-container">
        <img
          src={cover}
          alt={title}
          className="playlist-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultCover;
          }}
        />
        <button
          className="cover-upload-overlay"
          onClick={onUploadCover}
          disabled={isUploadingCover}
          title="Upload custom cover"
        >
          {isUploadingCover ? (
            <div className="upload-spinner">
              <span className="spinner"></span>
            </div>
          ) : (
            <span className="upload-icon">📷</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlaylistCover;