import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, Users } from 'lucide-react';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useDepartmentStore } from '@/stores/departmentStore';
import { Employee, EmployeeFilters, EmployeeSortOptions } from '@/types';
import { Button } from '@/components/ui/button';
import useToast from '@/hooks/useToast';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EmployeeTable from '@/components/employees/EmployeeTable';
import EmployeeDialog from '@/components/employees/EmployeeDialog';

const EmployeeListPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const {
    employees,
    isLoading,
    error,
    pageInfo,
    currentPage,
    pageSize,
    filters,
    sortOptions,
    fetchEmployees,
    searchEmployees,
    deleteEmployee,
    setFilters,
    setSortOptions,
    clearError,
    exportEmployees,
  } = useEmployeeStore();

  const {
    departments,
    fetchDepartments,
  } = useDepartmentStore();

  // Load initial data
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  // Search debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        handleSearch(searchInput);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);
  useEffect(() => {
    if (error) {
      showError({
        title: 'Employee action failed',
        description: error,
      });
    }
  }, [error, showError]);

  const handleSearch = async (query: string) => {
    await searchEmployees(query);
  };

  const handleFilterChange = async (newFilters: Partial<EmployeeFilters>) => {
    setFilters(newFilters);
    await fetchEmployees(0, pageSize, { ...filters, ...newFilters }, sortOptions);
  };

  const handleSort = async (field: string) => {
    const newSortOptions: EmployeeSortOptions = {
      field: field as EmployeeSortOptions['field'],
      direction: sortOptions.field === field && sortOptions.direction === 'asc' ? 'desc' : 'asc',
    };
    setSortOptions(newSortOptions);
    await fetchEmployees(currentPage, pageSize, filters, newSortOptions);
  };

  const handlePageChange = async (page: number) => {
    await fetchEmployees(page, pageSize, filters, sortOptions);
  };

  const handlePageSizeChange = async (size: number) => {
    await fetchEmployees(0, size, filters, sortOptions);
  };

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    navigate(`/employees/${employee.id}`);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.fullName}?`)) {
      const success = await deleteEmployee(employee.id);
      if (success) {
        await fetchEmployees(currentPage, pageSize, filters, sortOptions);
        showSuccess({
          title: 'Employee deleted',
          description: `${employee.fullName} has been removed.`,
        });
      } else {
        showError({
          title: 'Failed to delete employee',
          description: 'Please try again or check your permissions.',
        });
      }
    }
  };
    const handleDialogSuccess = async (employee: Employee) => {
    const wasEditing = Boolean(selectedEmployee);
    await fetchEmployees(currentPage, pageSize, filters, sortOptions);
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);

    showSuccess({
      title: wasEditing ? 'Employee updated' : 'Employee created',
      description: `${employee.fullName} has been ${wasEditing ? 'updated' : 'added'} successfully.`,
    });
  };
const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
    clearError();
  };

  const handleExport = async () => {
    const blob = await exportEmployees(filters);
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED') => {
    const variants = {
      ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-100',
      INACTIVE: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      TERMINATED: 'bg-red-100 text-red-800 hover:bg-red-100',
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };

  const resetFilters = async () => {
    setSearchInput('');
    setFilters({
      search: '',
      status: 'ALL',
    });
    await fetchEmployees(0, pageSize, {
      search: '',
      status: 'ALL',
    }, sortOptions);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage employee records, departments, and organizational structure
          </p>
        </div>
        <Button onClick={handleCreateEmployee} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, email, or employee code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {(filters.departmentId || (filters.status && filters.status !== 'ALL')) && (
                <Badge variant="secondary" className="ml-2">
                  {[
                    filters.departmentId && 'Dept',
                    filters.status && filters.status !== 'ALL' && 'Status'
                  ].filter(Boolean).length}
                </Badge>
              )}
            </Button>

            {/* Export */}
            <Button variant="outline" onClick={handleExport} disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              {/* Department Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select
                  value={filters.departmentId?.toString() || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange({
                      departmentId: value === 'all' ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || 'ALL'}
                  onValueChange={(value) =>
                    handleFilterChange({
                      status: value as EmployeeFilters['status'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    <SelectItem value="ACTIVE">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="INACTIVE">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full" />
                        Inactive
                      </div>
                    </SelectItem>
                    <SelectItem value="TERMINATED">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        Terminated
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-transparent">Actions</label>
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {pageInfo && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              Showing {pageInfo.size * pageInfo.page + 1}-
              {Math.min(pageInfo.size * (pageInfo.page + 1), pageInfo.totalElements)} of{' '}
              {pageInfo.totalElements} employees
            </span>
          </div>
          {(filters.search || filters.departmentId || (filters.status && filters.status !== 'ALL')) && (
            <span>Filtered results</span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive rounded-md">
          {error}
        </div>
      )}

      {/* Employee Table */}
      <EmployeeTable
        employees={employees}
        loading={isLoading}
        onEdit={handleEditEmployee}
        onView={handleViewEmployee}
        onDelete={handleDeleteEmployee}
        onSort={handleSort}
        sortColumn={sortOptions.field}
        sortDirection={sortOptions.direction}
        pagination={{
          currentPage,
          pageSize,
          totalPages: pageInfo?.totalPages || 0,
          totalElements: pageInfo?.totalElements || 0,
          hasNext: pageInfo?.hasNext || false,
          hasPrevious: pageInfo?.hasPrevious || false,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
      />

      {/* Create Employee Dialog */}
      <EmployeeDialog
        open={isCreateDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />

      {/* Edit Employee Dialog */}
      <EmployeeDialog
        open={isEditDialogOpen}
        employee={selectedEmployee}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
};

export default EmployeeListPage;









