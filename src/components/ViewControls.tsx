import React from 'react';
import './ViewControls.css';

interface ViewControlsProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const ViewControls: React.FC<ViewControlsProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="view-controls">
      <button
        className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => onViewModeChange('grid')}
        title="Grid view"
      >
        ⊞
      </button>
      <button
        className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => onViewModeChange('list')}
        title="List view"
      >
        ≡
      </button>
    </div>
  );
};

export default ViewControls;