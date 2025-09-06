import React, { useMemo } from "react";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";
import "./IconDisplay.css";

export interface IconDisplayData {
  id: string;
  mediaId: string;
  title: string;
  imageUrl?: string;
  tags?: string[];
  isCustom: boolean;
}

interface IconDisplayProps {
  icon: IconDisplayData;
  size?: "small" | "medium" | "large";
  variant?: "card" | "grid" | "selector";
  isSelected?: boolean;
  highlighted?: boolean;
  showBadge?: boolean;
  showTitle?: boolean;
  showTags?: boolean;
  maxTags?: number;
  onClick?: (icon: IconDisplayData) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  tabIndex?: number;
  role?: string;
  "aria-label"?: string;
}

export const IconDisplay: React.FC<IconDisplayProps> = ({
  icon,
  size = "medium",
  variant = "grid",
  isSelected = false,
  highlighted = false,
  showBadge = true,
  showTitle = true,
  showTags = true,
  maxTags = 2,
  onClick,
  onKeyDown,
  className = "",
  tabIndex,
  role,
  "aria-label": ariaLabel,
}) => {
  // Get the proper icon URL
  const iconUrl = useMemo(() => {
    if (icon.isCustom && icon.imageUrl) {
      return icon.imageUrl;
    }
    // For public icons, use the Yoto media format
    return `https://media-secure-v2.api.yotoplay.com/icons/${icon.mediaId}`;
  }, [icon]);

  const { authenticatedImageUrl, loading } = useAuthenticatedImage(
    icon.isCustom ? undefined : iconUrl
  );

  const finalImageUrl = icon.isCustom
    ? iconUrl
    : authenticatedImageUrl || iconUrl;

  const handleClick = () => {
    if (onClick) {
      onClick(icon);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(e);
    } else if ((e.key === "Enter" || e.key === " ") && onClick) {
      e.preventDefault();
      onClick(icon);
    }
  };

  const containerClasses = [
    "icon-display",
    `icon-display--${size}`,
    `icon-display--${variant}`,
    isSelected && "icon-display--selected",
    highlighted && "icon-display--highlighted",
    onClick && "icon-display--clickable",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      role={role}
      aria-label={ariaLabel || `${icon.title} icon`}
    >
      <div className="icon-display__image-container">
        {loading ? (
          <div className="icon-display__loading">⏳</div>
        ) : (
          <img
            src={finalImageUrl}
            alt={icon.title}
            className="icon-display__image"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const container = target.parentElement;
              if (container) {
                container.innerHTML =
                  '<div class="icon-display__error">❌</div>';
              }
            }}
          />
        )}

        {isSelected && (
          <div className="icon-display__selected-overlay">
            <span className="icon-display__checkmark">✓</span>
          </div>
        )}

        {icon.isCustom && showBadge && (
          <div className="icon-display__custom-badge" title="Custom icon">
            ⭐
          </div>
        )}
      </div>

      {(showTitle || showTags) && (
        <div className="icon-display__info">
          {showTitle && (
            <div className="icon-display__title" title={icon.title}>
              {icon.title}
            </div>
          )}
          {showTags && icon.tags && icon.tags.length > 0 && (
            <div className="icon-display__tags">
              {icon.tags.slice(0, maxTags).map((tag, index) => (
                <span key={`${tag}-${index}`} className="icon-display__tag">
                  {tag}
                </span>
              ))}
              {icon.tags.length > maxTags && (
                <span
                  className="icon-display__tag-more"
                  title={icon.tags.join(", ")}
                >
                  +{icon.tags.length - maxTags}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
