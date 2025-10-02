import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import {
  LoginPage,
  DashboardPage,
  DepartmentListPage,
  DepartmentDetailPage,
  EmployeeListPage,
  EmployeeDetailPage,
} from '../pages';

interface AppRoutesProps {}

const AppRoutes: React.FC<AppRoutesProps> = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        )}
      >
        {/* Dashboard */}
        <Route index element={<DashboardPage />} />

        {/* Department Routes */}
        <Route path="departments" element={<DepartmentListPage />} />
        <Route path="departments/:id" element={<DepartmentDetailPage />} />

        {/* Employee Routes */}
        <Route path="employees" element={<EmployeeListPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
      </Route>

      {/* Catch all route - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;