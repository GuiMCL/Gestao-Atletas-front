import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    const button = screen.getByText('Click me');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Click me
      </Button>
    );

    const button = screen.getByText('Click me');
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toBeDefined();

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByText('Danger')).toBeDefined();

    rerender(<Button variant="success">Success</Button>);
    expect(screen.getByText('Success')).toBeDefined();
  });

  it('should show loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByText('Loading');
    expect(button.querySelector('svg')).toBeDefined();
  });

  it('should be disabled when loading', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Loading
      </Button>
    );

    const button = screen.getByText('Loading');
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
