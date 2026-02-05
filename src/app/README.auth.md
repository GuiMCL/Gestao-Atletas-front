# Authentication Pages

This directory contains the authentication pages for the Volleyball Management System.

## Pages

### Login Page (`/login`)

The login page allows users to authenticate with their username and password.

**Features:**
- Form validation using react-hook-form
- Username and password fields with validation
- Error handling and display
- Loading state during authentication
- Automatic redirection based on user role (ATHLETE, COACH, ADMIN)
- Link to password recovery page

**Validation Rules:**
- Username: Required, minimum 3 characters
- Password: Required, minimum 6 characters

### Forgot Password Page (`/forgot-password`)

The forgot password page allows users to request a password reset link.

**Features:**
- Email input with validation
- Success message after submission
- Error handling
- Link back to login page

**Validation Rules:**
- Email: Required, valid email format

### Reset Password Page (`/reset-password`)

The reset password page allows users to set a new password using a reset token.

**Features:**
- Token validation from URL query parameter
- New password and confirmation fields
- Password strength requirements
- Success message after reset
- Error handling for invalid or expired tokens

**Validation Rules:**
- New Password: Required, minimum 8 characters, must contain uppercase, lowercase, and number
- Confirm Password: Must match new password

## Authentication Flow

1. **Login:**
   - User enters credentials on `/login`
   - System validates credentials via API
   - On success, JWT tokens are stored in localStorage
   - User is redirected to role-specific dashboard

2. **Password Recovery:**
   - User enters email on `/forgot-password`
   - System sends reset link to email
   - User clicks link in email (contains token)
   - User is redirected to `/reset-password?token=...`
   - User sets new password
   - User is redirected to `/login`

## Client-Side JWT Storage

Authentication tokens are stored in localStorage using the following utilities:

**Location:** `src/lib/auth.ts`

**Functions:**
- `setAuthTokens(tokens)` - Store access and refresh tokens
- `getAccessToken()` - Retrieve access token
- `getRefreshToken()` - Retrieve refresh token
- `setUser(user)` - Store user data
- `getUser()` - Retrieve user data
- `clearAuth()` - Clear all authentication data
- `isAuthenticated()` - Check if user is authenticated
- `decodeToken(token)` - Decode JWT token (client-side only)
- `isTokenExpired(token)` - Check if token is expired

**Storage Keys:**
- `volleyball_access_token` - Access token
- `volleyball_refresh_token` - Refresh token
- `volleyball_user` - User data (JSON)

## API Integration

Authentication API calls are handled by the API client:

**Location:** `src/lib/api/auth.api.ts`

**Endpoints:**
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/refresh` - Refresh access token

## Custom Hooks

### useAuth Hook

**Location:** `src/hooks/useAuth.ts`

A custom hook for managing authentication state across the application.

**Returns:**
- `user` - Current user data or null
- `isLoading` - Loading state
- `isAuthenticated` - Authentication status
- `logout()` - Function to logout user

**Usage:**
```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Security Considerations

1. **Token Storage:** Tokens are stored in localStorage for simplicity. For production, consider using httpOnly cookies for enhanced security.

2. **Token Expiration:** The client checks token expiration before making requests. Expired tokens trigger automatic logout.

3. **HTTPS Only:** In production, ensure all authentication requests are made over HTTPS.

4. **Password Requirements:** Passwords must meet minimum security requirements (8+ characters, mixed case, numbers).

5. **Token Refresh:** Implement automatic token refresh using the refresh token to maintain user sessions.

## Testing

Authentication utilities are tested in `src/lib/__tests__/auth.test.ts`.

Run tests with:
```bash
npm run test
```

## Environment Variables

Set the API base URL in your environment:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 1.1:** Valid authentication generates JWT tokens
- **Requirement 1.2:** Invalid credentials are rejected with error messages
- **Requirement 1.3:** Password recovery flow is implemented
- **Client-side JWT storage:** Tokens are securely stored in localStorage
- **Form validation:** All forms include comprehensive validation
- **Error handling:** User-friendly error messages are displayed
- **Loading states:** Visual feedback during async operations
