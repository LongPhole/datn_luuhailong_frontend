import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/authStore';
import { api } from '../../services/apiClient';
import { AttendanceRecord, PaginatedResponse } from '../../types';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/useToast';
import { AttendanceView } from '../../components/attendance/AttendanceView';
import { CheckInOut } from '../../components/attendance/CheckInOut';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

/**
 * User Attendance Page - USER Role
 *
 * Allows users to view their own attendance history and check in/out for the current date.
 * Users can only modify their attendance for the current date.
 *
 * Features:
 * - View personal attendance history (table and calendar views)
 * - Check-in/check-out for current date
 * - Filter by date range
 * - View attendance statistics
 * - Cannot edit past attendance records
 *
 * API Endpoints:
 * - GET /api/v1/me/attendances
 * - POST /api/v1/me/attendances
 * - PUT /api/v1/me/attendances/{id}
 */

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    checkInTime: '',
    checkOutTime: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load attendance records
  useEffect(() => {
    loadAttendances();
  }, [pagination.page, dateRange]);

  const loadAttendances = async () => {
    setIsLoading(true);
    try {
      const response: PaginatedResponse<AttendanceRecord> = await api.selfService.getMyAttendances({
        from: dateRange.from,
        to: dateRange.to,
        page: pagination.page,
        size: pagination.size,
      });

      setAttendances(response.content);
      setPagination(prev => ({
        ...prev,
        totalElements: response.page.totalElements,
        totalPages: response.page.totalPages,
      }));

      // Check if today's attendance exists
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = response.content.find(
        record => record.attendanceDate === today
      );
      setTodayAttendance(todayRecord || null);

    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to load attendance records',
        
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (time: string, notes?: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const newRecord = await api.selfService.createAttendance({
        checkInTime: time,
        notes,
      });

      setTodayAttendance(newRecord);
      // Refresh the list
      loadAttendances();

      showError({
        title: 'Success',
        description: 'Checked in successfully',
      });
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to check in',
        
      });
    }
  };

  const handleCheckOut = async (time: string, notes?: string) => {
    if (!todayAttendance) {
      showError({
        title: 'Error',
        description: 'No check-in record found for today',
        
      });
      return;
    }

    try {
      const updatedRecord = await api.selfService.updateAttendance(
        todayAttendance.id,
        {
          checkInTime: todayAttendance.checkInTime,
          checkOutTime: time,
          notes: notes || todayAttendance.notes,
        }
      );

      setTodayAttendance(updatedRecord);
      // Refresh the list
      loadAttendances();

      showError({
        title: 'Success',
        description: 'Checked out successfully',
      });
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to check out',
        
      });
    }
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setDateRange({ from, to });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRecordClick = (record: AttendanceRecord) => {
    // Check if this is today's record
    const today = new Date().toISOString().split('T')[0];
    if (record.attendanceDate === today && record.canEdit) {
      // Extract time portion from ISO timestamp for time input
      const extractTime = (timestamp: string | null): string => {
        if (!timestamp) return '';
        // "2025-10-02T16:12:00" -> "16:12"
        const timePart = timestamp.split('T')[1];
        if (!timePart) return '';
        return timePart.substring(0, 5); // "16:12:00" -> "16:12"
      };

      setEditingRecord(record);
      setEditFormData({
        checkInTime: extractTime(record.checkInTime),
        checkOutTime: extractTime(record.checkOutTime),
        notes: record.notes || '',
      });
      setEditDialogOpen(true);
    }
  };

  const parseTimeInput = (hours: string, minutes: string): string => {
    const h = hours.padStart(2, '0');
    const m = minutes.padStart(2, '0');
    return `${h}:${m}`;
  };

  const getHoursMinutes = (timeString: string): { hours: string; minutes: string } => {
    if (!timeString) return { hours: '', minutes: '' };
    const [hours, minutes] = timeString.split(':');
    return { hours: hours || '', minutes: minutes || '' };
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    setIsSaving(true);
    try {
      // Format times as LocalTime (HH:mm:ss) for backend
      const checkInTime = editFormData.checkInTime
        ? `${editFormData.checkInTime}:00`
        : null;
      const checkOutTime = editFormData.checkOutTime
        ? `${editFormData.checkOutTime}:00`
        : null;

      const updatedRecord = await api.selfService.updateMyAttendance(
        editingRecord.id,
        {
          checkInTime,
          checkOutTime,
          notes: editFormData.notes,
        }
      );

      // Update local state
      setAttendances(prev =>
        prev.map(a => (a.id === updatedRecord.id ? updatedRecord : a))
      );
      if (todayAttendance?.id === updatedRecord.id) {
        setTodayAttendance(updatedRecord);
      }

      showSuccess({
        title: 'Success',
        description: 'Attendance record updated successfully',
      });

      setEditDialogOpen(false);
      setEditingRecord(null);
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to update attendance record',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate attendance statistics
  const stats = React.useMemo(() => {
    const total = attendances.length;
    const present = attendances.filter(a => a.status === 'PRESENT').length;
    const late = attendances.filter(a => a.status === 'LATE').length;
    const absent = attendances.filter(a => a.status === 'ABSENT').length;
    const leave = attendances.filter(a => a.status === 'LEAVE').length;

    return {
      total,
      present,
      late,
      absent,
      leave,
      presentRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }, [attendances]);

  if (isLoading && attendances.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">My Attendance</h1>
        <div className="grid gap-6">
          <Card className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-96 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
          >
            Calendar View
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Check In/Out Card */}
        <CheckInOut
          attendance={todayAttendance}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          canEdit={true}
        />

        {/* Attendance Statistics */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Attendance Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Days</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.present}</p>
              <p className="text-sm text-gray-600">Present</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
              <p className="text-sm text-gray-600">Late</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
              <p className="text-sm text-gray-600">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.leave}</p>
              <p className="text-sm text-gray-600">Leave</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Attendance Rate: <span className="font-semibold text-lg">{stats.presentRate}%</span>
            </p>
          </div>
        </Card>

        {/* Attendance Records */}
        <AttendanceView
          attendances={attendances}
          isLoading={isLoading}
          viewMode={viewMode}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          pagination={pagination}
          onPageChange={handlePageChange}
          showEmployeeName={false}
          canEdit={true}
          onRecordClick={handleRecordClick}
        />
      </div>

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  value={editingRecord.attendanceDate}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Check In Time (24-hour format)</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Label htmlFor="checkInHours" className="text-xs text-muted-foreground">Hours</Label>
                    <Input
                      id="checkInHours"
                      type="number"
                      min="0"
                      max="23"
                      placeholder="HH"
                      value={getHoursMinutes(editFormData.checkInTime).hours}
                      onChange={(e) => {
                        const { minutes } = getHoursMinutes(editFormData.checkInTime);
                        const newTime = parseTimeInput(e.target.value, minutes);
                        setEditFormData(prev => ({ ...prev, checkInTime: newTime }));
                      }}
                    />
                  </div>
                  <span className="text-2xl font-bold mt-5">:</span>
                  <div className="flex-1">
                    <Label htmlFor="checkInMinutes" className="text-xs text-muted-foreground">Minutes</Label>
                    <Input
                      id="checkInMinutes"
                      type="number"
                      min="0"
                      max="59"
                      placeholder="MM"
                      value={getHoursMinutes(editFormData.checkInTime).minutes}
                      onChange={(e) => {
                        const { hours } = getHoursMinutes(editFormData.checkInTime);
                        const newTime = parseTimeInput(hours, e.target.value);
                        setEditFormData(prev => ({ ...prev, checkInTime: newTime }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Check Out Time (24-hour format)</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Label htmlFor="checkOutHours" className="text-xs text-muted-foreground">Hours</Label>
                    <Input
                      id="checkOutHours"
                      type="number"
                      min="0"
                      max="23"
                      placeholder="HH"
                      value={getHoursMinutes(editFormData.checkOutTime).hours}
                      onChange={(e) => {
                        const { minutes } = getHoursMinutes(editFormData.checkOutTime);
                        const newTime = parseTimeInput(e.target.value, minutes);
                        setEditFormData(prev => ({ ...prev, checkOutTime: newTime }));
                      }}
                    />
                  </div>
                  <span className="text-2xl font-bold mt-5">:</span>
                  <div className="flex-1">
                    <Label htmlFor="checkOutMinutes" className="text-xs text-muted-foreground">Minutes</Label>
                    <Input
                      id="checkOutMinutes"
                      type="number"
                      min="0"
                      max="59"
                      placeholder="MM"
                      value={getHoursMinutes(editFormData.checkOutTime).minutes}
                      onChange={(e) => {
                        const { hours } = getHoursMinutes(editFormData.checkOutTime);
                        const newTime = parseTimeInput(hours, e.target.value);
                        setEditFormData(prev => ({ ...prev, checkOutTime: newTime }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData(prev => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="Add any notes..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendancePage;
