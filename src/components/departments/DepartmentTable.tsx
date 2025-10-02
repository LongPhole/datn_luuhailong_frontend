import React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Trash2 } from 'lucide-react';
import { Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface DepartmentTableProps {
  departments: Department[];
  loading?: boolean;
  onEdit: (department: Department) => void;
  onView: (department: Department) => void;
  onDelete: (department: Department) => void;
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

const DepartmentTable: React.FC<DepartmentTableProps> = ({
  departments,
  loading = false,
  onEdit,
  onView,
  onDelete,
  onSort,
  sortColumn,
  sortDirection,
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

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE') => {
    return (
      <Badge
        variant={status === 'ACTIVE' ? 'success' : 'secondary'}
        className="text-xs"
      >
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="h-4 w-16 animate-pulse bg-muted rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 animate-pulse bg-muted rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-8 animate-pulse bg-muted rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 animate-pulse bg-muted rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 animate-pulse bg-muted rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 animate-pulse bg-muted rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('code')}
                  className="h-auto p-0 font-medium"
                >
                  Code
                  {getSortIcon('code')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-medium"
                >
                  Name
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('employeeCount')}
                  className="h-auto p-0 font-medium"
                >
                  Employees
                  {getSortIcon('employeeCount')}
                </Button>
              </TableHead>
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
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('createdAt')}
                  className="h-auto p-0 font-medium"
                >
                  Created
                  {getSortIcon('createdAt')}
                </Button>
              </TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <p className="text-sm">No departments found</p>
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
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('code')}
                className="h-auto p-0 font-medium"
              >
                Code
                {getSortIcon('code')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('name')}
                className="h-auto p-0 font-medium"
              >
                Name
                {getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('employeeCount')}
                className="h-auto p-0 font-medium"
              >
                Employees
                {getSortIcon('employeeCount')}
              </Button>
            </TableHead>
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
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('createdAt')}
                className="h-auto p-0 font-medium"
              >
                Created
                {getSortIcon('createdAt')}
              </Button>
            </TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((department) => (
            <TableRow key={department.id}>
              <TableCell className="font-mono text-sm">
                {department.code}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{department.name}</div>
                  {department.description && (
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {department.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {department.manager ? (
                  <div>
                    <div className="font-medium text-sm">
                      {department.manager.fullName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {department.manager.title}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">No manager</span>
                )}
              </TableCell>
              <TableCell>
                <span className="font-medium">{department.employeeCount}</span>
              </TableCell>
              <TableCell>
                {getStatusBadge(department.status)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {department.createdAt ? format(new Date(department.createdAt), 'MMM dd, yyyy') : 'N/A'}
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
                      onClick={() => onView(department)}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onEdit(department)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(department)}
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
    </div>
  );
};

export default DepartmentTable;