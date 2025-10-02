import React from 'react';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
} from 'lucide-react';
import { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

interface EmployeeTableProps {
  employees: Employee[];
  loading?: boolean;
  onEdit: (employee: Employee) => void;
  onView: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  pagination?: PaginationProps;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  loading = false,
  onEdit,
  onView,
  onDelete,
  onSort,
  sortColumn,
  sortDirection,
  pagination,
}) => {
  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn === column) {
      return (
        <ArrowUpDown
          className={`ml-2 h-4 w-4 ${
            sortDirection === 'asc' ? 'rotate-180' : ''
          }`}
        />
      );
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
  };

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED') => {
    const variants = {
      ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-100',
      INACTIVE: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      TERMINATED: 'bg-red-100 text-red-800 hover:bg-red-100',
    };

    return (
      <Badge className={variants[status]} variant="secondary">
        {status}
      </Badge>
    );
  };

  const formatSalary = (salary: number | null) => {
    if (salary === null || salary === undefined) {
      return 'Not disclosed';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  // Check if user has access to salary information
  const userRole = localStorage.getItem('hrm_user_role');
  const canViewSalary = userRole === 'ADMIN';

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]" />
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Hire Date</TableHead>
              {canViewSalary && <TableHead>Salary</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                {canViewSalary && (
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                )}
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pagination && (
          <div className="border-t px-4 py-3">
            <Skeleton className="h-4 w-32" />
          </div>
        )}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]"></TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('fullName')}
                  className="h-auto p-0 font-medium"
                >
                  Employee
                  {getSortIcon('fullName')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('department')}
                  className="h-auto p-0 font-medium"
                >
                  Department
                  {getSortIcon('department')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('title')}
                  className="h-auto p-0 font-medium"
                >
                  Title
                  {getSortIcon('title')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('hireDate')}
                  className="h-auto p-0 font-medium"
                >
                  Hire Date
                  {getSortIcon('hireDate')}
                </Button>
              </TableHead>
              {canViewSalary && (
                <TableHead>Base Salary</TableHead>
              )}
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('status')}
                  className="h-auto p-0 font-medium"
                >
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={canViewSalary ? 8 : 7} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <User className="h-8 w-8 mb-2" />
                  <p className="text-sm">No employees found</p>
                  <p className="text-xs">Try adjusting your search or filters</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]"></TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('fullName')}
                className="h-auto p-0 font-medium"
              >
                Employee
                {getSortIcon('fullName')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('department')}
                className="h-auto p-0 font-medium"
              >
                Department
                {getSortIcon('department')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('title')}
                className="h-auto p-0 font-medium"
              >
                Title
                {getSortIcon('title')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('hireDate')}
                className="h-auto p-0 font-medium"
              >
                Hire Date
                {getSortIcon('hireDate')}
              </Button>
            </TableHead>
            {canViewSalary && (
              <TableHead>Base Salary</TableHead>
            )}
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('status')}
                className="h-auto p-0 font-medium"
              >
                Status
                {getSortIcon('status')}
              </Button>
            </TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center justify-center">
                  {employee.avatarUrl ? (
                    <img
                      src={employee.avatarUrl}
                      alt={employee.fullName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{employee.fullName}</div>
                  <div className="text-sm text-muted-foreground">
                    {employee.email}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {employee.empCode}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-sm">
                    {employee.department.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {employee.department.code}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm">{employee.title}</div>
                {employee.phone && (
                  <div className="text-xs text-muted-foreground">
                    {employee.phone}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(employee.hireDate), 'MMM dd, yyyy')}
              </TableCell>
              {canViewSalary && (
                <TableCell className="text-sm font-medium">
                  {formatSalary(employee.baseSalary)}
                </TableCell>
              )}
              <TableCell>
                {getStatusBadge(employee.status)}
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
                      onClick={() => onView(employee)}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onEdit(employee)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(employee)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => pagination.onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-16 h-8 ml-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage + 1} of {pagination.totalPages}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(0)}
                disabled={!pagination.hasPrevious}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevious}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.totalPages - 1)}
                disabled={!pagination.hasNext}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { EmployeeTable };
export default EmployeeTable;

