import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "./useSettings";
import { useServices } from "@/contexts/useServices";
import { useError } from "@/contexts/ErrorContext";
import { pickRandomCoverUrl } from "@/utils/random-cover";

export const useRandomPlaylist = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();
  const { showError } = useError();
  const { yotoPlaylistService, yotoDataSyncService } = useServices();

  const createRandomPlaylist = async () => {
    if (!settings.yotoAuthToken) {
      showError("Authorization token not found.");
      return;
    }

    // Get all cached playlist details for track extraction
    const allPlaylistDetails =
      await yotoDataSyncService.getAllPlaylistDetails();

    if (allPlaylistDetails.length === 0) {
      showError(
        "No existing playlists found to create a random playlist from."
      );
      return;
    }

    // Collect all tracks from existing playlists
    const allTracks: any[] = [];
    allPlaylistDetails.forEach((playlist) => {
      if (playlist.content?.chapters) {
        playlist.content.chapters.forEach((chapter) => {
          if (chapter.tracks && chapter.tracks.length > 0) {
            allTracks.push({
              ...chapter,
              sourcePlaylist: playlist.title,
            });
          }
        });
      }
    });

    if (allTracks.length === 0) {
      showError("No tracks found in existing playlists.");
      return;
    }

    // Shuffle the tracks randomly
    const shuffledTracks = [...allTracks].sort(() => Math.random() - 0.5);

    // Take a random number of tracks (between 10-30 or all tracks if fewer)
    const maxTracks = Math.min(30, shuffledTracks.length);
    const minTracks = Math.min(10, shuffledTracks.length);
    const numberOfTracks =
      Math.floor(Math.random() * (maxTracks - minTracks + 1)) + minTracks;
    const selectedTracks = shuffledTracks.slice(0, numberOfTracks);

    // Create the random playlist
    const randomPlaylist = {
      cardId: "",
      title: `Random Mix ${new Date().toLocaleDateString()}`,
      content: {
        chapters: selectedTracks.map((track, index) => ({
          ...track,
          key: String(index + 1).padStart(2, "0"),
        })),
        activity: "yoto_Player",
        restricted: true,
        config: { onlineOnly: false },
        version: "1",
      },
      metadata: {
        cover: {
          imageL: pickRandomCoverUrl(),
        },
        media: {
          duration: selectedTracks.reduce(
            (sum, track) => sum + (track.tracks?.[0]?.duration || 0),
            0
          ),
          fileSize: selectedTracks.reduce(
            (sum, track) => sum + (track.tracks?.[0]?.fileSize || 0),
            0
          ),
        },
      },
    };

    try {
      setLoading(true);
      const payload = { card: randomPlaylist };
      const result = await yotoPlaylistService.savePlaylist(payload);

      // Navigate to the new playlist - result contains data which has the cardId
      if (result && typeof result === "object" && "data" in result) {
        const cardId = (result.data as any)?.cardId;
        if (cardId) {
          navigate(`/playlists/${cardId}`);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        showError(`Failed to create random playlist: ${err.message}`);
      } else {
        showError("Failed to create random playlist due to an unknown error.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    createRandomPlaylist,
    loading,
  };
};