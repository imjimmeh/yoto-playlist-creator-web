import React, { useState } from "react";
import { TrackIcon } from "./TrackIcon";
import { TrackIconSelector } from "../../components/TrackIconSelector";
import ProgressBar from "../../components/ProgressBar";
import type { YotoPlaylistChapter } from "../../types";
import {
  TRACK_PLAYBACK_OPTIONS,
  type TrackPlaybackOption,
} from "../../types/yoto-api";
import "./TrackItem.css";

// Utility function to parse existing combined titles like "Artist - Title"
const parseTitle = (title: string): { artist?: string; cleanTitle: string } => {
  // Look for patterns like "Artist - Title" with various separators
  const separators = [" - ", " – ", " — ", " | "];

  for (const separator of separators) {
    const index = title.indexOf(separator);
    if (index > 0 && index < title.length - separator.length) {
      const potentialArtist = title.substring(0, index).trim();
      const potentialTitle = title.substring(index + separator.length).trim();

      // Only treat as artist-title if both parts are reasonable length
      if (
        potentialArtist.length > 0 &&
        potentialArtist.length < 100 &&
        potentialTitle.length > 0
      ) {
        return {
          artist: potentialArtist,
          cleanTitle: potentialTitle,
        };
      }
    }
  }

  return { cleanTitle: title };
};

// Extended chapter type that can include upload status and AI processing status
export type TrackItemChapter = YotoPlaylistChapter & {
  uploadStatus?: "uploading" | "transcoding" | "completed" | "failed";
  uploadProgress?: number;
  uploadError?: string;
  artist?: string;
  playbackOption?: "continue" | "stop" | "repeat";
  // AI processing states
  aiProcessingStatus?: "processing" | "updating";
};

interface TrackItemProps {
  chapter: TrackItemChapter;
  index: number;
  isDragging?: boolean;
  isDraggedOver?: boolean;
  onRemove: (chapterKey: string) => void;
  onDragStart?: (index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
  onDragLeave?: () => void;
  onIconChange?: (chapterKey: string, iconRef: string) => void;
  onTitleChange?: (chapterKey: string, newTitle: string) => void;
  onPlaybackOptionChange?: (
    chapterKey: string,
    option: TrackPlaybackOption
  ) => void;
  formatDuration: (seconds: number) => string;
  formatFileSize: (bytes: number) => string;
}

// Component for displaying upload status
const UploadStatus: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    uploading: { emoji: "⬆️", text: "Uploading..." },
    transcoding: { emoji: "🔄", text: "Processing..." },
    completed: { emoji: "✅", text: "Complete" },
    failed: { emoji: "❌", text: "Failed" },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <span className={`upload-status status-${status}`}>
      {config.emoji} {config.text}
    </span>
  );
};

// Component for displaying AI processing status
const AIProcessingStatus: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    processing: {
      emoji: "✨",
      text: "AI Picking Icon...",
      className: "ai-processing",
    },
    updating: {
      emoji: "🔄",
      text: "Updating Icon...",
      className: "ai-updating",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <span className={`ai-status ${config.className}`}>
      {config.emoji} {config.text}
    </span>
  );
};

// Component for displaying upload progress
const UploadProgress: React.FC<{
  progress?: number;
  error?: string;
}> = ({ progress, error }) => (
  <ProgressBar
    progress={progress}
    showText={true}
    size="small"
    variant="primary"
    className="upload-progress"
    error={error}
  />
);

