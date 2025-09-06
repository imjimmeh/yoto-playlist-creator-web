import { v4 as uuidv4 } from "uuid";

interface JobFactory {
  createJob(
    jobPayload: JobCreationPayload,
    authToken: string,
    aiConfig?: AiConfig
  ): QueueJob;
}

class RegenerateIconsJobFactory implements JobFactory {
  createJob(
    jobPayload: JobCreationPayload,
    authToken: string,
    aiConfig?: AiConfig
  ): RegenerateIconsJob {
    if (jobPayload.type !== "regenerate-icons") {
      throw new Error("Invalid job type for RegenerateIconsJobFactory");
    }

    return {
      type: "regenerate-icons",
      id: uuidv4(),
      playlistTitle: jobPayload.playlistTitle,
      payload: {
        authToken,
        playlistTitle: jobPayload.playlistTitle,
        playlistId: jobPayload.playlistId,
        aiConfig: aiConfig || { apiKey: "", baseUrl: "" },
      },
      status: "queued",
      progress: { status: "Queued" },
      createdAt: Date.now(),
    } as RegenerateIconsJob;
  }
}

class CreatePlaylistJobFactory implements JobFactory {
  createJob(
    jobPayload: JobCreationPayload,
    authToken: string,
    aiConfig?: AiConfig
  ): CreatePlaylistJob {
    if (jobPayload.type !== "create-playlist") {
      throw new Error("Invalid job type for CreatePlaylistJobFactory");
    }

    return {
      type: "create-playlist",
      id: uuidv4(),
      playlistTitle: jobPayload.playlistTitle,
      payload: {
        authToken,
        playlistTitle: jobPayload.playlistTitle,
        sources: [],
        topXIcons: 100,
        aiConfig: aiConfig || { apiKey: "", baseUrl: "" },
        coverImagePath: undefined,
        files: jobPayload.files,
      },
      status: "queued",
      progress: { status: "Queued" },
      createdAt: Date.now(),
    } as CreatePlaylistJob;
  }
}

class UpdatePlaylistJobFactory implements JobFactory {
  createJob(
    jobPayload: JobCreationPayload,
    authToken: string,
    aiConfig?: AiConfig
  ): UpdatePlaylistJob {
    if (jobPayload.type !== "update-playlist") {
      throw new Error("Invalid job type for UpdatePlaylistJobFactory");
    }

    return {
      type: "update-playlist",
      id: uuidv4(),
      playlistTitle: jobPayload.playlistTitle,
      payload: {
        authToken,
        playlistTitle: jobPayload.playlistTitle,
        sources: [],
        topXIcons: 100,
        aiConfig: aiConfig || { apiKey: "", baseUrl: "" },
        coverImagePath: undefined,
        files: jobPayload.files,
        cardId: jobPayload.cardId,
      },
      status: "queued",
      progress: { status: "Queued" },
      createdAt: Date.now(),
    } as UpdatePlaylistJob;
  }
}
import { YotoIconService } from "./YotoIconService";
import { YotoPlaylistService } from "./YotoPlaylistService";
import { YotoSongUploadService } from "./YotoSongUploadService";
import { HybridIconMapper, type AiConfig } from "./HybridIconMapper";
import { logger } from "./Logger";
import type {
  JobProgress,
  QueueJob,
  RegenerateIconsJob,
  JobQueueStatus,
  JobQueueEvents,
  JobCreationPayload,
  CreatePlaylistJob,
  UpdatePlaylistJob,
  JobType,
} from "../types/jobs";
import type { AuthToken } from "../types/app";

// Re-export types from ../types/jobs.ts for backward compatibility
export type {
  QueueJob as QueueJobType,
  RegenerateIconsJob,
  JobQueueStatus,
} from "../types/jobs";

export class JobQueueService {
  private readonly queue: QueueJob[] = [];
  private history: QueueJob[] = [];
  private isProcessing = false;
  private currentJob: QueueJob | null = null;
  private readonly yotoIconService: YotoIconService;
  private readonly yotoPlaylistService: YotoPlaylistService;
  private readonly yotoSongUploadService: YotoSongUploadService;
  private readonly jobFactories: Map<string, JobFactory> = new Map();

  private readonly listeners: Map<string, unknown[]> = new Map();

