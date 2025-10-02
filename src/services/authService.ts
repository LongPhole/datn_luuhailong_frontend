import { apiClient, api } from './apiClient';
import { User, LoginRequest, LoginResponse, ApiError } from '../types';

// Authentication result types
export interface LoginResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface AuthValidationResult {
  isValid: boolean;
  user?: User;
  error?: string;
}

export interface TokenInfo {
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: Date;
  user?: Partial<User>;
}

class AuthService {
  private readonly TOKEN_KEY = 'hrm_auth_token';
  private readonly USER_KEY = 'hrm_user_data';

  /**
   * Authenticate user with email and password
   */
  public async login(credentials: LoginRequest): Promise<LoginResult> {
    try {
      const response = await api.auth.login(credentials) as LoginResponse;

      if (response.token && response.user) {
        // Store token and user data
        this.setToken(response.token);
        this.setUserData(response.user);

        // Setup token expiration listener
        this.setupTokenExpirationCheck(response.token);

        return {
          success: true,
          user: response.user,
          token: response.token,
        };
      } else {
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }
    } catch (error) {
      // Clear any stored auth data on login failure
      this.clearStoredAuth();

      const apiError = error as ApiError;

      // Extract the most specific error message available
      let errorMessage = 'Login failed';
      if (apiError.message) {
        errorMessage = apiError.message;
      } else if (apiError.error) {
        errorMessage = apiError.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Logout user and clear authentication data
   */
  public async logout(): Promise<void> {
    try {
      // Call API logout endpoint if token exists
      if (this.getToken()) {
        await api.auth.logout().catch(() => {
          // Ignore API errors during logout - we're clearing local state anyway
        });
      }
    } catch (error) {
    } finally {
      // Always clear local authentication state
      this.clearStoredAuth();

      // Dispatch logout event for stores to handle
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  /**
   * Get current authenticated user
   */
  public getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      if (userData) {
        return JSON.parse(userData) as User;
      }
    } catch (error) {
      this.clearUserData();
    }
    return null;
  }

  /**
   * Check if user is currently authenticated
   */
  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    return this.isTokenValid(token);
  }

  /**
   * Validate current authentication status
   */
  public validateAuth(): AuthValidationResult {
    const token = this.getToken();
    const user = this.getCurrentUser();

    if (!token) {
      return { isValid: false, error: 'No authentication token found' };
    }

    if (!this.isTokenValid(token)) {
      this.clearStoredAuth();
      return { isValid: false, error: 'Authentication token has expired' };
    }

    if (!user) {
      this.clearStoredAuth();
      return { isValid: false, error: 'User data not found' };
    }

    return { isValid: true, user };
  }

  /**
   * Get detailed token information
   */
  public getTokenInfo(): TokenInfo {
    const token = this.getToken();

    if (!token) {
      return { isValid: false, isExpired: true };
    }

    try {
      const payload = this.parseTokenPayload(token);
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp <= currentTime;
      const isValid = !isExpired;

      const result: TokenInfo = {
        isValid,
        isExpired,
        expiresAt: new Date(payload.exp * 1000),
      };

      if (payload.sub) {
        result.user = {
          id: parseInt(payload.sub),
          email: payload.email,
          fullName: payload.fullName,
          role: payload.role,
        };
      }

      return result;
    } catch (error) {
      console.warn('Failed to parse token:', error);
      return { isValid: false, isExpired: true };
    }
  }

  /**
   * Check if current user has admin role
   */
  public isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }

  /**
   * Check if current user has manager role
   */
  public isManager(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'MANAGER';
  }

  /**
   * Check if current user has regular user role
   */
  public isUser(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'USER';
  }

  /**
   * Get current user's department ID (for MANAGER role)
   */
  public getDepartmentId(): number | null {
    const user = this.getCurrentUser();
    return user?.departmentId ?? null;
  }

  /**
   * Get current user's employee ID
   */
  public getEmployeeId(): number | null {
    const user = this.getCurrentUser();
    return user?.employeeId ?? null;
  }

  /**
   * Check if current user has specific permission
   */
  public hasPermission(permission: 'read' | 'write' | 'delete'): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }

