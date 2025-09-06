import React, { useState, useEffect } from "react";
import type { JobQueueStatus } from "@/services/JobQueueService";
import ToastHeader from "./ToastHeader";
import ToastBody from "./ToastBody";
import "./CreationStatusToast.css";
import { logger } from "@/services/Logger";

interface CreationStatusToastProps {
  queueStatus: JobQueueStatus;
  onDismiss: () => void;
}

const CreationStatusToast: React.FC<CreationStatusToastProps> = ({
  queueStatus,
  onDismiss,
}) => {
  const { isProcessing, queueLength, currentJob } = queueStatus;
  const [isMinimized, setIsMinimized] = useState(false);

  // Determine if the job is completed (success or failure)
  const isJobCompleted =
    currentJob?.progress?.done === true ||
    currentJob?.status === "completed" ||
    currentJob?.status === "failed";

  // Auto-dismiss completed jobs after 5 seconds
  useEffect(() => {
    logger.debug(
      "CreationStatusToast: isJobCompleted:",
      isJobCompleted,
      "queueLength:",
      queueLength,
      "isProcessing:",
      isProcessing
    );
    if (isJobCompleted && queueLength === 0 && !isProcessing) {
      logger.debug("CreationStatusToast: Setting 5-second auto-dismiss timer");
      const timer = setTimeout(() => {
        logger.debug("CreationStatusToast: Auto-dismissing toast");
        onDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isJobCompleted, queueLength, isProcessing, onDismiss]);

  if (!isProcessing && queueLength === 0 && !currentJob) {
    return null;
  }

  // Handle dismiss - allow dismissal when job is completed and queue is empty
  const handleDismiss = () => {
    if (
      (isJobCompleted && queueLength === 0) ||
      (!isProcessing && queueLength === 0 && !currentJob)
    ) {
      onDismiss();
    }
  };

  // Toggle minimize/expand
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const isError = currentJob?.progress?.success === false;

  return (
    <div
      className={`creation-status-toast ${isError ? "error" : ""} ${
        isMinimized ? "minimized" : ""
      }`}
    >
      <ToastHeader
        currentJob={currentJob || undefined}
        isMinimized={isMinimized}
        isJobCompleted={isJobCompleted}
        queueLength={queueLength}
        onToggleMinimize={toggleMinimize}
        onDismiss={handleDismiss}
      />
      {!isMinimized && (
        <ToastBody
          currentJob={currentJob || undefined}
          queueLength={queueLength}
          isJobCompleted={isJobCompleted}
        />
      )}
    </div>
  );
};

export default CreationStatusToast;
