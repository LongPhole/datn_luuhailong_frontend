import React from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../../components/forms/LoginForm';
import { useAuth } from '../../stores/authStore';
import { LoginRequest } from '../../types';

interface LocationState {
  from?: Location;
  message?: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, isAuthenticated, isLoading, error, clearError, logout } = useAuth();

  // Extract redirect location from router state
  const from = (location.state as LocationState)?.from?.pathname || '/';
  const redirectMessage = (location.state as LocationState)?.message;

  // Clear initial authentication errors when login page loads (but not login attempt errors)
  React.useEffect(() => {
    if (error && error === 'No authentication token found') {
      clearError();
    }
  }, []); // Empty dependency array means this runs only once on component mount

  // Helper function to check if a path is valid for the user's role
  const isValidPathForRole = (path: string, role: string): boolean => {
    if (path === '/' || path === '/login') {
      return false; // Always redirect to role-specific home
    }

    // Check if path is allowed for the user's role
    if (role === 'ADMIN') {
      // Admin can only access admin routes
      return path.startsWith('/admin');
    }

    if (role === 'MANAGER') {
      // Manager can access manager and shared routes
      return path.startsWith('/manager') ||
             path.startsWith('/departments') ||
             path.startsWith('/employees');
    }

    if (role === 'USER') {
      // User can only access self-service routes
      return path.startsWith('/me');
    }

    return false;
  };

  // If already authenticated, redirect based on role
  if (isAuthenticated && user) {
    // Check if saved redirect location is valid for user's role
    if (from && from !== '/' && isValidPathForRole(from, user.role)) {
      return <Navigate to={from} replace />;
    }

    // Otherwise, redirect to role-specific home page
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      case 'MANAGER':
        return <Navigate to="/manager/dashboard" replace />;
      case 'USER':
        return <Navigate to="/me/profile" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  const handleLogin = async (credentials: LoginRequest) => {
    try {
      await login(credentials);
      // Redirect will happen automatically on next render when isAuthenticated becomes true
    } catch (err) {
      // Error is handled by the auth store and displayed in the form
    }
  };

  const handleClearError = () => {
    clearError();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
            <div className="h-6 w-6 bg-primary-foreground rounded"></div>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            HR Management System
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your organization's departments and employees
          </p>
        </div>

        {/* Redirect Message */}
        {redirectMessage && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {redirectMessage}
            </p>
          </div>
        )}

        {/* Login Form */}
        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
          onClearError={handleClearError}
        />

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            This is a demo application for showcasing HR management features.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;