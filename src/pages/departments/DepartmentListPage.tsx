import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, RefreshCw } from 'lucide-react';
import {
  useDepartmentStore,
  useDepartments,
  useDepartmentLoading,
  useDepartmentError,
  useDepartmentFilters,
  useDepartmentPageInfo
} from '@/stores/departmentStore';
import { Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DepartmentTable from '@/components/departments/DepartmentTable';
import DepartmentDialog from '@/components/departments/DepartmentDialog';

const DepartmentListPage: React.FC = () => {
  const navigate = useNavigate();

  // Store state
  const departments = useDepartments();
  const loading = useDepartmentLoading();
  const error = useDepartmentError();
  const filters = useDepartmentFilters();
  const pageInfo = useDepartmentPageInfo();

  // Store actions
  const {
    fetchDepartments,
    setFilters,
    resetFilters,
    clearError,
    setSelectedDepartment,
    currentPage,
    pageSize
  } = useDepartmentStore();

  // Local state
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartmentLocal] = useState<Department | null>(null);

  // Load departments on component mount
  useEffect(() => {
    fetchDepartments(0, pageSize, filters);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        handleSearch(searchValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleSearch = (search: string) => {
    const newFilters = { ...filters, search };
    setFilters(newFilters);
    fetchDepartments(0, pageSize, newFilters);
  };

  const handleStatusFilter = (status: string) => {
    const newFilters = {
      ...filters,
      status: status === 'all' ? 'ALL' : status as 'ACTIVE' | 'INACTIVE'
    };
    setFilters(newFilters);
    fetchDepartments(0, pageSize, newFilters);
  };

  const handleSort = (column: string) => {
    let newDirection: 'asc' | 'desc' = 'asc';

    if (sortColumn === column) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }

    setSortColumn(column);
    setSortDirection(newDirection);

    // Here you would typically send the sort parameters to the API
    // For now, we'll just update the local sort state
    fetchDepartments(currentPage, pageSize, filters);
  };

  const handlePageChange = (page: number) => {
    fetchDepartments(page, pageSize, filters);
  };

  const handlePageSizeChange = (size: number) => {
    fetchDepartments(0, size, filters);
  };

  const handleRefresh = () => {
    fetchDepartments(currentPage, pageSize, filters);
  };

  const handleResetFilters = () => {
    setSearchValue('');
    resetFilters();
    fetchDepartments(0, pageSize);
  };

  const handleCreateDepartment = () => {
    setShowCreateDialog(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartmentLocal(department);
    setSelectedDepartment(department);
    setShowEditDialog(true);
  };

  const handleViewDepartment = (department: Department) => {
    navigate(`/departments/${department.id}`);
  };

  const handleDeleteDepartment = (department: Department) => {
    // This would typically show a confirmation dialog
    console.log('Delete department:', department);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedDepartmentLocal(null);
    setSelectedDepartment(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage organizational departments and their structure
          </p>
        </div>
        <Button onClick={handleCreateDepartment} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search departments by name or code..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-[200px]">
              <Select
                value={filters.status === 'ALL' ? 'all' : filters.status?.toLowerCase()}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="gap-2 h-9"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="gap-2 h-9"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.search || filters.status !== 'ALL') && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Active filters:</span>
              {filters.search && (
                <span className="bg-muted px-2 py-1 rounded text-xs">
                  Search: "{filters.search}"
                </span>
              )}
              {filters.status !== 'ALL' && (
                <span className="bg-muted px-2 py-1 rounded text-xs">
                  Status: {filters.status}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {pageInfo && (
        <div className="text-sm text-muted-foreground">
          Showing {pageInfo.page * pageInfo.size + 1} to{' '}
          {Math.min((pageInfo.page + 1) * pageInfo.size, pageInfo.totalElements)} of{' '}
          {pageInfo.totalElements} departments
        </div>
      )}

      {/* Department Table */}
      <DepartmentTable
        departments={departments}
        loading={loading}
        onEdit={handleEditDepartment}
        onView={handleViewDepartment}
        onDelete={handleDeleteDepartment}
        onSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
      />

      {/* Pagination */}
      {pageInfo && pageInfo.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pageInfo.hasPrevious || loading}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {/* Simple pagination - could be enhanced with page numbers */}
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {pageInfo.totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pageInfo.hasNext || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <DepartmentDialog
          open={showCreateDialog}
          onClose={handleCloseDialog}
          onSuccess={() => {
            handleCloseDialog();
            handleRefresh();
          }}
        />
      )}

      {showEditDialog && selectedDepartment && (
        <DepartmentDialog
          open={showEditDialog}
          department={selectedDepartment}
          onClose={handleCloseDialog}
          onSuccess={() => {
            handleCloseDialog();
            handleRefresh();
          }}
        />
      )}
    </div>
  );
};

export default DepartmentListPage;