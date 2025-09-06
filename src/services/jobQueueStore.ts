import { JobQueueService } from "./JobQueueService";
import { YotoIconService } from "./YotoIconService";
import { YotoPlaylistService } from "./YotoPlaylistService";
import { YotoSongUploadService } from "./YotoSongUploadService";
import { yotoHttpClient } from "./YotoHttpClient"; // Import the singleton client
import type { JobQueueStatus } from "../types/jobs";

// --- 1. Instantiate Singleton Services ---
// These services are created once and live for the entire session.
const yotoPlaylistService = new YotoPlaylistService(yotoHttpClient);
const yotoIconService = new YotoIconService(yotoHttpClient);
const yotoSongUploadService = new YotoSongUploadService(yotoHttpClient);

export const jobQueueService = new JobQueueService(
  yotoIconService,
  yotoPlaylistService,
  yotoSongUploadService
);

// --- 2. Create the External Store ---
// This object manages the state and notifies subscribers.
let currentState: JobQueueStatus = jobQueueService.getStatus();
const listeners = new Set<() => void>();

const store = {
  /**
   * Components call this to subscribe to changes.
   * It returns an `unsubscribe` function.
   */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * Components call this to get the current state snapshot.
   */
  getSnapshot(): JobQueueStatus {
    return currentState;
  },
};

// --- 3. Connect the Service to the Store ---
// When the service emits an event, we update the state and notify all listeners.
jobQueueService.onQueueStatus((status) => {
  currentState = status;
  listeners.forEach((listener) => listener());
});

// Make sure progress updates also trigger a notification
jobQueueService.onJobProgress((progressData) => {
    if (currentState.currentJob?.id === progressData.jobId) {
        const updatedJob = { ...currentState.currentJob, progress: progressData.progress };
        currentState = { ...currentState, currentJob: updatedJob };
        listeners.forEach((listener) => listener());
    }
});

// Listen for job completion events to trigger UI updates
jobQueueService.onJobCompleted((_completedJob) => {
    // Force a full state refresh when a job completes
    currentState = jobQueueService.getStatus();
    listeners.forEach((listener) => listener());
});

// Listen for job failure events to trigger UI updates  
jobQueueService.onJobFailed((_failedJob) => {
    // Force a full state refresh when a job fails
    currentState = jobQueueService.getStatus();
    listeners.forEach((listener) => listener());
});

// You can export the store directly, but it's cleaner to export a hook.
export default store;
