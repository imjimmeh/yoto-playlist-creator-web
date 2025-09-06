import React from "react";
import type { QueueJob } from "@/types/jobs";
import ProgressBar from "./ProgressBar";

interface JobStatusProps {
  job: QueueJob;
}

const JobStatus: React.FC<JobStatusProps> = ({ job }) => {
  // Calculate progress percentage
  const progressPercent =
    job.progress.total && job.progress.current
      ? Math.round((job.progress.current / job.progress.total) * 100)
      : 0;

  // Determine if we should show detailed progress
  const showDetailedProgress =
    job.progress.total &&
    (job.progress.fileName || job.progress.current !== undefined);

  // Check if job is done
  const isJobDone = job.progress.done === true;

  const status = job.progress.success ? "✅" : "❌";

  return (
    <div className="current-job-status">
      <div className="job-title">
        <span className="job-icon">{job.progress.done ? status : "🎵"}</span>
        <span className="job-name" title={job.playlistTitle}>
          {job.playlistTitle}
        </span>
      </div>
      <p className="job-progress-status">{job.progress.status}</p>

      {/* Detailed progress information */}
      {showDetailedProgress && !isJobDone && (
        <div className="detailed-progress">
          {job.progress.fileName && (
            <p className="current-file">File: {job.progress.fileName}</p>
          )}

          <ProgressBar progress={progressPercent} />
        </div>
      )}

      {job.progress.total && !showDetailedProgress && !isJobDone && (
        <div className="progress-bar-container">
          <div
            className={`progress-bar ${
              progressPercent === 100 ? "completed" : ""
            }`}
            style={{ width: `${progressPercent}%` }}
          />
          <span className="progress-text">{progressPercent}%</span>
        </div>
      )}
    </div>
  );
};

export default JobStatus;
