import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * Role-based access control component
 * Wraps child components and only renders them if user has required role
 * Redirects to 403 Forbidden page if user lacks permission
 */

export interface RequireRoleProps {
  /** Required role(s) - can be a single role or array of roles */
  allowedRoles: 'ADMIN' | 'MANAGER' | 'USER' | Array<'ADMIN' | 'MANAGER' | 'USER'>;

  /** Child components to render if user has required role */
  children: React.ReactNode;

  /** Optional: redirect path if unauthorized (defaults to /forbidden) */
  redirectTo?: string;

  /** Optional: custom fallback component to render instead of redirect */
  fallback?: React.ReactNode;
}

/**
 * RequireRole component for role-based access control
 *
 * @example
 * // Single role requirement
 * <RequireRole allowedRoles="ADMIN">
 *   <AdminDashboard />
 * </RequireRole>
 *
 * @example
 * // Multiple roles allowed
 * <RequireRole allowedRoles={['ADMIN', 'MANAGER']}>
 *   <EmployeeManagement />
 * </RequireRole>
 *
 * @example
 * // Custom fallback
 * <RequireRole allowedRoles="ADMIN" fallback={<p>Admin access required</p>}>
 *   <AuditLogs />
 * </RequireRole>
 */
export const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles,
  children,
  redirectTo = '/forbidden',
  fallback,
}) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize allowedRoles to array for consistent checking
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  // Check if user has one of the allowed roles
  const hasRequiredRole = rolesArray.includes(user.role);

  // If user doesn't have required role
  if (!hasRequiredRole) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Otherwise redirect to forbidden page (or custom redirect path)
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User has required role - render children
  return <>{children}</>;
};

/**
 * Convenience component for ADMIN-only access
 */
export const RequireAdmin: React.FC<Omit<RequireRoleProps, 'allowedRoles'>> = (props) => {
  return <RequireRole {...props} allowedRoles="ADMIN" />;
};

/**
 * Convenience component for MANAGER-only access
 */
export const RequireManager: React.FC<Omit<RequireRoleProps, 'allowedRoles'>> = (props) => {
  return <RequireRole {...props} allowedRoles="MANAGER" />;
};

/**
 * Convenience component for USER-only access
 */
export const RequireUser: React.FC<Omit<RequireRoleProps, 'allowedRoles'>> = (props) => {
  return <RequireRole {...props} allowedRoles="USER" />;
};

/**
 * Convenience component for ADMIN or MANAGER access
 */
export const RequireAdminOrManager: React.FC<Omit<RequireRoleProps, 'allowedRoles'>> = (props) => {
  return <RequireRole {...props} allowedRoles={['ADMIN', 'MANAGER']} />;
};

/**
 * Convenience component for any authenticated user
 */
export const RequireAuth: React.FC<Omit<RequireRoleProps, 'allowedRoles'>> = (props) => {
  return <RequireRole {...props} allowedRoles={['ADMIN', 'MANAGER', 'USER']} />;
};

export default RequireRole;
