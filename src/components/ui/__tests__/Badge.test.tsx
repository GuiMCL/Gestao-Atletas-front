import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('should render with children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeDefined();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Badge variant="default">Default</Badge>);
    expect(screen.getByText('Default')).toBeDefined();

    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toBeDefined();

    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toBeDefined();

    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toBeDefined();

    rerender(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toBeDefined();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toBeDefined();

    rerender(<Badge size="md">Medium</Badge>);
    expect(screen.getByText('Medium')).toBeDefined();

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText('Large')).toBeDefined();
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge.className).toContain('custom-class');
  });
});
