import React from "react";

interface PlaylistActionsProps {
  // Edit mode props
  onSave?: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  hasChanges?: boolean;

  // Create mode props
  isCreateMode?: boolean;
  files?: File[];
  playlistTitle?: string;
  isSubmitting?: boolean;
  hasAuthToken?: boolean;
  hasAnyTracks?: boolean;
  onCreatePlaylist?: () => Promise<void>;
}

const PlaylistActions: React.FC<PlaylistActionsProps> = ({
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  hasChanges,
  isCreateMode,
  files: _files,
  playlistTitle,
  isSubmitting,
  hasAuthToken,
  hasAnyTracks,
  onCreatePlaylist,
}) => {
  if (isCreateMode) {
    const canCreate = playlistTitle && hasAuthToken && hasAnyTracks;

    return (
      <div className="playlist-actions">
        <div className="action-group primary-actions">
          <button
            type="button"
            className="btn btn-success"
            onClick={onCreatePlaylist}
            disabled={isSubmitting || !canCreate}
          >
            {isSubmitting ? "Creating..." : "Create Playlist"}
          </button>
        </div>

        <div className="playlist-status">
          {!hasAuthToken && (
            <div className="status-warning">
              ⚠️ Configure your Yoto auth token in Settings
            </div>
          )}
          {!playlistTitle && (
            <div className="status-warning">⚠️ Enter a playlist title</div>
          )}
          {!hasAnyTracks && (
            <div className="status-warning">
              ⚠️ Add audio files to create playlist
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit mode - hasChanges is now passed as a prop

  return (
    <div className="playlist-actions">
      <div className="action-group primary-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSave}
          disabled={isSaving || isDeleting || !hasChanges}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          className="btn btn-delete"
          onClick={onDelete}
          disabled={isSaving || isDeleting}
        >
          {isDeleting ? "Deleting..." : "🗑️ Delete"}
        </button>
      </div>

      <div className="playlist-status">
        {hasChanges && (
          <div className="status-info">💾 You have unsaved changes</div>
        )}
      </div>
    </div>
  );
};

export default PlaylistActions;
