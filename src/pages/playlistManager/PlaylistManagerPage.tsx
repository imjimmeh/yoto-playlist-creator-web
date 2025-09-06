import React from "react";
import { useParams } from "react-router-dom";
import { usePlaylistManager } from "../../hooks/usePlaylistManager";
import { useSettings } from "../../hooks/useSettings";
import { useError } from "@/contexts/ErrorContext";
import Alert from "../../components/Alert";
import BackButton from "../../components/BackButton";
import PlaylistCover from "../../components/PlaylistCover";
import PlaylistInfo from "../../components/PlaylistInfo";
import TracksList from "../../components/TracksList";
import PlaylistActions from "./components/PlaylistActions";
import "./PlaylistManagerPage.css";

const PlaylistManagerPage: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { settings } = useSettings();
  const { showError } = useError();

  const {
    playlist,
    isLoading,
    isDeleting,
    isUploading,
    isRegenerating,
    isUploadingCover,
    error,
    tracksWithStatus,
    hasUnsavedChanges,
    updateTitle,
    updateDescription,
    addFilesToUploadQueue,
    removeTrack,
    reorderChapters,
    updateTrackIcon,
    updateTrackTitle,
    updatePlaybackOption,
    savePlaylist,
    deletePlaylist,
    regenerateIcons,
    uploadCoverImage,
  } = usePlaylistManager(playlistId);

  // Helper functions
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleAddMusicClick = () => {
    // Create file input element for web
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".mp3,.m4a,.m4b,.aac";
    fileInput.multiple = true;

    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const selectedFiles = target.files;

      if (selectedFiles && selectedFiles.length > 0) {
        const files: File[] = Array.from(selectedFiles);
        addFilesToUploadQueue(files);
      }
    };

    fileInput.click();
  };

  const handleUploadCover = () => {
    // Create file input element for web
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = false;

    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const selectedFile = target.files?.[0];

      if (selectedFile) {
        uploadCoverImage(selectedFile);
      }
    };

    fileInput.click();
  };

  if (isLoading) {
    return (
      <div className="playlist-edit-page">
        <div className="loading">Loading playlist...</div>
      </div>
    );
  }

  if (error) {
    showError(error);
    return (
      <div className="playlist-edit-page">
        <BackButton className="page-back-button" />
        <div className="error-container">
          <Alert type="error">{error}</Alert>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="playlist-edit-page">
        <BackButton className="page-back-button" />
        <Alert type="warning">Playlist not found.</Alert>
      </div>
    );
  }

  const isCreateMode = !playlist.cardId;

  // Combine existing chapters with new uploads for display
  // Only show tracks that are still uploading/failed, not completed ones
  const pendingTracks = tracksWithStatus.filter(
    (track) => track.uploadStatus !== "completed"
  );
  const allChapters = [...(playlist.content?.chapters || []), ...pendingTracks];

  return (
    <div className="playlist-edit-page">
      <BackButton className="page-back-button" />

      <div className="playlist-content">
        <PlaylistCover
          coverUrl={playlist.metadata?.cover?.imageL}
          title={playlist.title}
          onUploadCover={handleUploadCover}
          isUploadingCover={isUploadingCover}
        />

        <PlaylistInfo
          title={playlist.title}
          description={playlist.metadata?.description}
          trackCount={allChapters.length}
          isCreateMode={isCreateMode}
          isEditable={true}
          onTitleChange={updateTitle}
          onDescriptionChange={updateDescription}
          formatDuration={formatDuration}
          formatFileSize={formatFileSize}
          durationSeconds={playlist.metadata?.media?.duration}
          fileSizeBytes={playlist.metadata?.media?.fileSize}
          onRegenerateIcons={!isCreateMode ? regenerateIcons : undefined}
          isRegeneratingIcons={isRegenerating}
        />
      </div>

      <div>
        <button className="add-music-btn" onClick={handleAddMusicClick}>
          Add MP3s
        </button>
      </div>

      <TracksList
        chapters={allChapters}
        onRemoveChapter={removeTrack}
        onReorderChapters={reorderChapters}
        onIconChange={updateTrackIcon}
        onTitleChange={updateTrackTitle}
        onPlaybackOptionChange={updatePlaybackOption}
        formatDuration={formatDuration}
        formatFileSize={formatFileSize}
      />

      <div className="tracks-section">
        {!settings.yotoAuthToken && (
          <Alert type="warning">
            <span>
              Configure your Yoto auth token in{" "}
              <a href="#/settings">Settings</a> first.
            </span>
          </Alert>
        )}

        <PlaylistActions
          onSave={savePlaylist}
          onDelete={deletePlaylist}
          isSaving={isUploading}
          isDeleting={isDeleting}
          hasChanges={hasUnsavedChanges}
          isCreateMode={isCreateMode}
          playlistTitle={playlist?.title}
          isSubmitting={isDeleting || isUploading}
          hasAuthToken={!!settings.yotoAuthToken}
          files={
            tracksWithStatus.length > 0
              ? tracksWithStatus.map((t) => t.originalFile!).filter(Boolean)
              : []
          }
          hasAnyTracks={allChapters.length > 0}
          onCreatePlaylist={async () => savePlaylist()}
        />
      </div>
    </div>
  );
};

export default PlaylistManagerPage;
