import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/authStore';
import { api } from '../../services/apiClient';
import { AttendanceRecord, PaginatedResponse } from '../../types';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/useToast';
import { AttendanceView } from '../../components/attendance/AttendanceView';

/**
 * Department Attendance Page - MANAGER Role
 *
 * Displays attendance records for all employees in the manager's department.
 * Managers can edit attendance within the last 7 days.
 *
 * Features:
 * - View all attendance records for department employees
 * - Filter by employee, date range, and status
 * - Edit attendance records within 7 days
 * - View attendance statistics
 * - Table and calendar views
 * - Export attendance data
 *
 * Time-based Restrictions:
 * - Can edit records within 7 days
 * - Cannot edit records older than 7 days
 *
 * API Endpoints:
 * - GET /api/v1/attendances?departmentId={id}
 * - PUT /api/v1/attendances/{id} (within 7 days only)
 * - POST /api/v1/attendances
 */

export const DepartmentAttendancePage: React.FC = () => {
  const { user, getDepartmentId } = useAuth();
  const { showError } = useToast();

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const departmentId = getDepartmentId();

  useEffect(() => {
    if (departmentId) {
      loadAttendances();
    }
  }, [departmentId, pagination.page, dateRange, statusFilter]);

  const loadAttendances = async () => {
    if (!departmentId) return;

    setIsLoading(true);
    try {
      const params: any = {
        departmentId,
        from: dateRange.from,
        to: dateRange.to,
        page: pagination.page,
        size: pagination.size,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response: PaginatedResponse<AttendanceRecord> = await api.attendances.list(params);

      setAttendances(response.content);
      setPagination(prev => ({
        ...prev,
        totalElements: response.page.totalElements,
        totalPages: response.page.totalPages,
      }));
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to load attendance records',
        
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setDateRange({ from, to });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRefresh = () => {
    loadAttendances();
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = attendances.length;
    const present = attendances.filter(a => a.status === 'PRESENT').length;
    const late = attendances.filter(a => a.status === 'LATE').length;
    const absent = attendances.filter(a => a.status === 'ABSENT').length;
    const leave = attendances.filter(a => a.status === 'LEAVE').length;
    const presentRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      total,
      present,
      late,
      absent,
      leave,
      presentRate,
    };
  }, [attendances]);

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
          <h1 className="text-3xl font-bold">Department Attendance</h1>
          <p className="text-gray-600">Manage attendance for your department</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
          >
            Calendar View
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Attendance Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Records</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Present</p>
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Late</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Absent</p>
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Leave</p>
          <p className="text-2xl font-bold text-purple-600">{stats.leave}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Attendance Rate</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.presentRate}%</p>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2">Filter by status:</span>
          <Button
            variant={statusFilter === null ? 'default' : 'outline'}
            onClick={() => handleStatusFilterChange(null)}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'PRESENT' ? 'default' : 'outline'}
            onClick={() => handleStatusFilterChange('PRESENT')}
            size="sm"
          >
            Present
          </Button>
          <Button
            variant={statusFilter === 'LATE' ? 'default' : 'outline'}
            onClick={() => handleStatusFilterChange('LATE')}
            size="sm"
          >
            Late
          </Button>
          <Button
            variant={statusFilter === 'ABSENT' ? 'default' : 'outline'}
            onClick={() => handleStatusFilterChange('ABSENT')}
            size="sm"
          >
            Absent
          </Button>
          <Button
            variant={statusFilter === 'LEAVE' ? 'default' : 'outline'}
            onClick={() => handleStatusFilterChange('LEAVE')}
            size="sm"
          >
            Leave
          </Button>
        </div>
      </Card>

      {/* Attendance Records */}
      <AttendanceView
        attendances={attendances}
        isLoading={isLoading}
        viewMode={viewMode}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        pagination={pagination}
        onPageChange={handlePageChange}
        showEmployeeName={true}
        canEdit={true}
        editRestrictionDays={7}
      />

      {/* Info Message */}
      <Card className="p-4 mt-6 bg-blue-50">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Manager Access</p>
            <p className="text-sm text-blue-700 mt-1">
              As a manager, you can view and edit attendance records for employees in your department.
              You can edit records within the last 7 days. Records older than 7 days can only be edited by administrators.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DepartmentAttendancePage;