  constructor(
    yotoIconService: YotoIconService,
    yotoPlaylistService: YotoPlaylistService,
    yotoSongUploadService: YotoSongUploadService
  ) {
    this.yotoIconService = yotoIconService;
    this.yotoPlaylistService = yotoPlaylistService;
    this.yotoSongUploadService = yotoSongUploadService;
    
    this.initializeJobFactories();
    this.loadState();
  }

  private initializeJobFactories(): void {
    this.jobFactories.set("regenerate-icons", new RegenerateIconsJobFactory());
    this.jobFactories.set("create-playlist", new CreatePlaylistJobFactory());
    this.jobFactories.set("update-playlist", new UpdatePlaylistJobFactory());
  }

  private emit<E extends keyof JobQueueEvents>(
    event: E,
    ...args: Parameters<JobQueueEvents[E]>
  ): void {
    const eventListeners = this.listeners.get(event) || [];
    logger.info(
      `JobQueueService emitting '${event}' to ${eventListeners.length} listeners`,
      event === "job-completed" ? { job: args[0] } : undefined
    );
    for (const listener of eventListeners) {
      (listener as (...args: unknown[]) => void)(...args);
    }
  }

  on<E extends keyof JobQueueEvents>(
    event: E,
    listener: JobQueueEvents[E]
  ): () => void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.push(listener as unknown);
    this.listeners.set(event, eventListeners);
    logger.info(
      `JobQueueService: Added listener for '${event}', total listeners: ${eventListeners.length}`
    );

