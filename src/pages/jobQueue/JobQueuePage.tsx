import React, { useState } from "react";
import { useJobQueueStore } from "@/hooks/useJobQueueStore";
import { useServices } from "@/contexts/useServices";
import CurrentJobSection from "./components/CurrentJobSection";
import PendingJobsList from "./components/PendingJobsList";
import JobHistorySection from "./components/JobHistorySection";
import TabNavigation from "./components/TabNavigation";
import PageHero from "../../components/PageHero";
import type { JobHistoryItem } from "@/types/jobs";
import "./JobQueuePage.css";

const JobQueuePage: React.FC = () => {
  const { jobQueueService } = useServices();
  const queueStatus = useJobQueueStore();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const currentJob = queueStatus.currentJob;
  const pendingJobs = jobQueueService.getQueue();
  const jobHistory = jobQueueService.getJobHistory();

  const cancelJob = (jobId: string) => {
    jobQueueService.cancelJob(jobId);
  };

  const clearJobHistory = () => {
    jobQueueService.clearJobHistory();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "pending" | "history");
  };

  const adaptedCurrentJob = currentJob;
  const adaptedPendingJobs = pendingJobs;
  const adaptedJobHistory = jobHistory.map((job) => ({
    id: job.id,
    playlistTitle: job.playlistTitle,
    timestamp: job.createdAt,
    status: job.status as JobHistoryItem["status"],
    error: job.error,
    type: job.type,
  }));

  return (
    <div className="job-queue-page">
      <PageHero
        title="Job Queue & History"
        description="View your playlist creation queue and history"
      />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingCount={pendingJobs.length + (currentJob ? 1 : 0)}
        historyCount={jobHistory.length}
      />

      <div className="tab-content">
        {activeTab === "pending" && (
          <div className="pending-section">
            {adaptedCurrentJob && (
              <CurrentJobSection
                currentJob={adaptedCurrentJob}
                onCancelJob={cancelJob}
              />
            )}

            {pendingJobs.length > 0 ? (
              <PendingJobsList
                pendingJobs={adaptedPendingJobs}
                onCancelJob={cancelJob}
              />
            ) : !currentJob && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No Pending Jobs</h3>
                <p>
                  Playlist creation jobs will appear here when added to the
                  queue.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <JobHistorySection
            jobHistory={adaptedJobHistory}
            onClearHistory={clearJobHistory}
          />
        )}
      </div>
    </div>
  );
};

export default JobQueuePage;