// Component for selecting playback options
const PlaybackOptionSelector: React.FC<{
  currentOption?: TrackPlaybackOption;
  chapterKey: string;
  onChange?: (chapterKey: string, option: TrackPlaybackOption) => void;
  disabled?: boolean;
}> = ({ currentOption = "continue", chapterKey, onChange, disabled }) => {
  const selectedOption =
    TRACK_PLAYBACK_OPTIONS.find((opt) => opt.value === currentOption) ||
    TRACK_PLAYBACK_OPTIONS[0];

  const getOptionIcon = (option: TrackPlaybackOption) => {
    switch (option) {
      case "continue":
        return "▶️";
      case "stop":
        return "⏸️";
      case "repeat":
        return "🔄";
      default:
        return "▶️";
    }
  };

  return (
    <div className="playback-option-selector">
      <label className="playback-option-label">After track ends:</label>
      <select
        value={currentOption}
        onChange={(e) =>
          onChange?.(chapterKey, e.target.value as TrackPlaybackOption)
        }
        disabled={disabled}
        className="playback-option-select"
        title={selectedOption.description}
      >
        {TRACK_PLAYBACK_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {getOptionIcon(option.value)} {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const TrackItem: React.FC<TrackItemProps> = ({
  chapter,
  index,
  isDragging,
  isDraggedOver,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragLeave,
  onIconChange,
  onTitleChange,
  onPlaybackOptionChange,
  formatDuration,
  formatFileSize,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(chapter.title);
  const trackInfo = chapter.tracks?.[0];
  const hasUploadStatus =
    chapter.uploadStatus && chapter.uploadStatus !== "completed";

  // For existing tracks without separate artist field, parse the combined title
  const displayInfo = chapter.artist
    ? { artist: chapter.artist, cleanTitle: chapter.title }
    : parseTitle(chapter.title);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.outerHTML);
    onDragStart?.(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    onDragOver?.(e, index);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const handleDragLeave = () => {
    onDragLeave?.();
  };

  const handleStartTitleEdit = () => {
    setIsEditingTitle(true);
    setEditTitle(chapter.title);
  };

  const handleSaveTitle = () => {
    if (onTitleChange && editTitle.trim()) {
      onTitleChange(chapter.key, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitleEdit = () => {
    setEditTitle(chapter.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelTitleEdit();
    }
  };

  const dragClassName = `track-item${isDragging ? " dragging" : ""}${
    isDraggedOver ? " drag-over" : ""
  }${isModalOpen ? " modal-open" : ""}`;

  // Disable dragging when editing title or when modal is open
  const isDragDisabled = isEditingTitle || isModalOpen;

  return (
    <div
      className={dragClassName}
      draggable={false}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div
        className="track-drag-handle"
        title="Drag to reorder"
        draggable={!isDragDisabled}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ cursor: isDragDisabled ? "not-allowed" : "grab" }}
      >
        ⋮⋮
      </div>

      <div className="track-number">
        <span>{index + 1}</span>
      </div>

      {onIconChange ? (
        <TrackIconSelector
          chapter={chapter}
          onIconChange={onIconChange}
          disabled={hasUploadStatus}
          size="medium"
          onModalStateChange={setIsModalOpen}
          isProcessing={chapter.aiProcessingStatus === "processing"}
          isUpdating={chapter.aiProcessingStatus === "updating"}
        />
      ) : (
        <TrackIcon
          display={chapter.display}
          isProcessing={chapter.aiProcessingStatus === "processing"}
          isUpdating={chapter.aiProcessingStatus === "updating"}
        />
      )}

      <div className="track-info">
        <div className="track-title-container">
          {isEditingTitle && onTitleChange ? (
            <div className="track-title-edit">
              <div className="input-with-icon">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="track-title-input"
                  placeholder="Enter track title"
                  autoFocus
                />
                <span className="edit-icon">✏️</span>
              </div>
              <div className="title-edit-actions">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSaveTitle}
                  disabled={!editTitle.trim()}
                >
                  ✓
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleCancelTitleEdit}
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className="track-title-display">
              <h3 className="track-title">{displayInfo.cleanTitle}</h3>
              {onTitleChange && !hasUploadStatus && (
                <button
                  className="btn btn-sm btn-ghost track-title-edit-btn"
                  onClick={handleStartTitleEdit}
                  title="Edit track title"
                >
                  ✏️
                </button>
              )}
            </div>
          )}
          {displayInfo.artist && (
            <div className="track-artist">{displayInfo.artist}</div>
          )}
        </div>
        <div className="track-meta">
          <span className="track-duration">
            ⏱️ {formatDuration(trackInfo?.duration || 0)}
          </span>
          <span className="track-size">
            💾 {formatFileSize(trackInfo?.fileSize || 0)}
          </span>
          {chapter.uploadStatus && (
            <UploadStatus status={chapter.uploadStatus} />
          )}
          {chapter.aiProcessingStatus && (
            <AIProcessingStatus status={chapter.aiProcessingStatus} />
          )}
        </div>
        {hasUploadStatus && (
          <UploadProgress
            progress={chapter.uploadProgress}
            error={chapter.uploadError}
          />
        )}
        {onPlaybackOptionChange && !hasUploadStatus && (
          <PlaybackOptionSelector
            currentOption={chapter.playbackOption}
            chapterKey={chapter.key}
            onChange={onPlaybackOptionChange}
            disabled={hasUploadStatus}
          />
        )}
      </div>

      <div className="track-actions">
        <button
          className="btn btn-secondary btn-sm remove-track-btn"
          onClick={() => onRemove(chapter.key)}
          title="Remove track"
        >
          <span>🗑️</span>
          Remove
        </button>
      </div>
    </div>
  );
};

export default TrackItem;
