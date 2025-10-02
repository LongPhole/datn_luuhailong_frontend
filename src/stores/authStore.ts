import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest, LoginResponse } from '../types';
import { authService } from '../services/authService';

export interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;

  // Permission helpers
  isAdmin: () => boolean;
  isManager: () => boolean;
  isUser: () => boolean;
  getDepartmentId: () => number | null;
  getEmployeeId: () => number | null;
  hasPermission: (permission: 'read' | 'write' | 'delete') => boolean;
  canAccessDepartment: (departmentId: number) => boolean;
  canAccessEmployee: (employeeId: number) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const result = await authService.login(credentials);

          if (result.success && result.user && result.token) {
            set({
              user: result.user,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(result.error || 'Login failed');
          }
        } catch (error) {
          let errorMessage = 'Login failed';

          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = (error as any).message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.warn('Logout failed:', error);
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkAuth: () => {
        const authValidation = authService.validateAuth();

        if (authValidation.isValid && authValidation.user) {
          set({
            user: authValidation.user,
            token: authService.getToken(),
            isAuthenticated: true,
            error: null,
          });
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: authValidation.error || null,
          });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },

      clearError: () => {
        set({ error: null as string | null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Permission helpers
      isAdmin: (): boolean => {
        const { user } = get();
        return user?.role === 'ADMIN';
      },

      isManager: (): boolean => {
        const { user } = get();
        return user?.role === 'MANAGER';
      },

      isUser: (): boolean => {
        const { user } = get();
        return user?.role === 'USER';
      },

      getDepartmentId: (): number | null => {
        const { user } = get();
        return user?.departmentId ?? null;
      },

      getEmployeeId: (): number | null => {
        const { user } = get();
        return user?.employeeId ?? null;
      },

      hasPermission: (permission: 'read' | 'write' | 'delete'): boolean => {
        const { user, isAuthenticated } = get();

        if (!isAuthenticated || !user) {
          return false;
        }

        switch (permission) {
          case 'read':
            // All authenticated users can read
            return true;
          case 'write':
            // ADMIN and MANAGER can write, USER has limited write access
            return user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'USER';
          case 'delete':
            // Only ADMIN can delete
            return user.role === 'ADMIN';
          default:
            return false;
        }
      },

      canAccessDepartment: (departmentId: number): boolean => {
        const { user, isAuthenticated } = get();

        if (!isAuthenticated || !user) {
          return false;
        }

        // ADMIN can access all departments
        if (user.role === 'ADMIN') {
          return true;
        }

        // MANAGER can only access their own department
        if (user.role === 'MANAGER') {
          return user.departmentId === departmentId;
        }

        // USER can view all departments (read-only)
        return true;
      },

      canAccessEmployee: (employeeId: number): boolean => {
        const { user, isAuthenticated } = get();

        if (!isAuthenticated || !user) {
          return false;
        }

        // ADMIN can access all employees
        if (user.role === 'ADMIN') {
          return true;
        }

        // MANAGER and USER can access their own employee record
        if (user.employeeId === employeeId) {
          return true;
        }

        // MANAGER can access employees in their department (checked at API level)
        return user.role === 'MANAGER';
      },
    }),
    {
      name: 'hrm-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Check token validity on rehydration
        if (state) {
          state.checkAuth();
        }
      },
    }
  )
);

// Hook for easier access to auth state
export const useAuth = () => {
  const authState = useAuthStore();
  return authState;
};

// Selector hooks for specific auth state
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore((state) => state.isAdmin());
export const useIsManager = () => useAuthStore((state) => state.isManager());
export const useIsUser = () => useAuthStore((state) => state.isUser());
export const useAuthToken = () => useAuthStore((state) => state.token);
export const useUserDepartmentId = () => useAuthStore((state) => state.getDepartmentId());
export const useUserEmployeeId = () => useAuthStore((state) => state.getEmployeeId());