import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUpload } from '../FileUpload';

describe('FileUpload', () => {
  it('should render with label', () => {
    render(<FileUpload label="Upload photo" />);
    expect(screen.getByText('Upload photo')).toBeDefined();
  });

  it('should render with error message', () => {
    render(<FileUpload label="Upload photo" error="File too large" />);
    expect(screen.getByText('File too large')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('should render with helper text', () => {
    render(<FileUpload label="Upload photo" helperText="Max size: 5MB" />);
    expect(screen.getByText('Max size: 5MB')).toBeDefined();
  });

  it('should not show helper text when error is present', () => {
    render(
      <FileUpload
        label="Upload photo"
        error="File too large"
        helperText="Max size: 5MB"
      />
    );
    expect(screen.getByText('File too large')).toBeDefined();
    expect(screen.queryByText('Max size: 5MB')).toBeNull();
  });

  it('should call onChange when file is selected', () => {
    const onChange = vi.fn();
    render(<FileUpload label="Upload photo" onChange={onChange} />);

    const input = screen.getByLabelText('Upload photo') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith(file);
  });

  it('should display file name after selection', () => {
    render(<FileUpload label="Upload photo" />);

    const input = screen.getByLabelText('Upload photo') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('test.png')).toBeDefined();
  });

  it('should show remove button after file selection', () => {
    render(<FileUpload label="Upload photo" />);

    const input = screen.getByLabelText('Upload photo') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('Remove')).toBeDefined();
  });

  it('should clear file when remove button is clicked', () => {
    const onChange = vi.fn();
    render(<FileUpload label="Upload photo" onChange={onChange} />);

    const input = screen.getByLabelText('Upload photo') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText('test.png')).toBeDefined();

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(screen.queryByText('test.png')).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('should validate file size when maxSize is set', () => {
    const onChange = vi.fn();
    const maxSize = 1024; // 1KB
    render(<FileUpload label="Upload photo" maxSize={maxSize} onChange={onChange} />);

    const input = screen.getByLabelText('Upload photo') as HTMLInputElement;
    const largeFile = new File(['x'.repeat(2048)], 'large.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(screen.getByText(/File size exceeds/)).toBeDefined();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<FileUpload label="Upload photo" disabled />);
    const input = screen.getByLabelText('Upload photo') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('should accept specific file types', () => {
    render(<FileUpload label="Upload photo" accept="image/jpeg,image/png" />);
    const input = screen.getByLabelText('Upload photo') as HTMLInputElement;
    expect(input.accept).toBe('image/jpeg,image/png');
  });
});
