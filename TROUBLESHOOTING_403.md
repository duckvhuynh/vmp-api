# Troubleshooting 403 Forbidden Errors

## Problem

You're getting `403 Forbidden` errors when accessing endpoints like:
- `/api/v1/price-regions`
- `/api/v1/surcharges`
- `/api/v1/vehicles`
- `/api/v1/base-prices`
- `/api/v1/fixed-prices`

## Root Causes

### 1. Missing Authentication Token

**Symptoms:**
- 403 Forbidden error
- No `Authorization` header in request

**Solution:**
You must include a JWT token in the `Authorization` header:

```bash
# Example with curl
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://api.visitmauritiusparadise.com/api/v1/price-regions
```

### 2. Invalid or Expired Token

**Symptoms:**
- 401 Unauthorized (if token is invalid)
- 403 Forbidden (if token is valid but user lacks roles)

**Solution:**
1. Login to get a new token:
```bash
curl -X POST https://api.visitmauritiusparadise.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

2. Use the `accessToken` from the response in your requests.

### 3. User Doesn't Have Required Roles

**Symptoms:**
- 403 Forbidden with message: "Access denied. Required roles: admin, dispatcher"

**Solution:**
These endpoints require `admin` or `dispatcher` roles. Your user account needs to have one of these roles assigned.

**Check your user roles:**
```bash
# Get your user profile (requires authentication)
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://api.visitmauritiusparadise.com/api/v1/users/me
```

**If you need admin access:**
1. Use the seed script to create an admin account:
```bash
npm run seed:admin
```

2. Or have an existing admin update your roles via:
```bash
# Admin only endpoint
PATCH /api/v1/users/:id
{
  "roles": ["admin"]
}
```

## Required Roles by Endpoint

| Endpoint | Required Roles |
|----------|----------------|
| `GET /price-regions` | `admin`, `dispatcher` |
| `GET /surcharges` | `admin`, `dispatcher` |
| `GET /vehicles` | `admin`, `dispatcher` |
| `GET /base-prices` | `admin`, `dispatcher` |
| `GET /fixed-prices` | `admin`, `dispatcher` |
| `GET /admin/dashboard` | `admin` |
| `GET /users` | `admin` |

## Step-by-Step Fix

### Step 1: Create Admin Account

```bash
# Run the seed script
npm run seed:admin

# Or use environment variables
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=SecurePass123 \
npm run seed:admin
```

### Step 2: Login as Admin

```bash
curl -X POST https://api.visitmauritiusparadise.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 3: Use the Token

```bash
# Copy the accessToken from Step 2
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Now make authenticated requests
curl -H "Authorization: Bearer $TOKEN" \
  https://api.visitmauritiusparadise.com/api/v1/price-regions
```

## Testing Authentication

### Test 1: Check if you're authenticated

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.visitmauritiusparadise.com/api/v1/users/me
```

**Expected:** Your user profile with roles array

### Test 2: Check your roles

Look at the `roles` field in the response:
```json
{
  "_id": "...",
  "name": "...",
  "email": "...",
  "roles": ["admin"],  // ← Check this
  ...
}
```

### Test 3: Try accessing protected endpoint

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.visitmauritiusparadise.com/api/v1/price-regions
```

**If you get 403:**
- Your token is valid (otherwise you'd get 401)
- But your user doesn't have the required roles

## Common Mistakes

### ❌ Wrong: Missing Authorization Header
```bash
curl https://api.visitmauritiusparadise.com/api/v1/price-regions
```

### ✅ Correct: With Authorization Header
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.visitmauritiusparadise.com/api/v1/price-regions
```

### ❌ Wrong: Wrong Header Format
```bash
curl -H "Authorization: YOUR_TOKEN"  # Missing "Bearer "
```

### ✅ Correct: Proper Bearer Token Format
```bash
curl -H "Authorization: Bearer YOUR_TOKEN"
```

### ❌ Wrong: Using Refresh Token Instead of Access Token
```bash
# Don't use refreshToken for API calls
curl -H "Authorization: Bearer REFRESH_TOKEN" ...
```

### ✅ Correct: Use Access Token
```bash
# Use accessToken from login response
curl -H "Authorization: Bearer ACCESS_TOKEN" ...
```

## Browser/JavaScript Example

```javascript
// Login first
const loginResponse = await fetch('https://api.visitmauritiusparadise.com/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'SecurePass123'
  })
});

const { accessToken } = await loginResponse.json();

// Use token for authenticated requests
const response = await fetch('https://api.visitmauritiusparadise.com/api/v1/price-regions', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const data = await response.json();
```

## Still Having Issues?

1. **Check token expiration:** Access tokens expire after 15 minutes. Use `/auth/refresh` to get a new token.

2. **Verify user roles:** Make sure your user has `admin` or `dispatcher` role assigned.

3. **Check server logs:** Look for authentication/authorization errors in server logs.

4. **Test with Swagger UI:** Visit `https://api.visitmauritiusparadise.com/docs` and use the "Authorize" button to test endpoints interactively.

## Updated Error Messages

After the fix, you'll get more helpful error messages:

- **No token:** `"Authentication required"`
- **No roles:** `"User has no assigned roles"`
- **Wrong roles:** `"Access denied. Required roles: admin, dispatcher. User roles: passenger"`

These messages will help you identify the exact issue.

