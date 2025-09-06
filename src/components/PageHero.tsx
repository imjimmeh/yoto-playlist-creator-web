import React from 'react';
import './PageHero.css';

interface PageHeroProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const PageHero: React.FC<PageHeroProps> = ({ title, description, children }) => {
  return (
    <div className="page-hero">
      <div className="hero-content">
        <h1>{title}</h1>
        <p>{description}</p>
        
        {children && (
          <div className="hero-actions">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHero;