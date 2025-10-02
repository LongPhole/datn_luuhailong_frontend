import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';
import { authService } from '../services/authService';
import {
  AttendanceRecord,
  PaginatedResponse,
  SelfAttendanceRequest,
  Employee,
} from '../types';

interface UseSelfServiceOptions {
  autoFetch?: boolean;
}

interface UserProfile {
  id: number;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  employee: Employee | null;
  lastLoginAt: string | null;
}

interface UserProfileUpdateData {
  email?: string;
  phone?: string | null;
  firstName?: string;
  lastName?: string;
}

interface MyAttendanceOptions {
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  autoFetch?: boolean;
}

interface UseSelfServiceReturn {
  // Profile management
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UserProfileUpdateData) => Promise<UserProfile | null>;

  // My attendance management
  myAttendances: AttendanceRecord[];
  attendanceLoading: boolean;
  attendanceError: string | null;
  attendancePageInfo: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  } | null;
  fetchMyAttendances: (options?: MyAttendanceOptions) => Promise<void>;
  checkIn: (notes?: string) => Promise<AttendanceRecord | null>;
  checkOut: (notes?: string) => Promise<AttendanceRecord | null>;
  updateMyAttendance: (id: number, data: SelfAttendanceRequest) => Promise<AttendanceRecord | null>;

  // Utility functions
  refreshAll: () => Promise<void>;
  getTodayAttendance: () => AttendanceRecord | null;
  hasCheckedInToday: () => boolean;
  hasCheckedOutToday: () => boolean;
}

/**
 * Custom hook for user self-service operations (/me/* endpoints)
 *
 * Provides:
 * - Profile management (view and update own profile)
 * - My attendance management (view, check-in, check-out, update own attendance)
 * - Current date attendance utilities
 *
 * This hook is designed for USER role but can be used by any authenticated user
 * to access their own data.
 *
 * @param options - Configuration options
 * @returns Self-service data and operations
 */
