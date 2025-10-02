import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ToastVariant = 'default' | 'success' | 'destructive';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface ToastInternal {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
}

interface ToastContextValue {
  toasts: ToastInternal[];
  addToast: (toast: ToastOptions) => string;
  removeToast: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION = 5000;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantClasses: Record<ToastVariant, string> = {
  default: 'border border-gray-200 bg-white text-gray-900 shadow-lg',
  success: 'border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-lg',
  destructive: 'border border-red-200 bg-red-50 text-red-900 shadow-lg',
};

const accentClasses: Record<ToastVariant, string> = {
  default: 'bg-indigo-500/80',
  success: 'bg-emerald-500/80',
  destructive: 'bg-red-500/80',
};

const generateId = () => `toast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeToast = (toast: ToastOptions): ToastInternal => ({
  id: toast.id ?? generateId(),
  title: toast.title,
  description: toast.description,
  variant: toast.variant ?? 'default',
  duration: toast.duration ?? DEFAULT_DURATION,
  action: toast.action,
});

const ToastItem: React.FC<{ toast: ToastInternal; onDismiss: () => void }> = ({ toast, onDismiss }) => (
  <div className={`pointer-events-auto relative overflow-hidden rounded-lg px-4 py-3 ${variantClasses[toast.variant]}`}>
    <span className={`absolute left-0 top-0 h-full w-1 ${accentClasses[toast.variant]}`} aria-hidden="true" />
    <div className="flex flex-1 flex-col gap-1 pr-6">
      <p className="text-sm font-semibold leading-tight">{toast.title}</p>
      {toast.description && (
        <p className="text-sm text-gray-600">
          {toast.description}
        </p>
      )}
      {toast.action && (
        <div className="pt-2">
          <Button
            type="button"
            size="sm"
            variant={toast.variant === 'destructive' ? 'destructive' : 'secondary'}
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
          >
            {toast.action.label}
          </Button>
        </div>
      )}
    </div>
    <button
      type="button"
      className="absolute right-2 top-2 rounded-md p-1 text-sm text-gray-500 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      onClick={onDismiss}
      aria-label="Dismiss notification"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);
  const timers = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timers.current[id] !== undefined) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const clear = useCallback(() => {
    Object.values(timers.current).forEach((timerId) => window.clearTimeout(timerId));
    timers.current = {};
    setToasts([]);
  }, []);

  const addToast = useCallback((toastOptions: ToastOptions) => {
    const toast = normalizeToast(toastOptions);
    setToasts((prev) => [...prev, toast]);

    if (toast.duration > 0) {
      timers.current[toast.id] = window.setTimeout(() => removeToast(toast.id), toast.duration);
    }

    return toast.id;
  }, [removeToast]);

  const contextValue = useMemo<ToastContextValue>(() => ({
    toasts,
    addToast,
    removeToast,
    clear,
  }), [toasts, addToast, removeToast, clear]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

export const ToastViewport: React.FC = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('ToastViewport must be used within a ToastProvider');
  }

  const { toasts, removeToast } = context;

  return (
    <div className="pointer-events-none fixed top-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;



