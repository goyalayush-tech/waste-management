# Authentication System Documentation

## Overview

The authentication system has been implemented to provide a complete login and signup flow from the landing page to the dashboard. This document outlines the architecture and implementation details.

## Components Created

### 1. **Login Page** (`src/pages/Auth/LoginPage.tsx`)
- Email and password authentication form
- Remember me functionality
- Social login options (Google, LinkedIn)
- Forgot password link
- Sign up link
- Beautiful gradient background with animated blobs
- Form validation using Ant Design Form

### 2. **Signup Page** (`src/pages/Auth/SignupPage.tsx`)
- Complete registration form with:
  - Full Name
  - Email Address
  - Phone Number
  - Company Name
  - Role Selection
  - Password (with strength requirements)
  - Confirm Password
  - Terms & Conditions checkbox
- Social signup options
- Login link for existing users
- Same design theme as login page

### 3. **Authentication Context** (`src/hooks/useAuth.tsx`)
- Global authentication state management
- Methods:
  - `login(email, password)` - Authenticates user
  - `signup(userData)` - Creates new account
  - `logout()` - Signs out user
  - `getAuthToken()` - Returns current auth token
- Persists authentication state in localStorage
- Hook-based API with `useAuth()`

### 4. **Protected Route Component** (`src/components/Auth/ProtectedRoute.tsx`)
- Protects routes that require authentication
- Redirects unauthenticated users to login page
- Shows loading spinner while checking auth status
- Preserves redirect location for post-login navigation

## User Flow

```
Landing Page (/)
    ↓
    ├─→ [Sign In Button] → Login Page (/auth/login)
    │                           ↓
    │                    [Create Account Link] → Signup Page (/auth/signup)
    │                           ↓
    │                    [Submit Form] → Dashboard (/app/claimclean/dashboard)
    │
    └─→ [Create Account Button] → Signup Page (/auth/signup)
                                        ↓
                                 [Submit Form] → Dashboard (/app/claimclean/dashboard)
```

## Routes Configuration

The routing system has been updated in `src/routes/index.tsx` to include:

```typescript
// Public Routes
- / (Landing Page)
- /landing (Landing Page)
- /auth/login (Login Page)
- /auth/signup (Signup Page)

// Protected Routes
- /app/* (All app routes require authentication)
```

## Features

### Security
- Password validation with requirements:
  - Minimum 8 characters for signup
  - Must contain uppercase, lowercase, and numbers
  - Minimum 6 characters for login
- Token-based authentication
- LocalStorage for token persistence
- Email format validation

### User Experience
- Smooth animations and transitions
- Loading states during form submission
- Form validation with helpful error messages
- Social login placeholders (ready for integration)
- Remember me functionality
- Back to landing page button

### Responsive Design
- Mobile-first approach
- Fully responsive on all screen sizes
- Optimized layouts for tablets and phones
- Touch-friendly buttons and inputs

## Styling

Both pages use:
- **Color Scheme**: Green gradient (#1B5E20 → #2E7D32 → #43A047)
- **Typography**: Inter font family
- **Animations**: Floating blob background, slide animations
- **Components**: Ant Design for form inputs and buttons
- **CSS Modules**: Scoped styling to prevent conflicts

## Integration Steps

### 1. Update Authentication Backend API
Replace mock API calls in `useAuth.tsx` with actual endpoints:

```typescript
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { token, user } = await response.json();
  // Store token and user data
};
```

### 2. Set Up Social Authentication
Integrate OAuth providers:
- Google OAuth 2.0
- LinkedIn OAuth 2.0

### 3. Implement Password Reset
Add password reset functionality:
- Request password reset via email
- Reset token validation
- New password submission

### 4. Add Email Verification
Implement email verification:
- Verification email on signup
- Email confirmation page
- Resend verification option

## API Endpoints Required

```
POST /api/auth/login
- Request: { email, password }
- Response: { token, user: { id, email, name, role } }

POST /api/auth/signup
- Request: { email, password, fullName, phone, company, role }
- Response: { token, user: { id, email, name, role } }

POST /api/auth/logout
- Request: { token }
- Response: { success: boolean }

GET /api/auth/profile
- Request: Header { Authorization: Bearer token }
- Response: { user: { id, email, name, role, company } }

POST /api/auth/refresh-token
- Request: { token }
- Response: { newToken: string }
```

## Usage Examples

### Using Authentication in Components

```tsx
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={() => {
        logout();
        navigate('/');
      }}>
        Logout
      </button>
    </div>
  );
};
```

### Using Protected Routes

```tsx
import ProtectedRoute from '../components/Auth/ProtectedRoute';

<Route
  path="/app/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## State Management

Authentication state is managed through:
1. **React Context API** - Global state
2. **LocalStorage** - Persistence
3. **Custom Hook** - Easy access throughout app

## Current Implementation Status

✅ **Completed:**
- Login page UI and form
- Signup page UI and form
- Authentication context and hook
- Protected route component
- Landing page integration
- Routing configuration
- Form validation
- Mock authentication logic

🔄 **To Implement:**
- Backend API integration
- Real password hashing and validation
- Email verification
- Social OAuth integration
- Password reset functionality
- Token refresh mechanism
- Role-based access control (RBAC)
- Session management

## Testing

### Manual Testing Checklist

- [ ] Landing page displays correctly
- [ ] Sign In button navigates to login page
- [ ] Create Account button navigates to signup page
- [ ] Login form validates email and password
- [ ] Signup form validates all fields
- [ ] Form submission shows loading state
- [ ] Successful login redirects to dashboard
- [ ] Successful signup redirects to dashboard
- [ ] Back button returns to landing page
- [ ] Remember me checkbox works
- [ ] Social login buttons show messages
- [ ] Mobile responsiveness works
- [ ] All animations play smoothly

## Future Enhancements

1. **Two-Factor Authentication (2FA)**
2. **Biometric Authentication**
3. **Single Sign-On (SSO)**
4. **Audit Logging**
5. **Session Management**
6. **Device Management**
7. **Login History**
8. **Security Settings**
9. **OAuth Integration**
10. **API Key Management**

## Support

For questions or issues, please refer to:
- Backend API Documentation
- Ant Design Documentation: https://ant.design
- React Router Documentation: https://reactrouter.com
- React Context API: https://react.dev/reference/react/createContext
