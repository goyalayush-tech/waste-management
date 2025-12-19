// Auth Mock Client - provides realistic mock data for authentication API endpoints
import { 
  AuthApiClient,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  RefreshTokenRequest,
  RefreshTokenResponse
} from '../authClient';

export class AuthMockClient extends AuthApiClient {
  private users: User[] = [];
  private sessions: Map<string, { user: User; token: string; refreshToken: string; expiresAt: Date }> = new Map();
  private currentUser: User | null = null;

  constructor() {
    super({ baseURL: 'mock://auth' });
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock users
    this.users = [
      {
        id: 'user-1',
        email: 'admin@wastemanagement.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        permissions: ['read', 'write', 'admin', 'manage_users', 'manage_system'],
        profilePicture: 'https://via.placeholder.com/150?text=Admin',
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: '2024-08-24T08:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-08-24T08:00:00Z',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            browser: true,
            mobile: false,
          },
          dashboard: {
            defaultView: 'overview',
            autoRefresh: true,
            refreshInterval: 30,
          },
        },
      },
      {
        id: 'user-2',
        email: 'manager@wastemanagement.com',
        username: 'manager',
        firstName: 'John',
        lastName: 'Manager',
        role: 'manager',
        permissions: ['read', 'write', 'manage_teams'],
        profilePicture: 'https://via.placeholder.com/150?text=Manager',
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: '2024-08-23T16:30:00Z',
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-08-23T16:30:00Z',
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: true,
            browser: true,
            mobile: true,
          },
          dashboard: {
            defaultView: 'analytics',
            autoRefresh: true,
            refreshInterval: 60,
          },
        },
      },
      {
        id: 'user-3',
        email: 'operator@wastemanagement.com',
        username: 'operator',
        firstName: 'Jane',
        lastName: 'Operator',
        role: 'operator',
        permissions: ['read', 'write'],
        profilePicture: 'https://via.placeholder.com/150?text=Operator',
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: '2024-08-24T07:45:00Z',
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-08-24T07:45:00Z',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: false,
            browser: true,
            mobile: true,
          },
          dashboard: {
            defaultView: 'monitoring',
            autoRefresh: true,
            refreshInterval: 15,
          },
        },
      },
    ];
  }

  private generateToken(): string {
    return `mock_jwt_token_${Math.random().toString(36).substring(2)}_${Date.now()}`;
  }

  private generateRefreshToken(): string {
    return `mock_refresh_token_${Math.random().toString(36).substring(2)}_${Date.now()}`;
  }

  // Override API methods with mock implementations
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user by email or username
    const user = this.users.find(u => 
      u.email === credentials.email || u.username === credentials.email
    );

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    // In a real implementation, we'd verify the password hash
    // For mock, we'll accept any password except 'wrong'
    if (credentials.password === 'wrong') {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken();
    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create session
    this.sessions.set(token, {
      user,
      token,
      refreshToken,
      expiresAt,
    });

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    this.currentUser = user;

    return {
      token,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        ...user,
        // Don't expose sensitive information
      },
    };
  }

  async register(userData: RegisterRequest): Promise<{ message: string; userId: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if user already exists
    const existingUser = this.users.find(u => 
      u.email === userData.email || u.username === userData.username
    );

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'operator',
      permissions: ['read', 'write'],
      isActive: true,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          browser: true,
          mobile: false,
        },
        dashboard: {
          defaultView: 'overview',
          autoRefresh: true,
          refreshInterval: 30,
        },
      },
    };

    this.users.push(newUser);

    return {
      message: 'User registered successfully. Please verify your email.',
      userId: newUser.id,
    };
  }

  async logout(token: string): Promise<{ message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    this.sessions.delete(token);
    this.currentUser = null;

    return { message: 'Logged out successfully' };
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Find session by refresh token
    const session = Array.from(this.sessions.values()).find(s => s.refreshToken === request.refreshToken);

    if (!session) {
      throw new Error('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      this.sessions.delete(session.token);
      throw new Error('Refresh token expired');
    }

    // Generate new tokens
    const newToken = this.generateToken();
    const newRefreshToken = this.generateRefreshToken();
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Remove old session and create new one
    this.sessions.delete(session.token);
    this.sessions.set(newToken, {
      ...session,
      token: newToken,
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
    });

    return {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt.toISOString(),
    };
  }

  async getCurrentUser(token: string): Promise<User> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const session = this.sessions.get(token);

    if (!session) {
      throw new Error('Invalid token');
    }

    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      throw new Error('Token expired');
    }

    return session.user;
  }

  async updateProfile(token: string, updateData: Partial<User>): Promise<User> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const session = this.sessions.get(token);

    if (!session) {
      throw new Error('Invalid token');
    }

    // Find user and update
    const userIndex = this.users.findIndex(u => u.id === session.user.id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Validate email if being updated
    if (updateData.email && updateData.email !== session.user.email) {
      const emailExists = this.users.some(u => u.email === updateData.email && u.id !== session.user.id);
      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    // Update user
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    // Update session
    session.user = this.users[userIndex];
    this.sessions.set(token, session);

    return this.users[userIndex];
  }

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    const session = this.sessions.get(token);

    if (!session) {
      throw new Error('Invalid token');
    }

    // In mock, we'll accept any current password except 'wrong'
    if (currentPassword === 'wrong') {
      throw new Error('Current password is incorrect');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    return { message: 'Password changed successfully' };
  }

  async resetPassword(email: string): Promise<{ message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = this.users.find(u => u.email === email);

    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If the email exists, a reset link has been sent' };
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // In a real implementation, we'd decode the verification token
    // For mock, we'll just return success
    return { message: 'Email verified successfully' };
  }

  async getUsers(token: string, params: { limit?: number; offset?: number; role?: string } = {}): Promise<{
    users: User[];
    total: number;
    hasMore: boolean;
  }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const session = this.sessions.get(token);

    if (!session) {
      throw new Error('Invalid token');
    }

    // Check permissions
    if (!session.user.permissions.includes('admin') && !session.user.permissions.includes('manage_users')) {
      throw new Error('Insufficient permissions');
    }

    const { limit = 10, offset = 0, role } = params;
    let filteredUsers = this.users;

    if (role) {
      filteredUsers = this.users.filter(u => u.role === role);
    }

    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);

    return {
      users: filteredUsers.slice(startIndex, endIndex),
      total: filteredUsers.length,
      hasMore: endIndex < filteredUsers.length,
    };
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}