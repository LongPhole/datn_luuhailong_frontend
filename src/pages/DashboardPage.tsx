import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Building2,
  Clock,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import StatisticsWidget from '@/components/dashboard/StatisticsWidget';
import useToast from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient, { API_ENDPOINTS } from '@/services/apiClient';
import {
  AuditLogEntry,
  Department,
  Employee,
  PaginatedResponse,
} from '@/types';

interface DepartmentStat {
  id: number;
  name: string;
  code: string;
  employeeCount: number;
  status: Department['status'];
}

interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  terminated: number;
}

const operationLabels: Record<AuditLogEntry['operation'], string> = {
  CREATE: 'created',
  UPDATE: 'updated',
  DELETE: 'deleted',
};

const operationBadgeClasses: Record<AuditLogEntry['operation'], string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  UPDATE: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
  DELETE: 'bg-red-100 text-red-700 hover:bg-red-100',
};

const DashboardPage: React.FC = () => {
  const { showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats>({
    total: 0,
    active: 0,
    inactive: 0,
    terminated: 0,
  });
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [departmentResponse, employeeResponse, auditResponse] = await Promise.all([
          apiClient.get<PaginatedResponse<Department>>(API_ENDPOINTS.departments.list, {
            params: { page: 0, size: 100 },
          }),
          apiClient.get<PaginatedResponse<Employee>>(API_ENDPOINTS.employees.list, {
            params: { page: 0, size: 100 },
          }),
          apiClient.get<PaginatedResponse<AuditLogEntry>>(API_ENDPOINTS.audit.list, {
            params: { page: 0, size: 8 },
          }),
        ]);

        if (cancelled) return;

        const departments = departmentResponse.content ?? [];
        const sortedDepartments = [...departments]
          .sort((a, b) => b.employeeCount - a.employeeCount)
          .map<DepartmentStat>((dept) => ({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            employeeCount: dept.employeeCount,
            status: dept.status,
          }));

        const employees = employeeResponse.content ?? [];
        const stats = employees.reduce<EmployeeStats>((acc, employee) => {
          acc.total += 1;
          if (employee.status === 'ACTIVE') {
            acc.active += 1;
          } else if (employee.status === 'TERMINATED') {
            acc.terminated += 1;
          } else {
            acc.inactive += 1;
          }
          return acc;
        }, {
          total: 0,
          active: 0,
          inactive: 0,
          terminated: 0,
        });

        // Fallback to pagination metadata if we did not fetch the full dataset
        const totalEmployees = employeeResponse.page?.totalElements ?? stats.total;
        const normalisedStats: EmployeeStats = {
          ...stats,
          total: totalEmployees,
        };

        setDepartmentStats(sortedDepartments);
        setEmployeeStats(normalisedStats);
        setRecentActivity(auditResponse.content ?? []);
      } catch (fetchError) {
        if (cancelled) return;
        const message = fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load dashboard data.';
        setError(message);
        showError({
          title: 'Unable to load dashboard',
          description: message,
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  const activePercentage = useMemo(() => {
    if (employeeStats.total === 0) {
      return 0;
    }
    return Math.round((employeeStats.active / employeeStats.total) * 100);
  }, [employeeStats.active, employeeStats.total]);

  const inactiveCount = useMemo(() => employeeStats.inactive + employeeStats.terminated, [
    employeeStats.inactive,
    employeeStats.terminated,
  ]);

  const topDepartments = useMemo(
    () => departmentStats.slice(0, 5),
    [departmentStats],
  );

  const hasActivity = recentActivity.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of workforce metrics and the latest account activity.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/employees"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View employees
          </Link>
          <Link
            to="/departments"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View departments
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatisticsWidget
          title="Total employees"
          value={employeeStats.total}
          description={`Active: ${employeeStats.active} � Inactive: ${inactiveCount}`}
          icon={<Users className="h-5 w-5" />}
          trendLabel={isLoading ? undefined : 'Data refreshed from employee directory'}
          trendTone="neutral"
          loading={isLoading}
        />
        <StatisticsWidget
          title="Active workforce"
          value={`${activePercentage}%`}
          description="Share of employees currently active"
          icon={<UserCheck className="h-5 w-5" />}
          trendLabel={
            isLoading
              ? undefined
              : `${employeeStats.active} active / ${inactiveCount} inactive`
          }
          trendTone="positive"
          loading={isLoading}
        >
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${isNaN(activePercentage) ? 0 : activePercentage}%` }}
            />
          </div>
        </StatisticsWidget>
        <StatisticsWidget
          title="Inactive & terminated"
          value={inactiveCount}
          description="Employees requiring follow-up"
          icon={<UserX className="h-5 w-5" />}
          trendLabel={
            isLoading
              ? undefined
              : `${employeeStats.inactive} inactive � ${employeeStats.terminated} terminated`
          }
          trendTone="negative"
          loading={isLoading}
        />
        <StatisticsWidget
          title="Departments"
          value={departmentStats.length}
          description="Headcount distribution across teams"
          icon={<Building2 className="h-5 w-5" />}
          trendLabel={
            isLoading
              ? undefined
              : `${departmentStats.filter((dept) => dept.status === 'ACTIVE').length} active / ${departmentStats.filter((dept) => dept.status === 'INACTIVE').length} inactive`
          }
          trendTone="neutral"
          loading={isLoading}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Headcount by department</CardTitle>
              <p className="text-sm text-muted-foreground">
                Top teams by current employee count.
              </p>
            </div>
            <Badge variant="outline" className="gap-2 text-xs">
              <Users className="h-3.5 w-3.5" />
              {employeeStats.total} total
            </Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {topDepartments.length > 0 ? (
                  topDepartments.map((department) => {
                    const percentage = employeeStats.total > 0
                      ? Math.round((department.employeeCount / employeeStats.total) * 100)
                      : 0;

                    return (
                      <div key={department.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {department.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Code {department.code} � {department.status.toLowerCase()}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {department.employeeCount}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-indigo-500"
                            style={{ width: `${isNaN(percentage) ? 0 : percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No departments available yet.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Recent changes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest updates from the audit log.
              </p>
            </div>
            <Badge variant="outline" className="gap-2 text-xs">
              <Activity className="h-3.5 w-3.5" />
              Audit trail
            </Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : hasActivity ? (
              <ul className="space-y-4">
                {recentActivity.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`${operationBadgeClasses[entry.operation]} text-xs`}
                        >
                          {entry.operation}
                        </Badge>
                        <span className="text-sm font-semibold text-gray-900">
                          {entry.entityType} #{entry.entityId}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.user?.fullName || 'Unknown user'} {operationLabels[entry.operation]} this record
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No audit activity recorded yet.
              </div>
            )}
          </CardContent>

        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;






