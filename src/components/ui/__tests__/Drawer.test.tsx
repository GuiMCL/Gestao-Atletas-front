import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drawer } from '../Drawer';

describe('Drawer', () => {
  it('should render when isOpen is true', () => {
    render(
      <Drawer isOpen={true} onClose={() => {}} position="right">
        <p>Drawer content</p>
      </Drawer>
    );

    expect(screen.getByText('Drawer content')).toBeDefined();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <Drawer isOpen={false} onClose={() => {}} position="right">
        <p>Drawer content</p>
      </Drawer>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render with title', () => {
    render(
      <Drawer isOpen={true} onClose={() => {}} position="right" title="Drawer Title">
        <p>Drawer content</p>
      </Drawer>
    );

    expect(screen.getByText('Drawer Title')).toBeDefined();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen={true} onClose={onClose} position="right" title="Drawer">
        <p>Drawer content</p>
      </Drawer>
    );

    const closeButton = screen.getByLabelText('Close drawer');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen={true} onClose={onClose} position="right">
        <p>Drawer content</p>
      </Drawer>
    );

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render on left position', () => {
    render(
      <Drawer isOpen={true} onClose={() => {}} position="left">
        <p>Drawer content</p>
      </Drawer>
    );

    expect(screen.getByText('Drawer content')).toBeDefined();
  });
});
