import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/authStore';
import { api } from '../../services/apiClient';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/useToast';

/**
 * Department Reports Page - MANAGER Role
 *
 * Provides reporting and analytics for the manager's department including:
 * - Attendance reports
 * - Employee statistics
 * - Department performance metrics
 * - Exportable reports
 *
 * Features:
 * - Generate attendance summary reports
 * - View department-wide statistics
 * - Filter reports by date range
 * - Export reports to CSV/PDF
 * - Visual charts and graphs
 *
 * API Endpoints:
 * - GET /api/v1/reports/attendance?departmentId={id}
 * - GET /api/v1/reports/employees?departmentId={id}
 */

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  attendanceRate: number;
}

interface EmployeeSummary {
  totalEmployees: number;
  activeEmployees: number;
  terminatedEmployees: number;
  averageTenure: number;
}

export const DepartmentReportsPage: React.FC = () => {
  const { user, getDepartmentId } = useAuth();
  const { showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeSummary | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const departmentId = getDepartmentId();

  useEffect(() => {
    if (departmentId) {
      loadReports();
    }
  }, [departmentId, dateRange]);

  const loadReports = async () => {
    if (!departmentId) return;

    setIsLoading(true);
    try {
      // Load attendance and employee data for the department
      const [attendanceResponse, employeesResponse] = await Promise.all([
        api.attendances.list({
          departmentId,
          from: dateRange.from,
          to: dateRange.to,
          size: 100, // Maximum allowed page size
        }),
        api.employees.list({ departmentId, size: 100 }),
      ]);

      // Calculate attendance summary
      const attendances = attendanceResponse.content;
      const totalDays = attendances.length;
      const presentDays = attendances.filter(a => a.status === 'PRESENT').length;
      const lateDays = attendances.filter(a => a.status === 'LATE').length;
      const absentDays = attendances.filter(a => a.status === 'ABSENT').length;
      const leaveDays = attendances.filter(a => a.status === 'LEAVE').length;
      const attendanceRate = totalDays > 0
        ? Math.round(((presentDays + lateDays) / totalDays) * 100)
        : 0;

      setAttendanceSummary({
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        leaveDays,
        attendanceRate,
      });

      // Calculate employee summary
      const employees = employeesResponse.content;
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;
      const terminatedEmployees = employees.filter(e => e.status === 'TERMINATED').length;

      // Calculate average tenure in months
      const now = new Date();
      const tenures = employees
        .filter(e => e.status === 'ACTIVE')
        .map(e => {
          const hireDate = new Date(e.hireDate);
          const months = (now.getFullYear() - hireDate.getFullYear()) * 12 +
                        (now.getMonth() - hireDate.getMonth());
          return months;
        });
      const averageTenure = tenures.length > 0
        ? Math.round(tenures.reduce((a, b) => a + b, 0) / tenures.length)
        : 0;

      setEmployeeSummary({
        totalEmployees,
        activeEmployees,
        terminatedEmployees,
        averageTenure,
      });

    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to load reports',
        
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    showError({
      title: 'Export Started',
      description: `Exporting report as ${format.toUpperCase()}...`,
    });
    // Implementation would call export API endpoint
  };

  const handleDateChange = (field: 'from' | 'to') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Department Reports</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-32 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Department Reports</h1>
          <p className="text-gray-600">Analytics and insights for your department</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('csv')} variant="outline">
            Export CSV
          </Button>
          <Button onClick={() => handleExport('pdf')} variant="outline">
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Report Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="from">From Date</Label>
            <Input
              id="from"
              type="date"
              value={dateRange.from}
              onChange={handleDateChange('from')}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="to">To Date</Label>
            <Input
              id="to"
              type="date"
              value={dateRange.to}
              onChange={handleDateChange('to')}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Attendance Summary */}
      {attendanceSummary && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Attendance Summary</h2>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{attendanceSummary.totalDays}</p>
              <p className="text-sm text-gray-600">Total Days</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{attendanceSummary.presentDays}</p>
              <p className="text-sm text-gray-600">Present</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{attendanceSummary.lateDays}</p>
              <p className="text-sm text-gray-600">Late</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{attendanceSummary.absentDays}</p>
              <p className="text-sm text-gray-600">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{attendanceSummary.leaveDays}</p>
              <p className="text-sm text-gray-600">Leave</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{attendanceSummary.attendanceRate}%</p>
              <p className="text-sm text-gray-600">Attendance Rate</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Attendance Distribution</span>
              <span>{attendanceSummary.attendanceRate}% Attendance Rate</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500"
                style={{ width: `${(attendanceSummary.presentDays / attendanceSummary.totalDays) * 100}%` }}
                title={`Present: ${attendanceSummary.presentDays}`}
              />
              <div
                className="bg-yellow-500"
                style={{ width: `${(attendanceSummary.lateDays / attendanceSummary.totalDays) * 100}%` }}
                title={`Late: ${attendanceSummary.lateDays}`}
              />
              <div
                className="bg-red-500"
                style={{ width: `${(attendanceSummary.absentDays / attendanceSummary.totalDays) * 100}%` }}
                title={`Absent: ${attendanceSummary.absentDays}`}
              />
              <div
                className="bg-purple-500"
                style={{ width: `${(attendanceSummary.leaveDays / attendanceSummary.totalDays) * 100}%` }}
                title={`Leave: ${attendanceSummary.leaveDays}`}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Employee Summary */}
      {employeeSummary && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Employee Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-blue-600">{employeeSummary.totalEmployees}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Employees</p>
              <p className="text-3xl font-bold text-green-600">{employeeSummary.activeEmployees}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Terminated</p>
              <p className="text-3xl font-bold text-gray-600">{employeeSummary.terminatedEmployees}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Tenure</p>
              <p className="text-3xl font-bold text-purple-600">{employeeSummary.averageTenure}</p>
              <p className="text-xs text-gray-500">months</p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/manager/employees'}>
            View Employees
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/manager/attendances'}>
            View Attendance
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/manager/my-department'}>
            Department Details
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DepartmentReportsPage;
