// Core entity types based on the API specification

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  employeeId?: number | null;
  departmentId?: number | null;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description: string | null;
  manager: EmployeeSummary | null;
  status: 'ACTIVE' | 'INACTIVE';
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: number;
  empCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  hireDate: string;
  title: string;
  baseSalary: number | null;
  department: DepartmentSummary;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSummary {
  id: number;
  empCode: string;
  fullName: string;
  title: string;
  email: string;
}

export interface DepartmentSummary {
  id: number;
  code: string;
  name: string;
}

export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: PageInfo;
}

export interface ApiError {
  error: string;
  message: string;
  details?: string[];
  timestamp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn?: number;
}

// Attendance types
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  attendanceDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: AttendanceStatus;
  totalHoursWorked: number;
  notes: string | null;
  originalDepartmentId: number;
  originalDepartmentName: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
}

export interface AttendanceRequest {
  employeeId: number;
  attendanceDate: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status?: AttendanceStatus | null;
  notes?: string | null;
}

export interface SelfAttendanceRequest {
  checkInTime?: string | null;
  checkOutTime?: string | null;
  notes?: string | null;
}

// Form types
export interface DepartmentFormData {
  code: string;
  name: string;
  description?: string;
  managerId?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface EmployeeFormData {
  empCode: string;
  fullName: string;
  email: string;
  phone?: string;
  hireDate: string;
  title: string;
  baseSalary?: number;
  departmentId: number;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  avatarUrl?: string;
}

export type AuditOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogEntry {
  id: number;
  entityType: string;
  entityId: number;
  operation: AuditOperation;
  user: User;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  timestamp: string;
}
