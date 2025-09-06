import React from 'react';
import './FormGroup.css';

export type BadgeType = 'required' | 'optional' | 'advanced';

interface FormGroupProps {
  id?: string;
  label: string;
  badge?: BadgeType;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

const FormGroup: React.FC<FormGroupProps> = ({ 
  id, 
  label, 
  badge, 
  helpText, 
  children, 
  className = '' 
}) => {
  const getBadgeClass = (badgeType: BadgeType) => {
    switch (badgeType) {
      case 'required': return 'required';
      case 'optional': return 'optional';
      case 'advanced': return 'advanced';
      default: return '';
    }
  };

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id}>
          <span className="label-text">{label}</span>
          {badge && (
            <span className={`label-badge ${getBadgeClass(badge)}`}>
              {badge.charAt(0).toUpperCase() + badge.slice(1)}
            </span>
          )}
        </label>
      )}
      <div className="input-wrapper">
        {children}
        {helpText && (
          <div className="input-help">
            <span className="help-text">{helpText}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormGroup;