import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from '../DatePicker';

describe('DatePicker', () => {
  it('should render with label', () => {
    render(<DatePicker label="Select date" />);
    expect(screen.getByText('Select date')).toBeDefined();
  });

  it('should render as date input by default', () => {
    render(<DatePicker label="Select date" />);
    const input = screen.getByLabelText('Select date') as HTMLInputElement;
    expect(input.type).toBe('date');
  });

  it('should render as datetime-local input when showTime is true', () => {
    render(<DatePicker label="Select date and time" showTime />);
    const input = screen.getByLabelText('Select date and time') as HTMLInputElement;
    expect(input.type).toBe('datetime-local');
  });

  it('should render with error message', () => {
    render(<DatePicker label="Select date" error="Invalid date" />);
    expect(screen.getByText('Invalid date')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('should render with helper text', () => {
    render(<DatePicker label="Select date" helperText="Choose a future date" />);
    expect(screen.getByText('Choose a future date')).toBeDefined();
  });

  it('should not show helper text when error is present', () => {
    render(
      <DatePicker
        label="Select date"
        error="Invalid date"
        helperText="Choose a future date"
      />
    );
    expect(screen.getByText('Invalid date')).toBeDefined();
    expect(screen.queryByText('Choose a future date')).toBeNull();
  });

  it('should call onChange when date changes', () => {
    const onChange = vi.fn();
    render(<DatePicker label="Select date" onChange={onChange} />);

    const input = screen.getByLabelText('Select date') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2024-12-25' } });

    expect(onChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<DatePicker label="Select date" disabled />);
    const input = screen.getByLabelText('Select date') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('should render with different validation states', () => {
    const { rerender } = render(<DatePicker label="Select date" validationState="success" />);
    expect(screen.getByLabelText('Select date')).toBeDefined();

    rerender(<DatePicker label="Select date" validationState="error" />);
    expect(screen.getByLabelText('Select date')).toBeDefined();
  });
});
