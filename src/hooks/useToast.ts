import { useCallback } from 'react';
import { ToastOptions, ToastVariant, useToastContext } from '@/components/ui/toast';

export interface ToastMessage {
  title: string;
  description?: string;
  duration?: number;
}

const buildMessage = (
  options: ToastMessage,
  variant: ToastVariant,
): ToastOptions => ({
  title: options.title,
  description: options.description,
  duration: options.duration,
  variant,
});

export const useToast = () => {
  const { addToast, removeToast, clear } = useToastContext();

  const showToast = useCallback((options: ToastOptions) => addToast(options), [addToast]);

  const showSuccess = useCallback(
    (options: ToastMessage) => addToast(buildMessage(options, 'success')),
    [addToast],
  );

  const showError = useCallback(
    (options: ToastMessage) => addToast(buildMessage(options, 'destructive')),
    [addToast],
  );

  const showInfo = useCallback(
    (options: ToastMessage) => addToast(buildMessage(options, 'default')),
    [addToast],
  );

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    dismissToast: removeToast,
    clearToasts: clear,
  };
};

export type UseToastReturn = ReturnType<typeof useToast>;

export default useToast;
