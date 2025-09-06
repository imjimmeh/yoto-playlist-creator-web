import { useState, useCallback, useMemo } from "react";
import type { YotoPlaylistChapter, TrackWithUploadStatus } from "@/types";
import { useServices } from "../contexts/useServices";
import { logger } from "@/services/Logger";

export const useFileUploads = (
  authToken: string | undefined,
  onUploadComplete: (chapter: YotoPlaylistChapter) => void
) => {
  const [tracks, setTracks] = useState<TrackWithUploadStatus[]>([]);
  const { yotoSongUploadService } = useServices();

  const isUploading = useMemo(() => {
    return tracks.some(
      (t) => t.uploadStatus === "uploading" || t.uploadStatus === "transcoding"
    );
  }, [tracks]);

  const updateTrackProgress = useCallback(
    (trackKey: string, progress: number) => {
      setTracks((prev) =>
        prev.map((t) =>
          t.key === trackKey ? { ...t, uploadProgress: progress } : t
        )
      );
    },
    []
  );

  const updateTrackStatus = useCallback(
    (
      trackKey: string,
      status: TrackWithUploadStatus["uploadStatus"],
      updates?: Partial<TrackWithUploadStatus>
    ) => {
      setTracks((prev) => {
        let newTracks = [...prev];
        const trackIndex = newTracks.findIndex((t) => t.key === trackKey);
        if (trackIndex === -1) return prev; // Should not happen

        if (status === "completed") {
          const completedTrack = {
            ...newTracks[trackIndex],
            ...updates,
            uploadStatus: status,
          };

          // Only call onUploadComplete if this track wasn't already completed
          if (newTracks[trackIndex].uploadStatus !== "completed") {
            const chapter: YotoPlaylistChapter = {
              key: completedTrack.key,
              title: completedTrack.title,
              tracks: completedTrack.tracks,
            };
            console.log("Debug - calling onUploadComplete for:", chapter.key, chapter.title);
            onUploadComplete(chapter);
          }

          // Remove the track from the uploading state immediately after calling onUploadComplete
          console.log("Debug - removing completed track from uploads:", trackKey, completedTrack.title);
          newTracks.splice(trackIndex, 1);
        } else {
          newTracks[trackIndex] = {
            ...newTracks[trackIndex],
            ...updates,
            uploadStatus: status,
          };
        }

        return newTracks;
      });
    },
    [onUploadComplete]
  );

  const pollTranscodingStatus = useCallback(
    async (
      trackKey: string,
      uploadId: string,
      fileName: string,
      fileSize: number
    ) => {
      if (!authToken) return;

      const pollInterval = setInterval(async () => {
        try {
          const status = await yotoSongUploadService.checkTranscodingStatus(
            uploadId,
            false
          );

          if (status.isComplete && status.transcode) {
            clearInterval(pollInterval);
            const trackTitle = status.transcode.transcodedInfo?.metadata?.title || 
                             status.transcode.uploadInfo?.metadata?.title || 
                             fileName.replace(/\.mp3$/i, "");
            const trackArtist = status.transcode.transcodedInfo?.metadata?.artist || 
                              status.transcode.uploadInfo?.metadata?.artist;
            
            const finalChapter: Partial<TrackWithUploadStatus> = {
              uploadProgress: 100,
              title: trackTitle,
              artist: trackArtist,
              tracks: [
                {
                  key: "01",
                  title: trackTitle,
                  trackUrl: `yoto:#${status.transcode.transcodedSha256}`,
                  type: "audio" as const,
                  format: "mp3" as const,
                  duration: status.transcode.transcodedInfo?.duration || status.transcode.uploadInfo?.duration || 0,
                  fileSize: fileSize,
                },
              ],
            };
            updateTrackStatus(trackKey, "completed", finalChapter);
          } else if (!status.isComplete) {
            updateTrackStatus(trackKey, "transcoding", { uploadProgress: 75 });
          } else {
            // Is complete but something went wrong with transcode object
            throw new Error("Transcoding finished but no data was returned.");
          }
        } catch (error) {
          clearInterval(pollInterval);
          logger.error(
            `Error polling transcoding status for ${fileName}:`,
            error
          );
          updateTrackStatus(trackKey, "failed", {
            uploadError: "Transcoding failed",
          });
        }
      }, 2000);

      // Clear interval after 5 minutes to prevent infinite polling
      setTimeout(() => {
        clearInterval(pollInterval);
        // Check if still transcoding after timeout
        const track = tracks.find((t) => t.key === trackKey);
        if (track && track.uploadStatus === "transcoding") {
          updateTrackStatus(trackKey, "failed", {
            uploadError: "Transcoding timed out.",
          });
        }
      }, 300000);
    },
    [authToken, yotoSongUploadService, updateTrackStatus, tracks]
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!authToken) {
        logger.error("No auth token available for upload");
        return;
      }

      const initialTracks: TrackWithUploadStatus[] = files.map(
        (file, index) => ({
          key: `temp-${Date.now()}-${index}`,
          title: file.name.replace(/\.mp3$/i, ""),
          uploadStatus: "uploading",
          uploadProgress: 0,
          originalFile: file,
          tracks: [
            {
              key: "01",
              title: file.name.replace(/\.mp3$/i, ""),
              trackUrl: "", // Will be set after transcoding
              type: "audio" as const,
              format: "mp3" as const,
              duration: 0,
              fileSize: file.size,
            },
          ],
        })
      );

      setTracks((prev) => [...prev, ...initialTracks]);

      for (const track of initialTracks) {
        try {
          const file = track.originalFile!;
          updateTrackProgress(track.key, 10);

          const uploadResult = await yotoSongUploadService.uploadSong(
            file,
            false, // loudnorm
            false // don't wait for completion
          );

          updateTrackProgress(track.key, 50);

          if (uploadResult.isTranscodingComplete && uploadResult.transcode) {
            const trackTitle = uploadResult.transcode.transcodedInfo?.metadata?.title || 
                             uploadResult.transcode.uploadInfo?.metadata?.title || 
                             track.title;
            const trackArtist = uploadResult.transcode.transcodedInfo?.metadata?.artist || 
                              uploadResult.transcode.uploadInfo?.metadata?.artist;
            
            const finalChapter: Partial<TrackWithUploadStatus> = {
              uploadProgress: 100,
              title: trackTitle,
              artist: trackArtist,
              tracks: [
                {
                  key: "01",
                  title: trackTitle,
                  trackUrl: `yoto:#${uploadResult.transcode.transcodedSha256}`,
                  type: "audio" as const,
                  format: "mp3" as const,
                  duration: uploadResult.transcode.transcodedInfo?.duration || uploadResult.transcode.uploadInfo?.duration || 0,
                  fileSize: file.size,
                },
              ],
            };
            updateTrackStatus(track.key, "completed", finalChapter);
          } else if (uploadResult.uploadId) {
            updateTrackStatus(track.key, "transcoding", { uploadProgress: 75 });
            pollTranscodingStatus(
              track.key,
              uploadResult.uploadId,
              file.name,
              file.size
            );
          } else {
            throw new Error("Upload did not return a valid state.");
          }
        } catch (error) {
          logger.error(`Failed to upload ${track.originalFile?.name}:`, error);
          updateTrackStatus(track.key, "failed", {
            uploadError:
              error instanceof Error ? error.message : "Upload failed",
          });
        }
      }
    },
    [
      authToken,
      yotoSongUploadService,
      updateTrackProgress,
      updateTrackStatus,
      pollTranscodingStatus,
    ]
  );

  const removeTrack = useCallback((trackKey: string) => {
    setTracks((prev) => prev.filter((t) => t.key !== trackKey));
  }, []);

  const clearTracks = useCallback(() => {
    setTracks([]);
  }, []);

  return {
    tracks,
    uploadFiles,
    removeTrack,
    clearTracks,
    isUploading,
  };
};
