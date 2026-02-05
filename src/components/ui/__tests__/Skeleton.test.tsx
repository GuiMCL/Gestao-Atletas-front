import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonAvatar } from '../Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Skeleton variant="text" />);
    let skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('rounded', 'h-4');

    rerender(<Skeleton variant="circular" />);
    skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('rounded-full');

    rerender(<Skeleton variant="rounded" />);
    skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('rounded-lg');
  });

  it('applies custom width and height', () => {
    render(<Skeleton width={100} height={50} />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveStyle({ width: '100px', height: '50px' });
  });

  it('applies custom width and height as strings', () => {
    render(<Skeleton width="50%" height="2rem" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveStyle({ width: '50%', height: '2rem' });
  });

  it('renders with different animations', () => {
    const { rerender } = render(<Skeleton animation="pulse" />);
    let skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('animate-pulse');

    rerender(<Skeleton animation="none" />);
    skeleton = screen.getByRole('status');
    expect(skeleton).not.toHaveClass('animate-pulse');
  });
});

describe('SkeletonText', () => {
  it('renders default number of lines', () => {
    render(<SkeletonText />);
    const skeletons = screen.getAllByRole('status');
    expect(skeletons).toHaveLength(3);
  });

  it('renders custom number of lines', () => {
    render(<SkeletonText lines={5} />);
    const skeletons = screen.getAllByRole('status');
    expect(skeletons).toHaveLength(5);
  });
});

describe('SkeletonCard', () => {
  it('renders card skeleton structure', () => {
    render(<SkeletonCard />);
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('SkeletonTable', () => {
  it('renders default table skeleton', () => {
    render(<SkeletonTable />);
    const skeletons = screen.getAllByRole('status');
    // Default: 5 rows + 1 header = 6 rows, 4 columns each = 24 cells
    expect(skeletons).toHaveLength(24);
  });

  it('renders custom table dimensions', () => {
    render(<SkeletonTable rows={3} columns={2} />);
    const skeletons = screen.getAllByRole('status');
    // 3 rows + 1 header = 4 rows, 2 columns each = 8 cells
    expect(skeletons).toHaveLength(8);
  });
});

describe('SkeletonAvatar', () => {
  it('renders with default size', () => {
    render(<SkeletonAvatar />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('renders with custom size', () => {
    render(<SkeletonAvatar size={64} />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveStyle({ width: '64px', height: '64px' });
  });
});
