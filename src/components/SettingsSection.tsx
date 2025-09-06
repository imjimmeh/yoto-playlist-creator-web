import React from 'react';
import './SettingsSection.css';

interface SettingsSectionProps {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  icon,
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <div className={`settings-section ${className}`}>
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon">{icon}</span>
          <h2>{title}</h2>
        </div>
        <div className="section-description">
          {description}
        </div>
      </div>
      
      {children}
    </div>
  );
};

export default SettingsSection;