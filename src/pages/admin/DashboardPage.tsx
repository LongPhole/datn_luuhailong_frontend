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
 * Admin Dashboard Page - ADMIN Role
 *
 * Provides a comprehensive overview of the entire system including:
 * - System-wide statistics
 * - Department overview
 * - Employee metrics
 * - Attendance summary
 * - Recent activities
 *
 * Features:
 * - Total system statistics (departments, employees, attendance)
 * - Quick access to all management functions
 * - Real-time data visualization
 * - System health indicators
 *
 * API Endpoints:
 * - GET /api/v1/departments
 * - GET /api/v1/employees
 * - GET /api/v1/attendances
 */

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showError } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayAttendances, setTodayAttendances] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Load all dashboard data in parallel
      const [deptsResponse, employeesResponse, attendancesResponse] = await Promise.all([
        api.departments.list({ size: 100 }),
        api.employees.list({ size: 100 }),
        api.attendances.list({ from: today, to: today, size: 100 }),
      ]);

      setDepartments(deptsResponse.content);
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
    // Department stats
    const totalDepartments = departments.length;
    const activeDepartments = departments.filter(d => d.status === 'ACTIVE').length;

    // Employee stats
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;
    const terminatedEmployees = employees.filter(e => e.status === 'TERMINATED').length;

    // Attendance stats
    const totalAttendance = todayAttendances.length;
    const presentToday = todayAttendances.filter(a => a.status === 'PRESENT').length;
    const lateToday = todayAttendances.filter(a => a.status === 'LATE').length;
    const absentToday = activeEmployees - totalAttendance;
    const leaveToday = todayAttendances.filter(a => a.status === 'LEAVE').length;
    const attendanceRate = activeEmployees > 0
      ? Math.round((totalAttendance / activeEmployees) * 100)
      : 0;

    return {
      totalDepartments,
      activeDepartments,
      totalEmployees,
      activeEmployees,
      terminatedEmployees,
      totalAttendance,
      presentToday,
      lateToday,
      absentToday,
      leaveToday,
      attendanceRate,
    };
  }, [departments, employees, todayAttendances]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-20 w-full" />
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">System Overview and Management</p>
        </div>
        <Button onClick={loadDashboardData}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Primary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalDepartments}</p>
              <p className="text-xs text-gray-500">{stats.activeDepartments} active</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalEmployees}</p>
              <p className="text-xs text-gray-500">{stats.activeEmployees} active</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Attendance</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalAttendance}</p>
              <p className="text-xs text-gray-500">{stats.attendanceRate}% rate</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Present Today</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.presentToday}</p>
              <p className="text-xs text-gray-500">{stats.lateToday} late</p>
            </div>
            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Attendance Stats */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Today's Attendance Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalAttendance}</p>
            <p className="text-sm text-gray-600">Total Checked In</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
            <p className="text-sm text-gray-600">On Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.lateToday}</p>
            <p className="text-sm text-gray-600">Late</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
            <p className="text-sm text-gray-600">Absent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.leaveToday}</p>
            <p className="text-sm text-gray-600">On Leave</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Attendance Rate</span>
            <span>{stats.attendanceRate}%</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
            <div
              className="bg-green-500"
              style={{ width: `${stats.activeEmployees > 0 ? (stats.presentToday / stats.activeEmployees) * 100 : 0}%` }}
              title={`On Time: ${stats.presentToday}`}
            />
            <div
              className="bg-yellow-500"
              style={{ width: `${stats.activeEmployees > 0 ? (stats.lateToday / stats.activeEmployees) * 100 : 0}%` }}
              title={`Late: ${stats.lateToday}`}
            />
            <div
              className="bg-purple-500"
              style={{ width: `${stats.activeEmployees > 0 ? (stats.leaveToday / stats.activeEmployees) * 100 : 0}%` }}
              title={`Leave: ${stats.leaveToday}`}
            />
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/admin/departments">
              <Button variant="outline" className="w-full justify-start">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Manage Departments
              </Button>
            </Link>

            <Link to="/admin/employees">
              <Button variant="outline" className="w-full justify-start">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Manage Employees
              </Button>
            </Link>

            <Link to="/admin/attendances">
              <Button variant="outline" className="w-full justify-start">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Manage Attendance
              </Button>
            </Link>

            <Link to="/admin/reports">
              <Button variant="outline" className="w-full justify-start">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Reports
              </Button>
            </Link>

            <Link to="/admin/audit">
              <Button variant="outline" className="w-full justify-start">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Audit Logs
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Department Overview</h2>
          <div className="space-y-3">
            {departments.slice(0, 5).map(dept => (
              <Link
                key={dept.id}
                to={`/admin/departments/${dept.id}`}
                className="block p-3 border rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{dept.name}</p>
                    <p className="text-sm text-gray-600">{dept.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">{dept.employeeCount}</p>
                    <p className="text-xs text-gray-500">employees</p>
                  </div>
                </div>
              </Link>
            ))}
            {departments.length > 5 && (
              <Link to="/admin/departments">
                <Button variant="link" className="w-full">
                  View all {departments.length} departments →
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
