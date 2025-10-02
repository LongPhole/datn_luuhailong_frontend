import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';
import { authService } from '../services/authService';
import {
  AttendanceRecord,
  PaginatedResponse,
  AttendanceRequest,
  AttendanceStatus
} from '../types';

interface UseAttendanceOptions {
  employeeId?: number;
  departmentId?: number;
  from?: string;
  to?: string;
  status?: AttendanceStatus;
  page?: number;
  size?: number;
  sort?: string;
  autoFetch?: boolean;
}

interface UseAttendanceReturn {
  attendances: AttendanceRecord[];
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
  fetchAttendances: () => Promise<void>;
  createAttendance: (data: AttendanceRequest) => Promise<AttendanceRecord | null>;
  updateAttendance: (id: number, data: AttendanceRequest) => Promise<AttendanceRecord | null>;
  deleteAttendance: (id: number) => Promise<boolean>;
  getAttendanceById: (id: number) => Promise<AttendanceRecord | null>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for attendance management with role-based auto-scoping
 *
 * Auto-scoping behavior:
 * - ADMIN: Can access all attendance records across all departments
 * - MANAGER: Automatically scoped to own department's attendance records
 * - USER: Automatically scoped to own attendance records only
 *
 * @param options - Configuration options for attendance fetching
 * @returns Attendance data and CRUD operations
 */
export function useAttendance(options: UseAttendanceOptions = {}): UseAttendanceReturn {
  const {
    employeeId,
    departmentId,
    from,
    to,
    status,
    page = 0,
    size = 20,
    sort = 'attendanceDate,desc',
    autoFetch = true,
  } = options;

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
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
   * Apply role-based scoping to query parameters
   */
  const applyAutoScoping = useCallback((params: Record<string, any>): Record<string, any> => {
    const user = authService.getCurrentUser();
    if (!user) return params;

    const scopedParams = { ...params };

    // ADMIN: No scoping needed, can access all records
    if (user.role === 'ADMIN') {
      return scopedParams;
    }

    // MANAGER: Scope to own department unless already scoped
    if (user.role === 'MANAGER') {
      if (!scopedParams.departmentId && user.departmentId) {
        scopedParams.departmentId = user.departmentId;
      }
      return scopedParams;
    }

    // USER: Scope to own employee records only
    if (user.role === 'USER') {
      if (user.employeeId) {
        scopedParams.employeeId = user.employeeId;
      }
      // Remove department filter for USER role (only sees own records)
      delete scopedParams.departmentId;
      return scopedParams;
    }

    return scopedParams;
  }, []);

  /**
   * Fetch attendance records with auto-scoping applied
   */
  const fetchAttendances = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = {
        page,
        size,
        sort,
      };

      // Add optional filters
      if (employeeId) params.employeeId = employeeId;
      if (departmentId) params.departmentId = departmentId;
      if (from) params.from = from;
      if (to) params.to = to;
      if (status) params.status = status;

      // Apply role-based scoping
      const scopedParams = applyAutoScoping(params);

      const response = await api.attendances.list(scopedParams) as PaginatedResponse<AttendanceRecord>;

      setAttendances(response.content);
      setPageInfo(response.page);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch attendance records';
      setError(errorMessage);
      console.error('Error fetching attendances:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId, departmentId, from, to, status, page, size, sort, applyAutoScoping]);

  /**
   * Create a new attendance record with role-based restrictions
   */
  const createAttendance = useCallback(async (data: AttendanceRequest): Promise<AttendanceRecord | null> => {
    setError(null);

    try {
      const user = authService.getCurrentUser();

      // Apply role-based restrictions
      let attendanceData = { ...data };

      // USER role: Can only create for self, current date
      if (user?.role === 'USER') {
        if (user.employeeId) {
          attendanceData.employeeId = user.employeeId;
        }
        // Enforce current date for USER
        const today = new Date().toISOString().split('T')[0];
        attendanceData.attendanceDate = today!;
      }

      // MANAGER role: Can only create for department employees
      // (backend will validate department membership)

      const newRecord = await api.attendances.create(attendanceData) as AttendanceRecord;

      // Refresh list after creation
      await fetchAttendances();

      return newRecord;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create attendance record';
      setError(errorMessage);
      console.error('Error creating attendance:', err);
      return null;
    }
  }, [fetchAttendances]);

  /**
   * Update an existing attendance record with time-based restrictions
   */
  const updateAttendance = useCallback(async (
    id: number,
    data: AttendanceRequest
  ): Promise<AttendanceRecord | null> => {
    setError(null);

    try {
      const updatedRecord = await api.attendances.update(id, data) as AttendanceRecord;

      // Update local state
      setAttendances(prev =>
        prev.map(record => record.id === id ? updatedRecord : record)
      );

      return updatedRecord;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update attendance record';
      setError(errorMessage);
      console.error('Error updating attendance:', err);
      return null;
    }
  }, []);

  /**
   * Delete an attendance record (ADMIN only)
   */
  const deleteAttendance = useCallback(async (id: number): Promise<boolean> => {
    setError(null);

    try {
      await api.attendances.delete(id);

      // Remove from local state
      setAttendances(prev => prev.filter(record => record.id !== id));

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete attendance record';
      setError(errorMessage);
      console.error('Error deleting attendance:', err);
      return false;
    }
  }, []);

  /**
   * Get a single attendance record by ID
   */
  const getAttendanceById = useCallback(async (id: number): Promise<AttendanceRecord | null> => {
    setError(null);

    try {
      const record = await api.attendances.get(id) as AttendanceRecord;
      return record;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch attendance record';
      setError(errorMessage);
      console.error('Error fetching attendance by ID:', err);
      return null;
    }
  }, []);

  /**
   * Refresh the current attendance list
   */
  const refresh = useCallback(async () => {
    await fetchAttendances();
  }, [fetchAttendances]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchAttendances();
    }
  }, [autoFetch, fetchAttendances]);

  return {
    attendances,
    loading,
    error,
    pageInfo,
    fetchAttendances,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceById,
    refresh,
  };
}

export default useAttendance;
