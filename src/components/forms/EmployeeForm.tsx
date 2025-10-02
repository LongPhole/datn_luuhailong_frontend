import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarDays, Upload, X, RefreshCw } from 'lucide-react';
import { Employee, EmployeeFormData, DepartmentSummary } from '@/types';
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
import { Badge } from '@/components/ui/badge';

// Validation schema
const employeeFormSchema = z.object({
  empCode: z
    .string()
    .min(3, 'Employee code must be at least 3 characters')
    .max(20, 'Employee code must not exceed 20 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Employee code must contain only letters and numbers'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name must contain only letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must not exceed 255 characters'),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must not exceed 20 characters')
    .optional()
    .or(z.literal('')),
  hireDate: z
    .string()
    .min(1, 'Hire date is required')
    .refine((date) => {
      const hireDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return hireDate <= today;
    }, 'Hire date cannot be in the future'),
  title: z
    .string()
    .min(2, 'Job title must be at least 2 characters')
    .max(100, 'Job title must not exceed 100 characters'),
  baseSalary: z
    .union([
      z.number().min(0, 'Salary must be a positive number'),
      z.literal(''),
      z.literal(undefined),
    ])
    .optional()
    .transform((val) => {
      if (val === '' || val === undefined || val === null) return undefined;
      return typeof val === 'string' ? parseFloat(val) : val;
    }),
  departmentId: z
    .number()
    .min(1, 'Please select a department'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED'], {
    required_error: 'Please select a status',
  }),
  avatarUrl: z
    .string()
    .optional()
    .refine((value) => {
      if (!value || value === '') return true;
      // Allow data URLs (base64) and regular URLs
      const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
      const urlPattern = /^https?:\/\/.+/i;
      return dataUrlPattern.test(value) || urlPattern.test(value);
    }, 'Please enter a valid URL or upload an image file')
    .or(z.literal('')),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  employee?: Employee;
  availableDepartments?: DepartmentSummary[];
  loading?: boolean;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel?: () => void;
  generateEmployeeCode?: () => string;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  availableDepartments = [],
  loading = false,
  onSubmit,
  onCancel,
  generateEmployeeCode,
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const isEditing = !!employee;

  // Check if user has access to salary information
  const userRole = localStorage.getItem('hrm_user_role');
  const canEditSalary = userRole === 'ADMIN';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      empCode: employee?.empCode || '',
      fullName: employee?.fullName || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      hireDate: employee?.hireDate ? format(new Date(employee.hireDate), 'yyyy-MM-dd') : '',
      title: employee?.title || '',
      baseSalary: employee?.baseSalary || undefined,
      departmentId: employee?.department?.id || undefined,
      status: employee?.status || 'ACTIVE',
      avatarUrl: employee?.avatarUrl || '',
    },
  });

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      reset({
        empCode: employee.empCode,
        fullName: employee.fullName,
        email: employee.email,
        phone: employee.phone || '',
        hireDate: format(new Date(employee.hireDate), 'yyyy-MM-dd'),
        title: employee.title,
        baseSalary: employee.baseSalary || undefined,
        departmentId: employee.department.id,
        status: employee.status,
        avatarUrl: employee.avatarUrl || '',
      });
      setAvatarPreview(employee.avatarUrl);
    }
  }, [employee, reset]);

  const watchedDepartmentId = watch('departmentId');
  const watchedAvatarUrl = watch('avatarUrl');

  // Update avatar preview when URL changes
  useEffect(() => {
    if (watchedAvatarUrl && watchedAvatarUrl !== avatarPreview) {
      setAvatarPreview(watchedAvatarUrl);
    }
  }, [watchedAvatarUrl]);

  const handleFormSubmit = async (data: EmployeeFormValues) => {
    try {
      setSubmitError(null);

      const formData: EmployeeFormData = {
        empCode: data.empCode,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone && data.phone.trim() !== '' ? data.phone : undefined,
        hireDate: data.hireDate,
        title: data.title,
        baseSalary: canEditSalary ? data.baseSalary : undefined,
        departmentId: data.departmentId,
        status: data.status,
        avatarUrl: data.avatarUrl && data.avatarUrl.trim() !== '' ? data.avatarUrl : undefined,
      };

      await onSubmit(formData);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An error occurred while saving the employee'
      );
    }
  };

  const handleDepartmentChange = (value: string) => {
    const departmentId = parseInt(value);
    setValue('departmentId', departmentId, { shouldValidate: true });
  };

  const handleGenerateEmployeeCode = () => {
    if (generateEmployeeCode) {
      const newCode = generateEmployeeCode();
      setValue('empCode', newCode, { shouldValidate: true });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Image file size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // In a real implementation, this would upload to a file storage service
      // For demo purposes, we'll convert to base64 data URL that can be stored
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAvatarPreview(dataUrl);
        setValue('avatarUrl', dataUrl, { shouldValidate: true });
        setSubmitError(null);
        setIsUploadingAvatar(false);
      };
      reader.onerror = () => {
        setSubmitError('Failed to read image file');
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setSubmitError('Failed to upload avatar image');
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setValue('avatarUrl', '', { shouldValidate: true });
  };

  const getSelectedDepartment = () => {
    return availableDepartments.find(dept => dept.id === watchedDepartmentId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Employee Details' : 'Create New Employee'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Avatar Section */}
            <div className="space-y-4">
              <Label>Profile Photo</Label>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {avatarPreview ? (
                    <div className="relative">
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={handleRemoveAvatar}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 w-full">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingAvatar}
                      className="w-full"
                      asChild
                    >
                      <span>
                        {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Or enter image URL</Label>
                    <Input
                      id="avatarUrl"
                      placeholder="https://example.com/avatar.jpg"
                      {...register('avatarUrl')}
                      disabled={loading}
                      className={errors.avatarUrl ? 'border-destructive' : ''}
                    />
                    {errors.avatarUrl && (
                      <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Code */}
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Employee Code <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="empCode"
                      placeholder="e.g., EMP001"
                      {...register('empCode')}
                      disabled={isEditing || loading}
                      className={errors.empCode ? 'border-destructive' : ''}
                    />
                    {!isEditing && generateEmployeeCode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGenerateEmployeeCode}
                        disabled={loading}
                        title="Generate employee code"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {errors.empCode && (
                    <p className="text-sm text-destructive">{errors.empCode.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Unique identifier for the employee
                  </p>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="e.g., John Smith"
                    {...register('fullName')}
                    disabled={loading}
                    className={errors.fullName ? 'border-destructive' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.smith@company.com"
                    {...register('email')}
                    disabled={loading}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="e.g., +1 (555) 123-4567"
                    {...register('phone')}
                    disabled={loading}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                {/* Hire Date */}
                <div className="space-y-2">
                  <Label htmlFor="hireDate">
                    Hire Date <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="hireDate"
                      type="date"
                      {...register('hireDate')}
                      disabled={loading}
                      className={errors.hireDate ? 'border-destructive' : ''}
                    />
                    <CalendarDays className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.hireDate && (
                    <p className="text-sm text-destructive">{errors.hireDate.message}</p>
                  )}
                </div>

                {/* Job Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Job Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Software Engineer"
                    {...register('title')}
                    disabled={loading}
                    className={errors.title ? 'border-destructive' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* Base Salary (ADMIN only) */}
                {canEditSalary && (
                  <div className="space-y-2">
                    <Label htmlFor="baseSalary">
                      Base Salary
                      <Badge variant="secondary" className="ml-2 text-xs">
                        ADMIN ONLY
                      </Badge>
                    </Label>
                    <Input
                      id="baseSalary"
                      type="number"
                      placeholder="e.g., 75000"
                      {...register('baseSalary', {
                        setValueAs: (value) => value === '' ? undefined : parseFloat(value),
                      })}
                      disabled={loading}
                      className={errors.baseSalary ? 'border-destructive' : ''}
                    />
                    {errors.baseSalary && (
                      <p className="text-sm text-destructive">{errors.baseSalary.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Annual base salary (optional)
                    </p>
                  </div>
                )}

                {/* Department */}
                <div className="space-y-2">
                  <Label>
                    Department <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watchedDepartmentId?.toString() || ''}
                    onValueChange={handleDepartmentChange}
                    disabled={loading}
                  >
                    <SelectTrigger className={errors.departmentId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepartments.map((department) => (
                        <SelectItem key={department.id} value={department.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{department.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({department.code})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.departmentId && (
                    <p className="text-sm text-destructive">{errors.departmentId.message}</p>
                  )}
                  {getSelectedDepartment() && (
                    <div className="text-xs text-muted-foreground">
                      Selected: {getSelectedDepartment()?.name} ({getSelectedDepartment()?.code})
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>
                    Employment Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE' | 'TERMINATED')}
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
                      <SelectItem value="TERMINATED">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          Terminated
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-destructive">{errors.status.message}</p>
                  )}
                </div>
              </div>
            </div>
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
                ? 'Update Employee'
                : 'Create Employee'}
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

export default EmployeeForm;