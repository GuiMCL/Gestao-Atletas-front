'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  React.useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
    
    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Something went wrong
        </h1>

        <p className="text-gray-600 text-center mb-6">
          We encountered an unexpected error. Please try again or return to the home page.
        </p>

        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-red-800 mb-2">Error Details:</h2>
          <p className="text-sm text-red-700 font-mono break-words">{error.message}</p>
          {error.digest && (
            <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>
          )}
          {process.env.NODE_ENV === 'development' && error.stack && (
            <details className="mt-3">
              <summary className="text-xs text-red-700 cursor-pointer hover:text-red-800">
                Stack Trace
              </summary>
              <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}
          <p className="text-xs text-gray-600 mt-3">
            Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="primary" size="md">
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="secondary"
            size="md"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
