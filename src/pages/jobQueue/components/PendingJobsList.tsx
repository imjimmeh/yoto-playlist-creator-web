import type { QueueJob } from "@/types/jobs";
import React from "react";
import JobItem from "./JobItem";

interface PendingJobsListProps {
  pendingJobs: QueueJob[];
  onCancelJob: (jobId: string) => void;
}

const PendingJobsList: React.FC<PendingJobsListProps> = ({
  pendingJobs,
  onCancelJob,
}) => {
  if (pendingJobs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>No Pending Jobs</h3>
        <p>
          Playlist creation and icon regeneration jobs will appear here when
          added to the queue.
        </p>
      </div>
    );
  }

  return (
    <div className="job-queue-list">
      {pendingJobs.map((job, index) => (
        <JobItem
          key={job.id}
          job={job}
          onCancelJob={onCancelJob}
          variant="pending"
          queuePosition={index + 1}
        />
      ))}
    </div>
  );
};

export default PendingJobsList;
