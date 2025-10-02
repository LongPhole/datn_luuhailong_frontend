import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();

  // Check if user is authenticated by looking for JWT token in localStorage
  const isAuthenticated = () => {
    const token = localStorage.getItem('hrm_auth_token');

    if (!token) return false;

    try {
      // Basic token validation - check if it's not expired
      // In a real application, you would validate the token properly
      const parts = token.split('.');

      if (parts.length !== 3) return false;

      const payloadPart = parts[1];

      if (!payloadPart) return false;

      const payload = JSON.parse(atob(payloadPart));
      const currentTime = Date.now() / 1000;

      return payload.exp > currentTime;
    } catch (error) {
      // If token is invalid, remove it and return false
      localStorage.removeItem('auth_token');

      return false;
    }
  };

  if (!isAuthenticated()) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;