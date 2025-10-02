import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Users,
  Building,
  Calendar,
  Settings,
  Crown,
  Mail,
  MoreHorizontal
} from 'lucide-react';
import { Department, Employee } from '@/types';
import { useDepartmentStore } from '@/stores/departmentStore';
import { useAuth } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DepartmentEmployees from '@/components/departments/DepartmentEmployees';
import DepartmentDialog from '@/components/departments/DepartmentDialog';
import { routeConfig } from '@/router';

const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Local state
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);

  // Store actions
  const { updateDepartment, deleteDepartment, isUpdating, isDeleting } = useDepartmentStore();

  // Get departments list route based on user role
  const getDepartmentsRoute = () => {
    if (!user) return '/departments';

    switch (user.role) {
      case 'ADMIN':
        return routeConfig.admin.departments;
      case 'MANAGER':
        return '/departments'; // Manager uses shared route
      default:
        return '/departments';
    }
  };

  useEffect(() => {
    if (id) {
      loadDepartment(parseInt(id));
    }
  }, [id]);

  const loadDepartment = async (departmentId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/departments/${departmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Department not found');
        }
        throw new Error('Failed to load department details');
      }

      const departmentData = await response.json();
      setDepartment(departmentData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load department');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(getDepartmentsRoute());
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleEditSuccess = (updatedDepartment: Department) => {
    setDepartment(updatedDepartment);
    setShowEditDialog(false);
  };

  const handleDeleteDepartment = async () => {
    if (!department) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the department "${department.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      const success = await deleteDepartment(department.id);
      if (success) {
        navigate(getDepartmentsRoute());
      }
    }
  };

  const handleAssignManager = async (employee: Employee) => {
    if (!department) return;

    const confirmed = window.confirm(
      `Are you sure you want to assign ${employee.fullName} as the manager of ${department.name}?`
    );

    if (confirmed) {
      try {
        const updatedDepartment = await updateDepartment(department.id, {
          managerId: employee.id,
        });

        if (updatedDepartment) {
          setDepartment(updatedDepartment);
        }
      } catch (error) {
        console.error('Failed to assign manager:', error);
      }
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    // Navigate to employee detail or show employee dialog
    navigate(`/employees/${employee.id}`);
  };

  const handleAddEmployee = () => {
    // Navigate to add employee form with department pre-selected
    navigate(`/employees/new?departmentId=${department?.id}`);
  };

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE') => {
    return (
      <Badge
        variant={status === 'ACTIVE' ? 'success' : 'secondary'}
        className="text-sm"
      >
        {status}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-24 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-16 w-full bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Departments
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive text-lg mb-4">
                {error || 'Department not found'}
              </p>
              <div className="space-x-4">
                <Button variant="outline" onClick={handleBack}>
                  Back to Departments
                </Button>
                {id && (
                  <Button onClick={() => loadDepartment(parseInt(id))}>
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-4">
          <Button variant="ghost" onClick={handleBack} className="gap-2 self-start">
            <ArrowLeft className="h-4 w-4" />
            Back to Departments
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{department.name}</h1>
            <p className="text-muted-foreground">Department Details</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit Department
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddEmployee} className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                Add Employee
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteDepartment}
                className="cursor-pointer text-destructive focus:text-destructive"
                disabled={isDeleting}
              >
                <Settings className="mr-2 h-4 w-4" />
                Delete Department
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Department Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Department Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Department Code
                  </label>
                  <p className="text-lg font-mono">{department.code}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(department.status)}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Department Name
                  </label>
                  <p className="text-lg">{department.name}</p>
                </div>

                {department.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
                      {department.description}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Employee Count
                  </label>
                  <p className="text-lg font-semibold">{department.employeeCount}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created Date
                  </label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(department.createdAt), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Employees */}
          <DepartmentEmployees
            department={department}
            onEmployeeSelect={handleEmployeeSelect}
            onAssignManager={handleAssignManager}
            onAddEmployee={handleAddEmployee}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Department Manager */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Department Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              {department.manager ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {getInitials(department.manager.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{department.manager.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {department.manager.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {department.manager.empCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `mailto:${department.manager!.email}`}
                      className="flex-1 gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Contact
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/employees/${department.manager!.id}`)}
                      className="flex-1"
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm mb-3">
                    No manager assigned
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* This would open a manager assignment dialog */}}
                  >
                    Assign Manager
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Employees</span>
                <span className="font-semibold">{department.employeeCount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Department Code</span>
                <span className="font-mono text-sm">{department.code}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(department.status)}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">
                  {format(new Date(department.updatedAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      {showEditDialog && (
        <DepartmentDialog
          open={showEditDialog}
          department={department}
          onClose={() => setShowEditDialog(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default DepartmentDetailPage;