import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: 'default' | 'setup';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'default'
}) => {
  const getContainerClass = () => {
    switch (variant) {
      case 'setup': return 'setup-required';
      default: return 'empty-state';
    }
  };

  const getIconClass = () => {
    switch (variant) {
      case 'setup': return 'setup-icon';
      default: return 'empty-state-icon';
    }
  };

  return (
    <div className={getContainerClass()}>
      <div className={getIconClass()}>{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
};

export default EmptyState;