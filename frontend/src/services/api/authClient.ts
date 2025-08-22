// Authentication API Client
import { BaseApiClient, ApiConfig } from './baseClient';

// Auth Service Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  role?: 'admin' | 'operator' | 'analyst' | 'viewer';
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  role: 'admin' | 'operator' | 'analyst' | 'viewer';
  permissions: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    dashboard: {
      layout: string;
      widgets: string[];
    };
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  preferences?: Partial<User['preferences']>;
}

export interface InviteUserRequest {
  email: string;
  role: 'admin' | 'operator' | 'analyst' | 'viewer';
  permissions?: string[];
  companyName?: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface TwoFactorSetupResponse {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
  code: string;
  secret?: string; // For setup
}

export class AuthApiClient extends BaseApiClient {
  constructor(config: Omit<ApiConfig, 'baseURL'> & { baseURL?: string } = {}) {
    super({
      baseURL: config.baseURL || process.env.REACT_APP_AUTH_API_URL || 'http://localhost:8000/api/auth',
      ...config,
    });
  }

  // Authentication
  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/login', request);
    this.setAuthToken(response.token);
    return response;
  }

  async register(request: RegisterRequest): Promise<{
    success: boolean;
    message: string;
    userId?: string;
  }> {
    return this.post('/register', request);
  }

  async logout(): Promise<{ success: boolean }> {
    const response = await this.post<{ success: boolean }>('/logout');
    this.setAuthToken(null);
    return response;
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await this.post<RefreshTokenResponse>('/refresh', request);
    this.setAuthToken(response.token);
    return response;
  }

  // Password Management
  async forgotPassword(request: ForgotPasswordRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post('/forgot-password', request);
  }

  async resetPassword(request: ResetPasswordRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post('/reset-password', request);
  }

  async changePassword(request: ChangePasswordRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post('/change-password', request);
  }

  // User Profile
  async getProfile(): Promise<User> {
    return this.get<User>('/profile');
  }

  async updateProfile(request: UpdateProfileRequest): Promise<User> {
    return this.patch<User>('/profile', request);
  }

  async deleteAccount(): Promise<{ success: boolean }> {
    return this.delete('/profile');
  }

  // Email Verification
  async sendVerificationEmail(): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post('/send-verification');
  }

  async verifyEmail(request: VerifyEmailRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post('/verify-email', request);
  }

  // Two-Factor Authentication
  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    return this.post<TwoFactorSetupResponse>('/2fa/setup');
  }

  async verifyTwoFactor(request: TwoFactorVerifyRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post('/2fa/verify', request);
  }

  async disableTwoFactor(code: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post('/2fa/disable', { code });
  }

  async generateBackupCodes(): Promise<{
    backupCodes: string[];
  }> {
    return this.post('/2fa/backup-codes');
  }

  // User Management (Admin only)
  async getUsers(params: {
    limit?: number;
    offset?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  } = {}): Promise<{
    users: User[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/users?${queryParams.toString()}`);
  }

  async getUserById(id: string): Promise<User> {
    return this.get<User>(`/users/${id}`);
  }

  async inviteUser(request: InviteUserRequest): Promise<{
    success: boolean;
    message: string;
    inviteId?: string;
  }> {
    return this.post('/users/invite', request);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.patch<User>(`/users/${id}`, updates);
  }

  async deactivateUser(id: string): Promise<{ success: boolean }> {
    return this.patch(`/users/${id}/deactivate`);
  }

  async activateUser(id: string): Promise<{ success: boolean }> {
    return this.patch(`/users/${id}/activate`);
  }

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return this.delete(`/users/${id}`);
  }

  // Permissions & Roles
  async getRoles(): Promise<Array<{
    name: string;
    description: string;
    permissions: string[];
  }>> {
    return this.get('/roles');
  }

  async getPermissions(): Promise<Array<{
    name: string;
    description: string;
    category: string;
  }>> {
    return this.get('/permissions');
  }

  async updateUserPermissions(userId: string, permissions: string[]): Promise<{
    success: boolean;
  }> {
    return this.patch(`/users/${userId}/permissions`, { permissions });
  }

  // Session Management
  async getSessions(): Promise<Array<{
    id: string;
    deviceInfo: string;
    ipAddress: string;
    location?: string;
    lastActivity: string;
    isCurrent: boolean;
  }>> {
    return this.get('/sessions');
  }

  async revokeSession(sessionId: string): Promise<{ success: boolean }> {
    return this.delete(`/sessions/${sessionId}`);
  }

  async revokeAllSessions(): Promise<{ success: boolean }> {
    return this.delete('/sessions');
  }

  // Audit Logs
  async getAuditLogs(params: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    logs: Array<{
      id: string;
      userId: string;
      action: string;
      resource: string;
      details: Record<string, any>;
      ipAddress: string;
      userAgent: string;
      timestamp: string;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/audit-logs?${queryParams.toString()}`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem('current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('current_user');
    }
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions.includes(permission) || false;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}