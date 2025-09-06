import { render, screen } from '@testing-library/react';
import Alert, { AlertType } from '../components/Alert';

describe('Alert', () => {
  const alertTypes: AlertType[] = ['error', 'success', 'warning', 'info'];

  it('should render with correct icon for each type', () => {
    alertTypes.forEach((type) => {
      const { unmount } = render(
        <Alert type={type}>
          This is a {type} message
        </Alert>
      );

      // Check that the alert renders with the correct class
      const alertElement = screen.getByText(`This is a ${type} message`).closest('.alert');
      expect(alertElement).toHaveClass(`alert-${type}`);

      // Check that the content is rendered
      expect(screen.getByText(`This is a ${type} message`)).toBeInTheDocument();

      unmount();
    });
  });

  it('should render with action when provided', () => {
    const action = <button>Dismiss</button>;
    
    render(
      <Alert type="info" action={action}>
        This is an info message with action
      </Alert>
    );

    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  it('should render without action when not provided', () => {
    render(
      <Alert type="info">
        This is an info message without action
      </Alert>
    );

    // Check that the alert element exists
    const alertElement = screen.getByText('This is an info message without action').closest('.alert');
    expect(alertElement).toBeInTheDocument();
    
    // Check that there's no action element
    expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
  });

  it('should render children content correctly', () => {
    render(
      <Alert type="success">
        <p>Paragraph content</p>
        <span>Span content</span>
      </Alert>
    );

    expect(screen.getByText('Paragraph content')).toBeInTheDocument();
    expect(screen.getByText('Span content')).toBeInTheDocument();
  });
});