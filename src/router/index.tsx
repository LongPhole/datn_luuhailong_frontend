import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, ManagerRoute, UserRoute, AdminOrManagerRoute } from '../components/auth/ProtectedRoute';

/**
 * Application Router with Role-Based Access Control
 *
 * Route Structure:
 * - /login - Public route for authentication
 * - /forbidden - 403 error page
 * - /admin/* - ADMIN only routes
 * - /manager/* - MANAGER only routes
 * - /me/* - USER self-service routes
 * - /departments/* - ADMIN and MANAGER routes
 * - /employees/* - ADMIN and MANAGER routes
 * - /attendances/* - All authenticated users (with role-based filtering)
 */

// ============================================================================
// Lazy-loaded Page Components
// ============================================================================

// Public pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const ForbiddenPage = lazy(() => import('../pages/error/ForbiddenPage'));

// Admin pages
const AdminDashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const DepartmentListPage = lazy(() => import('../pages/admin/DepartmentListPage'));
const DepartmentDetailPage = lazy(() => import('../pages/admin/DepartmentDetailPage'));
const EmployeeListPage = lazy(() => import('../pages/admin/EmployeeListPage'));
const EmployeeDetailPage = lazy(() => import('../pages/admin/EmployeeDetailPage'));
const AttendanceListPage = lazy(() => import('../pages/admin/AttendanceListPage'));
const ReportsPage = lazy(() => import('../pages/admin/ReportsPage'));
const AuditLogsPage = lazy(() => import('../pages/admin/AuditLogsPage'));
const SettingsPage = lazy(() => import('../pages/admin/SettingsPage'));

// Manager pages
const ManagerDashboardPage = lazy(() => import('../pages/manager/DashboardPage'));
const MyDepartmentPage = lazy(() => import('../pages/manager/MyDepartmentPage'));
const DepartmentEmployeesPage = lazy(() => import('../pages/manager/DepartmentEmployeesPage'));
const DepartmentAttendancePage = lazy(() => import('../pages/manager/DepartmentAttendancePage'));
const DepartmentReportsPage = lazy(() => import('../pages/manager/DepartmentReportsPage'));

// User pages
const UserProfilePage = lazy(() => import('../pages/user/ProfilePage'));
const UserAttendancePage = lazy(() => import('../pages/user/AttendancePage'));

// Shared pages (different access levels)
const AttendanceCalendarPage = lazy(() => import('../pages/shared/AttendanceCalendarPage'));

// ============================================================================
// Loading Fallback Component
// ============================================================================

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// ============================================================================
// Layout Components
// ============================================================================

const AdminLayout = lazy(() => import('../components/layout/AdminLayout'));
const ManagerLayout = lazy(() => import('../components/layout/ManagerLayout'));
const UserLayout = lazy(() => import('../components/layout/UserLayout'));

