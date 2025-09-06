import React from 'react';
import './Alert.css';

export type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({ type, children, action }) => {
  const getIcon = () => {
    switch (type) {
      case 'error': return '⚠️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div className={`alert alert-${type}`}>
      <span className="alert-icon">{getIcon()}</span>
      <div className="alert-content">{children}</div>
      {action && <div className="alert-action">{action}</div>}
    </div>
  );
};

export default Alert;