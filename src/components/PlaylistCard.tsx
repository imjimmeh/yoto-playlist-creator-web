import React from "react";
import "./PlaylistCard.css";
import type { YotoPlaylistCard } from "../types";
import { useAuthenticatedImage } from "../hooks/useAuthenticatedImage";

interface PlaylistCardProps {
  playlist: YotoPlaylistCard;
  viewMode: "grid" | "list";
  onClick: (cardId: string) => void | Promise<void> | PromiseLike<void>;
  onDelete?: (cardId: string) => void | Promise<void> | PromiseLike<void>;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  viewMode,
  onClick,
  onDelete,
}) => {
  const { authenticatedImageUrl, loading: imageLoading } =
    useAuthenticatedImage(playlist.metadata?.cover?.imageL);

  const handleClick = async () => {
    await onClick(playlist.cardId);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (onDelete) {
      await onDelete(playlist.cardId);
    }
  };

  return (
    <div
      className={`playlist-card ${
        viewMode === "list" ? "list-mode" : "grid-mode"
      }`}
      onClick={() => handleClick()}
    >
      <div className="playlist-cover">
        {(authenticatedImageUrl || playlist.metadata?.cover?.imageL) &&
          !imageLoading && (
            <img
              src={authenticatedImageUrl || playlist.metadata?.cover?.imageL}
              alt={playlist.title}
            />
          )}
        {imageLoading && <div className="loading-placeholder">Loading...</div>}
        {viewMode === "grid" && <div className="playlist-overlay"></div>}
      </div>

      <div className="playlist-info">
        <h3>{playlist.title}</h3>
      </div>

      {onDelete && (
        <button
          className="delete-button"
          onClick={handleDelete}
          title="Delete playlist"
          aria-label="Delete playlist"
        >
          🗑️
        </button>
      )}
    </div>
  );
};

export default PlaylistCard;
