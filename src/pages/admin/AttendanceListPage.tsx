import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient';
import { AttendanceRecord, PaginatedResponse } from '../../types';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/useToast';
import { AttendanceView } from '../../components/attendance/AttendanceView';
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
 * Admin Attendance List Page - ADMIN Role
 *
 * Full attendance management across all departments with no time restrictions
 */

export const AttendanceListPage: React.FC = () => {
  const { showError, showSuccess } = useToast();
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
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

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    checkInTime: '',
    checkOutTime: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAttendances();
  }, [pagination.page, dateRange]);

  const loadAttendances = async () => {
    setIsLoading(true);
    try {
      const response: PaginatedResponse<AttendanceRecord> = await api.attendances.list({
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
    } catch (error: any) {
      showError({
        title: 'Error',
        description: error.message || 'Failed to load attendance records',

      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordClick = (record: AttendanceRecord) => {
    // Admin can edit any attendance record
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

      const updatedRecord = await api.attendances.update(
        editingRecord.id,
        {
          employeeId: editingRecord.employeeId,
          attendanceDate: editingRecord.attendanceDate,
          checkInTime,
          checkOutTime,
          notes: editFormData.notes,
        }
      );

      // Update local state
      setAttendances(prev =>
        prev.map(a => (a.id === updatedRecord.id ? updatedRecord : a))
      );

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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <div className="flex gap-2">
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

      <AttendanceView
        attendances={attendances}
        isLoading={isLoading}
        viewMode={viewMode}
        dateRange={dateRange}
        onDateRangeChange={(from, to) => setDateRange({ from, to })}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        showEmployeeName={true}
        canEdit={true}
        editRestrictionDays={null}
        onRecordClick={handleRecordClick}
      />

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Input
                  value={editingRecord.employeeName}
                  disabled
                  className="bg-muted"
                />
              </div>

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

export default AttendanceListPage;
