import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/authStore';
import { api } from '../../services/apiClient';
import { Department } from '../../types';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

/**
 * My Department Page - MANAGER Role
 *
 * Displays comprehensive information about the manager's assigned department.
 * Managers can view (but not edit) department details.
 *
 * Features:
 * - Department basic information
 * - Employee count and statistics
 * - Department manager information
 * - Department description and status
 *
 * API Endpoints:
 * - GET /api/v1/departments/{id}
 */

export const MyDepartmentPage: React.FC = () => {
  const { user, getDepartmentId } = useAuth();
  const { showError } = useToast();

  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const departmentId = getDepartmentId();

  useEffect(() => {
    if (departmentId) {
      loadDepartment();
    }
  }, [departmentId]);

  const loadDepartment = async () => {
    if (!departmentId) return;

    setIsLoading(true);
    try {
      const response = await api.departments.get(departmentId);
      setDepartment(response);
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to load department information',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">My Department</h1>
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="p-6">
          <p className="text-center text-gray-500">
            Department information not found. Please contact your administrator.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Department</h1>
      </div>

      <div className="grid gap-6">
        {/* Department Overview Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Department Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Department Code</Label>
              <p className="mt-1 text-gray-900 font-mono">{department.code}</p>
            </div>

            <div>
              <Label>Department Name</Label>
              <p className="mt-1 text-gray-900 font-semibold text-lg">{department.name}</p>
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <p className="mt-1 text-gray-700">
                {department.description || 'No description provided'}
              </p>
            </div>

            <div>
              <Label>Status</Label>
              <div className="mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  department.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {department.status}
                </span>
              </div>
            </div>

            <div>
              <Label>Total Employees</Label>
              <p className="mt-1 text-gray-900 text-2xl font-bold text-blue-600">
                {department.employeeCount}
              </p>
            </div>
          </div>
        </Card>

        {/* Manager Information Card */}
        {department.manager && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Department Manager</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Manager Name</Label>
                <p className="mt-1 text-gray-900 font-semibold">
                  {department.manager.fullName}
                </p>
              </div>

              <div>
                <Label>Employee Code</Label>
                <p className="mt-1 text-gray-900 font-mono">
                  {department.manager.code}
                </p>
              </div>

              <div>
                <Label>Position</Label>
                <p className="mt-1 text-gray-900">
                  {department.manager.position}
                </p>
              </div>

              <div>
                <Label>Email</Label>
                <p className="mt-1 text-gray-900">
                  <a href={`mailto:${department.manager.email}`} className="text-blue-600 hover:underline">
                    {department.manager.email}
                  </a>
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Department Metadata */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Department Metadata</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Created At</Label>
              <p className="mt-1 text-gray-900">
                {new Date(department.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <Label>Last Updated</Label>
              <p className="mt-1 text-gray-900">
                {new Date(department.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/manager/employees'}
            >
              View Department Employees
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/manager/attendances'}
            >
              View Department Attendance
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/manager/reports'}
            >
              View Department Reports
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MyDepartmentPage;
