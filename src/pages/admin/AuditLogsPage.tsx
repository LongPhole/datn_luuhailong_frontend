import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/useToast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

/**
 * Admin Audit Logs Page - ADMIN Role Only
 *
 * View all system audit logs and changes
 */

interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  userId: number;
  user?: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  };
  timestamp: string;
  oldValues?: any;
  newValues?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditStatistics {
  totalAuditLogs: number;
  departmentAudits: number;
  employeeAudits: number;
  createOperations: number;
  updateOperations: number;
  deleteOperations: number;
}

interface PagedResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export const AuditLogsPage: React.FC = () => {
  const { showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    entityType: 'ALL',
    operation: 'ALL',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadAuditLogs();
    loadStatistics();
  }, [pagination.page, pagination.size, filters]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        size: pagination.size,
      };

      if (filters.entityType && filters.entityType !== 'ALL') params.entityType = filters.entityType;
      if (filters.operation && filters.operation !== 'ALL') params.operation = filters.operation;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response: PagedResponse<AuditLog> = await api.audit.list(params);

      setAuditLogs(response.content);
      setPagination(prev => ({
        ...prev,
        totalPages: response.page.totalPages,
        totalElements: response.page.totalElements,
      }));
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to load audit logs',
        
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await api.audit.getStatistics();
      setStatistics(stats);
    } catch (error) {
      // Silent fail for statistics
      console.error('Failed to load audit statistics:', error);
    }
  };

  const handleFilterChange = (field: keyof typeof filters) => (
    value: string | React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = typeof value === 'string' ? value : value.target.value;
    setFilters(prev => ({
      ...prev,
      [field]: newValue,
    }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters({
      entityType: 'ALL',
      operation: 'ALL',
      startDate: '',
      endDate: '',
    });
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getOperationBadge = (operation: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      CREATE: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive',
    };
    return (
      <Badge variant={variants[operation] || 'default'}>
        {operation}
      </Badge>
    );
  };

  if (isLoading && auditLogs.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Audit Logs</h1>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Audit Logs</h1>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Logs</div>
            <div className="text-2xl font-bold">{statistics.totalAuditLogs}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Departments</div>
            <div className="text-2xl font-bold text-blue-600">{statistics.departmentAudits}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Employees</div>
            <div className="text-2xl font-bold text-green-600">{statistics.employeeAudits}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Created</div>
            <div className="text-2xl font-bold text-emerald-600">{statistics.createOperations}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Updated</div>
            <div className="text-2xl font-bold text-amber-600">{statistics.updateOperations}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Deleted</div>
            <div className="text-2xl font-bold text-red-600">{statistics.deleteOperations}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="entityType">Entity Type</Label>
            <Select value={filters.entityType} onValueChange={handleFilterChange('entityType')}>
              <SelectTrigger id="entityType">
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All entities</SelectItem>
                <SelectItem value="Department">Department</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Attendance">Attendance</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="operation">Operation</Label>
            <Select value={filters.operation} onValueChange={handleFilterChange('operation')}>
              <SelectTrigger id="operation">
                <SelectValue placeholder="All operations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All operations</SelectItem>
                <SelectItem value="CREATE">CREATE</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange('startDate')}
            />
          </div>

          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange('endDate')}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={() => loadAuditLogs()} variant="outline">
            Apply Filters
          </Button>
          <Button onClick={handleClearFilters} variant="ghost">
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>{getOperationBadge(log.operation)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.entityType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{log.entityId}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{log.user?.fullName || 'Unknown'}</div>
                      <div className="text-gray-500">{log.user?.email || `User #${log.userId}`}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {log.description || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {pagination.page * pagination.size + 1} to{' '}
              {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of{' '}
              {pagination.totalElements} entries
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 0}
              >
                Previous
              </Button>
              <div className="flex items-center px-4">
                Page {pagination.page + 1} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditLogsPage;
