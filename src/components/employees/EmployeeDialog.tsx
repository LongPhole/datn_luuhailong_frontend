import React, { useEffect, useState } from 'react';
import { Employee, EmployeeFormData, DepartmentSummary } from '@/types';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useDepartmentStore } from '@/stores/departmentStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EmployeeForm from '@/components/forms/EmployeeForm';

interface EmployeeDialogProps {
  open: boolean;
  employee?: Employee;
  onClose: () => void;
  onSuccess?: (employee: Employee) => void;
}

const EmployeeDialog: React.FC<EmployeeDialogProps> = ({
  open,
  employee,
  onClose,
  onSuccess,
}) => {
  const [availableDepartments, setAvailableDepartments] = useState<DepartmentSummary[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const {
    createEmployee,
    updateEmployee,
    isCreating,
    isUpdating,
    error,
    clearError,
  } = useEmployeeStore();

  const {
    departments,
    fetchDepartments,
    isLoading: isDepartmentsLoading,
  } = useDepartmentStore();

  const isEditing = !!employee;
  const loading = isCreating || isUpdating;

  // Load available departments when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableDepartments();
      clearError();
    }
  }, [open]);

  const loadAvailableDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      // Fetch departments if not already loaded
      if (departments.length === 0) {
        await fetchDepartments();
      }

      // Convert departments to department summaries
      const departmentSummaries: DepartmentSummary[] = departments
        .filter(dept => dept.status === 'ACTIVE') // Only show active departments
        .map(dept => ({
          id: dept.id,
          code: dept.code,
          name: dept.name,
        }));

      setAvailableDepartments(departmentSummaries);
    } catch (error) {
      console.error('Failed to load available departments:', error);
      setAvailableDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleSubmit = async (formData: EmployeeFormData) => {
    try {
      let result: Employee | null = null;

      if (isEditing && employee) {
        result = await updateEmployee(employee.id, formData);
      } else {
        result = await createEmployee(formData);
      }

      if (result) {
        onSuccess?.(result);
        onClose();
      }
    } catch (error) {
      // Error is handled by the store
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = () => {
    clearError();
    onClose();
  };

  const generateEmployeeCode = (): string => {
    // Generate a simple employee code based on timestamp and random number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `EMP${timestamp}${random}`;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Employee' : 'Create New Employee'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update employee information and job details.'
              : 'Fill in the employee details to add a new member to the organization.'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <EmployeeForm
            key={employee?.id || 'new'}
            employee={employee}
            availableDepartments={availableDepartments}
            loading={loading || departmentsLoading || isDepartmentsLoading}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            generateEmployeeCode={generateEmployeeCode}
          />
        </div>

        {/* Display store-level errors */}
        {error && (
          <div className="mt-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive rounded-md">
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDialog;