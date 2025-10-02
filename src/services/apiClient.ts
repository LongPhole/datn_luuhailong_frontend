import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { config, API_ENDPOINTS } from '../utils/config';
import { ApiError } from '../types';

// API Response wrapper for consistent typing
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

// Extended Axios request config with custom options
export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  retryCount?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private readonly TOKEN_KEY = 'hrm_auth_token';
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for auth token attachment
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        const skipAuth = (config as any).skipAuth;

        if (token && !skipAuth) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log requests in development
        if (import.meta.env.DEV) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error: AxiosError) => {
        if (import.meta.env.DEV) {
          console.error('❌ Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log responses in development
        if (import.meta.env.DEV) {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as ApiRequestConfig & { _retry?: boolean };

        if (import.meta.env.DEV) {
          console.error('❌ Response Error:', {
            status: error.response?.status,
            message: error.message,
            url: originalRequest?.url,
            data: error.response?.data,
          });
        }

        // Handle 401 Unauthorized - Token expired or invalid
        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;

          // Check if this is a token refresh attempt
          if (originalRequest.url?.includes('/auth/refresh')) {
            this.handleAuthFailure();
            return Promise.reject(error);
          }

          // Try to refresh token
          try {
            const newToken = await this.refreshToken();
            if (newToken && originalRequest) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          }
        }

        // Handle network errors with retry logic
        if (this.isNetworkError(error) && this.shouldRetry(originalRequest)) {
          return this.retryRequest(originalRequest);
        }

        // Transform error to standardized format
        const apiError = this.transformError(error);
        return Promise.reject(apiError);
      }
    );
  }

  private getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to retrieve token from localStorage:', error);
      return null;
    }
  }

  private setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store token in localStorage:', error);
    }
  }

  private removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to remove token from localStorage:', error);
    }
  }

  private async refreshToken(): Promise<string | null> {
    try {
      // For now, we don't have a refresh endpoint in the API spec
      // This would typically call POST /auth/refresh with the current token
      // For this implementation, we'll just return null and force re-login
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  private handleAuthFailure(): void {
    this.removeToken();
    // Dispatch auth failure event for stores to handle
    window.dispatchEvent(new CustomEvent('auth:token-expired'));
  }

  private isNetworkError(error: AxiosError): boolean {
    return !error.response && (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT');
  }

  private shouldRetry(config?: ApiRequestConfig): boolean {
    if (!config) return false;
    const retryCount = config.retryCount || 0;
    return retryCount < this.MAX_RETRIES;
  }

  private async retryRequest(config: ApiRequestConfig): Promise<AxiosResponse> {
    config.retryCount = (config.retryCount || 0) + 1;

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, config.retryCount - 1) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    return this.client(config);
  }

  private transformError(error: AxiosError): ApiError {
    const defaultError: ApiError = {
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    };

    if (!error.response) {
      // Network or timeout error
      return {
        ...defaultError,
        error: 'NETWORK_ERROR',
        message: error.code === 'TIMEOUT'
          ? 'Request timeout - please try again'
          : 'Network error - please check your connection',
      };
    }

    const status = error.response.status;
    const responseData = error.response.data as any;

    // If response already matches ApiError format
    if (responseData && typeof responseData === 'object' && responseData.error) {
      return responseData as ApiError;
    }

    // Transform based on HTTP status
    switch (status) {
      case 400:
        return {
          ...defaultError,
          error: 'BAD_REQUEST',
          message: responseData?.message || 'Invalid request data',
          details: responseData?.details || responseData?.errors,
        };
      case 401:
        return {
          ...defaultError,
          error: 'UNAUTHORIZED',
          message: responseData?.message || 'Invalid email or password',
        };
      case 403:
        return {
          ...defaultError,
          error: 'FORBIDDEN',
          message: 'Access denied - insufficient permissions',
        };
      case 404:
        return {
          ...defaultError,
          error: 'NOT_FOUND',
          message: 'Resource not found',
        };
      case 409:
        return {
          ...defaultError,
          error: 'CONFLICT',
          message: responseData?.message || 'Resource conflict',
        };
      case 422:
        return {
          ...defaultError,
          error: 'VALIDATION_ERROR',
          message: responseData?.message || 'Validation failed',
          details: responseData?.details || responseData?.errors,
        };
      case 500:
        return {
          ...defaultError,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Server error - please try again later',
        };
      default:
        return {
          ...defaultError,
          error: `HTTP_${status}`,
          message: responseData?.message || `Request failed with status ${status}`,
        };
    }
  }

  // Generic HTTP methods with proper typing
  public async get<T = any>(url: string, config?: ApiRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T = any, D = any>(url: string, data?: D, config?: ApiRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = any, D = any>(url: string, data?: D, config?: ApiRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T = any, D = any>(url: string, data?: D, config?: ApiRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: ApiRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Utility methods
  public setAuthToken(token: string): void {
    this.setToken(token);
  }

  public clearAuthToken(): void {
    this.removeToken();
  }

  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic JWT validation - check if token is expired
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]!));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  // Download helper for file responses
  public async downloadFile(url: string, filename?: string, config?: ApiRequestConfig): Promise<void> {
    const response = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Upload helper for multipart/form-data
  public async uploadFile<T = any>(
    url: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { skipAuth: true, timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export API endpoints for use in services
export { API_ENDPOINTS };

// Convenience methods for common API patterns
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post(API_ENDPOINTS.auth.login, credentials, { skipAuth: true }),
    logout: () =>
      apiClient.post(API_ENDPOINTS.auth.logout),
  },

  // Self-service endpoints (for USER role)
  selfService: {
    getProfile: () =>
      apiClient.get(API_ENDPOINTS.selfService.profile),
    updateProfile: (data: any) =>
      apiClient.put(API_ENDPOINTS.selfService.profile, data),
    getMyAttendances: (params?: Record<string, any>) =>
      apiClient.get(API_ENDPOINTS.selfService.attendances, { params }),
    createMyAttendance: (data: any) =>
      apiClient.post(API_ENDPOINTS.selfService.attendances, data),
    updateMyAttendance: (id: number, data: any) =>
      apiClient.put(API_ENDPOINTS.selfService.attendance(id), data),
  },

  // Attendance management endpoints (role-based access)
  attendances: {
    list: (params?: Record<string, any>) =>
      apiClient.get(API_ENDPOINTS.attendances.list, { params }),
    get: (id: number) =>
      apiClient.get(API_ENDPOINTS.attendances.get(id)),
    create: (data: any) =>
      apiClient.post(API_ENDPOINTS.attendances.create, data),
    update: (id: number, data: any) =>
      apiClient.put(API_ENDPOINTS.attendances.update(id), data),
    delete: (id: number) =>
      apiClient.delete(API_ENDPOINTS.attendances.delete(id)),
  },

  // Department endpoints
  departments: {
    list: (params?: Record<string, any>) =>
      apiClient.get(API_ENDPOINTS.departments.list, { params }),
    get: (id: number) =>
      apiClient.get(API_ENDPOINTS.departments.get(id)),
    create: (data: any) =>
      apiClient.post(API_ENDPOINTS.departments.create, data),
    update: (id: number, data: any) =>
      apiClient.put(API_ENDPOINTS.departments.update(id), data),
    delete: (id: number) =>
      apiClient.delete(API_ENDPOINTS.departments.delete(id)),
  },

  // Employee endpoints
  employees: {
    list: (params?: Record<string, any>) =>
      apiClient.get(API_ENDPOINTS.employees.list, { params }),
    get: (id: number) =>
      apiClient.get(API_ENDPOINTS.employees.get(id)),
    create: (data: any) =>
      apiClient.post(API_ENDPOINTS.employees.create, data),
    update: (id: number, data: any) =>
      apiClient.put(API_ENDPOINTS.employees.update(id), data),
    delete: (id: number) =>
      apiClient.delete(API_ENDPOINTS.employees.delete(id)),
    export: (params?: Record<string, any>) =>
      apiClient.downloadFile(`${API_ENDPOINTS.employees.list}/export`, 'employees.csv', { params }),
    bulkUpdateStatus: (employeeIds: number[], status: string) =>
      apiClient.patch(`${API_ENDPOINTS.employees.list}/bulk-update-status`, { employeeIds, status }),
  },

  // Audit endpoints (ADMIN only)
  audit: {
    list: (params?: Record<string, any>) =>
      apiClient.get(API_ENDPOINTS.audit.list, { params }),
    getEntityHistory: (entityType: string, entityId: number, params?: Record<string, any>) =>
      apiClient.get(`${API_ENDPOINTS.audit.list}/entity/${entityType}/${entityId}`, { params }),
    getRecentActivity: (limit: number = 10) =>
      apiClient.get(`${API_ENDPOINTS.audit.list}/recent`, { params: { limit } }),
    getUserActivity: (userId: number, params?: Record<string, any>) =>
      apiClient.get(`${API_ENDPOINTS.audit.list}/user/${userId}`, { params }),
    getStatistics: () =>
      apiClient.get(`${API_ENDPOINTS.audit.list}/statistics`),
  },

  // Reports endpoints (role-based access)
  reports: {
    getDepartmentAttendance: (departmentId: number, params?: { startDate?: string; endDate?: string }) =>
      apiClient.get(API_ENDPOINTS.reports.departmentAttendance(departmentId), { params }),
    getDepartmentEmployees: (departmentId: number) =>
      apiClient.get(API_ENDPOINTS.reports.departmentEmployees(departmentId)),
    getSystemStatistics: () =>
      apiClient.get(API_ENDPOINTS.reports.statistics),
  },
};

export default apiClient;