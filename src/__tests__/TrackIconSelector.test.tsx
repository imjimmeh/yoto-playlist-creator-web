import { render, screen, fireEvent } from '@testing-library/react';
import { TrackIconSelector } from '../components/TrackIconSelector';
import { YotoPlaylistChapter } from '@/types';

// Mock the IconPickerModal component
jest.mock('../components/IconPickerModal', () => ({
  IconPickerModal: ({ isOpen, onClose, onSelect }: any) => (
    isOpen ? (
      <div data-testid="icon-picker-modal">
        <button onClick={() => onClose()}>Close</button>
        <button onClick={() => onSelect('new-icon-ref')}>Select Icon</button>
      </div>
    ) : null
  )
}));

// Mock the TrackIcon component
jest.mock('../pages/components/TrackIcon', () => ({
  TrackIcon: ({ display }: any) => (
    <div data-testid="track-icon">
      {display?.icon16x16 || 'No Icon'}
    </div>
  )
}));

describe('TrackIconSelector', () => {
  const mockChapter: YotoPlaylistChapter = {
    key: 'chapter-1',
    title: 'Test Chapter',
    display: {
      icon16x16: 'test-icon-ref'
    }
  };

  const mockOnIconChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the current icon', () => {
    render(
      <TrackIconSelector
        chapter={mockChapter}
        onIconChange={mockOnIconChange}
      />
    );

    expect(screen.getByTestId('track-icon')).toBeInTheDocument();
    expect(screen.getByText('test-icon-ref')).toBeInTheDocument();
  });

  it('opens the icon picker modal when clicked', () => {
    render(
      <TrackIconSelector
        chapter={mockChapter}
        onIconChange={mockOnIconChange}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByTestId('icon-picker-modal')).toBeInTheDocument();
  });

  it('does not open the icon picker when disabled', () => {
    render(
      <TrackIconSelector
        chapter={mockChapter}
        onIconChange={mockOnIconChange}
        disabled={true}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.queryByTestId('icon-picker-modal')).not.toBeInTheDocument();
  });

  it('calls onIconChange when an icon is selected', () => {
    render(
      <TrackIconSelector
        chapter={mockChapter}
        onIconChange={mockOnIconChange}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const selectButton = screen.getByText('Select Icon');
    fireEvent.click(selectButton);

    expect(mockOnIconChange).toHaveBeenCalledWith('chapter-1', 'new-icon-ref');
  });

  it('closes the icon picker when close is called', () => {
    render(
      <TrackIconSelector
        chapter={mockChapter}
        onIconChange={mockOnIconChange}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByTestId('icon-picker-modal')).toBeInTheDocument();

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('icon-picker-modal')).not.toBeInTheDocument();
  });

  it('applies the correct size class', () => {
    const { container } = render(
      <TrackIconSelector
        chapter={mockChapter}
        onIconChange={mockOnIconChange}
        size="large"
      />
    );

    expect(container.firstChild).toHaveClass('large');
  });

  it('applies disabled class when disabled', () => {
    const { container } = render(
      <TrackIconSelector
        chapter={mockChapter}
        onIconChange={mockOnIconChange}
        disabled={true}
      />
    );

    expect(container.firstChild).toHaveClass('disabled');
  });

  it('shows processing state when isProcessing is true', () => {
    render(
      <TrackIconSelector
        chapter={mockChapter}
        onIconChange={mockOnIconChange}
        isProcessing={true}
      />
    );

    expect(screen.getByTestId('track-icon')).toBeInTheDocument();
  });

  it('shows updating state when isUpdating is true', () => {
    render(
      <TrackIconSelector
        chapter={mockChapter}
        onIconChange={mockOnIconChange}
        isUpdating={true}
      />
    );

    expect(screen.getByTestId('track-icon')).toBeInTheDocument();
  });
});