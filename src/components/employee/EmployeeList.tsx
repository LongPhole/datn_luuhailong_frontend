import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Download, Mail, Phone } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '../../lib/utils';
import { useAuth } from '../../stores/authStore';
import { Employee, Department, PaginatedResponse } from '../../types';
import { api } from '../../services/apiClient';

interface EmployeeListProps {
  departmentId?: number;
  onEmployeeClick?: (employee: Employee) => void;
  onCreateEmployee?: () => void;
  className?: string;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  departmentId,
  onEmployeeClick,
  onCreateEmployee,
  className,
}) => {
  const { user, isAdmin, isManager, getDepartmentId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | 'ALL'>(
    departmentId || 'ALL'
  );
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ALL'>('ACTIVE');

  // Fetch departments for filter
  const fetchDepartments = async () => {
    try {
      const response = await api.departments.list({ page: 0, size: 100 });
      setDepartments(response.content);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
    }
  };

  // Fetch employees with filters
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = {
        page: currentPage,
        size: 20,
      };

      // Apply search query
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Apply department filter
      if (selectedDepartment !== 'ALL') {
        params.departmentId = selectedDepartment;
      } else if (isManager() && getDepartmentId()) {
        // Managers can only see their department employees
        params.departmentId = getDepartmentId();
      }

      // Apply status filter
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }

      const response: PaginatedResponse<Employee> = await api.employees.list(params);

      setEmployees(response.content);
      setTotalPages(response.page.totalPages);
      setTotalElements(response.page.totalElements);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDepartments();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEmployees();
    }
  }, [currentPage, selectedDepartment, selectedStatus, user]);

  const handleSearch = () => {
    setCurrentPage(0); // Reset to first page
    fetchEmployees();
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusBadge = (status: Employee['status']) => {
    const variants = {
      ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20',
      INACTIVE: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      TERMINATED: 'bg-red-500/10 text-red-600 border-red-500/20',
    };

    return (
      <Badge variant="outline" className={cn('font-medium', variants[status])}>
        {status}
      </Badge>
    );
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleExport = async () => {
    try {
      await api.employees.export({
        search: searchQuery || undefined,
        departmentId: selectedDepartment !== 'ALL' ? selectedDepartment : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  };

  const canCreateEmployee = isAdmin() || isManager();
  const canViewSalary = isAdmin();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search and Create */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm"
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {canCreateEmployee && (
              <Button onClick={onCreateEmployee}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="w-64">
              <Select
                value={selectedDepartment.toString()}
                onValueChange={(value) => {
                  setSelectedDepartment(value === 'ALL' ? 'ALL' : parseInt(value));
                  setCurrentPage(0);
                }}
                disabled={isManager() && !isAdmin()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin() && <SelectItem value="ALL">All Departments</SelectItem>}
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value as typeof selectedStatus);
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isAdmin() && (
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Employee Table */}
      <Card>
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Contact</TableHead>
                {canViewSalary && <TableHead>Salary</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canViewSalary ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    Loading employees...
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canViewSalary ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onEmployeeClick?.(employee)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={employee.avatarUrl || undefined} alt={employee.fullName} />
                          <AvatarFallback>{getInitials(employee.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{employee.fullName}</div>
                          <div className="text-xs text-muted-foreground">{employee.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{employee.empCode}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.department.name}</div>
                        <div className="text-xs text-muted-foreground">{employee.department.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.title}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {employee.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{employee.email}</span>
                          </div>
                        )}
                        {employee.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{employee.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {canViewSalary && (
                      <TableCell>
                        {employee.baseSalary
                          ? `$${employee.baseSalary.toLocaleString()}`
                          : '-'}
                      </TableCell>
                    )}
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEmployeeClick?.(employee);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {employees.length} of {totalElements} employees (Page {currentPage + 1} of {totalPages})
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
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

export default EmployeeList;
