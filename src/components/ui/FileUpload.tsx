'use client';

import React, { forwardRef, useState, useCallback } from 'react';

export interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  validationState?: 'default' | 'error' | 'success';
  accept?: string;
  maxSize?: number; // in bytes
  preview?: boolean;
  onChange?: (file: File | null) => void;
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      validationState = 'default',
      accept = 'image/*',
      maxSize,
      preview = true,
      onChange,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    const inputId = id || `fileupload-${Math.random().toString(36).substr(2, 9)}`;
    const effectiveValidationState = error || localError ? 'error' : validationState;
    const effectiveError = error || localError;

    const handleFileChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setLocalError(null);

        if (file) {
          // Validate file size
          if (maxSize && file.size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
            setLocalError(`File size exceeds ${maxSizeMB}MB limit`);
            setFileName(null);
            setPreviewUrl(null);
            onChange?.(null);
            return;
          }

          setFileName(file.name);

          // Generate preview for images
          if (preview && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
          } else {
            setPreviewUrl(null);
          }

          onChange?.(file);
        } else {
          setFileName(null);
          setPreviewUrl(null);
          onChange?.(null);
        }
      },
      [maxSize, preview, onChange]
    );

    const handleClear = useCallback(() => {
      setFileName(null);
      setPreviewUrl(null);
      setLocalError(null);
      onChange?.(null);
      
      // Reset the input
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    }, [inputId, onChange]);

    const baseClasses = 'block w-full text-sm text-gray-900 border rounded-lg cursor-pointer bg-white focus:outline-none transition-colors';

    const stateClasses = {
      default: 'border-gray-300 focus:border-blue-500',
      error: 'border-red-500 focus:border-red-500',
      success: 'border-green-500 focus:border-green-500',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className={widthClass}>
          <input
            ref={ref}
            id={inputId}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className={`${baseClasses} ${stateClasses[effectiveValidationState]} ${className}`}
            {...props}
          />
          
          {fileName && (
            <div className="mt-2 flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm text-gray-700 truncate">{fileName}</span>
              <button
                type="button"
                onClick={handleClear}
                className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          )}

          {previewUrl && (
            <div className="mt-2">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>

        {effectiveError && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {effectiveError}
          </p>
        )}
        {helperText && !effectiveError && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';
