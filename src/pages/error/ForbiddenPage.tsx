import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

/**
 * 403 Forbidden Page
 * Displayed when users attempt to access resources they don't have permission for
 * Shows appropriate message based on authentication state and provides navigation options
 */

interface LocationState {
  from?: {
    pathname: string;
  };
  error?: string;
}

export const ForbiddenPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  // Get the location user tried to access and any custom error message
  const state = location.state as LocationState;
  const attemptedPath = state?.from?.pathname || 'this resource';
  const customError = state?.error;

  /**
   * Get role-specific home page
   */
  const getRoleHomePage = () => {
    if (!user) return '/login';

    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'MANAGER':
        return '/manager/dashboard';
      case 'USER':
        return '/me/profile';
      default:
        return '/';
    }
  };

  /**
   * Get role-specific message
   */
  const getRoleMessage = () => {
    if (!isAuthenticated || !user) {
      return 'You need to log in to access this resource.';
    }

    return `Your role (${user.role}) does not have permission to access this resource.`;
  };

  const handleGoBack = () => {
    // Try to go back in history, or navigate to role home if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(getRoleHomePage());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6">
              <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Error Code */}
          <div className="text-center mb-6">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              403
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-300">
              Access Forbidden
            </h2>
          </div>

          {/* Error Message */}
          <div className="text-center mb-8 space-y-3">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {customError || getRoleMessage()}
            </p>

            {isAuthenticated && user && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Current User:</span> {user.email}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Role:</span> {user.role}
                </p>
              </div>
            )}

            {attemptedPath !== 'this resource' && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Attempted to access: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{attemptedPath}</code>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Go Back
            </button>

            <Link
              to={getRoleHomePage()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Home className="h-5 w-5" />
              Go to Home
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              If you believe you should have access to this resource, please contact your system administrator.
            </p>
          </div>
        </div>

        {/* Additional Info for Developers (only in development) */}
        {import.meta.env.DEV && (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-xs font-mono text-yellow-800 dark:text-yellow-200">
              <strong>DEV INFO:</strong> Location state: {JSON.stringify(state, null, 2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForbiddenPage;
