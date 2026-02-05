import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from '../Spinner';

describe('Spinner', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Spinner size="sm" />);
    let spinner = screen.getByRole('status').querySelector('svg');
    expect(spinner).toHaveClass('h-4', 'w-4');

    rerender(<Spinner size="lg" />);
    spinner = screen.getByRole('status').querySelector('svg');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('renders with different colors', () => {
    const { rerender } = render(<Spinner color="primary" />);
    let spinner = screen.getByRole('status').querySelector('svg');
    expect(spinner).toHaveClass('text-blue-600');

    rerender(<Spinner color="white" />);
    spinner = screen.getByRole('status').querySelector('svg');
    expect(spinner).toHaveClass('text-white');
  });

  it('applies custom className', () => {
    render(<Spinner className="custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });
});
