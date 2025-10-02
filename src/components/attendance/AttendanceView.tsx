import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar as CalendarIcon, Filter, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '../../lib/utils';
import { useAuth } from '../../stores/authStore';
import { AttendanceRecord, AttendanceStatus, PaginatedResponse } from '../../types';
import { api } from '../../services/apiClient';
import { AttendanceCalendar } from './AttendanceCalendar';

interface AttendanceViewProps {
  attendances: AttendanceRecord[];
  isLoading: boolean;
  viewMode?: 'table' | 'calendar';
  dateRange: { from: string; to: string };
  onDateRangeChange: (from: string, to: string) => void;
  pagination?: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  showEmployeeName?: boolean;
  canEdit?: boolean;
  editRestrictionDays?: number | null;
  employeeId?: number;
  departmentId?: number;
  onRecordClick?: (record: AttendanceRecord) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendances,
  isLoading,
  viewMode = 'table',
  dateRange,
  onDateRangeChange,
  pagination,
  onPageChange,
  showEmployeeName = true,
  canEdit = false,
  editRestrictionDays = null,
  employeeId,
  departmentId,
  onRecordClick,
}) => {
  const { user, isAdmin, isManager } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'ALL'>('ALL');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayRecords, setSelectedDayRecords] = useState<AttendanceRecord[] | null>(null);
  const [filteredAttendances, setFilteredAttendances] = useState<AttendanceRecord[]>([]);

  // Filter attendances by status on the client side
  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredAttendances(attendances);
    } else {
      setFilteredAttendances(attendances.filter(a => a.status === statusFilter));
    }
  }, [attendances, statusFilter]);

  const getStatusBadge = (status: AttendanceStatus) => {
    const variants: Record<AttendanceStatus, string> = {
      PRESENT: 'bg-green-500/10 text-green-600 border-green-500/20',
      ABSENT: 'bg-red-500/10 text-red-600 border-red-500/20',
      LATE: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      LEAVE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    };

    return (
      <Badge variant="outline" className={cn('font-medium', variants[status])}>
        {status}
      </Badge>
    );
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    try {
      return format(parseISO(timeString), 'HH:mm');
    } catch {
      return timeString;
    }
  };

  const handleExport = async () => {
    try {
      // Fetch all attendance records in batches (backend limits to max 100 per page)
      const allRecords: AttendanceRecord[] = [];
      let currentPage = 0;
      let hasMore = true;
      const pageSize = 100; // Maximum allowed by backend

      const baseParams: Record<string, any> = {
        from: dateRange.from,
        to: dateRange.to,
        size: pageSize,
      };

      if (employeeId) {
        baseParams.employeeId = employeeId;
      }

      if (departmentId) {
        baseParams.departmentId = departmentId;
      }

      if (statusFilter !== 'ALL') {
        baseParams.status = statusFilter;
      }

      // Fetch all pages
      while (hasMore) {
        const params = { ...baseParams, page: currentPage };

        let response: PaginatedResponse<AttendanceRecord>;
        if (employeeId && user?.employeeId === employeeId) {
          response = await api.selfService.getMyAttendances(params);
        } else {
          response = await api.attendances.list(params);
        }

        allRecords.push(...response.content);

        // Check if there are more pages
        hasMore = response.page.hasNext;
        currentPage++;
      }

      // Convert to CSV
      const csvData = convertToCSV(allRecords);

      // Download CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_export_${dateRange.from}_to_${dateRange.to}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Exported ${allRecords.length} attendance records`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export attendance data. Please try again.');
    }
  };

  const convertToCSV = (records: AttendanceRecord[]): string => {
    if (records.length === 0) {
      return 'No data to export';
    }

    // CSV headers
    const headers = [
      'Date',
      'Employee Name',
      'Employee ID',
      'Department',
      'Check In Time',
      'Check Out Time',
      'Total Hours',
      'Status',
      'Notes',
    ];

    // CSV rows
    const rows = records.map(record => [
      record.attendanceDate,
      record.employeeName,
      record.employeeId,
      record.originalDepartmentName,
      formatTime(record.checkInTime),
      formatTime(record.checkOutTime),
      record.totalHoursWorked ? record.totalHoursWorked.toFixed(2) : '0',
      record.status,
      record.notes ? `"${record.notes.replace(/"/g, '""')}"` : '', // Escape quotes in notes
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csvContent;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => onDateRangeChange(e.target.value, dateRange.to)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <span className="flex items-center">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => onDateRangeChange(dateRange.from, e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AttendanceStatus | 'ALL')}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="LEAVE">Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            {(isAdmin() || isManager()) && (
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-200">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading attendance records...
                    </TableCell>
                  </TableRow>
                ) : filteredAttendances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendances.map((record) => (
                    <TableRow
                      key={record.id}
                      className={cn(
                        'cursor-pointer hover:bg-muted/50',
                        !record.canEdit && 'opacity-60'
                      )}
                      onClick={() => onRecordClick?.(record)}
                    >
                      <TableCell className="font-medium">
                        {format(parseISO(record.attendanceDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{record.employeeName}</TableCell>
                      <TableCell>{record.originalDepartmentName}</TableCell>
                      <TableCell>{formatTime(record.checkInTime)}</TableCell>
                      <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                      <TableCell>
                        {record.totalHoursWorked ? `${record.totalHoursWorked.toFixed(1)}h` : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {record.canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRecordClick?.(record);
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page + 1} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(Math.max(0, pagination.page - 1))}
                  disabled={pagination.page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(Math.min(pagination.totalPages - 1, pagination.page + 1))}
                  disabled={pagination.page >= pagination.totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          <AttendanceCalendar
            attendances={filteredAttendances}
            currentMonth={currentMonth}
            onMonthChange={(newMonth) => {
              setCurrentMonth(newMonth);
              onDateRangeChange(
                format(startOfMonth(newMonth), 'yyyy-MM-dd'),
                format(endOfMonth(newMonth), 'yyyy-MM-dd')
              );
            }}
            onDayClick={(date, records) => {
              setSelectedDayRecords(records);
              onRecordClick?.(records[0]); // Open first record for editing
            }}
            loading={isLoading}
          />

          {/* Selected Day Details */}
          {selectedDayRecords && selectedDayRecords.length > 0 && (
            <Card>
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {format(parseISO(selectedDayRecords[0].attendanceDate), 'EEEE, MMMM d, yyyy')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDayRecords.length} attendance record(s)
                </p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDayRecords.map((record) => (
                      <TableRow
                        key={record.id}
                        className={cn(
                          'cursor-pointer hover:bg-muted/50',
                          !record.canEdit && 'opacity-60'
                        )}
                        onClick={() => onRecordClick?.(record)}
                      >
                        <TableCell className="font-medium">{record.employeeName}</TableCell>
                        <TableCell>{record.originalDepartmentName}</TableCell>
                        <TableCell>{formatTime(record.checkInTime)}</TableCell>
                        <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                        <TableCell>
                          {record.totalHoursWorked ? `${record.totalHoursWorked.toFixed(1)}h` : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.notes || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRecordClick?.(record);
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
