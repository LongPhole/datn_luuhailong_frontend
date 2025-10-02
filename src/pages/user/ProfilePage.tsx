import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/authStore';
import { api } from '../../services/apiClient';
import { Employee } from '../../types';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/useToast';
import { Avatar } from '../../components/ui/avatar';

/**
 * User Profile Page - USER Role
 *
 * Allows users to view and edit their own profile information.
 * Users can update contact details (email, phone) but not core employment data.
 *
 * Features:
 * - View personal employee information
 * - Edit contact information (email, phone)
 * - View department and position details (read-only)
 * - Avatar display
 *
 * API Endpoints:
 * - GET /api/v1/me/profile
 * - PUT /api/v1/me/profile
 */

interface UserProfileFormData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
}

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showError } = useToast();

  const [profile, setProfile] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UserProfileFormData>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
  });

  // Load user profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.selfService.getProfile();

      // Check if employee record exists
      if (!response.employee) {
        showError({
          title: 'No Employee Record',
          description: 'Your account does not have an associated employee record.',
        });
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setProfile(response.employee);

      // Initialize form data
      const nameParts = response.employee.fullName.split(' ');
      setFormData({
        email: response.employee.email,
        phone: response.employee.phone || '',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
      });
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to load profile',

      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data
    if (profile) {
      const nameParts = profile.fullName.split(' ');
      setFormData({
        email: profile.email,
        phone: profile.phone || '',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.selfService.updateProfile(formData);
      setProfile(response.employee);
      setIsEditing(false);

      showError({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfileFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-gray-700 mb-2">Your account does not have an associated employee record.</p>
            <p className="text-sm text-gray-500">Please contact your administrator to set up your employee profile.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {!isEditing && (
          <Button onClick={handleEdit}>Edit Profile</Button>
        )}
      </div>

      <div className="grid gap-6">
        {/* Personal Information Card */}
        <Card className="p-6">
          <div className="flex items-start space-x-6 mb-6">
            <Avatar
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="h-24 w-24"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{profile.fullName}</h2>
              <p className="text-gray-600">{profile.position}</p>
              <p className="text-sm text-gray-500">Employee Code: {profile.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-gray-900">{profile.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  placeholder="Enter phone number"
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-gray-900">{profile.phone || 'Not provided'}</p>
              )}
            </div>

            {/* First Name */}
            {isEditing && (
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  className="mt-1"
                />
              </div>
            )}

            {/* Last Name */}
            {isEditing && (
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </Card>

        {/* Employment Information Card (Read-Only) */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Employment Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Department</Label>
              <p className="mt-1 text-gray-900">{profile.department.name}</p>
              <p className="text-sm text-gray-500">{profile.department.code}</p>
            </div>

            <div>
              <Label>Position</Label>
              <p className="mt-1 text-gray-900">{profile.position}</p>
            </div>

            <div>
              <Label>Hire Date</Label>
              <p className="mt-1 text-gray-900">
                {new Date(profile.hireDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <Label>Status</Label>
              <p className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  profile.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile.status}
                </span>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
