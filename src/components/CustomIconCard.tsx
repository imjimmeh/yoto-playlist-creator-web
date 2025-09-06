import React from "react";
import { IconDisplay, type IconDisplayData } from "./IconDisplay";
import { type CustomIcon } from "@/services/CustomIconService";
import "./CustomIconCard.css";

interface CustomIconCardProps {
  icon: CustomIcon;
  isEditing: boolean;
  editTitle: string;
  editTags: string;
  onEditStart: (icon: CustomIcon) => void;
  onEditSave: (icon: CustomIcon) => void;
  onEditCancel: () => void;
  onTitleChange: (title: string) => void;
  onTagsChange: (tags: string) => void;
}

const CustomIconCard: React.FC<CustomIconCardProps> = ({
  icon,
  isEditing,
  editTitle,
  editTags,
  onEditStart,
  onEditSave,
  onEditCancel,
  onTitleChange,
  onTagsChange,
}) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onEditSave(icon);
    } else if (e.key === "Escape") {
      onEditCancel();
    }
  };

  const iconData: IconDisplayData = {
    id: icon.id,
    mediaId: icon.mediaId,
    title: icon.title,
    imageUrl: icon.imageUrl,
    tags: icon.tags,
    isCustom: true,
  };

  return (
    <div className="icon-card">
      <IconDisplay
        icon={iconData}
        variant="card"
        size="medium"
        showBadge={false}
        showTitle={false}
        showTags={false}
      />

      <div className="icon-details">
        {isEditing ? (
          <div className="edit-form">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="edit-title-input"
              placeholder="Icon title..."
              onKeyDown={handleKeyDown}
            />
            <input
              type="text"
              value={editTags}
              onChange={(e) => onTagsChange(e.target.value)}
              className="edit-tags-input"
              placeholder="Tags (comma separated)..."
            />
            <div className="edit-actions">
              <button
                onClick={() => onEditSave(icon)}
                className="btn btn-primary btn-sm"
              >
                ✓ Save
              </button>
              <button onClick={onEditCancel} className="btn btn-ghost btn-sm">
                ✕ Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h4 className="icon-title">{icon.title}</h4>
            <div className="icon-tags">
              {icon.tags?.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="icon-meta">
              <span>{formatDate(icon.uploadedAt)}</span>
            </div>
            <div className="icon-actions">
              <button
                onClick={() => onEditStart(icon)}
                className="btn btn-ghost btn-sm"
                title="Edit icon"
              >
                ✏️ Edit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomIconCard;
