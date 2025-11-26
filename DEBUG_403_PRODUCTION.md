# Debugging 403 Forbidden in Production

## Quick Fix Steps

### Step 1: Verify Admin Account Exists

Check if your admin account was seeded correctly:

```bash
# Connect to MongoDB and check
mongosh "mongodb://admin:0814940664asdUZ@vmp-mongo:27017/vmp_production?authSource=admin"

# In MongoDB shell:
use vmp_production
db.users.find({ email: "duchuynhvan124@gmail.com" })
```

You should see:
```json
{
  "_id": ObjectId("..."),
  "email": "duchuynhvan124@gmail.com",
  "roles": ["admin"],  // ← Must include "admin"
  ...
}
```

### Step 2: Log In Again

**IMPORTANT:** If your account was assigned admin role AFTER you logged in, your JWT token still has old roles. You MUST log in again.

```bash
POST https://api.visitmauritiusparadise.com/api/v1/auth/login
Content-Type: application/json

{
  "email": "duchuynhvan124@gmail.com",
  "password": "0814940664asdUZ@"
}
```

Save the `accessToken` from the response.

### Step 3: Verify Token Has Admin Role

Decode your token at https://jwt.io and check the payload:

```json
{
  "sub": "user-id-here",
  "roles": ["admin"],  // ← Must include "admin"
  "iat": ...,
  "exp": ...
}
```

If `roles` is `["passenger"]` or empty, log in again.

### Step 4: Use Debug Endpoint

Use the new debug endpoint to check what roles your token has:

```bash
GET https://api.visitmauritiusparadise.com/api/v1/admin/debug/user
Authorization: Bearer YOUR_ACCESS_TOKEN
```

This will show:
- Your user ID
- Roles in your token
- Whether admin role is present

### Step 5: Test Admin Endpoint

```bash
GET https://api.visitmauritiusparadise.com/api/v1/price-regions
Authorization: Bearer YOUR_NEW_ACCESS_TOKEN
```

## Common Issues Fixed

### Issue 1: JWT Configuration Not Using ConfigService

**Fixed:** JWT strategy and module now use ConfigService to read `JWT_SECRET` from environment variables properly.

### Issue 2: RolesGuard Error Messages

**Fixed:** RolesGuard now provides better error messages in logs when roles don't match.

### Issue 3: No Way to Debug Token Roles

**Fixed:** Added `/admin/debug/user` endpoint to check current user roles from token.

## Environment Variables Check

Your `.env` has:
- ✅ `SEED_ADMIN=true` - Admin seeding enabled
- ✅ `ADMIN_EMAIL=duchuynhvan124@gmail.com` - Admin email set
- ✅ `ADMIN_PASSWORD=0814940664asdUZ@` - Admin password set
- ✅ `JWT_SECRET=0814940664asdUZ@` - JWT secret set

## Verification Checklist

- [ ] Admin account exists in database with `roles: ["admin"]`
- [ ] Logged in AFTER admin role was assigned
- [ ] JWT token contains `roles: ["admin"]` (check at jwt.io)
- [ ] Using the NEW accessToken from login response
- [ ] Token is not expired (tokens expire after 15 minutes)
- [ ] Authorization header format: `Bearer <token>` (with space)

## Testing Script

```bash
#!/bin/bash

# 1. Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST https://api.visitmauritiusparadise.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duchuynhvan124@gmail.com",
    "password": "0814940664asdUZ@"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract token (requires jq)
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
echo "Token: ${TOKEN:0:50}..."

# 2. Debug user
echo -e "\nChecking user roles..."
curl -s -X GET https://api.visitmauritiusparadise.com/api/v1/admin/debug/user \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Test admin endpoint
echo -e "\nTesting admin endpoint..."
curl -s -X GET https://api.visitmauritiusparadise.com/api/v1/price-regions \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Server Logs

Check your server logs for RolesGuard warnings. You should see messages like:

```
[RolesGuard] User roles [admin] do not include required roles [admin, dispatcher]
```

Or:

```
[RolesGuard] User has no roles. Required: admin
```

These logs will help identify the exact issue.

## Still Not Working?

1. **Check server logs** - Look for RolesGuard warnings
2. **Verify database** - Ensure user has `roles: ["admin"]` array
3. **Check JWT_SECRET** - Must match between token creation and validation
4. **Restart server** - After code changes, restart to load new configuration
5. **Clear browser cache** - If using browser, clear cached tokens

## Next Steps After Fix

Once working:
1. Change admin password to something more secure
2. Set up proper secrets management (don't hardcode passwords)
3. Consider using refresh tokens for longer sessions
4. Monitor logs for authentication issues

