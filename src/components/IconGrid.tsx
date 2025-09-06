import React, { useMemo } from "react";
import { IconDisplay, type IconDisplayData } from "./IconDisplay";
import "./IconGrid.css";

interface CombinedIcon {
  id: string;
  mediaId: string;
  title: string;
  imageUrl?: string;
  tags: string[];
  isCustom: boolean;
}

interface IconGridProps {
  icons: CombinedIcon[];
  onIconSelect: (icon: CombinedIcon) => void;
  currentIconRef?: string;
}

export const IconGrid: React.FC<IconGridProps> = ({
  icons,
  onIconSelect,
  currentIconRef,
}) => {
  // Extract current mediaId from the icon reference
  const currentMediaId = useMemo(() => {
    if (!currentIconRef) return null;
    return currentIconRef.replace("yoto:#", "");
  }, [currentIconRef]);


  if (icons.length === 0) {
    return (
      <div className="icon-grid-empty">
        <div className="empty-message">No icons available</div>
      </div>
    );
  }
  console.log(icons);
  return (
    <div className="icon-grid">
      {icons.map((icon) => {
        const iconData: IconDisplayData = {
          id: icon.id,
          mediaId: icon.mediaId,
          title: icon.title,
          imageUrl: icon.imageUrl,
          tags: icon.tags,
          isCustom: icon.isCustom,
        };

        return (
          <IconDisplay
            key={`${icon.isCustom ? "custom" : "public"}-${icon.mediaId}`}
            icon={iconData}
            variant="grid"
            size="medium"
            isSelected={icon.mediaId === currentMediaId}
            highlighted={false}
            onClick={(_) => onIconSelect(icon)}
            tabIndex={0}
            role="button"
            aria-label={`Select ${icon.title} icon`}
            maxTags={2}
          />
        );
      })}
    </div>
  );
};
