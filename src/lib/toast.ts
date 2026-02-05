/**
 * Toast notification utilities
 * Provides a centralized interface for displaying toast notifications
 * Validates: Requirements 1.2, 10.1
 */

import toast from 'react-hot-toast';

/**
 * Display a success toast notification
 */
export function showSuccessToast(message: string) {
  return toast.success(message, {
    duration: 4000,
    position: 'top-right',
  });
}

/**
 * Display an error toast notification
 */
export function showErrorToast(message: string) {
  return toast.error(message, {
    duration: 5000,
    position: 'top-right',
  });
}

/**
 * Display an info toast notification
 */
export function showInfoToast(message: string) {
  return toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
  });
}

/**
 * Display a loading toast notification
 * Returns a toast ID that can be used to dismiss or update the toast
 */
export function showLoadingToast(message: string) {
  return toast.loading(message, {
    position: 'top-right',
  });
}

/**
 * Dismiss a specific toast by ID
 */
export function dismissToast(toastId: string) {
  toast.dismiss(toastId);
}

/**
 * Dismiss all active toasts
 */
export function dismissAllToasts() {
  toast.dismiss();
}

/**
 * Update an existing toast
 */
export function updateToast(toastId: string, message: string, type: 'success' | 'error') {
  if (type === 'success') {
    toast.success(message, { id: toastId });
  } else {
    toast.error(message, { id: toastId });
  }
}
