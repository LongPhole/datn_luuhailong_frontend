// Environment configuration
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  appTitle: import.meta.env.VITE_APP_TITLE || 'HR Management System',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: '/v1/auth/login',
    logout: '/v1/auth/logout',
  },
  selfService: {
    profile: '/v1/me/profile',
    attendances: '/v1/me/attendances',
    attendance: (id: number) => `/v1/me/attendances/${id}`,
  },
  attendances: {
    list: '/v1/attendances',
    create: '/v1/attendances',
    get: (id: number) => `/v1/attendances/${id}`,
    update: (id: number) => `/v1/attendances/${id}`,
    delete: (id: number) => `/v1/attendances/${id}`,
  },
  departments: {
    list: '/v1/departments',
    create: '/v1/departments',
    get: (id: number) => `/v1/departments/${id}`,
    update: (id: number) => `/v1/departments/${id}`,
    delete: (id: number) => `/v1/departments/${id}`,
  },
  employees: {
    list: '/v1/employees',
    create: '/v1/employees',
    get: (id: number) => `/v1/employees/${id}`,
    update: (id: number) => `/v1/employees/${id}`,
    delete: (id: number) => `/v1/employees/${id}`,
  },
  audit: {
    list: '/v1/audit',
  },
  reports: {
    departmentAttendance: (departmentId: number) => `/v1/reports/attendance/department/${departmentId}`,
    departmentEmployees: (departmentId: number) => `/v1/reports/employees/department/${departmentId}`,
    statistics: '/v1/reports/statistics',
  },
} as const;
