import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorReporter, reportError, reportMessage } from '../error-reporting';

describe('ErrorReporter', () => {
  let errorReporter: ErrorReporter;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    errorReporter = ErrorReporter.getInstance();
    errorReporter.clearErrors();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = ErrorReporter.getInstance();
      const instance2 = ErrorReporter.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('reportError', () => {
    it('reports error with correct structure', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      errorReporter.reportError(error, context, 'high');

      const errors = errorReporter.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        message: 'Test error',
        context,
        severity: 'high',
      });
      expect(errors[0].timestamp).toBeDefined();
      expect(errors[0].userAgent).toBeDefined();
      expect(errors[0].url).toBeDefined();
    });

    it('logs error in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Dev error');
      errorReporter.reportError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('includes stack trace', () => {
      const error = new Error('Error with stack');
      errorReporter.reportError(error);

      const errors = errorReporter.getErrors();
      expect(errors[0].stack).toBeDefined();
    });

    it('defaults to medium severity', () => {
      const error = new Error('Test error');
      errorReporter.reportError(error);

      const errors = errorReporter.getErrors();
      expect(errors[0].severity).toBe('medium');
    });
  });

  describe('reportMessage', () => {
    it('reports custom message', () => {
      const message = 'Custom warning message';
      const context = { component: 'TestComponent' };

      errorReporter.reportMessage(message, context, 'low');

      const errors = errorReporter.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        message,
        context,
        severity: 'low',
      });
    });

    it('logs message in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      errorReporter.reportMessage('Test message');

      expect(consoleWarnSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('error queue management', () => {
    it('maintains queue of errors', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      errorReporter.reportError(error1);
      errorReporter.reportError(error2);

      const errors = errorReporter.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('Error 1');
      expect(errors[1].message).toBe('Error 2');
    });

    it('limits queue size to 10 errors', () => {
      for (let i = 0; i < 15; i++) {
        errorReporter.reportError(new Error(`Error ${i}`));
      }

      const errors = errorReporter.getErrors();
      expect(errors).toHaveLength(10);
      expect(errors[0].message).toBe('Error 5'); // First 5 should be removed
      expect(errors[9].message).toBe('Error 14');
    });

    it('clears error queue', () => {
      errorReporter.reportError(new Error('Test error'));
      expect(errorReporter.getErrors()).toHaveLength(1);

      errorReporter.clearErrors();
      expect(errorReporter.getErrors()).toHaveLength(0);
    });
  });

  describe('localStorage persistence', () => {
    it('persists errors to localStorage', () => {
      const error = new Error('Persistent error');
      errorReporter.reportError(error);

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'app_error_reports',
        expect.any(String)
      );
    });

    it('clears localStorage when clearing errors', () => {
      errorReporter.reportError(new Error('Test'));
      errorReporter.clearErrors();

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('app_error_reports');
    });

    it('handles localStorage errors gracefully', () => {
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          throw new Error('Storage full');
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      // Should not throw
      expect(() => {
        errorReporter.reportError(new Error('Test'));
      }).not.toThrow();
    });
  });

  describe('convenience functions', () => {
    it('reportError function works', () => {
      const error = new Error('Convenience error');
      reportError(error, { test: true }, 'critical');

      const errors = errorReporter.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Convenience error');
      expect(errors[0].severity).toBe('critical');
    });

    it('reportMessage function works', () => {
      reportMessage('Convenience message', { test: true }, 'low');

      const errors = errorReporter.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Convenience message');
      expect(errors[0].severity).toBe('low');
    });
  });

  describe('error context', () => {
    it('captures user agent', () => {
      const error = new Error('Test');
      errorReporter.reportError(error);

      const errors = errorReporter.getErrors();
      expect(errors[0].userAgent).toBeDefined();
      expect(typeof errors[0].userAgent).toBe('string');
    });

    it('captures URL', () => {
      const error = new Error('Test');
      errorReporter.reportError(error);

      const errors = errorReporter.getErrors();
      expect(errors[0].url).toBeDefined();
      expect(typeof errors[0].url).toBe('string');
    });

    it('captures timestamp', () => {
      const error = new Error('Test');
      errorReporter.reportError(error);

      const errors = errorReporter.getErrors();
      expect(errors[0].timestamp).toBeDefined();
      expect(new Date(errors[0].timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});
