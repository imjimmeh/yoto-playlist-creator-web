import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

interface BackButtonProps {
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/');
  };

  return (
    <button
      className={`back-button ${className || ''}`}
      onClick={handleClick}
    >
      <span className="back-arrow">←</span>
      Back to Playlists
    </button>
  );
};

export default BackButton;