import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/authStore';
import { api } from '../../services/apiClient';
import { Department, Employee, AttendanceRecord } from '../../types';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/useToast';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';

/**
 * Manager Dashboard Page - MANAGER Role
 *
 * Provides an overview of the manager's department including:
 * - Department information and employee count
 * - Recent attendance statistics
 * - Quick actions for common tasks
 * - Department performance metrics
 *
 * Features:
 * - Department summary card
 * - Employee statistics
 * - Today's attendance overview
 * - Quick navigation to department resources
 *
 * API Endpoints:
 * - GET /api/v1/departments/{id}
 * - GET /api/v1/employees?departmentId={id}
 * - GET /api/v1/attendances?departmentId={id}&from={today}
 */

export const DashboardPage: React.FC = () => {
  const { user, getDepartmentId } = useAuth();
  const { showError } = useToast();

  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayAttendances, setTodayAttendances] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const departmentId = getDepartmentId();

  useEffect(() => {
    if (departmentId) {
      loadDashboardData();
    }
  }, [departmentId]);

  const loadDashboardData = async () => {
    if (!departmentId) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Load department info, employees, and today's attendance in parallel
      const [deptResponse, employeesResponse, attendancesResponse] = await Promise.all([
        api.departments.get(departmentId),
        api.employees.list({ departmentId, status: 'ACTIVE', size: 100 }),
        api.attendances.list({ departmentId, from: today, to: today, size: 100 }),
      ]);

      setDepartment(deptResponse);
      setEmployees(employeesResponse.content);
      setTodayAttendances(attendancesResponse.content);
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to load dashboard data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;

    const attendanceToday = todayAttendances.length;
    const presentToday = todayAttendances.filter(a => a.status === 'PRESENT').length;
    const lateToday = todayAttendances.filter(a => a.status === 'LATE').length;
    const absentToday = activeEmployees - attendanceToday;
    const attendanceRate = activeEmployees > 0
      ? Math.round((attendanceToday / activeEmployees) * 100)
      : 0;

    return {
      totalEmployees,
      activeEmployees,
      attendanceToday,
      presentToday,
      lateToday,
      absentToday,
      attendanceRate,
    };
  }, [employees, todayAttendances]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Manager Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="h-96 w-full" />
        </Card>
      </div>
    );
  }

  if (!department) {
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
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-gray-600">{department.name}</p>
        </div>
        <Link to="/manager/my-department">
          <Button>View Department Details</Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Attendance</p>
              <p className="text-3xl font-bold text-green-600">{stats.attendanceToday}</p>
              <p className="text-xs text-gray-500">{stats.attendanceRate}% attendance rate</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Present Today</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.presentToday}</p>
            </div>
            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Late/Absent</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.lateToday + stats.absentToday}
              </p>
              <p className="text-xs text-gray-500">{stats.lateToday} late, {stats.absentToday} absent</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Department Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Department Name</p>
              <p className="font-medium">{department.name}</p>
            </div>
            {department.description && (
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-700">{department.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="font-medium">{department.employeeCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs ${
                department.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {department.status}
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/manager/employees">
              <Button variant="outline" className="w-full justify-start">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                View Employees
              </Button>
            </Link>

            <Link to="/manager/attendances">
              <Button variant="outline" className="w-full justify-start">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Manage Attendance
              </Button>
            </Link>

            <Link to="/manager/reports">
              <Button variant="outline" className="w-full justify-start">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Reports
              </Button>
            </Link>

            <Link to="/manager/my-department">
              <Button variant="outline" className="w-full justify-start">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Department Details
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
