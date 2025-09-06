import { useMemo, useState } from "react";
import type { YotoPlaylistCard } from "@/types";

export type SortOption = "title" | "duration" | "size" | "dateCreated";

export interface SortConfig {
  key: SortOption;
  direction: "asc" | "desc";
}

export const usePlaylistSorting = (
  playlists: YotoPlaylistCard[],
  searchQuery: string
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "dateCreated",
    direction: "desc",
  });

  const handleSortChange = (key: SortOption) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredAndSortedPlaylists = useMemo(() => {
    let filtered = playlists;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((playlist) =>
        playlist.title.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.key) {
        case "title": {
          comparison = a.title.localeCompare(b.title);
          break;
        }
        case "duration": {
          const aDuration = a.metadata?.media?.duration || 0;
          const bDuration = b.metadata?.media?.duration || 0;
          comparison = aDuration - bDuration;
          break;
        }
        case "size": {
          const aSize = a.metadata?.media?.fileSize || 0;
          const bSize = b.metadata?.media?.fileSize || 0;
          comparison = aSize - bSize;
          break;
        }
        case "dateCreated": {
          comparison =
            new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
          break;
        }
        default: {
          break;
        }
      }

      return sortConfig.direction === "desc" ? -comparison : comparison;
    });

    return sorted;
  }, [playlists, searchQuery, sortConfig]);

  return {
    sortConfig,
    handleSortChange,
    filteredAndSortedPlaylists,
  };
};
