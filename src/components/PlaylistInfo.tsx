import React from "react";
import type { JobStatusInfo } from "@/types";

interface PlaylistInfoProps {
  title: string;
  description?: string;
  trackCount: number;
  duration?: string;
  fileSize?: number;
  onRegenerateIcons?: () => void;
  isRegeneratingIcons: boolean;
  iconRegenerationStatus?: JobStatusInfo;
  formatDuration: (seconds: number) => string;
  formatFileSize: (bytes: number) => string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  // New props for create mode
  isCreateMode?: boolean;
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  isEditable?: boolean;
  // New props for edit mode
  isEditingTitle?: boolean;
  onStartTitleEdit?: () => void;
  onSaveTitle?: () => void;
  onCancelTitleEdit?: () => void;
  isSavingTitle?: boolean;
}

const PlaylistInfo: React.FC<PlaylistInfoProps> = ({
  title,
  description,
  trackCount,
  duration,
  fileSize,
  onRegenerateIcons,
  isRegeneratingIcons,
  iconRegenerationStatus,
  formatDuration,
  formatFileSize,
  durationSeconds,
  fileSizeBytes,
  isCreateMode = false,
  onTitleChange,
  onDescriptionChange,
  isEditable = false,
  isEditingTitle = false,
  onStartTitleEdit,
  onSaveTitle,
  onCancelTitleEdit,
  isSavingTitle = false,
}) => {
  return (
    <div className="playlist-info-section">
      {isEditable && onTitleChange ? (
        <div className="title-edit-container">
          <div className="input-with-icon">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="playlist-title-input"
              placeholder="Enter playlist title"
            />
            <span className="edit-icon">✏️</span>
          </div>
          {!isCreateMode && isEditingTitle && (
            <div className="title-edit-actions">
              <button
                className="btn btn-sm btn-primary"
                onClick={onSaveTitle}
                disabled={isSavingTitle || !title.trim()}
              >
                {isSavingTitle ? "Saving..." : "Save"}
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={onCancelTitleEdit}
                disabled={isSavingTitle}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="title-display-container">
          <h1 className="playlist-title">{title || 'New Playlist'}</h1>
          {!isCreateMode && onStartTitleEdit && (
            <button
              className="btn btn-sm btn-ghost title-edit-btn"
              onClick={onStartTitleEdit}
              title="Edit playlist title"
            >
              ✏️
            </button>
          )}
        </div>
      )}

      {/* Description field */}
      {isEditable && onDescriptionChange ? (
        <div className="description-edit-container">
          <div className="input-with-icon">
            <textarea
              value={description || ""}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="playlist-description-input"
              placeholder="Enter playlist description (optional)"
              rows={3}
            />
            <span className="edit-icon">✏️</span>
          </div>
        </div>
      ) : (
        description && (
          <div className="description-display-container">
            <p className="playlist-description">{description}</p>
          </div>
        )
      )}

      <div className="playlist-stats">
        <div className="stat">
          <span className="stat-icon">🎵</span>
          <span className="stat-value">{trackCount}</span>
          <span className="stat-label">tracks</span>
        </div>
        {/* Only show duration and size in edit mode or when they have values */}
        {(!isCreateMode && (duration || durationSeconds)) && (
          <div className="stat">
            <span className="stat-icon">⏱️</span>
            <span className="stat-value">
              {duration || formatDuration(durationSeconds || 0)}
            </span>
            <span className="stat-label">duration</span>
          </div>
        )}
        {(!isCreateMode && (fileSize || fileSizeBytes)) && (
          <div className="stat">
            <span className="stat-icon">💾</span>
            <span className="stat-value">
              {fileSize ? `${fileSize} MB` : formatFileSize(fileSizeBytes || 0)}
            </span>
            <span className="stat-label">size</span>
          </div>
        )}
      </div>

      {/* Only show actions in edit mode */}
      {!isCreateMode && onRegenerateIcons && (
        <div className="playlist-actions">
          <button
            className="btn btn-primary action-btn"
            onClick={onRegenerateIcons}
            disabled={isRegeneratingIcons || !!iconRegenerationStatus}
          >
            {iconRegenerationStatus ? (
              iconRegenerationStatus.type === "current" ? (
                <>
                  <span className="spinner"></span>
                  {iconRegenerationStatus.job.progress.status}
                </>
              ) : (
                <>
                  <span>🕒</span>
                  Icon Regeneration Queued
                </>
              )
            ) : isRegeneratingIcons ? (
              <>
                <span className="spinner"></span>
                Adding to Queue...
              </>
            ) : (
              <>
                <span>✨</span>
                Queue AI Icon Regeneration
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlaylistInfo;