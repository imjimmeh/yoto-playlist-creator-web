import React, { useState } from "react";
import TrackItem from "../pages/components/TrackItem";
import type { YotoPlaylistCard } from "@/types";
import "../pages/components/TrackItem.css";

interface TracksListProps {
  playlist?: YotoPlaylistCard;
  chapters?: any[];
  onRemoveChapter?: (chapterKey: string) => void;
  onReorderChapters?: (fromIndex: number, toIndex: number) => void;
  onIconChange?: (chapterKey: string, iconRef: string) => void;
  onTitleChange?: (chapterKey: string, newTitle: string) => void;
  onPlaybackOptionChange?: (
    chapterKey: string,
    option: "continue" | "stop" | "repeat"
  ) => void;
  formatDuration?: (seconds: number) => string;
  formatFileSize?: (bytes: number) => string;
}

const TracksList: React.FC<TracksListProps> = ({
  playlist,
  chapters: providedChapters,
  onRemoveChapter,
  onReorderChapters,
  onIconChange,
  onTitleChange,
  onPlaybackOptionChange,
  formatDuration,
  formatFileSize,
}) => {
  const chapters = providedChapters || playlist?.content?.chapters || [];
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex &&
      onReorderChapters
    ) {
      onReorderChapters(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  return (
    <div className="tracks-list">
      {chapters.length === 0 ? (
        <div className="empty-tracks">
          <div className="empty-icon">🎵</div>
          <h3>No tracks yet</h3>
          <p>Upload some audio files to get started.</p>
        </div>
      ) : (
        <div>
          {chapters.map((chapter, chapterIndex) => (
            <TrackItem
              key={chapter.key}
              chapter={chapter}
              index={chapterIndex}
              isDragging={draggedIndex === chapterIndex}
              isDraggedOver={dragOverIndex === chapterIndex}
              onRemove={onRemoveChapter || (() => {})}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
              onIconChange={onIconChange}
              onTitleChange={onTitleChange}
              onPlaybackOptionChange={onPlaybackOptionChange}
              formatDuration={
                formatDuration ||
                ((seconds: number) =>
                  `${Math.floor(seconds / 60)}:${(seconds % 60)
                    .toString()
                    .padStart(2, "0")}`)
              }
              formatFileSize={
                formatFileSize ||
                ((bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TracksList;
