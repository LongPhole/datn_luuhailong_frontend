import React, { useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { AttendanceRecord, AttendanceStatus } from '../../types';

interface AttendanceCalendarProps {
  attendances: AttendanceRecord[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDayClick?: (date: Date, records: AttendanceRecord[]) => void;
  loading?: boolean;
}

interface DayAttendance {
  date: Date;
  records: AttendanceRecord[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  attendances,
  currentMonth,
  onMonthChange,
  onDayClick,
  loading = false,
}) => {
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: DayAttendance[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayRecords = attendances.filter(
        (record) => record.attendanceDate === dateStr
      );

      days.push({
        date: new Date(currentDate),
        records: dayRecords,
        isCurrentMonth: isSameMonth(currentDate, currentMonth),
        isToday: isSameDay(currentDate, new Date()),
      });

      currentDate = addDays(currentDate, 1);
    }

    return days;
  }, [attendances, currentMonth]);

  // Calculate status summary for a day
  const getDaySummary = (records: AttendanceRecord[]) => {
    if (records.length === 0) return null;

    const statusCounts = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as Record<AttendanceStatus, number>);

    return statusCounts;
  };

  // Get status color
  const getStatusColor = (status: AttendanceStatus): string => {
    const colors: Record<AttendanceStatus, string> = {
      PRESENT: 'bg-green-500',
      ABSENT: 'bg-red-500',
      LATE: 'bg-yellow-500',
      LEAVE: 'bg-blue-500',
    };
    return colors[status];
  };

  // Get status text color
  const getStatusTextColor = (status: AttendanceStatus): string => {
    const colors: Record<AttendanceStatus, string> = {
      PRESENT: 'text-green-700',
      ABSENT: 'text-red-700',
      LATE: 'text-yellow-700',
      LEAVE: 'text-blue-700',
    };
    return colors[status];
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    onMonthChange(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    onMonthChange(newMonth);
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  return (
    <Card className="p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {loading ? (
          // Loading skeleton
          Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square border rounded-lg bg-muted/20 animate-pulse"
            />
          ))
        ) : (
          calendarDays.map((day, index) => {
            const summary = getDaySummary(day.records);
            const hasRecords = day.records.length > 0;

            return (
              <div
                key={index}
                onClick={() => hasRecords && onDayClick?.(day.date, day.records)}
                className={cn(
                  'aspect-square border rounded-lg p-2 transition-colors',
                  day.isCurrentMonth
                    ? 'bg-background hover:bg-muted/50'
                    : 'bg-muted/20 text-muted-foreground',
                  day.isToday && 'ring-2 ring-primary',
                  hasRecords && 'cursor-pointer',
                  !day.isCurrentMonth && 'opacity-50'
                )}
              >
                <div className="h-full flex flex-col">
                  {/* Day number */}
                  <div
                    className={cn(
                      'text-sm font-medium mb-1',
                      day.isToday && 'text-primary font-bold'
                    )}
                  >
                    {format(day.date, 'd')}
                  </div>

                  {/* Attendance indicators */}
                  {summary && (
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                      {Object.entries(summary).map(([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center gap-1 text-xs"
                        >
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              getStatusColor(status as AttendanceStatus)
                            )}
                          />
                          <span
                            className={cn(
                              'font-medium',
                              getStatusTextColor(status as AttendanceStatus)
                            )}
                          >
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Leave</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AttendanceCalendar;
