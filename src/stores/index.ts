// Export all stores and their types
export { useAuthStore, useAuth, useUser, useIsAuthenticated, useIsAdmin, useAuthToken } from './authStore';
export type { AuthState } from './authStore';

export { useDepartmentStore, useDepartments, useSelectedDepartment, useDepartmentLoading, useDepartmentError, useDepartmentFilters, useDepartmentPageInfo } from './departmentStore';
export type { DepartmentState, DepartmentFilters } from './departmentStore';

export { useEmployeeStore, useEmployees, useSelectedEmployee, useEmployeeLoading, useEmployeeError, useEmployeeFilters, useEmployeePageInfo, useEmployeeSortOptions, useFilteredEmployees } from './employeeStore';
export type { EmployeeState, EmployeeFilters, EmployeeSortOptions } from './employeeStore';