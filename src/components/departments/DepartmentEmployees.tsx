import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, UserPlus, MoreHorizontal, Mail, Phone, Crown } from 'lucide-react';
import { Employee, Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DepartmentEmployeesProps {
  department: Department;
  onEmployeeSelect?: (employee: Employee) => void;
  onAssignManager?: (employee: Employee) => void;
  onAddEmployee?: () => void;
}

const DepartmentEmployees: React.FC<DepartmentEmployeesProps> = ({
  department,
  onEmployeeSelect,
  onAssignManager,
  onAddEmployee,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartmentEmployees();
  }, [department.id]);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, statusFilter]);

  const loadDepartmentEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/departments/${department.id}/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load department employees');
      }

      const employeesData = await response.json();
      setEmployees(employeesData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (employee) =>
          employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.empCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((employee) => employee.status === statusFilter);
    }

    setFilteredEmployees(filtered);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: Employee['status']) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      TERMINATED: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status]} className="text-xs">
        {status}
      </Badge>
    );
  };

  const isManager = (employee: Employee) => {
    return department.manager?.id === employee.id;
  };

  const handleEmployeeAction = (action: string, employee: Employee) => {
    switch (action) {
      case 'view':
        onEmployeeSelect?.(employee);
        break;
      case 'makeManager':
        onAssignManager?.(employee);
        break;
      case 'contact':
        window.location.href = `mailto:${employee.email}`;
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={loadDepartmentEmployees} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Department Employees ({employees.length})
          </CardTitle>
          {onAddEmployee && (
            <Button onClick={onAddEmployee} size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="TERMINATED">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employees Table */}
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {employees.length === 0
                ? 'No employees in this department'
                : 'No employees match your search criteria'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.avatarUrl || undefined} />
                          <AvatarFallback>{getInitials(employee.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{employee.fullName}</span>
                            {isManager(employee) && (
                              <Crown className="h-4 w-4 text-yellow-500" title="Department Manager" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.empCode}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{employee.email}</span>
                        </div>
                        {employee.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{employee.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{employee.title}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(employee.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(employee.hireDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleEmployeeAction('view', employee)}
                            className="cursor-pointer"
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEmployeeAction('contact', employee)}
                            className="cursor-pointer"
                          >
                            Send Email
                          </DropdownMenuItem>
                          {!isManager(employee) && onAssignManager && employee.status === 'ACTIVE' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleEmployeeAction('makeManager', employee)}
                                className="cursor-pointer"
                              >
                                <Crown className="mr-2 h-4 w-4" />
                                Make Manager
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Results Summary */}
        {filteredEmployees.length > 0 && filteredEmployees.length !== employees.length && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DepartmentEmployees;