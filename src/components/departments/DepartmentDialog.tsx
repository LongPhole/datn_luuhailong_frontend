import React, { useEffect, useState } from 'react';
import { Department, DepartmentFormData, EmployeeSummary } from '@/types';
import { useDepartmentStore } from '@/stores/departmentStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import DepartmentForm from '@/components/forms/DepartmentForm';

interface DepartmentDialogProps {
  open: boolean;
  department?: Department;
  onClose: () => void;
  onSuccess?: (department: Department) => void;
}

const DepartmentDialog: React.FC<DepartmentDialogProps> = ({
  open,
  department,
  onClose,
  onSuccess,
}) => {
  const [availableManagers, setAvailableManagers] = useState<EmployeeSummary[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);

  const {
    createDepartment,
    updateDepartment,
    isCreating,
    isUpdating,
    error,
    clearError,
  } = useDepartmentStore();

  const isEditing = !!department;
  const loading = isCreating || isUpdating;

  // Load available managers when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableManagers();
      clearError();
    }
  }, [open, department?.id]);

  const loadAvailableManagers = async () => {
    setManagersLoading(true);
    try {
      // In a real implementation, this would fetch employees from the department
      // For now, we'll use mock data or make an API call
      const response = await fetch('/api/employees?departmentId=' + (department?.id || ''), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hrm_auth_token')}`,
        },
      });

      if (response.ok) {
        const employees = await response.json();
        // Filter only active employees who could be managers
        const managers = employees
          .filter((emp: any) => emp.status === 'ACTIVE')
          .map((emp: any) => ({
            id: emp.id,
            empCode: emp.empCode,
            fullName: emp.fullName,
            title: emp.title,
            email: emp.email,
          }));
        setAvailableManagers(managers);
      } else {
        // Fallback to empty array if API call fails
        setAvailableManagers([]);
      }
    } catch (error) {
      console.error('Failed to load available managers:', error);
      setAvailableManagers([]);
    } finally {
      setManagersLoading(false);
    }
  };

  const handleSubmit = async (formData: DepartmentFormData) => {
    try {
      let result: Department | null = null;

      if (isEditing && department) {
        result = await updateDepartment(department.id, formData);
      } else {
        result = await createDepartment(formData);
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

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Department' : 'Create New Department'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <DepartmentForm
            department={department}
            availableManagers={availableManagers}
            loading={loading || managersLoading}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
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

export default DepartmentDialog;