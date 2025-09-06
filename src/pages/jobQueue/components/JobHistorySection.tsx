import React from "react";
import type { JobHistoryItem } from "@/types";

interface JobHistorySectionProps {
  jobHistory: JobHistoryItem[];
  onClearHistory: () => void;
}

const JobHistorySection: React.FC<JobHistorySectionProps> = ({
  jobHistory,
  onClearHistory,
}) => {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (status: JobHistoryItem["status"]) => {
    switch (status) {
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      case "cancelled":
        return "⏹️";
      default:
        return "❓";
    }
  };

  const getStatusClass = (status: JobHistoryItem["status"]) => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "failed":
        return "status-failed";
      case "cancelled":
        return "status-cancelled";
      default:
        return "";
    }
  };

  return (
    <div className="history-section">
      <div className="job-history-controls">
        <button
          className="clear-history-button"
          onClick={onClearHistory}
          disabled={jobHistory.length === 0}
        >
          Clear History
        </button>
      </div>

      {jobHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Job History</h3>
          <p>Playlist creation jobs will appear here after they complete.</p>
        </div>
      ) : (
        <div className="job-history-list">
          {jobHistory.map((job) => (
            <div
              key={job.id}
              className={`job-history-item ${getStatusClass(job.status)}`}
            >
              <div className="job-header">
                <div className="job-title">
                  <span className="job-status-icon">
                    {getStatusIcon(job.status)}
                  </span>
                  <span className="job-name" title={job.playlistTitle}>
                    {job.playlistTitle}
                  </span>
                </div>
                <div className="job-timestamp">
                  {formatTimestamp(job.timestamp)}
                </div>
              </div>
              <div className="job-details">
                <div className="job-status">
                  <span className="status-label">Status:</span>
                  <span className="status-value">
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
                {job.error && (
                  <div className="job-error">
                    <span className="error-label">Error:</span>
                    <span className="error-message">{job.error}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobHistorySection;
