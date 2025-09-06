import React from 'react';

interface TabNavigationProps {
  activeTab: 'pending' | 'history';
  pendingCount: number;
  historyCount: number;
  onTabChange: (tab: 'pending' | 'history') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  pendingCount, 
  historyCount, 
  onTabChange 
}) => {
  return (
    <div className="tabs">
      <button 
        className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
        onClick={() => onTabChange('pending')}
      >
        Pending ({pendingCount})
      </button>
      <button 
        className={`tab ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
      >
        History ({historyCount})
      </button>
    </div>
  );
};

export default TabNavigation;
