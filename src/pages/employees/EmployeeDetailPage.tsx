import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Building,
  User,
  Badge as BadgeIcon,
  DollarSign,
  MoreHorizontal
} from 'lucide-react';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useAuth } from '@/stores/authStore';
import { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EmployeeProfile from '@/components/employees/EmployeeProfile';
import EmployeeDialog from '@/components/employees/EmployeeDialog';
import { format } from 'date-fns';
import { routeConfig } from '@/router';

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  const {
    employees,
    selectedEmployee,
    setSelectedEmployee,
    deleteEmployee,
    fetchEmployees,
    error,
    clearError,
  } = useEmployeeStore();

  // Get employees list route based on user role
  const getEmployeesRoute = () => {
    if (!user) return '/employees';

    switch (user.role) {
      case 'ADMIN':
        return routeConfig.admin.employees;
      case 'MANAGER':
        return '/employees'; // Manager uses shared route
      default:
        return '/employees';
    }
  };

  // Check if user has access to salary information
  const userRole = localStorage.getItem('hrm_user_role');
  const canViewSalary = userRole === 'ADMIN';
  const canEdit = userRole === 'ADMIN' || userRole === 'USER';
  const canDelete = userRole === 'ADMIN';

  useEffect(() => {
    const loadEmployee = async () => {
      if (!id) {
        navigate(getEmployeesRoute());
        return;
      }

      setIsLoading(true);
      const employeeId = parseInt(id);

      // First check if employee is already in store
      let employee = employees.find(emp => emp.id === employeeId);

      if (!employee) {
        // If not in store, try to fetch from API or load all employees
        await fetchEmployees();
        employee = employees.find(emp => emp.id === employeeId);
      }

      if (employee) {
        setCurrentEmployee(employee);
        setSelectedEmployee(employee);
      } else {
        // Try to fetch individual employee (in real implementation)
        try {
          const response = await fetch(`/api/employees/${employeeId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
            },
          });

          if (response.ok) {
            const fetchedEmployee: Employee = await response.json();
            setCurrentEmployee(fetchedEmployee);
            setSelectedEmployee(fetchedEmployee);
          } else {
            navigate(getEmployeesRoute());
          }
        } catch (error) {
          console.error('Failed to fetch employee:', error);
          navigate(getEmployeesRoute());
        }
      }

      setIsLoading(false);
    };

    loadEmployee();
    clearError();
  }, [id, employees, navigate]);
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-6 h-4 w-24" />
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40 rounded" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!currentEmployee) return;

    if (window.confirm(`Are you sure you want to delete ${currentEmployee.fullName}? This action cannot be undone.`)) {
      const success = await deleteEmployee(currentEmployee.id);
      if (success) {
        navigate(getEmployeesRoute());
      }
    }
  };

  const handleDialogSuccess = async () => {
    // Refresh employee data after edit
    if (id) {
      const employeeId = parseInt(id);
      await fetchEmployees();
      const updatedEmployee = employees.find(emp => emp.id === employeeId);
      if (updatedEmployee) {
        setCurrentEmployee(updatedEmployee);
        setSelectedEmployee(updatedEmployee);
      }
    }
    setIsEditDialogOpen(false);
  };

  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
    clearError();
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


  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(getEmployeesRoute())}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>
        </div>

        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!currentEmployee) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(getEmployeesRoute())}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>
        </div>

        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Employee Not Found</h2>
          <p className="text-muted-foreground">The requested employee could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(getEmployeesRoute())} className="self-start">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Employee Profile</h1>
            <p className="text-muted-foreground">
              Detailed information for {currentEmployee.fullName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Employee
            </Button>
          )}

          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {canEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Employee
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Employee
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Profile Card */}
        <div className="lg:col-span-1">
          <EmployeeProfile employee={currentEmployee} />
        </div>

        {/* Employee Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <div className="text-sm">{currentEmployee.fullName}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Employee Code</label>
                  <div className="text-sm font-mono">{currentEmployee.empCode}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${currentEmployee.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {currentEmployee.email}
                    </a>
                  </div>
                </div>

                {currentEmployee.phone && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${currentEmployee.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {currentEmployee.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Employment Status</label>
                  <div>{getStatusBadge(currentEmployee.status)}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(currentEmployee.hireDate), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeIcon className="h-5 w-5" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                  <div className="text-sm font-medium">{currentEmployee.title}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{currentEmployee.department.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {currentEmployee.department.code}
                      </div>
                    </div>
                  </div>
                </div>

                {canViewSalary && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Base Salary
                      <Badge variant="secondary" className="ml-2 text-xs">
                        ADMIN ONLY
                      </Badge>
                    </label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatSalary(currentEmployee.baseSalary)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Years of Service</label>
                  <div className="text-sm">
                    {Math.floor((new Date().getTime() - new Date(currentEmployee.hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <div className="text-sm">
                    {format(new Date(currentEmployee.createdAt), 'MMMM dd, yyyy \'at\' h:mm a')}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <div className="text-sm">
                    {format(new Date(currentEmployee.updatedAt), 'MMMM dd, yyyy \'at\' h:mm a')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Employee Dialog */}
      <EmployeeDialog
        open={isEditDialogOpen}
        employee={currentEmployee}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
};

export default EmployeeDetailPage;



