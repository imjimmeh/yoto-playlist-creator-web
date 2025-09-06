import React from "react";
import type { QueueJob } from "@/types/jobs";

interface ToastHeaderProps {
  currentJob?: QueueJob;
  isMinimized: boolean;
  isJobCompleted: boolean;
  queueLength: number;
  onToggleMinimize: () => void;
  onDismiss: () => void;
}

const ToastHeader: React.FC<ToastHeaderProps> = ({
  currentJob,
  isMinimized,
  isJobCompleted,
  queueLength,
  onToggleMinimize,
  onDismiss,
}) => {
  const isError = currentJob?.progress.success === false;

  return (
    <div className={`toast-header ${isError ? "error" : ""}`}>
      <h4>
        {currentJob?.type === "regenerate-icons"
          ? "Icon Regeneration"
          : "Playlist Creation"}
      </h4>
      <div className="toast-controls">
        <button
          onClick={onToggleMinimize}
          className="minimize-btn"
          title={isMinimized ? "Expand" : "Minimize"}
        >
          {isMinimized ? "▲" : "▼"}
        </button>
        {isJobCompleted && queueLength === 0 && (
          <button onClick={onDismiss} className="dismiss-btn" title="Close">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ToastHeader;
