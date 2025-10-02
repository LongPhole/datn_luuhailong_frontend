import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/useToast';
import { BarChart3, Users, Building2, TrendingUp, TrendingDown, Activity } from 'lucide-react';

/**
 * Admin Reports Page - ADMIN Role
 *
 * System-wide reports and analytics
 */

interface SystemStatistics {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  totalEmployees: number;
  activeEmployees: number;
  terminatedEmployees: number;
  recentAttendanceRecords: number;
  attendanceReportPeriod: string;
  attendanceByStatus: {
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    LEAVE: number;
  };
}

export const ReportsPage: React.FC = () => {
  const { showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      const stats = await api.reports.getSystemStatistics();
      setStatistics(stats);
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to load system statistics',
        
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePercentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>
        <Card className="p-6">
          <p className="text-center text-gray-500">No statistics available</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">System-wide insights and metrics</p>
        </div>
        <Button onClick={loadStatistics} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Department Statistics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Department Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Departments</p>
                <p className="text-3xl font-bold mt-2">{statistics.totalDepartments}</p>
              </div>
              <BarChart3 className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Departments</p>
                <p className="text-3xl font-bold mt-2 text-green-600">{statistics.activeDepartments}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {calculatePercentage(statistics.activeDepartments, statistics.totalDepartments)}% of total
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Departments</p>
                <p className="text-3xl font-bold mt-2 text-gray-600">{statistics.inactiveDepartments}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {calculatePercentage(statistics.inactiveDepartments, statistics.totalDepartments)}% of total
                </p>
              </div>
              <TrendingDown className="h-12 w-12 text-gray-600 opacity-20" />
            </div>
          </Card>
        </div>
      </div>

      {/* Employee Statistics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Employee Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold mt-2">{statistics.totalEmployees}</p>
              </div>
              <Users className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Employees</p>
                <p className="text-3xl font-bold mt-2 text-green-600">{statistics.activeEmployees}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {calculatePercentage(statistics.activeEmployees, statistics.totalEmployees)}% of total
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Terminated Employees</p>
                <p className="text-3xl font-bold mt-2 text-red-600">{statistics.terminatedEmployees}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {calculatePercentage(statistics.terminatedEmployees, statistics.totalEmployees)}% of total
                </p>
              </div>
              <TrendingDown className="h-12 w-12 text-red-600 opacity-20" />
            </div>
          </Card>
        </div>
      </div>

      {/* Attendance Statistics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Attendance Overview ({statistics.attendanceReportPeriod})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Total Records</p>
            <p className="text-3xl font-bold mt-2">{statistics.recentAttendanceRecords}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-600">Present</p>
            <p className="text-3xl font-bold mt-2 text-green-600">
              {statistics.attendanceByStatus.PRESENT}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {calculatePercentage(
                statistics.attendanceByStatus.PRESENT,
                statistics.recentAttendanceRecords
              )}%
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-600">Late</p>
            <p className="text-3xl font-bold mt-2 text-yellow-600">
              {statistics.attendanceByStatus.LATE}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {calculatePercentage(
                statistics.attendanceByStatus.LATE,
                statistics.recentAttendanceRecords
              )}%
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-600">Absent</p>
            <p className="text-3xl font-bold mt-2 text-red-600">
              {statistics.attendanceByStatus.ABSENT}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {calculatePercentage(
                statistics.attendanceByStatus.ABSENT,
                statistics.recentAttendanceRecords
              )}%
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-600">Leave</p>
            <p className="text-3xl font-bold mt-2 text-purple-600">
              {statistics.attendanceByStatus.LEAVE}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {calculatePercentage(
                statistics.attendanceByStatus.LEAVE,
                statistics.recentAttendanceRecords
              )}%
            </p>
          </Card>
        </div>

        {/* Attendance Distribution Bar */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-3">Attendance Distribution</h3>
          <div className="h-6 bg-gray-200 rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 flex items-center justify-center text-xs text-white font-semibold"
              style={{
                width: `${calculatePercentage(
                  statistics.attendanceByStatus.PRESENT,
                  statistics.recentAttendanceRecords
                )}%`,
              }}
              title={`Present: ${statistics.attendanceByStatus.PRESENT}`}
            >
              {calculatePercentage(
                statistics.attendanceByStatus.PRESENT,
                statistics.recentAttendanceRecords
              ) > 10 && `${calculatePercentage(
                statistics.attendanceByStatus.PRESENT,
                statistics.recentAttendanceRecords
              )}%`}
            </div>
            <div
              className="bg-yellow-500 flex items-center justify-center text-xs text-white font-semibold"
              style={{
                width: `${calculatePercentage(
                  statistics.attendanceByStatus.LATE,
                  statistics.recentAttendanceRecords
                )}%`,
              }}
              title={`Late: ${statistics.attendanceByStatus.LATE}`}
            >
              {calculatePercentage(
                statistics.attendanceByStatus.LATE,
                statistics.recentAttendanceRecords
              ) > 10 && `${calculatePercentage(
                statistics.attendanceByStatus.LATE,
                statistics.recentAttendanceRecords
              )}%`}
            </div>
            <div
              className="bg-red-500 flex items-center justify-center text-xs text-white font-semibold"
              style={{
                width: `${calculatePercentage(
                  statistics.attendanceByStatus.ABSENT,
                  statistics.recentAttendanceRecords
                )}%`,
              }}
              title={`Absent: ${statistics.attendanceByStatus.ABSENT}`}
            >
              {calculatePercentage(
                statistics.attendanceByStatus.ABSENT,
                statistics.recentAttendanceRecords
              ) > 10 && `${calculatePercentage(
                statistics.attendanceByStatus.ABSENT,
                statistics.recentAttendanceRecords
              )}%`}
            </div>
            <div
              className="bg-purple-500 flex items-center justify-center text-xs text-white font-semibold"
              style={{
                width: `${calculatePercentage(
                  statistics.attendanceByStatus.LEAVE,
                  statistics.recentAttendanceRecords
                )}%`,
              }}
              title={`Leave: ${statistics.attendanceByStatus.LEAVE}`}
            >
              {calculatePercentage(
                statistics.attendanceByStatus.LEAVE,
                statistics.recentAttendanceRecords
              ) > 10 && `${calculatePercentage(
                statistics.attendanceByStatus.LEAVE,
                statistics.recentAttendanceRecords
              )}%`}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Present: {statistics.attendanceByStatus.PRESENT}</span>
            <span>Late: {statistics.attendanceByStatus.LATE}</span>
            <span>Absent: {statistics.attendanceByStatus.ABSENT}</span>
            <span>Leave: {statistics.attendanceByStatus.LEAVE}</span>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => (window.location.href = '/admin/departments')}>
            View Departments
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/admin/employees')}>
            View Employees
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/admin/attendances')}>
            View Attendance Records
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/admin/audit')}>
            View Audit Logs
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