// ============================================================================
// Main Router Component
// ============================================================================

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ================================================================ */}
        {/* Public Routes */}
        {/* ================================================================ */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* ================================================================ */}
        {/* ADMIN Routes - Full system access */}
        {/* ================================================================ */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />

            {/* Department Management */}
            <Route path="departments">
              <Route index element={<DepartmentListPage />} />
              <Route path=":id" element={<DepartmentDetailPage />} />
            </Route>

            {/* Employee Management */}
            <Route path="employees">
              <Route index element={<EmployeeListPage />} />
              <Route path=":id" element={<EmployeeDetailPage />} />
            </Route>

            {/* Attendance Management */}
            <Route path="attendances">
              <Route index element={<AttendanceListPage />} />
              <Route path="calendar" element={<AttendanceCalendarPage />} />
            </Route>

            {/* Reports & Analytics */}
            <Route path="reports" element={<ReportsPage />} />

            {/* Audit Logs - ADMIN only */}
            <Route path="audit" element={<AuditLogsPage />} />

            {/* Settings - ADMIN only */}
            <Route path="settings" element={<SettingsPage />} />

            {/* Profile - ADMIN */}
            <Route path="profile" element={<UserProfilePage />} />
          </Route>
        </Route>

        {/* ================================================================ */}
        {/* MANAGER Routes - Department scoped access */}
        {/* ================================================================ */}
        <Route path="/manager" element={<ManagerRoute requireDepartmentId />}>
          <Route element={<ManagerLayout />}>
            <Route index element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboardPage />} />

            {/* My Department */}
            <Route path="my-department" element={<MyDepartmentPage />} />

            {/* Department Employees */}
            <Route path="employees">
              <Route index element={<DepartmentEmployeesPage />} />
              <Route path=":id" element={<EmployeeDetailPage />} />
            </Route>

            {/* Department Attendance */}
            <Route path="attendances">
              <Route index element={<DepartmentAttendancePage />} />
              <Route path="calendar" element={<AttendanceCalendarPage />} />
            </Route>

            {/* Department Reports */}
            <Route path="reports" element={<DepartmentReportsPage />} />

            {/* Profile - MANAGER */}
            <Route path="profile" element={<UserProfilePage />} />
          </Route>
        </Route>

        {/* ================================================================ */}
        {/* USER Routes - Self-service access */}
        {/* ================================================================ */}
        <Route path="/me" element={<UserRoute requireEmployeeId />}>
          <Route element={<UserLayout />}>
            <Route index element={<Navigate to="/me/profile" replace />} />

            {/* My Profile */}
            <Route path="profile" element={<UserProfilePage />} />

            {/* My Attendance */}
            <Route path="attendances">
              <Route index element={<UserAttendancePage />} />
            </Route>
          </Route>
        </Route>

        {/* ================================================================ */}
        {/* Shared Routes - ADMIN or MANAGER access */}
        {/* ================================================================ */}
        <Route path="/departments" element={<AdminOrManagerRoute />}>
          <Route index element={<DepartmentListPage />} />
          <Route path=":id" element={<DepartmentDetailPage />} />
        </Route>

        <Route path="/employees" element={<AdminOrManagerRoute />}>
          <Route index element={<EmployeeListPage />} />
          <Route path=":id" element={<EmployeeDetailPage />} />
        </Route>

        {/* ================================================================ */}
        {/* Root Route - Role-based redirect */}
        {/* ================================================================ */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          }
        />

        {/* ================================================================ */}
        {/* Catch-all Route - 404 Not Found */}
        {/* ================================================================ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

/**
 * RoleBasedRedirect Component
 * Redirects authenticated users to their role-specific home page
 */
const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'MANAGER':
      return <Navigate to="/manager/dashboard" replace />;
    case 'USER':
      return <Navigate to="/me/profile" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Import useAuthStore for RoleBasedRedirect
import { useAuthStore } from '../stores/authStore';

// ============================================================================
// Route Configuration Export (for reference and testing)
// ============================================================================

export const routeConfig = {
  public: {
    login: '/login',
    forbidden: '/forbidden',
  },
  admin: {
    root: '/admin',
    dashboard: '/admin/dashboard',
    departments: '/admin/departments',
    departmentDetail: (id: number) => `/admin/departments/${id}`,
    employees: '/admin/employees',
    employeeDetail: (id: number) => `/admin/employees/${id}`,
    attendances: '/admin/attendances',
    attendanceCalendar: '/admin/attendances/calendar',
    reports: '/admin/reports',
    audit: '/admin/audit',
    profile: '/admin/profile',
  },
  manager: {
    root: '/manager',
    dashboard: '/manager/dashboard',
    myDepartment: '/manager/my-department',
    employees: '/manager/employees',
    employeeDetail: (id: number) => `/manager/employees/${id}`,
    attendances: '/manager/attendances',
    attendanceCalendar: '/manager/attendances/calendar',
    reports: '/manager/reports',
    profile: '/manager/profile',
  },
  user: {
    root: '/me',
    profile: '/me/profile',
    attendances: '/me/attendances',
  },
  shared: {
    departments: '/departments',
    departmentDetail: (id: number) => `/departments/${id}`,
    employees: '/employees',
    employeeDetail: (id: number) => `/employees/${id}`,
  },
} as const;

export default AppRouter;
