'use client';

import React, { useState } from 'react';
import { Select, DatePicker, FileUpload, FormField, Input, Button } from '../index';

/**
 * Example demonstrating the usage of form components
 * This file is for reference only and is not used in the application
 */
export function FormComponentsExample() {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    jerseyNumber: '',
    matchDate: '',
    photo: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const positionOptions = [
    { value: 'setter', label: 'Setter' },
    { value: 'outside', label: 'Outside Hitter' },
    { value: 'opposite', label: 'Opposite' },
    { value: 'middle', label: 'Middle Blocker' },
    { value: 'libero', label: 'Libero' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.position) newErrors.position = 'Position is required';
    if (!formData.jerseyNumber) newErrors.jerseyNumber = 'Jersey number is required';
    if (!formData.matchDate) newErrors.matchDate = 'Match date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log('Form submitted:', formData);
    alert('Form submitted successfully!');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Form Components Example</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Using FormField wrapper */}
        <FormField
          label="Athlete Name"
          error={errors.name}
          helperText="Enter the athlete's full name"
          required
          fullWidth
        >
          <Input
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              setErrors({ ...errors, name: '' });
            }}
            placeholder="John Doe"
          />
        </FormField>

        {/* Select component */}
        <Select
          label="Position"
          options={positionOptions}
          placeholder="Select a position"
          value={formData.position}
          onChange={(e) => {
            setFormData({ ...formData, position: e.target.value });
            setErrors({ ...errors, position: '' });
          }}
          error={errors.position}
          helperText="Choose the athlete's primary position"
          fullWidth
        />

        {/* Input with validation */}
        <Input
          label="Jersey Number"
          type="number"
          value={formData.jerseyNumber}
          onChange={(e) => {
            setFormData({ ...formData, jerseyNumber: e.target.value });
            setErrors({ ...errors, jerseyNumber: '' });
          }}
          error={errors.jerseyNumber}
          helperText="Must be between 1 and 99"
          fullWidth
        />

        {/* DatePicker component */}
        <DatePicker
          label="Match Date"
          showTime
          value={formData.matchDate}
          onChange={(e) => {
            setFormData({ ...formData, matchDate: e.target.value });
            setErrors({ ...errors, matchDate: '' });
          }}
          error={errors.matchDate}
          helperText="Select the date and time of the match"
          fullWidth
        />

        {/* FileUpload component */}
        <FileUpload
          label="Athlete Photo"
          accept="image/jpeg,image/png"
          maxSize={5 * 1024 * 1024} // 5MB
          onChange={(file) => {
            setFormData({ ...formData, photo: file });
          }}
          helperText="Upload a photo (max 5MB, JPG or PNG)"
          fullWidth
        />

        {/* Submit button */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" variant="primary" fullWidth>
            Submit
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                name: '',
                position: '',
                jerseyNumber: '',
                matchDate: '',
                photo: null,
              });
              setErrors({});
            }}
            fullWidth
          >
            Reset
          </Button>
        </div>
      </form>

      {/* Display form data */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Form Data:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(
            {
              ...formData,
              photo: formData.photo ? formData.photo.name : null,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