export function useSelfService(options: UseSelfServiceOptions = {}): UseSelfServiceReturn {
  const { autoFetch = true } = options;

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Attendance state
  const [myAttendances, setMyAttendances] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendancePageInfo, setAttendancePageInfo] = useState<{
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  } | null>(null);

  /**
   * Fetch current user's profile
   */
  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);

    try {
      const profileData = await api.selfService.getProfile() as UserProfile;
      setProfile(profileData);

      // Update auth service with latest user data
      if (profileData.employee) {
        authService.updateUserData({
          id: profileData.id,
          email: profileData.email,
          fullName: profileData.employee.fullName,
          role: profileData.role,
          employeeId: profileData.employee.id,
          departmentId: profileData.employee.department.id,
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch profile';
      setProfileError(errorMessage);
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  /**
   * Update current user's profile (limited fields)
   */
  const updateProfile = useCallback(async (data: UserProfileUpdateData): Promise<UserProfile | null> => {
    setProfileError(null);

    try {
      const updatedProfile = await api.selfService.updateProfile(data) as UserProfile;
      setProfile(updatedProfile);

      // Update auth service with latest user data
      if (updatedProfile.employee) {
        authService.updateUserData({
          id: updatedProfile.id,
          email: updatedProfile.email,
          fullName: updatedProfile.employee.fullName,
          role: updatedProfile.role,
          employeeId: updatedProfile.employee.id,
          departmentId: updatedProfile.employee.department.id,
        });
      }

      return updatedProfile;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile';
      setProfileError(errorMessage);
      console.error('Error updating profile:', err);
      return null;
    }
  }, []);

  /**
   * Fetch current user's attendance records
   */
  const fetchMyAttendances = useCallback(async (fetchOptions: MyAttendanceOptions = {}) => {
    setAttendanceLoading(true);
    setAttendanceError(null);

    try {
      const {
        from,
        to,
        page = 0,
        size = 20,
      } = fetchOptions;

      const params: Record<string, any> = {
        page,
        size,
      };

      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.selfService.getMyAttendances(params) as PaginatedResponse<AttendanceRecord>;

      setMyAttendances(response.content);
      setAttendancePageInfo(response.page);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch attendance records';
      setAttendanceError(errorMessage);
      console.error('Error fetching my attendances:', err);
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  /**
   * Check in for today (create attendance record with check-in time)
   */
  const checkIn = useCallback(async (notes?: string): Promise<AttendanceRecord | null> => {
    setAttendanceError(null);

    try {
      const now = new Date();
      const checkInTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format

      const data: SelfAttendanceRequest = {
        checkInTime,
        notes: notes || null,
      };

      const newRecord = await api.selfService.createMyAttendance(data) as AttendanceRecord;

      // Add to local state
      setMyAttendances(prev => [newRecord, ...prev]);

      return newRecord;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to check in';
      setAttendanceError(errorMessage);
      console.error('Error checking in:', err);
      return null;
    }
  }, []);

  /**
   * Check out for today (update today's attendance record with check-out time)
   */
  const checkOut = useCallback(async (notes?: string): Promise<AttendanceRecord | null> => {
    setAttendanceError(null);

    try {
      const todayRecord = getTodayAttendance();
      if (!todayRecord) {
        throw new Error('No check-in record found for today. Please check in first.');
      }

      const now = new Date();
      const checkOutTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format

      const data: SelfAttendanceRequest = {
        checkInTime: todayRecord.checkInTime,
        checkOutTime,
        notes: notes || todayRecord.notes || null,
      };

      const updatedRecord = await api.selfService.updateMyAttendance(todayRecord.id, data) as AttendanceRecord;

      // Update local state
      setMyAttendances(prev =>
        prev.map(record => record.id === todayRecord.id ? updatedRecord : record)
      );

      return updatedRecord;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to check out';
      setAttendanceError(errorMessage);
      console.error('Error checking out:', err);
      return null;
    }
  }, [myAttendances]);

  /**
   * Update own attendance record (current date only for USER role)
   */
  const updateMyAttendance = useCallback(async (
    id: number,
    data: SelfAttendanceRequest
  ): Promise<AttendanceRecord | null> => {
    setAttendanceError(null);

    try {
      const updatedRecord = await api.selfService.updateMyAttendance(id, data) as AttendanceRecord;

      // Update local state
      setMyAttendances(prev =>
        prev.map(record => record.id === id ? updatedRecord : record)
      );

      return updatedRecord;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update attendance';
      setAttendanceError(errorMessage);
      console.error('Error updating my attendance:', err);
      return null;
    }
  }, []);

  /**
   * Refresh all self-service data
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchProfile(),
      fetchMyAttendances(),
    ]);
  }, [fetchProfile, fetchMyAttendances]);

  /**
   * Get today's attendance record if exists
   */
  const getTodayAttendance = useCallback((): AttendanceRecord | null => {
    const today = new Date().toISOString().split('T')[0];
    return myAttendances.find(record => record.attendanceDate === today) || null;
  }, [myAttendances]);

  /**
   * Check if user has checked in today
   */
  const hasCheckedInToday = useCallback((): boolean => {
    const todayRecord = getTodayAttendance();
    return todayRecord !== null && todayRecord.checkInTime !== null;
  }, [getTodayAttendance]);

  /**
   * Check if user has checked out today
   */
  const hasCheckedOutToday = useCallback((): boolean => {
    const todayRecord = getTodayAttendance();
    return todayRecord !== null && todayRecord.checkOutTime !== null;
  }, [getTodayAttendance]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && authService.isAuthenticated()) {
      fetchProfile();
      fetchMyAttendances();
    }
  }, [autoFetch, fetchProfile, fetchMyAttendances]);

  return {
    // Profile management
    profile,
    profileLoading,
    profileError,
    fetchProfile,
    updateProfile,

    // My attendance management
    myAttendances,
    attendanceLoading,
    attendanceError,
    attendancePageInfo,
    fetchMyAttendances,
    checkIn,
    checkOut,
    updateMyAttendance,

    // Utility functions
    refreshAll,
    getTodayAttendance,
    hasCheckedInToday,
    hasCheckedOutToday,
  };
}

export default useSelfService;
