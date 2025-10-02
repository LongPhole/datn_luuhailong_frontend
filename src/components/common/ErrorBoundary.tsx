import React, { useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useToast from '@/hooks/useToast';

interface FallbackRenderArgs {
  error: Error;
  reset: () => void;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((args: FallbackRenderArgs) => React.ReactNode);
  onError?: (error: Error, info: React.ErrorInfo) => void;
  onReset?: () => void;
  /**
   * When true (default), the boundary will surface an error toast automatically.
   */
  showToast?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const DefaultFallback: React.FC<{ error: Error | null; onReset: () => void }> = ({ error, onReset }) => (
  <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
    <div className="flex items-start gap-3">
      <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-500" aria-hidden="true" />
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          {error?.message && (
            <p className="mt-1 text-sm text-red-600">
              {error.message}
            </p>
          )}
        </div>
        <Button variant="destructive" onClick={onReset}>
          Try again
        </Button>
      </div>
    </div>
  </div>
);

class ErrorBoundaryCore extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  private reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  override render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (typeof fallback === 'function') {
        return fallback({ error: error ?? new Error('Unknown error'), reset: this.reset });
      }

      if (fallback) {
        return fallback;
      }

      return <DefaultFallback error={error} onReset={this.reset} />;
    }

    return children;
  }
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ showToast = true, onError, ...props }) => {
  const { showError } = useToast();

  const handleError = useCallback((error: Error, info: React.ErrorInfo) => {
    if (showToast) {
      showError({
        title: 'Unexpected error',
        description: error.message,
      });
    }
    onError?.(error, info);
  }, [onError, showToast, showError]);

  return <ErrorBoundaryCore {...props} onError={handleError} />;
};

export default ErrorBoundary;
