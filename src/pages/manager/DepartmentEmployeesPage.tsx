import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/authStore';
import { api } from '../../services/apiClient';
import { Employee, PaginatedResponse } from '../../types';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/useToast';
import { EmployeeTable } from '../../components/employees/EmployeeTable';
import { Link } from 'react-router-dom';

/**
 * Department Employees Page - MANAGER Role
 *
 * Displays all employees in the manager's department with filtering and search capabilities.
 * Managers have limited editing capabilities compared to ADMIN.
 *
 * Features:
 * - View all employees in assigned department
 * - Search employees by name or code
 * - Filter by employee status
 * - View employee details
 * - Limited employee editing (department employees only)
 * - Pagination support
 *
 * API Endpoints:
 * - GET /api/v1/employees?departmentId={id}
 */

export const DepartmentEmployeesPage: React.FC = () => {
  const { user, getDepartmentId } = useAuth();
  const { showError } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'TERMINATED' | 'ALL'>('ACTIVE');
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });

  const departmentId = getDepartmentId();

  useEffect(() => {
    if (departmentId) {
      loadEmployees();
    }
  }, [departmentId, pagination.page, statusFilter, searchQuery]);

  const loadEmployees = async () => {
    if (!departmentId) return;

    setIsLoading(true);
    try {
      const params: any = {
        departmentId,
        page: pagination.page,
        size: pagination.size,
      };

      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response: PaginatedResponse<Employee> = await api.employees.list(params);

      setEmployees(response.content);
      setPagination(prev => ({
        ...prev,
        totalElements: response.page.totalElements,
        totalPages: response.page.totalPages,
      }));
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to load employees',
        
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleStatusFilterChange = (status: 'ACTIVE' | 'TERMINATED' | 'ALL') => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRefresh = () => {
    loadEmployees();
  };

  if (!departmentId) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <p className="text-center text-gray-500">
            You are not assigned to a department. Please contact your administrator.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Department Employees</h1>
          <p className="text-gray-600">Manage employees in your department</p>
        </div>
        <Button onClick={handleRefresh}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or employee code..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'ALL' ? 'default' : 'outline'}
              onClick={() => handleStatusFilterChange('ALL')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
              onClick={() => handleStatusFilterChange('ACTIVE')}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'TERMINATED' ? 'default' : 'outline'}
              onClick={() => handleStatusFilterChange('TERMINATED')}
              size="sm"
            >
              Terminated
            </Button>
          </div>
        </div>
      </Card>

      {/* Employee Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Employees</p>
          <p className="text-2xl font-bold text-blue-600">{pagination.totalElements}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Employees</p>
          <p className="text-2xl font-bold text-green-600">
            {employees.filter(e => e.status === 'ACTIVE').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Showing</p>
          <p className="text-2xl font-bold text-gray-700">
            {employees.length} of {pagination.totalElements}
          </p>
        </Card>
      </div>

      {/* Employee Table */}
      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No employees found</p>
            {searchQuery && (
              <Button
                variant="link"
                onClick={() => handleSearch('')}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <>
            <EmployeeTable
              employees={employees}
              onEmployeeClick={(employee) => {
                window.location.href = `/manager/employees/${employee.id}`;
              }}
              canEdit={false}
              canDelete={false}
              showSalary={false}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 0}
                  size="sm"
                >
                  Previous
                </Button>

                <span className="text-sm text-gray-600">
                  Page {pagination.page + 1} of {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages - 1}
                  size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default DepartmentEmployeesPage;
