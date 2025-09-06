import React from "react";
import { type NavigateFunction } from "react-router-dom";
import PlaylistCard from "../components/PlaylistCard";
import ViewControls from "../components/ViewControls";
import type { YotoPlaylistCard } from "@/types";
import type { SortConfig, SortOption } from "@/hooks/usePlaylistSorting";

interface PlaylistsViewProps {
  playlists: YotoPlaylistCard[];
  allPlaylists: YotoPlaylistCard[];
  viewMode: "grid" | "list";
  setViewMode: React.Dispatch<React.SetStateAction<"grid" | "list">>;
  navigate: NavigateFunction;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  sortConfig: SortConfig;
  onSortChange: (key: SortOption) => void;
  onDeletePlaylist: (cardId: string) => Promise<void>;
}

const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  allPlaylists,
  viewMode,
  setViewMode,
  navigate,
  searchQuery,
  setSearchQuery,
  sortConfig,
  onSortChange,
  onDeletePlaylist,
}) => {
  const goToCard = async (cardId: string) => {
    await navigate(`/playlists/${cardId}`);
  };

  return (
    <>
      <div className="section-header">
        <h2>
          Your Playlists ({playlists.length}
          {playlists.length !== allPlaylists.length &&
            ` of ${allPlaylists.length}`}
          )
        </h2>
        <ViewControls viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Search and Sort Controls */}
      <div className="playlist-controls">
        <div className="search-control">
          <input
            type="text"
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="sort-control">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortConfig.key}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="sort-select"
          >
            <option value="title">Title</option>
            <option value="duration">Duration</option>
            <option value="size">Size</option>
            <option value="dateCreated">Date Created</option>
          </select>
          <button
            onClick={() => onSortChange(sortConfig.key)}
            className="sort-direction-btn"
            aria-label={`Sort ${
              sortConfig.direction === "asc" ? "descending" : "ascending"
            }`}
          >
            {sortConfig.direction === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {playlists.length === 0 && searchQuery ? (
        <div className="no-results">
          <p>No playlists found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery("")}
            className="clear-search-link"
          >
            Show all playlists
          </button>
        </div>
      ) : (
        <div
          className={`playlists-container ${
            viewMode === "list" ? "list-view" : "grid-view"
          }`}
        >
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.cardId}
              playlist={playlist}
              viewMode={viewMode}
              onClick={goToCard}
              onDelete={onDeletePlaylist}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default PlaylistsView;