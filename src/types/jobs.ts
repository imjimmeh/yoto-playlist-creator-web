import type { PlaylistSource, AiConfig } from "./app";

// Unified Job Progress interface
export interface JobProgress {
  status: string;
  total?: number;
  current?: number;
  done?: boolean;
  fileName?: string;
  success?: boolean;
}

// Unified Job Status types
export type JobStatusType = "current" | "pending" | "completed" | "failed" | "cancelled" | "queued" | "processing";

// Job creation payload types
export type JobCreationPayload =
  | ({ type: "create-playlist"; files: File[]; playlistTitle: string })
  | ({ type: "update-playlist"; files: File[]; playlistTitle: string; cardId: string })
  | ({ type: "regenerate-icons"; playlistId: string; playlistTitle: string });

// Standardized Job Types - Using consistent naming throughout the application
export type JobType = "create-playlist" | "update-playlist" | "regenerate-icons";

// Base payload interfaces
export interface BaseJobPayload {
  authToken: string; // AuthToken type
  playlistTitle: string;
}

export interface CreatePlaylistPayload extends BaseJobPayload {
  sources: PlaylistSource[];
  topXIcons: number;
  aiConfig: AiConfig;
  coverImagePath?: string;
  files: File[];
}

export interface RegenerateIconsPayload extends BaseJobPayload {
  playlistId: string;
  aiConfig: AiConfig;
}

// Base Job interface with generic payload support
export interface Job<TPayload = Record<string, unknown>> {
  id: string;
  playlistTitle: string;
  progress: JobProgress;
  type: JobType;
  status: JobStatusType;
  payload?: TPayload;
  result?: unknown;
  error?: string;
  createdAt: number;
}

// Typed job interfaces using generic Job
export type CreatePlaylistJob = Job<CreatePlaylistPayload> & {
  type: "create-playlist";
};

export type UpdatePlaylistJob = Job<CreatePlaylistPayload> & {
  type: "update-playlist";
};

export type RegenerateIconsJob = Job<RegenerateIconsPayload> & {
  type: "regenerate-icons";
};

export type QueueJob = CreatePlaylistJob | UpdatePlaylistJob | RegenerateIconsJob;

// Job Queue Status
export interface JobQueueStatus {
  isProcessing: boolean;
  queueLength: number;
  currentJob: QueueJob | null;
}

// Job Queue Events
export type JobQueueEvents = {
  "queue-status": (status: JobQueueStatus) => void;
  "job-progress": (progress: { jobId: string; progress: JobProgress }) => void;
  "job-completed": (job: QueueJob) => void;
  "job-failed": (job: QueueJob) => void;
  "playlist-updated": (data: { jobId: string; playlistId: string; jobType: JobType }) => void;
  "track-icon-processing": (data: { jobId: string; playlistId: string; trackKey: string; trackTitle: string }) => void;
  "track-icon-updated": (data: { jobId: string; playlistId: string; trackKey: string; iconRef: string }) => void;
};

// Job History Item
export type JobStatus = Extract<JobStatusType, "completed" | "failed" | "cancelled">;

export interface JobHistoryItem {
  id: string;
  playlistTitle: string;
  timestamp: number;
  status: JobStatus;
  error?: string;
  type: JobType;
}

export type JobStatusInfo<TJob = Job> = {
  type: Extract<JobStatusType, "current" | "pending">;
  job: TJob;
};