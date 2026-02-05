import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('should render children', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeDefined();
  });

  it('should render with title', () => {
    render(
      <Card title="Card Title">
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeDefined();
  });

  it('should render with subtitle', () => {
    render(
      <Card title="Card Title" subtitle="Card subtitle">
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card subtitle')).toBeDefined();
  });

  it('should render with footer', () => {
    render(
      <Card footer={<button>Action</button>}>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Action')).toBeDefined();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <Card onClick={onClick}>
        <p>Card content</p>
      </Card>
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard events when clickable', () => {
    const onClick = vi.fn();
    render(
      <Card onClick={onClick}>
        <p>Card content</p>
      </Card>
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not be clickable when onClick is not provided', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );

    expect(screen.queryByRole('button')).toBeNull();
  });
});
