import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  User,
  Upload,
  Calendar,
  Badge as BadgeIcon,
  Building,
  Mail,
  Phone,
  DollarSign,
  Edit,
  Camera,
  X,
} from 'lucide-react';
import { Employee } from '@/types';
import { useEmployeeStore } from '@/stores/employeeStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface EmployeeProfileProps {
  employee: Employee;
  onEdit?: () => void;
  showEditButton?: boolean;
}

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({
  employee,
  onEdit,
  showEditButton = false,
}) => {
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const { updateEmployee, isUpdating } = useEmployeeStore();

  // Check if user has access to salary information
  const userRole = localStorage.getItem('hrm_user_role');
  const canViewSalary = userRole === 'ADMIN';
  const canEditAvatar = userRole === 'ADMIN' || userRole === 'USER';

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // In a real implementation, this would upload to a file storage service
      // For now, we'll create a local preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    } catch (error) {
      alert('Failed to upload avatar image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveAvatar = async () => {
    try {
      const newAvatarUrl = avatarPreview || avatarUrl;
      await updateEmployee(employee.id, {
        avatarUrl: newAvatarUrl,
      });
      setIsAvatarDialogOpen(false);
      setAvatarPreview(null);
      setAvatarUrl('');
    } catch (error) {
      alert('Failed to update avatar');
    }
  };

  const handleCancelAvatar = () => {
    setAvatarPreview(null);
    setAvatarUrl('');
    setIsAvatarDialogOpen(false);
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateEmployee(employee.id, {
        avatarUrl: null,
      });
    } catch (error) {
      alert('Failed to remove avatar');
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar */}
            <div className="relative group">
              {employee.avatarUrl ? (
                <img
                  src={employee.avatarUrl}
                  alt={employee.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted border-4 border-background shadow-lg flex items-center justify-center">
                  <User className="h-16 w-16 text-muted-foreground" />
                </div>
              )}

              {/* Avatar Edit Overlay */}
              {canEditAvatar && (
                <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Update Profile Photo</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Current Avatar Preview */}
                      <div className="flex justify-center">
                        {(avatarPreview || employee.avatarUrl) ? (
                          <img
                            src={avatarPreview || employee.avatarUrl || ''}
                            alt="Avatar preview"
                            className="w-24 h-24 rounded-full object-cover border-2 border-border"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                            <User className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Upload Methods */}
                      <div className="space-y-4">
                        {/* File Upload */}
                        <div className="space-y-2">
                          <Label htmlFor="avatar-file">Upload from device</Label>
                          <div className="flex gap-2">
                            <Label htmlFor="avatar-file" className="flex-1">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isUploadingAvatar}
                                className="w-full cursor-pointer"
                                asChild
                              >
                                <span>
                                  <Upload className="mr-2 h-4 w-4" />
                                  {isUploadingAvatar ? 'Uploading...' : 'Choose File'}
                                </span>
                              </Button>
                            </Label>
                          </div>
                          <input
                            id="avatar-file"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={isUploadingAvatar}
                          />
                          <p className="text-xs text-muted-foreground">
                            Supported formats: JPEG, PNG, GIF (max 5MB)
                          </p>
                        </div>

                        {/* URL Input */}
                        <div className="space-y-2">
                          <Label htmlFor="avatar-url">Or enter image URL</Label>
                          <Input
                            id="avatar-url"
                            placeholder="https://example.com/avatar.jpg"
                            value={avatarUrl}
                            onChange={(e) => {
                              setAvatarUrl(e.target.value);
                              if (e.target.value) {
                                setAvatarPreview(e.target.value);
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSaveAvatar}
                          disabled={isUpdating || (!avatarPreview && !avatarUrl)}
                          className="flex-1"
                        >
                          {isUpdating ? 'Saving...' : 'Save Photo'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelAvatar}
                          disabled={isUpdating}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>

                      {/* Remove Avatar Option */}
                      {employee.avatarUrl && (
                        <>
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">
                                or
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            disabled={isUpdating}
                            className="w-full"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Remove Photo
                          </Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Employee Name and Title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{employee.fullName}</h2>
              <p className="text-lg text-muted-foreground">{employee.title}</p>
              <div className="flex items-center justify-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{employee.department.name}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              {getStatusBadge(employee.status)}
            </div>

            {/* Quick Info */}
            <div className="w-full space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Employee ID</span>
                <span className="font-mono">{employee.empCode}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hire Date</span>
                <span>{format(new Date(employee.hireDate), 'MMM dd, yyyy')}</span>
              </div>

              {canViewSalary && employee.baseSalary && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Base Salary</span>
                  <span className="font-medium">{formatSalary(employee.baseSalary)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Years of Service</span>
                <span>
                  {Math.floor((new Date().getTime() - new Date(employee.hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="w-full space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${employee.email}`}
                  className="text-primary hover:underline truncate"
                >
                  {employee.email}
                </a>
              </div>

              {employee.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${employee.phone}`}
                    className="text-primary hover:underline"
                  >
                    {employee.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Edit Button */}
            {showEditButton && onEdit && (
              <Button onClick={onEdit} variant="outline" className="w-full">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default EmployeeProfile;