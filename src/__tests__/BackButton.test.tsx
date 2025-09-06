import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BackButton from '../components/BackButton';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('BackButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <MemoryRouter>
        {component}
      </MemoryRouter>
    );
  };

  it('should render with default text', () => {
    renderWithRouter(<BackButton />);
    
    expect(screen.getByText('←')).toBeInTheDocument();
    expect(screen.getByText('Back to Playlists')).toBeInTheDocument();
  });

  it('should render with additional className', () => {
    renderWithRouter(<BackButton className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('back-button');
    expect(button).toHaveClass('custom-class');
  });

  it('should navigate to home when clicked', () => {
    renderWithRouter(<BackButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});