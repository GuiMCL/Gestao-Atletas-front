import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from '../FormField';
import { Input } from '../Input';

describe('FormField', () => {
  it('should render with label', () => {
    render(
      <FormField label="Username">
        <Input />
      </FormField>
    );
    expect(screen.getByText('Username')).toBeDefined();
  });

  it('should render required indicator when required is true', () => {
    render(
      <FormField label="Email" required>
        <Input />
      </FormField>
    );
    expect(screen.getByText('*')).toBeDefined();
  });

  it('should render with error message', () => {
    render(
      <FormField label="Password" error="Password is required">
        <Input />
      </FormField>
    );
    expect(screen.getByText('Password is required')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('should render with helper text', () => {
    render(
      <FormField label="Username" helperText="Choose a unique username">
        <Input />
      </FormField>
    );
    expect(screen.getByText('Choose a unique username')).toBeDefined();
  });

  it('should not show helper text when error is present', () => {
    render(
      <FormField
        label="Email"
        error="Invalid email"
        helperText="Enter your email address"
      >
        <Input />
      </FormField>
    );
    expect(screen.getByText('Invalid email')).toBeDefined();
    expect(screen.queryByText('Enter your email address')).toBeNull();
  });

  it('should pass htmlFor to label', () => {
    render(
      <FormField label="Name" htmlFor="name-input">
        <Input id="name-input" />
      </FormField>
    );
    const label = screen.getByText('Name') as HTMLLabelElement;
    expect(label.htmlFor).toBe('name-input');
  });

  it('should set aria-invalid on child when error is present', () => {
    render(
      <FormField label="Email" error="Invalid email" htmlFor="email-input">
        <input id="email-input" />
      </FormField>
    );
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('should set aria-describedby on child when error is present', () => {
    render(
      <FormField label="Email" error="Invalid email" htmlFor="email-input">
        <input id="email-input" />
      </FormField>
    );
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.getAttribute('aria-describedby')).toContain('email-input-error');
  });

  it('should set aria-describedby on child when helper text is present', () => {
    render(
      <FormField label="Email" helperText="Enter your email" htmlFor="email-input">
        <input id="email-input" />
      </FormField>
    );
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.getAttribute('aria-describedby')).toContain('email-input-helper');
  });

  it('should render with fullWidth', () => {
    const { container } = render(
      <FormField label="Email" fullWidth>
        <Input />
      </FormField>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('w-full');
  });
});