    return () => {
      const currentListeners = this.listeners.get(event) || [];
      const index = currentListeners.indexOf(listener as unknown);
      if (index > -1) {
        currentListeners.splice(index, 1);
        logger.info(
          `JobQueueService: Removed listener for '${event}', remaining listeners: ${currentListeners.length}`
        );
      }
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem("jobQueue-history", JSON.stringify(this.history));
      // We don't save the active queue, as it holds non-serializable File objects
    } catch (error) {
      logger.error(`Failed to save job queue state: ${error}`);
    }
  }

  private loadState(): void {
    try {
      const historyData = localStorage.getItem("jobQueue-history");
      if (historyData) {
        this.history = JSON.parse(historyData);
      }
    } catch (error) {
      logger.error(`Failed to load job queue state: ${error}`);
    }
  }

  addJob(
    jobPayload: JobCreationPayload,
    authToken: AuthToken,
    aiConfig?: AiConfig
  ): QueueJob {
    const factory = this.jobFactories.get(jobPayload.type);
    
    if (!factory) {
      throw new Error(`Unsupported job type: ${jobPayload.type}`);
    }

    const job = factory.createJob(jobPayload, authToken, aiConfig);

    this.queue.push(job);
    logger.info(`Job added to queue: ${job.id}`);
    logger.info("Queue length after adding job:", this.queue.length);
    this.emit("queue-status", this.getStatus());
    this.processQueue();
    return job;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.currentJob = this.queue.shift()!;
    this.currentJob.status = "processing";
    logger.info(`Processing job: ${this.currentJob.id}`);
    logger.info(
      "Job moved to currentJob, queue length now:",
      this.queue.length
    );

    this.emit("queue-status", this.getStatus());

    // Small delay to ensure UI can update before job processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.emit("job-progress", {
      jobId: this.currentJob.id,
      progress: { status: "Starting job..." },
    });

    try {
      if (this.currentJob.type === "regenerate-icons") {
        const payload = this.currentJob.payload!;
        const { playlistId, playlistTitle, aiConfig } = payload;

        this.emit("job-progress", {
          jobId: this.currentJob.id,
          progress: { status: `Regenerating icons for ${playlistTitle}...` },
        });

        const icons = await this.yotoIconService.getIcons();
        const playlist = await this.yotoPlaylistService.getPlaylistById(
          playlistId
        );

        // Create a temporary icon mapper with the job's AI config
        const iconMapper = new HybridIconMapper(this.yotoPlaylistService.yotoClient, aiConfig);
        const mappedCard = await iconMapper.mapIcons(
          playlist,
          icons,
          100, // topXIcons
          (progress) => {
            if (this.currentJob) {
              this.currentJob.progress = progress;
              this.emit("job-progress", {
                jobId: this.currentJob.id,
                progress,
              });
              
              // Emit track processing event when starting a track
              if (progress.fileName && progress.current) {
                this.emit("track-icon-processing", {
                  jobId: this.currentJob.id,
                  playlistId: playlistId,
                  trackKey: String(progress.current - 1).padStart(2, "0"), // Convert to chapter key format
                  trackTitle: progress.fileName.replace(/"/g, '') // Remove quotes from fileName
                });
              }
            }
          },
          // Save callback - saves playlist after each icon assignment
          async (updatedCard, trackInfo) => {
            await this.yotoPlaylistService.savePlaylist(updatedCard);
            
            // Emit specific track icon update event
            if (this.currentJob && trackInfo) {
              this.emit("track-icon-updated", {
                jobId: this.currentJob.id,
                playlistId: playlistId,
                trackKey: trackInfo.chapterKey,
                iconRef: trackInfo.iconRef
              });
            }
            
            // Keep the general playlist update event for backward compatibility
            if (this.currentJob) {
              this.emit("playlist-updated", {
                jobId: this.currentJob.id,
                playlistId: playlistId,
                jobType: this.currentJob.type
              });
            }
          }
        );

        // Final save to ensure everything is persisted (this may be redundant now but ensures consistency)
        await this.yotoPlaylistService.savePlaylist(mappedCard);
        this.currentJob.result = { success: true };
      } else if (this.currentJob.type === "create-playlist" || this.currentJob.type === "update-playlist") {
        await this.processPlaylistJob(this.currentJob as CreatePlaylistJob | UpdatePlaylistJob);
      } else {
        throw new Error("Unsupported job type in process queue");
      }

      this.currentJob.status = "completed";
      logger.info(`Job completed: ${this.currentJob.id}`, {
        type: this.currentJob.type,
        payload: this.currentJob.payload
      });
      this.emit("job-completed", this.currentJob);
    } catch (error: unknown) {
      if (this.currentJob) {
        this.currentJob.status = "failed";
        this.currentJob.error =
          error instanceof Error ? error.message : String(error);
        this.emit("job-failed", this.currentJob);
        logger.error(`Job failed: ${this.currentJob.id} - ${error}`);
      }
    }

    if (this.currentJob) {
      this.history.unshift(this.currentJob); // Add to start of history
      if (this.history.length > 50) {
        this.history.pop(); // Limit history size
      }
    }

    this.currentJob = null;
    this.isProcessing = false;
    this.saveState();
    logger.info(
      "Job completed, currentJob set to null, isProcessing:",
      this.isProcessing
    );
    this.emit("queue-status", this.getStatus());

    // Process next job
    this.processQueue();
  }

  private async processPlaylistJob(job: CreatePlaylistJob | UpdatePlaylistJob): Promise<void> {
    const payload = job.payload!;
    const { files, playlistTitle } = payload;

    this.emitJobProgress(job.id, `Processing ${playlistTitle}...`, 0, files.length + 1);

    const uploadedChapters = await this.uploadFilesToChapters(job.id, files);
    const result = await this.savePlaylistWithChapters(job, uploadedChapters);
    
    if (job.type === "create-playlist") {
      await this.queueIconGenerationIfNeeded(result, payload);
    }

    job.result = { success: true, data: result };
  }

  private async uploadFilesToChapters(jobId: string, files: File[]): Promise<any[]> {
    const uploadedChapters: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.emitJobProgress(jobId, `Uploading ${file.name}...`, i + 1, files.length + 1, file.name);
      
      const chapter = await this.uploadSingleFileToChapter(file, i);
      logger.info(`Created chapter ${i + 1}:`, JSON.stringify(chapter, null, 2));
      uploadedChapters.push(chapter);
    }
    
    logger.info(`Total uploaded chapters: ${uploadedChapters.length}`);
    return uploadedChapters;
  }

  private async uploadSingleFileToChapter(file: File, index: number): Promise<any> {
    try {
      const uploadResult = await this.yotoSongUploadService.uploadSong(
        file,
        false, // loudnorm
        true   // wait for completion
      );

      if (!uploadResult.isTranscodingComplete || !uploadResult.transcode) {
        throw new Error(`Failed to transcode ${file.name}`);
      }

      return this.createChapterFromUpload(file, uploadResult, index);
    } catch (error) {
      throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private createChapterFromUpload(file: File, uploadResult: any, index: number): any {
    const title = uploadResult.transcode.metadata?.title || file.name.replace(/\.mp3$/i, "");
    
    return {
      key: String(index).padStart(2, "0"),
      title,
      tracks: [
        {
          key: "01",
          title,
          trackUrl: `yoto:#${uploadResult.transcode.transcodedSha256}`,
          type: "audio" as const,
          format: "mp3" as const,
          duration: uploadResult.transcode.metadata?.duration || 0,
          fileSize: file.size,
        },
      ],
    };
  }

  private async savePlaylistWithChapters(
    job: CreatePlaylistJob | UpdatePlaylistJob, 
    chapters: any[]
  ): Promise<any> {
    const payload = job.payload!;
    const statusText = job.type === "create-playlist" ? "Creating playlist..." : "Updating playlist...";
    
    this.emitJobProgress(job.id, statusText, payload.files.length + 1, payload.files.length + 1);

    const playlistCard = this.buildPlaylistCard(job, chapters);
    return await this.yotoPlaylistService.savePlaylist({ card: playlistCard });
  }

  private buildPlaylistCard(job: CreatePlaylistJob | UpdatePlaylistJob, chapters: any[]): any {
    const payload = job.payload!;
    
    const playlistCard = {
      cardId: job.type === "update-playlist" ? (payload as any).cardId : undefined,
      title: payload.playlistTitle,
      content: { chapters },
      metadata: {
        cover: {
          imageL: payload.coverImagePath || "https://picsum.photos/400/400",
        },
      },
    };
    
    logger.info(`Building playlist card with ${chapters.length} chapters:`, JSON.stringify(playlistCard, null, 2));
    
    return playlistCard;
  }

  private async queueIconGenerationIfNeeded(result: any, payload: any): Promise<void> {
    if (result.isUpdate || !result.data) return;

    const newCardId = this.extractCardIdFromResult(result.data);
    if (!newCardId || !payload.aiConfig) return;

    logger.info(`Playlist created with ID: ${newCardId}, queuing AI icon generation...`);
    
    try {
      this.addJob(
        {
          type: "regenerate-icons",
          playlistId: newCardId,
          playlistTitle: payload.playlistTitle,
        },
        payload.authToken,
        payload.aiConfig
      );
      logger.info("AI icon generation job queued successfully");
    } catch (iconError) {
      logger.error("Failed to queue icon generation job:", iconError);
    }
  }

  private extractCardIdFromResult(data: any): string | null {
    return data.cardId || data.card?.cardId || data.id || null;
  }

  private emitJobProgress(
    jobId: string, 
    status: string, 
    current: number, 
    total: number, 
    fileName?: string
  ): void {
    this.emit("job-progress", {
      jobId,
      progress: { status, current, total, fileName },
    });
  }

  getStatus(): JobQueueStatus {
    const status = {
      isProcessing: this.isProcessing,
      queueLength: this.queue.length,
      currentJob: this.currentJob,
    };
    logger.info("JobQueueService.getStatus() called:", status);
    return status;
  }

  getJobHistory(): QueueJob[] {
    return this.history;
  }

  clearJobHistory(): void {
    this.history = [];
    this.saveState();
  }

  getQueue(): QueueJob[] {
    return this.queue;
  }

  cancelJob(jobId: string): boolean {
    const jobIndex = this.queue.findIndex((job) => job.id === jobId);
    if (jobIndex > -1) {
      this.queue.splice(jobIndex, 1);
      this.emit("queue-status", this.getStatus());
      logger.info(`Job canceled from queue: ${jobId}`);
      return true;
    }
    // Cannot cancel a job that is already processing
    return false;
  }

  // Convenience methods for easier usage
  onQueueStatus(listener: (status: JobQueueStatus) => void): () => void {
    return this.on("queue-status", listener);
  }

  onJobProgress(
    listener: (progress: { jobId: string; progress: JobProgress }) => void
  ): () => void {
    return this.on("job-progress", listener);
  }

  onJobCompleted(listener: (job: QueueJob) => void): () => void {
    return this.on("job-completed", listener);
  }

  onJobFailed(listener: (job: QueueJob) => void): () => void {
    return this.on("job-failed", listener);
  }

  onPlaylistUpdated(listener: (data: { jobId: string; playlistId: string; jobType: JobType }) => void): () => void {
    return this.on("playlist-updated", listener);
  }

  onTrackIconProcessing(listener: (data: { jobId: string; playlistId: string; trackKey: string; trackTitle: string }) => void): () => void {
    return this.on("track-icon-processing", listener);
  }

  onTrackIconUpdated(listener: (data: { jobId: string; playlistId: string; trackKey: string; iconRef: string }) => void): () => void {
    return this.on("track-icon-updated", listener);
  }
}
