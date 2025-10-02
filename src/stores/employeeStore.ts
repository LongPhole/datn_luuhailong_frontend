import { create } from 'zustand';
import { Employee, EmployeeFormData, PaginatedResponse, PageInfo, ApiError } from '../types';

export interface EmployeeFilters {
  search?: string; // Search by name or email
  departmentId?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ALL';
  hireDate?: {
    from?: string;
    to?: string;
  };
  position?: string;
}

export interface EmployeeSortOptions {
  field: 'fullName' | 'email' | 'hireDate' | 'position' | 'department' | 'status';
  direction: 'asc' | 'desc';
}

export interface EmployeeState {
  // State
  employees: Employee[];
  selectedEmployee: Employee | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Pagination
  pageInfo: PageInfo | null;
  currentPage: number;
  pageSize: number;

  // Filters and search
  filters: EmployeeFilters;
  sortOptions: EmployeeSortOptions;

  // Actions
  fetchEmployees: (page?: number, size?: number, filters?: EmployeeFilters, sort?: EmployeeSortOptions) => Promise<void>;
  searchEmployees: (query: string) => Promise<void>;
  createEmployee: (employeeData: EmployeeFormData) => Promise<Employee | null>;
  updateEmployee: (id: number, employeeData: Partial<EmployeeFormData>) => Promise<Employee | null>;
  deleteEmployee: (id: number) => Promise<boolean>;
  setSelectedEmployee: (employee: Employee | null) => void;

