import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '../Select';

describe('Select', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  it('should render with label', () => {
    render(<Select label="Choose option" options={mockOptions} />);
    expect(screen.getByText('Choose option')).toBeDefined();
  });

  it('should render all options', () => {
    render(<Select label="Choose option" options={mockOptions} />);
    expect(screen.getByText('Option 1')).toBeDefined();
    expect(screen.getByText('Option 2')).toBeDefined();
    expect(screen.getByText('Option 3')).toBeDefined();
  });

  it('should render with placeholder', () => {
    render(
      <Select
        label="Choose option"
        options={mockOptions}
        placeholder="Select an option"
      />
    );
    expect(screen.getByText('Select an option')).toBeDefined();
  });

  it('should render with error message', () => {
    render(
      <Select label="Choose option" options={mockOptions} error="Required field" />
    );
    expect(screen.getByText('Required field')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('should render with helper text', () => {
    render(
      <Select
        label="Choose option"
        options={mockOptions}
        helperText="Select your preferred option"
      />
    );
    expect(screen.getByText('Select your preferred option')).toBeDefined();
  });

  it('should not show helper text when error is present', () => {
    render(
      <Select
        label="Choose option"
        options={mockOptions}
        error="Required field"
        helperText="Select your preferred option"
      />
    );
    expect(screen.getByText('Required field')).toBeDefined();
    expect(screen.queryByText('Select your preferred option')).toBeNull();
  });

  it('should call onChange when selection changes', () => {
    const onChange = vi.fn();
    render(<Select label="Choose option" options={mockOptions} onChange={onChange} />);

    const select = screen.getByLabelText('Choose option') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'option2' } });

    expect(onChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Select label="Choose option" options={mockOptions} disabled />);
    const select = screen.getByLabelText('Choose option') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it('should render disabled options', () => {
    const optionsWithDisabled = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
    ];
    render(<Select label="Choose option" options={optionsWithDisabled} />);
    
    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    const disabledOption = options.find(opt => opt.value === 'option2');
    expect(disabledOption?.disabled).toBe(true);
  });
});
