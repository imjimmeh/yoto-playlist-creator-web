import { useMemo, useState, useEffect } from "react";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";
import type { YotoPlaylistChapter } from "@/types";

const getIconUrl = (iconRef?: string): string | undefined => {
  if (!iconRef) {
    return;
  }

  return iconRef.startsWith("yoto:#")
    ? `https://media-secure-v2.api.yotoplay.com/icons/${iconRef.replace("yoto:#", "")}`
    : iconRef;
};

interface TrackIconProps {
  display?: YotoPlaylistChapter['display'];
  isProcessing?: boolean;
  isUpdating?: boolean;
}

export const TrackIcon = ({ display, isProcessing, isUpdating }: TrackIconProps) => {
  const iconUrl = useMemo(() => getIconUrl(display?.icon16x16), [display]);
  const { authenticatedImageUrl, loading } = useAuthenticatedImage(iconUrl);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const finalIconUrl = authenticatedImageUrl || iconUrl;
  
  // Trigger animation when icon changes
  useEffect(() => {
    if (finalIconUrl && !loading && !isProcessing) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [finalIconUrl, loading, isProcessing]);

  const getClassName = () => {
    let className = "track-icon";
    if (isProcessing) className += " processing";
    if (isUpdating) className += " updating";
    if (isAnimating) className += " icon-changed";
    return className;
  };

  const getContent = () => {
    if (isProcessing) {
      return <div className="processing-icon">✨</div>;
    }
    
    if (isUpdating || loading) {
      return <div className="loading-icon">🔄</div>;
    }
    
    if (finalIconUrl) {
      return (
        <img
          src={finalIconUrl}
          alt="Track icon"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      );
    }
    
    return <div className="default-icon">🎵</div>;
  };

  return (
    <div className={getClassName()}>
      {getContent()}
    </div>
  );
};
