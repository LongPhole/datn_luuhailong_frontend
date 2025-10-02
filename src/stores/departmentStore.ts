import { create } from 'zustand';
import { Department, DepartmentFormData, PaginatedResponse, PageInfo, ApiError } from '../types';

export interface DepartmentFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  managerId?: number;
}

export interface DepartmentState {
  // State
  departments: Department[];
  selectedDepartment: Department | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Pagination
  pageInfo: PageInfo | null;
  currentPage: number;
  pageSize: number;

  // Filters
  filters: DepartmentFilters;

  // Actions
  fetchDepartments: (page?: number, size?: number, filters?: DepartmentFilters) => Promise<void>;
  createDepartment: (departmentData: DepartmentFormData) => Promise<Department | null>;
  updateDepartment: (id: number, departmentData: Partial<DepartmentFormData>) => Promise<Department | null>;
  deleteDepartment: (id: number) => Promise<boolean>;
  setSelectedDepartment: (department: Department | null) => void;

  // Utility actions
  clearError: () => void;
  setFilters: (filters: Partial<DepartmentFilters>) => void;
  resetFilters: () => void;
  refreshDepartments: () => Promise<void>;

  // Local state management
  addDepartmentOptimistic: (department: Department) => void;
  updateDepartmentOptimistic: (id: number, updates: Partial<Department>) => void;
  removeDepartmentOptimistic: (id: number) => void;
}

const defaultFilters: DepartmentFilters = {
  search: '',
  status: 'ALL',
};

const defaultPageInfo: PageInfo = {
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  // Initial state
  departments: [],
  selectedDepartment: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,

  pageInfo: defaultPageInfo,
  currentPage: 0,
  pageSize: 10,

  filters: defaultFilters,

  // Actions
  fetchDepartments: async (page = 0, size = 10, filters) => {
    set({ isLoading: true, error: null });

    try {
      const currentFilters = filters || get().filters;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      if (currentFilters.search) {
        queryParams.append('search', currentFilters.search);
      }
      if (currentFilters.status && currentFilters.status !== 'ALL') {
        queryParams.append('status', currentFilters.status);
      }
      if (currentFilters.managerId) {
        queryParams.append('managerId', currentFilters.managerId.toString());
      }

      // This will be replaced with actual API call in T034
      const response = await fetch(`/api/v1/departments?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data: PaginatedResponse<Department> = await response.json();

      set({
        departments: data.content,
        pageInfo: data.page,
        currentPage: page,
        pageSize: size,
        filters: currentFilters,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        departments: [],
        pageInfo: defaultPageInfo,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch departments',
      });
    }
  },

  createDepartment: async (departmentData: DepartmentFormData): Promise<Department | null> => {
    set({ isCreating: true, error: null });

    try {
      // This will be replaced with actual API call in T034
      const response = await fetch('/api/v1/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
        body: JSON.stringify(departmentData),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || 'Failed to create department');
      }

      const newDepartment: Department = await response.json();

      // Add to local state optimistically
      set((state) => ({
        departments: [newDepartment, ...state.departments],
        isCreating: false,
        error: null,
      }));

      return newDepartment;
    } catch (error) {
      set({
        isCreating: false,
        error: error instanceof Error ? error.message : 'Failed to create department',
      });
      return null;
    }
  },

  updateDepartment: async (id: number, departmentData: Partial<DepartmentFormData>): Promise<Department | null> => {
    set({ isUpdating: true, error: null });

    try {
      // This will be replaced with actual API call in T034
      const response = await fetch(`/api/v1/departments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
        body: JSON.stringify(departmentData),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || 'Failed to update department');
      }

      const updatedDepartment: Department = await response.json();

      // Update local state
      set((state) => ({
        departments: state.departments.map((dept) =>
          dept.id === id ? updatedDepartment : dept
        ),
        selectedDepartment: state.selectedDepartment?.id === id ? updatedDepartment : state.selectedDepartment,
        isUpdating: false,
        error: null,
      }));

      return updatedDepartment;
    } catch (error) {
      set({
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update department',
      });
      return null;
    }
  },

  deleteDepartment: async (id: number): Promise<boolean> => {
    set({ isDeleting: true, error: null });

    try {
      // This will be replaced with actual API call in T034
      const response = await fetch(`/api/v1/departments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || 'Failed to delete department');
      }

      // Remove from local state
      set((state) => ({
        departments: state.departments.filter((dept) => dept.id !== id),
        selectedDepartment: state.selectedDepartment?.id === id ? null : state.selectedDepartment,
        isDeleting: false,
        error: null,
      }));

      return true;
    } catch (error) {
      set({
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Failed to delete department',
      });
      return false;
    }
  },

  setSelectedDepartment: (department: Department | null) => {
    set({ selectedDepartment: department });
  },

  // Utility actions
  clearError: () => {
    set({ error: null });
  },

  setFilters: (newFilters: Partial<DepartmentFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  refreshDepartments: async () => {
    const { currentPage, pageSize, filters } = get();
    await get().fetchDepartments(currentPage, pageSize, filters);
  },

  // Local state management for optimistic updates
  addDepartmentOptimistic: (department: Department) => {
    set((state) => ({
      departments: [department, ...state.departments],
    }));
  },

  updateDepartmentOptimistic: (id: number, updates: Partial<Department>) => {
    set((state) => ({
      departments: state.departments.map((dept) =>
        dept.id === id ? { ...dept, ...updates } : dept
      ),
      selectedDepartment: state.selectedDepartment?.id === id
        ? { ...state.selectedDepartment, ...updates }
        : state.selectedDepartment,
    }));
  },

  removeDepartmentOptimistic: (id: number) => {
    set((state) => ({
      departments: state.departments.filter((dept) => dept.id !== id),
      selectedDepartment: state.selectedDepartment?.id === id ? null : state.selectedDepartment,
    }));
  },
}));

// Selector hooks for specific department state
export const useDepartments = () => useDepartmentStore((state) => state.departments);
export const useSelectedDepartment = () => useDepartmentStore((state) => state.selectedDepartment);
export const useDepartmentLoading = () => useDepartmentStore((state) => state.isLoading);
export const useDepartmentError = () => useDepartmentStore((state) => state.error);
export const useDepartmentFilters = () => useDepartmentStore((state) => state.filters);
export const useDepartmentPageInfo = () => useDepartmentStore((state) => state.pageInfo);