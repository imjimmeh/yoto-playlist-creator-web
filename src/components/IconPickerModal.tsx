import React, { useState, useEffect, useMemo } from "react";
import { useServices } from "@/contexts/useServices";
import { IconGrid } from "./IconGrid";
import type { YotoPublicIcon } from "@/types/yoto-api";
import type { CustomIcon } from "@/services/CustomIconService";
import "./IconPickerModal.css";

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconRef: string) => void;
  currentIconRef?: string;
  trackTitle?: string;
}

interface CombinedIcon {
  id: string;
  mediaId: string;
  title: string;
  imageUrl?: string;
  tags: string[];
  isCustom: boolean;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentIconRef,
  trackTitle,
}) => {
  const { yotoIconService, customIconService } = useServices();
  const [icons, setIcons] = useState<CombinedIcon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Load icons when modal opens (only once)
  useEffect(() => {
    if (isOpen) {
      // Add class to body to disable hover effects globally
      document.body.classList.add("icon-modal-open");

      // Only load icons if we don't have any and we're not already loading
      if (icons.length === 0 && !loading) {
        loadIcons();
      }
    } else {
      // Remove class when modal closes
      document.body.classList.remove("icon-modal-open");
    }

    // Cleanup function
    return () => {
      document.body.classList.remove("icon-modal-open");
    };
  }, [isOpen]);

  const loadIcons = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load both Yoto public icons and custom icons
      const [publicIcons, customIcons] = await Promise.all([
        yotoIconService.getIcons(false),
        customIconService.getCustomIcons(),
      ]);

      // Convert to combined format
      const publicIconsCombined: CombinedIcon[] = publicIcons.map(
        (icon: YotoPublicIcon) => ({
          id: icon.mediaId,
          mediaId: icon.mediaId,
          title: icon.title,
          imageUrl: undefined, // Public icons use the yoto:# format
          tags: icon.publicTags || [],
          isCustom: false,
        })
      );

      const customIconsCombined: CombinedIcon[] = customIcons.map(
        (icon: CustomIcon) => ({
          id: `custom-${icon.id}`, // Prefix to ensure uniqueness from public icons
          mediaId: icon.mediaId,
          title: icon.title,
          imageUrl: icon.imageUrl,
          tags: icon.tags || [],
          isCustom: true,
        })
      );

      // Deduplicate icons by mediaId - custom icons take priority
      const iconMap = new Map<string, CombinedIcon>();

      // Add custom icons first (they get priority)
      customIconsCombined.forEach((icon) => {
        iconMap.set(icon.mediaId, icon);
      });

      // Add public icons only if they don't already exist as custom icons
      publicIconsCombined.forEach((icon) => {
        if (!iconMap.has(icon.mediaId)) {
          iconMap.set(icon.mediaId, icon);
        }
      });

      const deduplicatedIcons = Array.from(iconMap.values());
      setIcons(deduplicatedIcons);
    } catch (err) {
      console.error("Failed to load icons:", err);
      setError("Failed to load icons. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter icons based on search term and category
  const filteredIcons = useMemo(() => {
    let filtered = icons;

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (icon) =>
          (icon.title ?? "").toLowerCase().includes(term) ||
          (icon.tags ?? []).some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      if (selectedCategory === "custom") {
        filtered = filtered.filter((icon) => icon.isCustom);
      } else if (selectedCategory === "public") {
        filtered = filtered.filter((icon) => !icon.isCustom);
      } else {
        // Filter by tag category
        filtered = filtered.filter((icon) =>
          icon.tags.some(
            (tag) => tag.toLowerCase() === selectedCategory.toLowerCase()
          )
        );
      }
    }

    return filtered;
  }, [icons, searchTerm, selectedCategory]);

  // Get unique categories from all icons
  const categories = useMemo(() => {
    return [
      { value: "all", label: "All Icons" },
      { value: "custom", label: "Custom Icons" },
      { value: "public", label: "Public Icons" },
    ];
  }, [icons]);

  const handleIconSelect = (icon: CombinedIcon) => {
    const iconRef = `yoto:#${icon.mediaId}`;
    onSelect(iconRef);
  };

  const handleClose = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="icon-picker-overlay"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="icon-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="icon-picker-header">
          <h3>Choose Icon{trackTitle && ` for "${trackTitle}"`}</h3>
          <button className="close-button" onClick={handleClose} title="Close">
            ✕
          </button>
        </div>

        <div className="icon-picker-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              autoFocus
            />
          </div>

          <div className="category-container">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="icon-picker-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner">⏳</div>
              <p>Loading icons...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">❌</div>
              <p>{error}</p>
              <button onClick={loadIcons} className="retry-button">
                Retry
              </button>
            </div>
          ) : filteredIcons.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No icons found</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="clear-search-button"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <IconGrid
              icons={filteredIcons}
              onIconSelect={handleIconSelect}
              currentIconRef={currentIconRef}
            />
          )}
        </div>

        <div className="icon-picker-footer">
          <div className="icon-count">
            {filteredIcons.length} icon{filteredIcons.length !== 1 ? "s" : ""}{" "}
            available
          </div>
          <button onClick={handleClose} className="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
