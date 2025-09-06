import React from "react";
import "./ProgressBar.css";

interface ProgressBarProps {
  progress?: number;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
  error?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress = 0,
  showText = true,
  size = 'medium',
  variant = 'primary',
  className = '',
  error
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`progress-bar-wrapper ${size} ${className}`.trim()}>
      <div className="progress-bar-track">
        <div 
          className={`progress-bar-fill ${variant}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showText && (
        <span className="progress-bar-text">
          {Math.round(clampedProgress)}%
        </span>
      )}
      {error && (
        <span className="progress-bar-error">{error}</span>
      )}
    </div>
  );
};

export default ProgressBar;