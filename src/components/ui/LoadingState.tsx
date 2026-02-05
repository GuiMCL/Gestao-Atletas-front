'use client';

import React from 'react';
import { Spinner } from './Spinner';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando...',
  size = 'md',
  fullScreen = false,
  className = '',
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <Spinner size={size} color="primary" />
        {message && (
          <p className="text-gray-600 text-center animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
};

export const LoadingOverlay: React.FC<LoadingStateProps> = (props) => {
  return <LoadingState {...props} fullScreen={true} />;
};
