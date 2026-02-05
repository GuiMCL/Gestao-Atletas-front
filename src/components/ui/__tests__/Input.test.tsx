import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('should render with label', () => {
    render(<Input label="Username" />);
    expect(screen.getByText('Username')).toBeDefined();
  });

  it('should render with error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('should render with helper text', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />);
    expect(screen.getByText('Must be at least 8 characters')).toBeDefined();
  });

  it('should not show helper text when error is present', () => {
    render(
      <Input
        label="Email"
        error="Invalid email"
        helperText="Enter your email"
      />
    );
    expect(screen.getByText('Invalid email')).toBeDefined();
    expect(screen.queryByText('Enter your email')).toBeNull();
  });

  it('should call onChange when value changes', () => {
    const onChange = vi.fn();
    render(<Input label="Name" onChange={onChange} />);

    const input = screen.getByLabelText('Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'John' } });

    expect(onChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input label="Name" disabled />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('should render with different validation states', () => {
    const { rerender } = render(<Input label="Name" validationState="success" />);
    expect(screen.getByLabelText('Name')).toBeDefined();

    rerender(<Input label="Name" validationState="error" />);
    expect(screen.getByLabelText('Name')).toBeDefined();
  });
});
