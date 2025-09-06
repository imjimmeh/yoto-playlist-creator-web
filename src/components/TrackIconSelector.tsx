import React, { useState } from "react";
import { IconPickerModal } from "./IconPickerModal";
import { TrackIcon } from "../pages/components/TrackIcon";
import type { YotoPlaylistChapter } from "@/types";
import "./TrackIconSelector.css";

interface TrackIconSelectorProps {
  chapter: YotoPlaylistChapter;
  onIconChange: (chapterKey: string, iconRef: string) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  onModalStateChange?: (isOpen: boolean) => void;
  isProcessing?: boolean;
  isUpdating?: boolean;
}

export const TrackIconSelector: React.FC<TrackIconSelectorProps> = ({
  chapter,
  onIconChange,
  disabled = false,
  size = "medium",
  onModalStateChange,
  isProcessing = false,
  isUpdating = false,
}) => {
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleIconSelect = (iconRef: string) => {
    onIconChange(chapter.key, iconRef);
    setShowIconPicker(false);
    onModalStateChange?.(false);
  };

  const handleOpenPicker = () => {
    if (!disabled) {
      setShowIconPicker(true);
      onModalStateChange?.(true);
    }
  };

  const handleClosePicker = () => {
    setShowIconPicker(false);
    onModalStateChange?.(false);
  };

  return (
    <div className={`track-icon-selector ${size} ${disabled ? 'disabled' : ''}`}>
      <button
        type="button"
        className="icon-selector-button"
        onClick={handleOpenPicker}
        disabled={disabled}
        title={disabled ? "Cannot change icon" : "Click to change icon"}
      >
        <div className="current-icon">
          <TrackIcon 
            display={chapter.display} 
            isProcessing={isProcessing}
            isUpdating={isUpdating}
          />
        </div>
        {!disabled && (
          <div className="change-icon-overlay">
            <span className="change-icon-text">📝</span>
          </div>
        )}
      </button>

      {showIconPicker && (
        <IconPickerModal
          isOpen={showIconPicker}
          onClose={handleClosePicker}
          onSelect={handleIconSelect}
          currentIconRef={chapter.display?.icon16x16}
          trackTitle={chapter.title}
        />
      )}
    </div>
  );
};