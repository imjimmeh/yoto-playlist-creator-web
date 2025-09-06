import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHero from "../../components/PageHero";
import EmptyState from "../../components/EmptyState";
import LoadingButton from "../../components/LoadingButton";
import PlaylistsView from "../../components/PlaylistsView";
import { useSettings } from "../../hooks/useSettings";
import { useServices } from "@/contexts/useServices";
import { useError } from "@/contexts/ErrorContext";
import { usePlaylistSorting } from "@/hooks/usePlaylistSorting";
import { useRandomPlaylist } from "@/hooks/useRandomPlaylist";
import type { YotoPlaylistCard } from "@/types";
import "./PlaylistsPage.css";

const PlaylistsPage: React.FC = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<YotoPlaylistCard[]>([]);
  const [loading, setLoading] = useState(false);
  const { settings, isLoading: settingsLoading } = useSettings();
  const { showError } = useError();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const {
    yotoPlaylistService,
    yotoDataSyncService,
    isReady: servicesReady,
  } = useServices();
  
  const { 
    sortConfig, 
    handleSortChange, 
    filteredAndSortedPlaylists 
  } = usePlaylistSorting(playlists, searchQuery);
  
  const { 
    createRandomPlaylist: createRandomPlaylistHook, 
    loading: randomPlaylistLoading 
  } = useRandomPlaylist();

  const loadCachedPlaylists = async () => {
    try {
      const cachedPlaylists = await yotoDataSyncService.getAllPlaylistDetails();
      setPlaylists(cachedPlaylists as unknown as YotoPlaylistCard[]);
    } catch (err) {
      console.warn("Failed to load cached playlists:", err);
    }
  };

  const fetchPlaylists = async (forceSync = false) => {
    if (!settings.yotoAuthToken) {
      showError(
        "Authorization token not found. Please set it in the Settings page."
      );
      return;
    }

    if (!servicesReady) {
      return;
    }

    if (forceSync) {
      setLoading(true);
    }

    try {
      // Start background sync (don't await)
      void yotoDataSyncService.syncPlaylists();
    } catch (err) {
      if (err instanceof Error) {
        showError(err.message);
      } else {
        showError("An unknown error occurred.");
      }
    } finally {
      if (forceSync) {
        setLoading(false);
      }
    }
  };

  const handleDeletePlaylist = async (cardId: string) => {
    if (!settings.yotoAuthToken) {
      showError("Authorization token not found.");
      return;
    }

    const playlist = playlists.find((p) => p.cardId === cardId);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        playlist?.title || "this playlist"
      }"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await yotoPlaylistService.deletePlaylist(cardId);
      // Refresh playlists to remove the deleted one
      setPlaylists((prev) => prev.filter((p) => p.cardId !== cardId));
    } catch (err) {
      if (err instanceof Error) {
        showError(`Failed to delete playlist: ${err.message}`);
      } else {
        showError("Failed to delete playlist due to an unknown error.");
      }
    }
  };

  const createRandomPlaylist = async () => {
    await createRandomPlaylistHook();
    // Refresh playlists to show the new one
    await fetchPlaylists(true);
  };

  useEffect(() => {
    if (!settingsLoading && servicesReady && settings.yotoAuthToken) {
      // Load cached data immediately
      void loadCachedPlaylists();

      // Start background sync
      void fetchPlaylists(false);

      // Set up event listeners
      const unsubscribeSyncComplete = yotoDataSyncService.on(
        "sync-complete",
        (updatedPlaylists) => {
          setPlaylists(updatedPlaylists as unknown as YotoPlaylistCard[]);
          setLoading(false);
        }
      );

      const unsubscribeSyncError = yotoDataSyncService.on(
        "sync-error",
        (error) => {
          showError(`Sync failed: ${error.message}`);
          setLoading(false);
        }
      );

      const unsubscribeSyncStarted = yotoDataSyncService.on(
        "sync-started",
        () => {
          // Only show loading if we don't have cached data
          if (playlists.length === 0) {
            setLoading(true);
          }
        }
      );

      // Cleanup function
      return () => {
        unsubscribeSyncComplete();
        unsubscribeSyncError();
        unsubscribeSyncStarted();
      };
    }
  }, [settings.yotoAuthToken, settingsLoading, servicesReady]);

  const renderEmptyState = () => (
    <EmptyState
      icon="🎵"
      title="No Playlists Yet"
      description="Create your first Yoto playlist to get started!"
      action={
        <LoadingButton
          variant="primary"
          size="lg"
          onClick={() => navigate("/create")}
        >
          <span>➕</span>
          Create Your First Playlist
        </LoadingButton>
      }
    />
  );

  const renderSetupRequired = () => (
    <EmptyState
      icon="⚙️"
      title="Setup Required"
      description="Configure your Yoto authentication token to get started."
      variant="setup"
      action={
        <LoadingButton
          variant="secondary"
          size="lg"
          onClick={() => navigate("/settings")}
        >
          <span>⚙️</span>
          Go to Settings
        </LoadingButton>
      }
    />
  );

  return (
    <div className="playlists-page">
      <PageHero
        title="Your Yoto Playlists"
        description="Manage and create beautiful audio playlists for your Yoto player"
      >
        <div className="hero-actions">
          <LoadingButton
            variant="secondary"
            className="refresh-btn"
            onClick={() => fetchPlaylists(true)}
            loading={loading}
            loadingChildren="Refreshing..."
          >
            <span className="btn-icon">🔄</span>
            Refresh
          </LoadingButton>

          {playlists.length > 0 && (
            <LoadingButton
              variant="primary"
              className="random-playlist-btn"
              onClick={createRandomPlaylist}
              loading={randomPlaylistLoading || loading}
              loadingChildren="Creating..."
            >
              <span className="btn-icon">🎲</span>
              Random Mix
            </LoadingButton>
          )}
        </div>
      </PageHero>

      {/* Error handling is now centralized with toast notifications */}

      <div className="playlists-section">
        {!settings.yotoAuthToken ? (
          renderSetupRequired()
        ) : playlists.length === 0 && !loading ? (
          renderEmptyState()
        ) : (
          <PlaylistsView
            playlists={filteredAndSortedPlaylists}
            allPlaylists={playlists}
            viewMode={viewMode}
            setViewMode={setViewMode}
            navigate={navigate}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            onDeletePlaylist={handleDeletePlaylist}
          />
        )}
      </div>
    </div>
  );
};

export default PlaylistsPage;
