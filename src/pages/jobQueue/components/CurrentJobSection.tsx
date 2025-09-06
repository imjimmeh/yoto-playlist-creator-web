import type { QueueJob } from "@/types/jobs";
import React from "react";
import JobItem from "./JobItem";

interface CurrentJobSectionProps {
  currentJob: QueueJob;
  onCancelJob: (jobId: string) => void;
}

const CurrentJobSection: React.FC<CurrentJobSectionProps> = ({
  currentJob,
  onCancelJob,
}) => {
  if (!currentJob?.progress) {
    return null;
  }

  return (
    <div className="current-job-section">
      <h3>Currently Processing</h3>
      <JobItem job={currentJob} onCancelJob={onCancelJob} variant="current" />
    </div>
  );
};

export default CurrentJobSection;
