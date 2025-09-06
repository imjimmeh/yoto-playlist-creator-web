import type { QueueJob } from "@/types/jobs";
import React from "react";
import ProgressBar from "../../../components/ProgressBar";

interface JobItemProps {
  job: QueueJob;
  onCancelJob: (jobId: string) => void;
  variant?: "current" | "pending";
  queuePosition?: number;
}

const JobItem: React.FC<JobItemProps> = ({
  job,
  onCancelJob,
  variant = "pending",
  queuePosition,
}) => {
  const isCurrentJob = variant === "current";
  const statusIcon = isCurrentJob ? "🔄" : "🕒";
  const typeLabel =
    job.type === "regenerate-icons" ? "✨ AI Icon Picking" : "🎵 Create";

  return (
    <div className={`job-queue-item ${isCurrentJob ? "current-job" : ""}`}>
      <div className="job-header">
        <div className="job-title">
          <span className="job-status-icon">{statusIcon}</span>
          <span className="job-name" title={job.playlistTitle}>
            {job.playlistTitle}
          </span>
          <span className="job-type-badge">{typeLabel}</span>
        </div>
        {!isCurrentJob && queuePosition !== undefined && (
          <div className="job-position">#{queuePosition} in queue</div>
        )}
      </div>

      {isCurrentJob && job.progress && (
        <div className="job-progress">
          <div className="job-item-progress-text">{job.progress.status}</div>
          {job.progress.total && job.progress.current !== undefined && (
            <ProgressBar
              progress={(job.progress.current / job.progress.total) * 100}
              showText={false}
              size="medium"
              variant="primary"
              className="job-progress"
            />
          )}
          {job.progress.total && job.progress.current !== undefined && (
            <div className="job-item-progress-text">
              {job.progress.current} / {job.progress.total}
            </div>
          )}
        </div>
      )}

      <div className="job-actions">
        <button
          className="cancel-job-button"
          onClick={() => onCancelJob(job.id)}
          disabled={isCurrentJob && job.progress?.done}
        >
          {isCurrentJob && job.progress?.done ? "Completed" : "Cancel"}
        </button>
      </div>
    </div>
  );
};

export default JobItem;
