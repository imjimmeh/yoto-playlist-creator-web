import React from "react";
import type { QueueJob } from "@/types/jobs";
import JobStatus from "./JobStatus";
import QueueInfo from "./QueueInfo";
import ToastFooter from "./ToastFooter";

interface ToastBodyProps {
  currentJob?: QueueJob;
  queueLength: number;
  isJobCompleted: boolean;
}

const ToastBody: React.FC<ToastBodyProps> = ({
  currentJob,
  queueLength,
  isJobCompleted,
}) => {
  if (!currentJob) {
    return null;
  }

  return (
    <div className="toast-body">
      <JobStatus job={currentJob} />
      
      {queueLength > 0 && <QueueInfo queueLength={queueLength} />}
      
      {isJobCompleted && (
        <ToastFooter queueLength={queueLength} />
      )}
    </div>
  );
};

export default ToastBody;