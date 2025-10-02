import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Department, DepartmentFormData, EmployeeSummary } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Validation schema
const departmentFormSchema = z.object({
  code: z
    .string()
    .min(2, 'Department code must be at least 2 characters')
    .max(10, 'Department code must not exceed 10 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Department code must contain only uppercase letters, numbers, hyphens, and underscores'),
  name: z
    .string()
    .min(2, 'Department name must be at least 2 characters')
    .max(100, 'Department name must not exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  managerId: z
    .number()
    .min(1, 'Please select a manager')
    .optional()
    .or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    required_error: 'Please select a status',
  }),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentFormProps {
  department?: Department;
  availableManagers?: EmployeeSummary[];
  loading?: boolean;
  onSubmit: (data: DepartmentFormData) => Promise<void>;
  onCancel?: () => void;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({
  department,
  availableManagers = [],
  loading = false,
  onSubmit,
  onCancel,
}) => {
  const [managersLoading, setManagersLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!department;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      code: department?.code || '',
      name: department?.name || '',
      description: department?.description || '',
      managerId: department?.manager?.id || undefined,
      status: department?.status || 'ACTIVE',
    },
  });

  // Reset form when department changes
  useEffect(() => {
    if (department) {
      reset({
        code: department.code,
        name: department.name,
        description: department.description || '',
        managerId: department.manager?.id || undefined,
        status: department.status,
      });
    }
  }, [department, reset]);

  const watchedManagerId = watch('managerId');

  const handleFormSubmit = async (data: DepartmentFormValues) => {
    try {
      setSubmitError(null);

      const formData: DepartmentFormData = {
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        managerId: data.managerId || undefined,
        status: data.status,
      };

      await onSubmit(formData);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An error occurred while saving the department'
      );
    }
  };

  const handleManagerChange = (value: string) => {
    const managerId = value === 'none' ? undefined : parseInt(value);
    setValue('managerId', managerId, { shouldValidate: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Department' : 'Create New Department'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Department Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Department Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="e.g., IT, HR, SALES"
              {...register('code')}
              disabled={isEditing || loading}
              className={errors.code ? 'border-destructive' : ''}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use uppercase letters, numbers, hyphens, and underscores only
            </p>
          </div>

          {/* Department Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Department Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Information Technology"
              {...register('name')}
              disabled={loading}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Brief description of the department's role and responsibilities..."
              {...register('description')}
              disabled={loading}
              className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.description ? 'border-destructive' : ''
              }`}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Manager Selection */}
          <div className="space-y-2">
            <Label>Department Manager</Label>
            <Select
              value={watchedManagerId?.toString() || 'none'}
              onValueChange={handleManagerChange}
              disabled={loading || managersLoading}
            >
              <SelectTrigger className={errors.managerId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No manager assigned</SelectItem>
                {availableManagers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{manager.fullName}</span>
                      <span className="text-sm text-muted-foreground">
                        {manager.title} • {manager.empCode}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.managerId && (
              <p className="text-sm text-destructive">{errors.managerId.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Only employees from this department can be assigned as managers
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE')}
              disabled={loading}
            >
              <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
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
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive rounded-md">
              {submitError}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex-1"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                ? 'Update Department'
                : 'Create Department'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading || isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DepartmentForm;