/**
 * Error Reporting Utility
 * 
 * Provides centralized error reporting functionality for the application.
 * In production, this would integrate with services like Sentry, LogRocket, etc.
 */

export interface ErrorReport {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
  userAgent: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorReporter {
  private static instance: ErrorReporter;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 10;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  /**
   * Report an error to the error tracking service
   */
  reportError(
    error: Error,
    context?: Record<string, any>,
    severity: ErrorReport['severity'] = 'medium'
  ): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      severity,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', errorReport);
    }

    // Add to queue
    this.addToQueue(errorReport);

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToService(errorReport);
    }
  }

  /**
   * Report a custom message (non-Error)
   */
  reportMessage(
    message: string,
    context?: Record<string, any>,
    severity: ErrorReport['severity'] = 'low'
  ): void {
    const errorReport: ErrorReport = {
      message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      severity,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Message Report:', errorReport);
    }

    // Add to queue
    this.addToQueue(errorReport);

    // Send to service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToService(errorReport);
    }
  }

  /**
   * Add error to local queue for debugging
   */
  private addToQueue(errorReport: ErrorReport): void {
    this.errorQueue.push(errorReport);

    // Keep only the most recent errors
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Store in localStorage for debugging
    this.persistToLocalStorage();
  }

  /**
   * Persist errors to localStorage
   */
  private persistToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('app_error_reports', JSON.stringify(this.errorQueue));
    } catch (e) {
      // Ignore localStorage errors
      console.warn('Failed to persist errors to localStorage:', e);
    }
  }

  /**
   * Send error to external service
   */
  private sendToService(errorReport: ErrorReport): void {
    // In production, integrate with error tracking service
    // Example implementations:
    
    // Sentry:
    // Sentry.captureException(new Error(errorReport.message), {
    //   contexts: { custom: errorReport.context },
    //   level: this.mapSeverityToSentryLevel(errorReport.severity),
    // });

    // LogRocket:
    // LogRocket.captureException(new Error(errorReport.message), {
    //   tags: { severity: errorReport.severity },
    //   extra: errorReport.context,
    // });

    // Custom API endpoint:
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport),
    // }).catch(console.error);

    // For now, just log that we would send it
    console.log('Would send error report to service:', errorReport);
  }

  /**
   * Get all errors from the queue
   */
  getErrors(): ErrorReport[] {
    return [...this.errorQueue];
  }

  /**
   * Clear the error queue
   */
  clearErrors(): void {
    this.errorQueue = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('app_error_reports');
      } catch (e) {
        console.warn('Failed to clear errors from localStorage:', e);
      }
    }
  }

  /**
   * Load errors from localStorage on initialization
   */
  loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('app_error_reports');
      if (stored) {
        this.errorQueue = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load errors from localStorage:', e);
    }
  }
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance();

// Convenience functions
export const reportError = (
  error: Error,
  context?: Record<string, any>,
  severity?: ErrorReport['severity']
) => {
  errorReporter.reportError(error, context, severity);
};

export const reportMessage = (
  message: string,
  context?: Record<string, any>,
  severity?: ErrorReport['severity']
) => {
  errorReporter.reportMessage(message, context, severity);
};
