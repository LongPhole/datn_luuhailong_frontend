import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';
import { authService } from '../services/authService';
import { Employee, PaginatedResponse, EmployeeFormData } from '../types';

interface UseEmployeeOptions {
  departmentId?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  autoFetch?: boolean;
}

interface UseEmployeeReturn {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  pageInfo: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  } | null;
  fetchEmployees: () => Promise<void>;
  createEmployee: (data: EmployeeFormData) => Promise<Employee | null>;
  updateEmployee: (id: number, data: EmployeeFormData) => Promise<Employee | null>;
  deleteEmployee: (id: number) => Promise<boolean>;
  getEmployeeById: (id: number) => Promise<Employee | null>;
  bulkUpdateStatus: (employeeIds: number[], status: string) => Promise<boolean>;
  exportEmployees: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for employee management with role-based department filtering
 *
 * Auto-filtering behavior:
 * - ADMIN: Can access all employees across all departments
 * - MANAGER: Automatically filtered to own department's employees
 * - USER: Can view all employees (read-only access)
 *
 * @param options - Configuration options for employee fetching
 * @returns Employee data and CRUD operations
 */
export function useEmployee(options: UseEmployeeOptions = {}): UseEmployeeReturn {
  const {
    departmentId,
    status,
    search,
    page = 0,
    size = 20,
    sort = 'fullName,asc',
    autoFetch = true,
  } = options;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<{
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  } | null>(null);

  /**
   * Apply role-based department filtering to query parameters
   */
  const applyDepartmentFiltering = useCallback((params: Record<string, any>): Record<string, any> => {
    const user = authService.getCurrentUser();
    if (!user) return params;

    const filteredParams = { ...params };

    // ADMIN: No filtering needed, can access all employees
    if (user.role === 'ADMIN') {
      return filteredParams;
    }

    // MANAGER: Filter to own department unless explicitly specified
    if (user.role === 'MANAGER') {
      if (!filteredParams.departmentId && user.departmentId) {
        filteredParams.departmentId = user.departmentId;
      }
      return filteredParams;
    }

    // USER: Can view all employees (read-only)
    // No filtering applied, but write operations will be restricted
    return filteredParams;
  }, []);

  /**
   * Fetch employees with role-based filtering applied
   */
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = {
        page,
        size,
        sort,
      };

      // Add optional filters
      if (departmentId !== undefined) params.departmentId = departmentId;
      if (status) params.status = status;
      if (search) params.search = search;

      // Apply role-based department filtering
      const filteredParams = applyDepartmentFiltering(params);

      const response = await api.employees.list(filteredParams) as PaginatedResponse<Employee>;

      setEmployees(response.content);
      setPageInfo(response.page);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch employees';
      setError(errorMessage);
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  }, [departmentId, status, search, page, size, sort, applyDepartmentFiltering]);

  /**
   * Create a new employee (ADMIN only, MANAGER can create in own department)
   */
  const createEmployee = useCallback(async (data: EmployeeFormData): Promise<Employee | null> => {
    setError(null);

    try {
      const user = authService.getCurrentUser();

      // Apply role-based restrictions
      let employeeData = { ...data };

      // MANAGER role: Can only create employees in own department
      if (user?.role === 'MANAGER') {
        if (user.departmentId) {
          employeeData.departmentId = user.departmentId;
        } else {
          throw new Error('Manager must be assigned to a department');
        }
      }

      // USER role: Cannot create employees (backend will reject)

      const newEmployee = await api.employees.create(employeeData) as Employee;

      // Refresh list after creation
      await fetchEmployees();

      return newEmployee;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create employee';
      setError(errorMessage);
      console.error('Error creating employee:', err);
      return null;
    }
  }, [fetchEmployees]);

  /**
   * Update an existing employee
   * ADMIN: Can update any employee
   * MANAGER: Can update employees in own department
   * USER: Cannot update (except own contact info via self-service)
   */
  const updateEmployee = useCallback(async (
    id: number,
    data: EmployeeFormData
  ): Promise<Employee | null> => {
    setError(null);

    try {
      const user = authService.getCurrentUser();

      // Apply role-based restrictions
      let employeeData = { ...data };

      // MANAGER role: Can only update employees in own department
      if (user?.role === 'MANAGER') {
        if (user.departmentId) {
          // Ensure employee remains in manager's department
          employeeData.departmentId = user.departmentId;
        } else {
          throw new Error('Manager must be assigned to a department');
        }
      }

      const updatedEmployee = await api.employees.update(id, employeeData) as Employee;

      // Update local state
      setEmployees(prev =>
        prev.map(emp => emp.id === id ? updatedEmployee : emp)
      );

      return updatedEmployee;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update employee';
      setError(errorMessage);
      console.error('Error updating employee:', err);
      return null;
    }
  }, []);

  /**
   * Delete an employee (ADMIN only)
   */
  const deleteEmployee = useCallback(async (id: number): Promise<boolean> => {
    setError(null);

    try {
      if (!authService.isAdmin()) {
        throw new Error('Only administrators can delete employees');
      }

      await api.employees.delete(id);

      // Remove from local state
      setEmployees(prev => prev.filter(emp => emp.id !== id));

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete employee';
      setError(errorMessage);
      console.error('Error deleting employee:', err);
      return false;
    }
  }, []);

  /**
   * Get a single employee by ID with role-based access check
   */
  const getEmployeeById = useCallback(async (id: number): Promise<Employee | null> => {
    setError(null);

    try {
      const employee = await api.employees.get(id) as Employee;

      // Additional client-side access check for MANAGER
      const user = authService.getCurrentUser();
      if (user?.role === 'MANAGER') {
        if (user.departmentId && employee.department.id !== user.departmentId) {
          throw new Error('Access denied: Employee not in your department');
        }
      }

      return employee;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch employee';
      setError(errorMessage);
      console.error('Error fetching employee by ID:', err);
      return null;
    }
  }, []);

  /**
   * Bulk update employee status (ADMIN only)
   */
  const bulkUpdateStatus = useCallback(async (
    employeeIds: number[],
    newStatus: string
  ): Promise<boolean> => {
    setError(null);

    try {
      if (!authService.isAdmin()) {
        throw new Error('Only administrators can perform bulk updates');
      }

      await api.employees.bulkUpdateStatus(employeeIds, newStatus);

      // Refresh list after bulk update
      await fetchEmployees();

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update employee statuses';
      setError(errorMessage);
      console.error('Error in bulk status update:', err);
      return false;
    }
  }, [fetchEmployees]);

  /**
   * Export employees to CSV with current filters applied
   */
  const exportEmployees = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const params: Record<string, any> = {};

      // Add current filters
      if (departmentId !== undefined) params.departmentId = departmentId;
      if (status) params.status = status;
      if (search) params.search = search;

      // Apply role-based filtering
      const filteredParams = applyDepartmentFiltering(params);

      await api.employees.export(filteredParams);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to export employees';
      setError(errorMessage);
      console.error('Error exporting employees:', err);
    }
  }, [departmentId, status, search, applyDepartmentFiltering]);

  /**
   * Refresh the current employee list
   */
  const refresh = useCallback(async () => {
    await fetchEmployees();
  }, [fetchEmployees]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchEmployees();
    }
  }, [autoFetch, fetchEmployees]);

  return {
    employees,
    loading,
    error,
    pageInfo,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    bulkUpdateStatus,
    exportEmployees,
    refresh,
  };
}

export default useEmployee;
