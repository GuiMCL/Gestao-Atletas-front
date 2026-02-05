'use client';

import React, { useState } from 'react';
import { ErrorBoundary, PageErrorBoundary } from '../ErrorBoundary';
import { reportError, reportMessage } from '@/lib/error-reporting';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

/**
 * Example demonstrating error boundary usage
 */

// Component that can throw errors
const ProblematicComponent = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error('This is a simulated error!');
  }
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded">
      <p className="text-green-800">Component is working correctly!</p>
    </div>
  );
};

// Component with async error
const AsyncErrorComponent = () => {
  const [error, setError] = useState<string | null>(null);

  const handleAsyncError = async () => {
    try {
      // Simulate async operation that fails
      await new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Async operation failed')), 1000)
      );
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      reportError(error, { component: 'AsyncErrorComponent' }, 'high');
    }
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
      <p className="text-blue-800 mb-2">Async Error Handling Example</p>
      <Button onClick={handleAsyncError} size="sm">
        Trigger Async Error
      </Button>
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export const ErrorBoundaryExample = () => {
  const [shouldError1, setShouldError1] = useState(false);
  const [shouldError2, setShouldError2] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Error Boundary Examples</h1>

      {/* Example 1: Basic Error Boundary */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">1. Basic Error Boundary</h2>
        <p className="text-gray-600 mb-4">
          This demonstrates a basic error boundary that catches errors in child components.
        </p>
        <div className="space-y-4">
          <Button
            onClick={() => setShouldError1(!shouldError1)}
            variant={shouldError1 ? 'secondary' : 'primary'}
          >
            {shouldError1 ? 'Fix Component' : 'Break Component'}
          </Button>
          <ErrorBoundary>
            <ProblematicComponent shouldError={shouldError1} />
          </ErrorBoundary>
        </div>
      </Card>

      {/* Example 2: Error Boundary with Custom Fallback */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">2. Custom Fallback UI</h2>
        <p className="text-gray-600 mb-4">
          This shows how to provide a custom fallback UI for errors.
        </p>
        <div className="space-y-4">
          <Button
            onClick={() => setShouldError2(!shouldError2)}
            variant={shouldError2 ? 'secondary' : 'primary'}
          >
            {shouldError2 ? 'Fix Component' : 'Break Component'}
          </Button>
          <ErrorBoundary
            fallback={
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 font-semibold">Custom Error Message</p>
                <p className="text-yellow-700 text-sm mt-1">
                  This is a custom fallback UI. You can style it however you want!
                </p>
              </div>
            }
          >
            <ProblematicComponent shouldError={shouldError2} />
          </ErrorBoundary>
        </div>
      </Card>

      {/* Example 3: Error Boundary with Reset Keys */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">3. Auto-Reset with Reset Keys</h2>
        <p className="text-gray-600 mb-4">
          Error boundary automatically resets when the reset key changes.
        </p>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setResetKey(resetKey + 1)}>
              Change Reset Key (Current: {resetKey})
            </Button>
          </div>
          <ErrorBoundary resetKeys={[resetKey]}>
            <ProblematicComponent shouldError={resetKey % 2 === 1} />
          </ErrorBoundary>
        </div>
      </Card>

      {/* Example 4: Async Error Handling */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">4. Async Error Handling</h2>
        <p className="text-gray-600 mb-4">
          Error boundaries don't catch async errors. Use try-catch and error reporting.
        </p>
        <AsyncErrorComponent />
      </Card>

      {/* Example 5: Page Error Boundary */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">5. Page Error Boundary</h2>
        <p className="text-gray-600 mb-4">
          Use PageErrorBoundary for page-level error handling with context.
        </p>
        <PageErrorBoundary pageName="ExamplePage">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <p className="text-purple-800">
              This content is wrapped in a PageErrorBoundary
            </p>
          </div>
        </PageErrorBoundary>
      </Card>

      {/* Example 6: Manual Error Reporting */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">6. Manual Error Reporting</h2>
        <p className="text-gray-600 mb-4">
          Report errors and messages manually to the error tracking system.
        </p>
        <div className="space-y-2">
          <Button
            onClick={() => {
              reportError(
                new Error('Manual error report'),
                { userId: '123', action: 'test' },
                'medium'
              );
              alert('Error reported! Check console.');
            }}
            size="sm"
          >
            Report Error
          </Button>
          <Button
            onClick={() => {
              reportMessage(
                'User performed an action',
                { action: 'buttonClick' },
                'low'
              );
              alert('Message reported! Check console.');
            }}
            size="sm"
            variant="secondary"
          >
            Report Message
          </Button>
        </div>
      </Card>

      {/* Example 7: Nested Error Boundaries */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">7. Nested Error Boundaries</h2>
        <p className="text-gray-600 mb-4">
          Multiple error boundaries can be nested to isolate errors.
        </p>
        <ErrorBoundary>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded">
              <p className="text-gray-800 mb-2">Parent Boundary</p>
              <ErrorBoundary
                fallback={
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 text-sm">Child boundary caught an error</p>
                  </div>
                }
              >
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 text-sm">Child content (working)</p>
                </div>
              </ErrorBoundary>
            </div>
          </div>
        </ErrorBoundary>
      </Card>
    </div>
  );
};
