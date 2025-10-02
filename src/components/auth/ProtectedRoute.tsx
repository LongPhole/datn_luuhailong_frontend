import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * Protected route wrapper component
 * Used with React Router to protect routes that require authentication
 * Can optionally enforce role-based access control
 */

export interface ProtectedRouteProps {
  /** Optional: Required role(s) for accessing this route */
  allowedRoles?: 'ADMIN' | 'MANAGER' | 'USER' | Array<'ADMIN' | 'MANAGER' | 'USER'>;

  /** Optional: Redirect path for unauthenticated users (defaults to /login) */
  redirectTo?: string;

  /** Optional: Custom component to render instead of Outlet */
  children?: React.ReactNode;

  /** Optional: Department ID requirement for MANAGER scoped routes */
  requireDepartmentId?: boolean;

  /** Optional: Employee ID requirement for self-service routes */
  requireEmployeeId?: boolean;
}

/**
 * ProtectedRoute component for route-level authentication and authorization
 *
 * @example
 * // Basic authentication - any logged in user
 * <Route path="/dashboard" element={<ProtectedRoute />}>
 *   <Route index element={<Dashboard />} />
 * </Route>
 *
 * @example
 * // Role-based protection - ADMIN only
 * <Route path="/admin" element={<ProtectedRoute allowedRoles="ADMIN" />}>
 *   <Route path="audit" element={<AuditLogs />} />
 * </Route>
 *
 * @example
 * // Multiple roles allowed
 * <Route path="/employees" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
 *   <Route index element={<EmployeeList />} />
 * </Route>
 *
 * @example
 * // With department ID requirement (for MANAGER scoped routes)
 * <Route
 *   path="/my-department"
 *   element={<ProtectedRoute allowedRoles="MANAGER" requireDepartmentId />}
 * >
 *   <Route index element={<DepartmentDashboard />} />
 * </Route>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectTo = '/login',
  children,
  requireDepartmentId = false,
  requireEmployeeId = false,
}) => {
  const location = useLocation();
  const { user, isAuthenticated, getDepartmentId, getEmployeeId } = useAuthStore();

  // Check authentication
  if (!isAuthenticated || !user) {
    // Redirect to login, saving the attempted location
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles) {
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasRequiredRole = rolesArray.includes(user.role);

    if (!hasRequiredRole) {
      // User doesn't have required role - redirect to forbidden page
      return <Navigate to="/forbidden" state={{ from: location }} replace />;
    }
  }

  // Check department ID requirement (for MANAGER scoped routes)
  if (requireDepartmentId) {
    const departmentId = getDepartmentId();

    // ADMIN users bypass department ID check
    if (user.role !== 'ADMIN' && !departmentId) {
      // Redirect to error page - user doesn't have department assigned
      return (
        <Navigate
          to="/forbidden"
          state={{
            from: location,
            error: 'You must be assigned to a department to access this page'
          }}
          replace
        />
      );
    }
  }

  // Check employee ID requirement (for self-service routes)
  if (requireEmployeeId) {
    const employeeId = getEmployeeId();

    if (!employeeId) {
      // Redirect to error page - user doesn't have employee record
      return (
        <Navigate
          to="/forbidden"
          state={{
            from: location,
            error: 'You must have an employee record to access this page'
          }}
          replace
        />
      );
    }
  }

  // All checks passed - render children or outlet
  return children ? <>{children}</> : <Outlet />;
};

/**
 * Convenience wrapper for admin-only routes
 */
export const AdminRoute: React.FC<Omit<ProtectedRouteProps, 'allowedRoles'>> = (props) => {
  return <ProtectedRoute {...props} allowedRoles="ADMIN" />;
};

/**
 * Convenience wrapper for manager-only routes
 */
export const ManagerRoute: React.FC<Omit<ProtectedRouteProps, 'allowedRoles'>> = (props) => {
  return <ProtectedRoute {...props} allowedRoles="MANAGER" />;
};

/**
 * Convenience wrapper for user-only routes
 */
export const UserRoute: React.FC<Omit<ProtectedRouteProps, 'allowedRoles'>> = (props) => {
  return <ProtectedRoute {...props} allowedRoles="USER" />;
};

/**
 * Convenience wrapper for admin or manager routes
 */
export const AdminOrManagerRoute: React.FC<Omit<ProtectedRouteProps, 'allowedRoles'>> = (props) => {
  return <ProtectedRoute {...props} allowedRoles={['ADMIN', 'MANAGER']} />;
};

/**
 * Convenience wrapper for authenticated routes (any role)
 */
export const AuthenticatedRoute: React.FC<Omit<ProtectedRouteProps, 'allowedRoles'>> = (props) => {
  return <ProtectedRoute {...props} allowedRoles={['ADMIN', 'MANAGER', 'USER']} />;
};

export default ProtectedRoute;