    const user = this.getCurrentUser();
    if (!user) return false;

    switch (permission) {
      case 'read':
        // All authenticated users can read
        return true;
      case 'write':
        // ADMIN and MANAGER can write, USER has limited write access
        return user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'USER';
      case 'delete':
        // Only ADMIN can delete
        return user.role === 'ADMIN';
      default:
        return false;
    }
  }

  /**
   * Check if user can access a specific department
   */
  public canAccessDepartment(departmentId: number): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }

    const user = this.getCurrentUser();
    if (!user) return false;

    // ADMIN can access all departments
    if (user.role === 'ADMIN') {
      return true;
    }

    // MANAGER can only access their own department
    if (user.role === 'MANAGER') {
      return user.departmentId === departmentId;
    }

    // USER can view all departments (read-only)
    return true;
  }

  /**
   * Check if user can access a specific employee
   */
  public canAccessEmployee(employeeId: number): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }

    const user = this.getCurrentUser();
    if (!user) return false;

    // ADMIN can access all employees
    if (user.role === 'ADMIN') {
      return true;
    }

    // All users can access their own employee record
    if (user.employeeId === employeeId) {
      return true;
    }

    // MANAGER can access employees in their department (validated at API level)
    return user.role === 'MANAGER';
  }

  /**
   * Update current user data in localStorage
   */
  public updateUserData(userData: Partial<User>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      this.setUserData(updatedUser);

      // Dispatch user update event
      window.dispatchEvent(new CustomEvent('auth:user-updated', {
        detail: updatedUser
      }));
    }
  }

  /**
   * Get authentication token
   */
  public getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Setup automatic logout when token expires
   */
  public setupTokenExpirationCheck(token?: string): void {
    const authToken = token || this.getToken();
    if (!authToken) return;

    try {
      const payload = this.parseTokenPayload(authToken);
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      // If token is already expired, logout immediately
      if (timeUntilExpiration <= 0) {
        this.logout();
        return;
      }

      // Setup automatic logout 30 seconds before token expires
      const logoutDelay = Math.max(timeUntilExpiration - 30000, 0);

      setTimeout(() => {
        this.logout();
      }, logoutDelay);

    } catch (error) {
    }
  }

  /**
   * Initialize auth service and setup event listeners
   */
  public initialize(): void {
    // Setup token expiration check on initialization
    this.setupTokenExpirationCheck();

    // Listen for storage changes (multi-tab support)
    window.addEventListener('storage', (event) => {
      if (event.key === this.TOKEN_KEY) {
        if (!event.newValue) {
          // Token was removed in another tab
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      }
    });

    // Listen for custom auth events
    window.addEventListener('auth:token-expired', () => {
      this.clearStoredAuth();
    });

    // Validate auth on page focus (in case token expired while tab was inactive)
    window.addEventListener('focus', () => {
      if (this.getToken() && !this.isAuthenticated()) {
        this.logout();
      }
    });
  }

  // Private helper methods

  private setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      apiClient.setAuthToken(token);
    } catch (error) {
    }
  }

  private setUserData(user: User): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
    }
  }

  private clearStoredAuth(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      apiClient.clearAuthToken();
    } catch (error) {
    }
  }

  private clearUserData(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = this.parseTokenPayload(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  private parseTokenPayload(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const base64Url = parts[1]!;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export utility functions for easy access
export const authUtils = {
  isAuthenticated: () => authService.isAuthenticated(),
  getCurrentUser: () => authService.getCurrentUser(),
  isAdmin: () => authService.isAdmin(),
  isManager: () => authService.isManager(),
  isUser: () => authService.isUser(),
  getDepartmentId: () => authService.getDepartmentId(),
  getEmployeeId: () => authService.getEmployeeId(),
  hasPermission: (permission: 'read' | 'write' | 'delete') =>
    authService.hasPermission(permission),
  canAccessDepartment: (departmentId: number) =>
    authService.canAccessDepartment(departmentId),
  canAccessEmployee: (employeeId: number) =>
    authService.canAccessEmployee(employeeId),
  getToken: () => authService.getToken(),
  getTokenInfo: () => authService.getTokenInfo(),
};

export default authService;