import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, LogIn, LogOut, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { useAuth } from '../../stores/authStore';
import { AttendanceRecord, SelfAttendanceRequest } from '../../types';
import { api } from '../../services/apiClient';

interface CheckInOutProps {
  className?: string;
  onAttendanceUpdate?: (record: AttendanceRecord) => void;
}

export const CheckInOut: React.FC<CheckInOutProps> = ({
  className,
  onAttendanceUpdate,
}) => {
  const { user, getEmployeeId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  // Helper function to safely format date
  const formatDateTime = (dateString: string | null | undefined, formatStr: string): string => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return '-';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '-';
      }
      return format(date, formatStr);
    } catch {
      return '-';
    }
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance record
  const fetchTodayAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await api.selfService.getMyAttendances({
        from: today,
        to: today,
        page: 0,
        size: 1,
      });

      if (response.content && response.content.length > 0) {
        setTodayAttendance(response.content[0]);
      } else {
        setTodayAttendance(null);
      }
    } catch (err: any) {
      console.error('Error fetching today attendance:', err);
      // Don't set error for "not found" - it's expected if no record exists
      if (err.error !== 'NOT_FOUND') {
        setError(err.message || 'Failed to load attendance status');
      }
    }
  };

  useEffect(() => {
    if (user && getEmployeeId()) {
      fetchTodayAttendance();
    }
  }, [user]);

  const handleCheckIn = async () => {
    if (!user || !getEmployeeId()) {
      setError('User information not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const checkInData: SelfAttendanceRequest = {
        checkInTime: now.toISOString(),
        notes: `Checked in at ${format(now, 'HH:mm:ss')}`,
      };

      let updatedRecord: AttendanceRecord;

      if (todayAttendance) {
        // Update existing record
        updatedRecord = await api.selfService.updateMyAttendance(
          todayAttendance.id,
          checkInData
        );
      } else {
        // Create new record
        updatedRecord = await api.selfService.createMyAttendance(checkInData);
      }

      setTodayAttendance(updatedRecord);
      onAttendanceUpdate?.(updatedRecord);
    } catch (err: any) {
      setError(err.message || 'Check-in failed');
      console.error('Check-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !getEmployeeId() || !todayAttendance) {
      setError('Cannot check out without checking in first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const checkOutData: SelfAttendanceRequest = {
        checkOutTime: now.toISOString(),
        notes: todayAttendance.notes
          ? `${todayAttendance.notes}\nChecked out at ${format(now, 'HH:mm:ss')}`
          : `Checked out at ${format(now, 'HH:mm:ss')}`,
      };

      const updatedRecord = await api.selfService.updateMyAttendance(
        todayAttendance.id,
        checkOutData
      );

      setTodayAttendance(updatedRecord);
      onAttendanceUpdate?.(updatedRecord);
    } catch (err: any) {
      setError(err.message || 'Check-out failed');
      console.error('Check-out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (!todayAttendance) {
      return {
        message: 'Not checked in yet',
        variant: 'secondary' as const,
      };
    }

    if (todayAttendance.checkInTime && !todayAttendance.checkOutTime) {
      return {
        message: 'Currently working',
        variant: 'default' as const,
      };
    }

    if (todayAttendance.checkInTime && todayAttendance.checkOutTime) {
      return {
        message: 'Checked out',
        variant: 'outline' as const,
      };
    }

    return {
      message: 'Unknown status',
      variant: 'secondary' as const,
    };
  };

  const canCheckIn = !todayAttendance || !todayAttendance.checkInTime;
  const canCheckOut = todayAttendance && todayAttendance.checkInTime && !todayAttendance.checkOutTime;
  const statusInfo = getStatusInfo();

  return (
    <Card className={cn('p-6', className)}>
      {/* Current Time Display */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Current Time</span>
        </div>
        <div className="text-4xl font-bold tracking-tight">
          {format(currentTime, 'HH:mm:ss')}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {format(currentTime, 'EEEE, MMMM dd, yyyy')}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-6">
        <Badge variant={statusInfo.variant} className="px-4 py-1">
          {statusInfo.message}
        </Badge>
      </div>

      {/* Attendance Info */}
      {todayAttendance && (
        <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Check In:</span>
            <span className="font-medium">
              {formatDateTime(todayAttendance.checkInTime, 'HH:mm:ss')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Check Out:</span>
            <span className="font-medium">
              {formatDateTime(todayAttendance.checkOutTime, 'HH:mm:ss')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Hours Worked:</span>
            <span className="font-medium">
              {todayAttendance.totalHoursWorked
                ? `${todayAttendance.totalHoursWorked.toFixed(2)} hours`
                : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                todayAttendance.status === 'PRESENT' && 'border-green-500/20 bg-green-500/10 text-green-600',
                todayAttendance.status === 'LATE' && 'border-yellow-500/20 bg-yellow-500/10 text-yellow-600',
                todayAttendance.status === 'ABSENT' && 'border-red-500/20 bg-red-500/10 text-red-600',
                todayAttendance.status === 'LEAVE' && 'border-blue-500/20 bg-blue-500/10 text-blue-600'
              )}
            >
              {todayAttendance.status}
            </Badge>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={handleCheckIn}
          disabled={!canCheckIn || loading}
          className="h-14"
          variant={canCheckIn ? 'default' : 'outline'}
        >
          <LogIn className="h-5 w-5 mr-2" />
          Check In
        </Button>

        <Button
          onClick={handleCheckOut}
          disabled={!canCheckOut || loading}
          className="h-14"
          variant={canCheckOut ? 'default' : 'outline'}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Check Out
        </Button>
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          {canCheckIn && 'Click "Check In" to start your work day'}
          {canCheckOut && 'Click "Check Out" when you finish your work day'}
          {!canCheckIn && !canCheckOut && 'You have completed your attendance for today'}
        </p>
      </div>

      {/* Notes Display */}
      {todayAttendance?.notes && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-xs font-medium text-muted-foreground mb-1">Notes:</div>
          <div className="text-sm whitespace-pre-wrap">{todayAttendance.notes}</div>
        </div>
      )}
    </Card>
  );
};

export default CheckInOut;
