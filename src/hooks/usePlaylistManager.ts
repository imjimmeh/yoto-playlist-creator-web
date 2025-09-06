import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useServices } from "@/contexts/useServices";
import { useSettings } from "./useSettings";
import { useFileUploads } from "./useFileUploads";
import type { YotoPlaylistCard, YotoPlaylistChapter } from "@/types";
import { pickRandomCoverUrl } from "@/utils/random-cover";
import { logger } from "@/services/Logger";

const createBlankPlaylist = (): YotoPlaylistCard => ({
  cardId: "",
  title: "New Playlist",
  content: {
    chapters: [],
  },
  metadata: {
    cover: {
      imageL: pickRandomCoverUrl(),
    },
    description: "",
  },
});

const extractCardIdFromResult = (data: any): string | null => {
  return data.cardId || data.card?.cardId || data.id || null;
};

const extractPlaybackOption = (
  chapter: YotoPlaylistChapter
): "continue" | "stop" | "repeat" => {
  const firstTrack = chapter.tracks?.[0];
  const cmd = firstTrack?.events?.onEnd?.cmd;

  switch (cmd) {
    case "stop":
      return "stop";
    case "repeat":
      return "repeat";
    default:
      return "continue";
  }
};

export const usePlaylistManager = (playlistId?: string) => {
  const navigate = useNavigate();
  const {
    yotoPlaylistService,
    yotoCoverImageService,
    jobQueueService,
    isReady: servicesReady,
  } = useServices();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const [playlist, setPlaylist] = useState<YotoPlaylistCard | null>(null);
  const [originalPlaylist, setOriginalPlaylist] =
    useState<YotoPlaylistCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const onUploadComplete = useCallback((newChapter: YotoPlaylistChapter) => {
    setPlaylist((prev) => {
      if (!prev) return null;

      const existingChapters = prev.content?.chapters || [];

      // Check if this chapter is already in the playlist to prevent duplicates
      const isDuplicate = existingChapters.some(
        (chapter) =>
          chapter.tracks?.[0]?.trackUrl === newChapter.tracks?.[0]?.trackUrl ||
          chapter.title === newChapter.title
      );

      if (isDuplicate) {
        console.log("Debug - preventing duplicate chapter:", newChapter.title);
        return prev;
      }

      // Generate the next sequential chapter key
      const nextChapterIndex = existingChapters.length;
      const chapterKey = String(nextChapterIndex).padStart(2, "0");

      // Create the chapter with the proper key
      const chapterToAdd: YotoPlaylistChapter = {
        ...newChapter,
        key: chapterKey,
      };

      console.log(
        "Debug - adding new chapter to playlist:",
        chapterToAdd.key,
        chapterToAdd.title
      );
      return {
        ...prev,
        content: {
          ...prev.content,
          chapters: [...existingChapters, chapterToAdd],
        },
      };
    });
  }, []);

  const {
    tracks,
    uploadFiles,
    removeTrack: removeUploadedTrack,
    isUploading,
  } = useFileUploads(settings.yotoAuthToken, onUploadComplete);

  const fetchOrInitPlaylist = useCallback(async () => {
    // Don't start fetching until settings have finished loading AND services are ready
    if (isSettingsLoading || !servicesReady) {
      return;
    }

    setIsLoading(true);
    setError(null);
    if (playlistId && playlistId !== "create") {
      try {
        const fetchedPlaylist = (await yotoPlaylistService.getPlaylistById(
          playlistId
        )) as { card: YotoPlaylistCard };

        // Add playback options to chapters based on existing events
        const playlistWithOptions = {
          ...fetchedPlaylist.card,
          content: {
            ...fetchedPlaylist.card.content,
            chapters:
              fetchedPlaylist.card.content?.chapters?.map((chapter) => ({
                ...chapter,
                playbackOption: extractPlaybackOption(chapter),
              })) || [],
          },
        };

        setPlaylist(playlistWithOptions);
        setOriginalPlaylist(playlistWithOptions);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch playlist.");
        logger.error("Failed to fetch playlist:", e);
      }
    } else {
      const blankPlaylist = createBlankPlaylist();
      setPlaylist(blankPlaylist);
      setOriginalPlaylist(blankPlaylist);
    }
    setIsLoading(false);
  }, [
    playlistId,
    settings.yotoAuthToken,
    yotoPlaylistService,
    isSettingsLoading,
    servicesReady,
  ]);

  useEffect(() => {
    fetchOrInitPlaylist();
  }, [fetchOrInitPlaylist]);

  // Listen for job completion events to refresh playlist data
  useEffect(() => {
    if (!jobQueueService || !playlistId || playlistId === "create") {
      return;
    }

    const handleJobCompleted = (job: any) => {
      logger.info(`Job completed event received:`, {
        jobType: job.type,
        jobPayloadPlaylistId: job.payload?.playlistId,
        currentPlaylistId: playlistId,
        shouldRefresh: job.type === "regenerate-icons" && job.payload?.playlistId === playlistId
      });
      
      // Only refresh if this is an icon regeneration job for our playlist
      if (
        job.type === "regenerate-icons" &&
        job.payload?.playlistId === playlistId
      ) {
        logger.info(
          `Icon regeneration completed for playlist ${playlistId}, refreshing data...`
        );
        fetchOrInitPlaylist();
      }
    };

    const handleTrackIconProcessing = (data: { jobId: string; playlistId: string; trackKey: string; trackTitle: string }) => {
      logger.info(`Track icon processing event received:`, data);
      
      if (data.playlistId === playlistId) {
        // Mark the specific track as being processed
        setPlaylist((prev) => {
          if (!prev || !prev.content?.chapters) return prev;
          
          const updatedChapters = prev.content.chapters.map((chapter) => {
            if (chapter.key === data.trackKey) {
              return { ...chapter, aiProcessingStatus: "processing" as const } as any;
            }
            return chapter;
          });
          
          return {
            ...prev,
            content: {
              ...prev.content,
              chapters: updatedChapters,
            },
          };
        });
      }
    };

    const handleTrackIconUpdated = (data: { jobId: string; playlistId: string; trackKey: string; iconRef: string }) => {
      logger.info(`Track icon updated event received:`, data);
      
      if (data.playlistId === playlistId) {
        // Update the specific track's icon and mark as updating
        setPlaylist((prev) => {
          if (!prev || !prev.content?.chapters) return prev;
          
          const updatedChapters = prev.content.chapters.map((chapter) => {
            if (chapter.key === data.trackKey) {
              return { 
                ...chapter, 
                display: { 
                  ...chapter.display, 
                  icon16x16: data.iconRef 
                },
                aiProcessingStatus: "updating" as const
              } as any;
            }
            return chapter;
          });
          
          return {
            ...prev,
            content: {
              ...prev.content,
              chapters: updatedChapters,
            },
          };
        });
        
        // Clear the updating status after animation
        setTimeout(() => {
          setPlaylist((prev) => {
            if (!prev || !prev.content?.chapters) return prev;
            
            const updatedChapters = prev.content.chapters.map((chapter: any) => {
              if (chapter.key === data.trackKey) {
                const { aiProcessingStatus, ...chapterWithoutStatus } = chapter;
                return chapterWithoutStatus;
              }
              return chapter;
            });
            
            return {
              ...prev,
              content: {
                ...prev.content,
                chapters: updatedChapters,
              },
            };
          });
        }, 1000); // Clear after 1 second to allow animation to complete
      }
    };

    logger.info(`Setting up job completion listener for playlist ${playlistId}`);
    const unsubscribeJobCompleted = jobQueueService.onJobCompleted(handleJobCompleted);
    const unsubscribeTrackIconProcessing = jobQueueService.onTrackIconProcessing(handleTrackIconProcessing);
    const unsubscribeTrackIconUpdated = jobQueueService.onTrackIconUpdated(handleTrackIconUpdated);
    
    return () => {
      logger.info(`Cleaning up job completion listener for playlist ${playlistId}`);
      unsubscribeJobCompleted();
      unsubscribeTrackIconProcessing();
      unsubscribeTrackIconUpdated();
    };
  }, [jobQueueService, playlistId, fetchOrInitPlaylist]);

  const updateTitle = (newTitle: string) => {
    setPlaylist((prev) => (prev ? { ...prev, title: newTitle } : null));
  };

  const updateDescription = (newDescription: string) => {
    setPlaylist((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          description: newDescription,
        },
      };
    });
  };

  const removeTrack = (chapterKey: string) => {
    // This needs to handle both already-uploaded tracks and tracks from the original playlist
    const isNewlyUploaded = tracks.some((t) => t.key === chapterKey);
    if (isNewlyUploaded) {
      removeUploadedTrack(chapterKey);
    } else {
      setPlaylist((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          content: {
            ...prev.content,
            chapters: (prev.content?.chapters || []).filter(
              (c) => c.key !== chapterKey
            ),
          },
        };
      });
    }
  };

  const reorderChapters = (fromIndex: number, toIndex: number) => {
    setPlaylist((prev) => {
      if (!prev || !prev.content?.chapters) return prev;

      const chapters = [...prev.content.chapters];
      const [removed] = chapters.splice(fromIndex, 1);
      chapters.splice(toIndex, 0, removed);

      return {
        ...prev,
        content: {
          ...prev.content,
          chapters,
        },
      };
    });
  };

  const updateTrackIcon = (chapterKey: string, iconRef: string) => {
    setPlaylist((prev) => {
      if (!prev || !prev.content?.chapters) return prev;

      const chapters = prev.content.chapters.map((chapter) => {
        if (chapter.key === chapterKey) {
          return {
            ...chapter,
            display: {
              ...chapter.display,
              icon16x16: iconRef,
            },
            // Also update the track's display if it exists
            tracks:
              chapter.tracks?.map((track) => ({
                ...track,
                display: {
                  ...track.display,
                  icon16x16: iconRef,
                },
              })) || [],
          };
        }
        return chapter;
      });

      return {
        ...prev,
        content: {
          ...prev.content,
          chapters,
        },
      };
    });
  };

  const updateTrackTitle = (chapterKey: string, newTitle: string) => {
    setPlaylist((prev) => {
      if (!prev || !prev.content?.chapters) return prev;

      const chapters = prev.content.chapters.map((chapter) => {
        if (chapter.key === chapterKey) {
          return {
            ...chapter,
            title: newTitle,
          };
        }
        return chapter;
      });

      return {
        ...prev,
        content: {
          ...prev.content,
          chapters,
        },
      };
    });
  };

  const updatePlaybackOption = (
    chapterKey: string,
    option: "continue" | "stop" | "repeat"
  ) => {
    setPlaylist((prev) => {
      if (!prev || !prev.content?.chapters) return prev;

      const chapters = prev.content.chapters.map((chapter) => {
        if (chapter.key === chapterKey) {
          // Update the chapter's tracks to include the events field
          const updatedTracks =
            chapter.tracks?.map((track) => {
              // Remove events for "continue" option, add for others
              const events =
                option === "continue"
                  ? undefined
                  : {
                      onEnd: {
                        cmd:
                          option === "stop"
                            ? ("stop" as const)
                            : ("repeat" as const),
                      },
                    };

              return {
                ...track,
                events,
              };
            }) || [];

          return {
            ...chapter,
            tracks: updatedTracks,
            playbackOption: option, // Store for UI state
          };
        }
        return chapter;
      });

      return {
        ...prev,
        content: {
          ...prev.content,
          chapters,
        },
      };
    });
  };

  const savePlaylist = async () => {
    if (!playlist) {
      setError("Playlist data is not available.");
      return;
    }
    if (!settings.yotoAuthToken) {
      setError("Yoto auth token not configured.");
      return;
    }

    const isCreateMode = !playlist.cardId;

    // Check if we have any tracks to save (either existing chapters or tracks still uploading)
    const hasExistingChapters = (playlist.content?.chapters?.length || 0) > 0;
    const hasUploadingTracks = tracks.length > 0;

    if (!hasExistingChapters && !hasUploadingTracks) {
      setError("No tracks to save. Please upload some audio files first.");
      return;
    }

    if (hasUploadingTracks) {
      setError("Please wait for all uploads to complete before saving.");
      return;
    }

    try {
      // Use the existing playlist structure with uploaded chapters
      const result = await yotoPlaylistService.savePlaylist({ card: playlist });
      logger.info(
        `Successfully ${isCreateMode ? "created" : "updated"} playlist: ${
          playlist.title
        }`
      );

      // For newly created playlists, queue AI icon generation if we have AI config
      if (isCreateMode && result.data && settings.aiConfig?.apiKey) {
        const newCardId = extractCardIdFromResult(result.data);
        if (newCardId) {
          logger.info(
            `Playlist created with ID: ${newCardId}, queuing AI icon generation...`
          );
          try {
            jobQueueService.addJob(
              {
                type: "regenerate-icons",
                playlistId: newCardId,
                playlistTitle: playlist.title,
              },
              settings.yotoAuthToken,
              settings.aiConfig
            );
            logger.info("AI icon generation job queued successfully");
          } catch (iconError) {
            logger.error("Failed to queue icon generation job:", iconError);
            // Don't fail the whole operation if icon generation fails
          }
        }
      }

      navigate("/");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred.";
      setError(
        `Failed to ${
          isCreateMode ? "create" : "update"
        } playlist: ${errorMessage}`
      );
      logger.error(
        `Failed to ${isCreateMode ? "create" : "update"} playlist:`,
        e
      );
      return;
    }
  };

  const addFilesToUploadQueue = (files: File[]) => {
    uploadFiles(files);
  };

  const regenerateIcons = async () => {
    if (!playlist || !playlist.cardId || !settings.yotoAuthToken) {
      setError(
        "Cannot regenerate icons without a saved playlist and auth token."
      );
      return;
    }
    setIsRegenerating(true);
    try {
      jobQueueService.addJob(
        {
          type: "regenerate-icons",
          playlistId: playlist.cardId,
          playlistTitle: playlist.title,
        },
        settings.yotoAuthToken,
        settings.aiConfig
      );
      // Optionally, provide feedback to the user that the job has been queued.
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to queue icon regeneration."
      );
      logger.error("Error queueing icon regeneration:", e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const uploadCoverImage = async (imageFile: File) => {
    if (!playlist) {
      setError("Playlist data is not available.");
      return;
    }
    if (!settings.yotoAuthToken) {
      setError("Yoto auth token not configured.");
      return;
    }

    setIsUploadingCover(true);
    setError(null);

    try {
      const result = await yotoCoverImageService.uploadCoverImage(imageFile);
      logger.info("Successfully uploaded cover image:", result);

      // Update playlist with new cover
      setPlaylist((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          metadata: {
            ...prev.metadata,
            cover: {
              ...prev.metadata?.cover,
              imageL: result.mediaUrl,
            },
          },
        };
      });
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to upload cover image: ${errorMessage}`);
      logger.error("Error uploading cover image:", e);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const deletePlaylist = async () => {
    if (!playlist?.cardId) {
      setError("Cannot delete playlist without a saved playlist ID.");
      return;
    }
    if (!settings.yotoAuthToken) {
      setError("Yoto auth token not configured.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${playlist.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      await yotoPlaylistService.deletePlaylist(playlist.cardId);
      navigate("/");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to delete playlist: ${errorMessage}`);
      logger.error("Error deleting playlist:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasUnsavedChanges = (): boolean => {
    if (!playlist || !originalPlaylist) return false;

    // For create mode, check if there are changes from the blank template
    if (!playlist.cardId) {
      return (
        playlist.title !== originalPlaylist.title ||
        tracks.length > 0 ||
        (playlist.content?.chapters?.length || 0) !==
          (originalPlaylist.content?.chapters?.length || 0) ||
        playlist.metadata?.cover?.imageL !==
          originalPlaylist.metadata?.cover?.imageL ||
        playlist.metadata?.description !==
          originalPlaylist.metadata?.description
      );
    }

    // For edit mode, compare current state with original
    if (playlist.title !== originalPlaylist.title) return true;

    // Check if cover image has changed
    if (
      playlist.metadata?.cover?.imageL !==
      originalPlaylist.metadata?.cover?.imageL
    )
      return true;

    // Check if description has changed
    if (
      playlist.metadata?.description !== originalPlaylist.metadata?.description
    )
      return true;

    const currentChapters = playlist.content?.chapters || [];
    const originalChapters = originalPlaylist.content?.chapters || [];

    // Check if chapters have changed (length or content)
    if (currentChapters.length !== originalChapters.length) return true;
    if (tracks.length > 0) return true; // New uploads pending

    // Deep comparison of chapters (checking keys, titles, and playback options)
    for (let i = 0; i < currentChapters.length; i++) {
      const current = currentChapters[i];
      const original = originalChapters[i];

      if (current.key !== original.key || current.title !== original.title) {
        return true;
      }

      // Check if playback options have changed by comparing track events
      const currentOption = extractPlaybackOption(current);
      const originalOption = extractPlaybackOption(original);

      if (currentOption !== originalOption) {
        return true;
      }

      // Also check for icon changes
      const currentIcon = current.display?.icon16x16;
      const originalIcon = original.display?.icon16x16;

      if (currentIcon !== originalIcon) {
        return true;
      }
    }

    return false;
  };

  return {
    playlist,
    isLoading,
    isDeleting,
    isUploading,
    isRegenerating,
    isUploadingCover,
    error,
    tracksWithStatus: tracks,
    hasUnsavedChanges: hasUnsavedChanges(),
    updateTitle,
    updateDescription,
    addFilesToUploadQueue,
    removeTrack,
    reorderChapters,
    updateTrackIcon,
    updateTrackTitle,
    updatePlaybackOption,
    savePlaylist,
    deletePlaylist,
    regenerateIcons,
    uploadCoverImage,
  };
};