  // Advanced filtering
  filterByDepartment: (departmentId: number | null) => Promise<void>;
  filterByStatus: (status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ALL') => Promise<void>;
  filterByHireDate: (fromDate?: string, toDate?: string) => Promise<void>;

  // Utility actions
  clearError: () => void;
  setFilters: (filters: Partial<EmployeeFilters>) => void;
  resetFilters: () => void;
  setSortOptions: (sort: EmployeeSortOptions) => void;
  refreshEmployees: () => Promise<void>;

  // Local state management
  addEmployeeOptimistic: (employee: Employee) => void;
  updateEmployeeOptimistic: (id: number, updates: Partial<Employee>) => void;
  removeEmployeeOptimistic: (id: number) => void;

  // Bulk operations
  bulkUpdateStatus: (employeeIds: number[], status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED') => Promise<boolean>;
  exportEmployees: (filters?: EmployeeFilters) => Promise<Blob | null>;
}

const defaultFilters: EmployeeFilters = {
  search: '',
  status: 'ALL',
};

const defaultSortOptions: EmployeeSortOptions = {
  field: 'fullName',
  direction: 'asc',
};

const defaultPageInfo: PageInfo = {
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  // Initial state
  employees: [],
  selectedEmployee: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,

  pageInfo: defaultPageInfo,
  currentPage: 0,
  pageSize: 10,

  filters: defaultFilters,
  sortOptions: defaultSortOptions,

  // Actions
  fetchEmployees: async (page = 0, size = 10, filters, sort) => {
    set({ isLoading: true, error: null });

    try {
      const currentFilters = filters || get().filters;
      const currentSort = sort || get().sortOptions;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy: currentSort.field,
        sortDir: currentSort.direction,
      });

      if (currentFilters.search) {
        queryParams.append('search', currentFilters.search);
      }
      if (currentFilters.departmentId) {
        queryParams.append('departmentId', currentFilters.departmentId.toString());
      }
      if (currentFilters.status && currentFilters.status !== 'ALL') {
        queryParams.append('status', currentFilters.status);
      }
      if (currentFilters.position) {
        queryParams.append('position', currentFilters.position);
      }
      if (currentFilters.hireDate?.from) {
        queryParams.append('hireDateFrom', currentFilters.hireDate.from);
      }
      if (currentFilters.hireDate?.to) {
        queryParams.append('hireDateTo', currentFilters.hireDate.to);
      }

      // This will be replaced with actual API call in T034
      const response = await fetch(`/api/v1/employees?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data: PaginatedResponse<Employee> = await response.json();

      set({
        employees: data.content,
        pageInfo: data.page,
        currentPage: page,
        pageSize: size,
        filters: currentFilters,
        sortOptions: currentSort,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        employees: [],
        pageInfo: defaultPageInfo,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch employees',
      });
    }
  },

  searchEmployees: async (query: string) => {
    const filters = { ...get().filters, search: query };
    await get().fetchEmployees(0, get().pageSize, filters);
  },

  createEmployee: async (employeeData: EmployeeFormData): Promise<Employee | null> => {
    set({ isCreating: true, error: null });

    try {
      // This will be replaced with actual API call in T034
      const response = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || 'Failed to create employee');
      }

      const newEmployee: Employee = await response.json();

      // Add to local state optimistically
      set((state) => ({
        employees: [newEmployee, ...state.employees],
        isCreating: false,
        error: null,
      }));

      return newEmployee;
    } catch (error) {
      set({
        isCreating: false,
        error: error instanceof Error ? error.message : 'Failed to create employee',
      });
      return null;
    }
  },

  updateEmployee: async (id: number, employeeData: Partial<EmployeeFormData>): Promise<Employee | null> => {
    set({ isUpdating: true, error: null });

    try {
      // This will be replaced with actual API call in T034
      const response = await fetch(`/api/v1/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || 'Failed to update employee');
      }

      const updatedEmployee: Employee = await response.json();

      // Update local state
      set((state) => ({
        employees: state.employees.map((emp) =>
          emp.id === id ? updatedEmployee : emp
        ),
        selectedEmployee: state.selectedEmployee?.id === id ? updatedEmployee : state.selectedEmployee,
        isUpdating: false,
        error: null,
      }));

      return updatedEmployee;
    } catch (error) {
      set({
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update employee',
      });
      return null;
    }
  },

  deleteEmployee: async (id: number): Promise<boolean> => {
    set({ isDeleting: true, error: null });

    try {
      // This will be replaced with actual API call in T034
      const response = await fetch(`/api/v1/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || 'Failed to delete employee');
      }

      // Remove from local state
      set((state) => ({
        employees: state.employees.filter((emp) => emp.id !== id),
        selectedEmployee: state.selectedEmployee?.id === id ? null : state.selectedEmployee,
        isDeleting: false,
        error: null,
      }));

      return true;
    } catch (error) {
      set({
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Failed to delete employee',
      });
      return false;
    }
  },

  setSelectedEmployee: (employee: Employee | null) => {
    set({ selectedEmployee: employee });
  },

  // Advanced filtering
  filterByDepartment: async (departmentId: number | null) => {
    const filters = { ...get().filters };
    if (departmentId) {
      filters.departmentId = departmentId;
    } else {
      delete filters.departmentId;
    }
    await get().fetchEmployees(0, get().pageSize, filters);
  },

  filterByStatus: async (status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ALL') => {
    const filters = { ...get().filters, status };
    await get().fetchEmployees(0, get().pageSize, filters);
  },

  filterByHireDate: async (fromDate?: string, toDate?: string) => {
    const filters = { ...get().filters };
    if (fromDate || toDate) {
      filters.hireDate = {};
      if (fromDate) filters.hireDate.from = fromDate;
      if (toDate) filters.hireDate.to = toDate;
    } else {
      delete filters.hireDate;
    }
    await get().fetchEmployees(0, get().pageSize, filters);
  },

  // Utility actions
  clearError: () => {
    set({ error: null });
  },

  setFilters: (newFilters: Partial<EmployeeFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  setSortOptions: (sort: EmployeeSortOptions) => {
    set({ sortOptions: sort });
  },

  refreshEmployees: async () => {
    const { currentPage, pageSize, filters, sortOptions } = get();
    await get().fetchEmployees(currentPage, pageSize, filters, sortOptions);
  },

  // Local state management for optimistic updates
  addEmployeeOptimistic: (employee: Employee) => {
    set((state) => ({
      employees: [employee, ...state.employees],
    }));
  },

  updateEmployeeOptimistic: (id: number, updates: Partial<Employee>) => {
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? { ...emp, ...updates } : emp
      ),
      selectedEmployee: state.selectedEmployee?.id === id
        ? { ...state.selectedEmployee, ...updates }
        : state.selectedEmployee,
    }));
  },

  removeEmployeeOptimistic: (id: number) => {
    set((state) => ({
      employees: state.employees.filter((emp) => emp.id !== id),
      selectedEmployee: state.selectedEmployee?.id === id ? null : state.selectedEmployee,
    }));
  },

  // Bulk operations
  bulkUpdateStatus: async (employeeIds: number[], status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED'): Promise<boolean> => {
    set({ isUpdating: true, error: null });

    try {
      // This will be replaced with actual API call in T034
      const response = await fetch('/api/v1/employees/bulk-update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
        body: JSON.stringify({ employeeIds, status }),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || 'Failed to update employee status');
      }

      // Update local state optimistically
      set((state) => ({
        employees: state.employees.map((emp) =>
          employeeIds.includes(emp.id) ? { ...emp, status } : emp
        ),
        isUpdating: false,
        error: null,
      }));

      return true;
    } catch (error) {
      set({
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update employee status',
      });
      return false;
    }
  },

  exportEmployees: async (filters?: EmployeeFilters): Promise<Blob | null> => {
    set({ isLoading: true, error: null });

    try {
      const currentFilters = filters || get().filters;
      const queryParams = new URLSearchParams();

      if (currentFilters.search) {
        queryParams.append('search', currentFilters.search);
      }
      if (currentFilters.departmentId) {
        queryParams.append('departmentId', currentFilters.departmentId.toString());
      }
      if (currentFilters.status && currentFilters.status !== 'ALL') {
        queryParams.append('status', currentFilters.status);
      }

      // This will be replaced with actual API call in T034
      const response = await fetch(`/api/v1/employees/export?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export employees');
      }

      const blob = await response.blob();
      set({ isLoading: false, error: null });
      return blob;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to export employees',
      });
      return null;
    }
  },
}));

// Selector hooks for specific employee state
export const useEmployees = () => useEmployeeStore((state) => state.employees);
export const useSelectedEmployee = () => useEmployeeStore((state) => state.selectedEmployee);
export const useEmployeeLoading = () => useEmployeeStore((state) => state.isLoading);
export const useEmployeeError = () => useEmployeeStore((state) => state.error);
export const useEmployeeFilters = () => useEmployeeStore((state) => state.filters);
export const useEmployeePageInfo = () => useEmployeeStore((state) => state.pageInfo);
export const useEmployeeSortOptions = () => useEmployeeStore((state) => state.sortOptions);

// Computed selectors
export const useFilteredEmployees = () => {
  return useEmployeeStore((state) => {
    if (!state.filters.search) return state.employees;

    const searchTerm = state.filters.search.toLowerCase();
    return state.employees.filter(
      (employee) =>
        employee.fullName.toLowerCase().includes(searchTerm) ||
        employee.email.toLowerCase().includes(searchTerm) ||
        employee.empCode.toLowerCase().includes(searchTerm)
    );
  });
};