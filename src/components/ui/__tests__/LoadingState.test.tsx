import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingState, LoadingOverlay } from '../LoadingState';

describe('LoadingState', () => {
  it('renders with default message', () => {
    render(<LoadingState />);
    // Check for the visible message (not the sr-only one)
    const messages = screen.getAllByText('Loading...');
    expect(messages.length).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingState message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders without message when not provided', () => {
    const { container } = render(<LoadingState message="" />);
    // The sr-only "Loading..." from Spinner will still be there, but the visible message should not
    const visibleMessage = container.querySelector('p.text-gray-600');
    expect(visibleMessage).not.toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingState size="sm" />);
    let spinner = screen.getByRole('status').querySelector('svg');
    expect(spinner).toHaveClass('h-4', 'w-4');

    rerender(<LoadingState size="xl" />);
    spinner = screen.getByRole('status').querySelector('svg');
    expect(spinner).toHaveClass('h-16', 'w-16');
  });

  it('renders as full screen when specified', () => {
    const { container } = render(<LoadingState fullScreen />);
    const loadingContainer = container.firstChild;
    expect(loadingContainer).toHaveClass('fixed', 'inset-0', 'z-50');
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingState className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('LoadingOverlay', () => {
  it('renders as full screen by default', () => {
    const { container } = render(<LoadingOverlay />);
    const loadingContainer = container.firstChild;
    expect(loadingContainer).toHaveClass('fixed', 'inset-0', 'z-50');
  });

  it('renders with custom message', () => {
    render(<LoadingOverlay message="Processing..." />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});
