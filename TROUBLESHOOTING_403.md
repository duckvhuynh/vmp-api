# Troubleshooting 403 Forbidden Errors

## Common Cause: JWT Token Doesn't Include Admin Role

If you're getting a `403 Forbidden` error even though you logged in as admin, the most likely cause is that **your JWT token was issued before you were assigned the admin role**.

### Why This Happens

1. You logged in with a regular user account (e.g., `passenger` role)
2. Later, your account was assigned the `admin` role in the database
3. Your JWT token still contains the old roles (`['passenger']`)
4. The API checks your token's roles, not your database roles
5. Since your token doesn't have `admin`, you get 403 Forbidden

### Solution: Log In Again

**You need to log in again after being assigned the admin role** to get a new JWT token with the updated roles.

```bash
# 1. Log in again with your admin credentials
POST /api/v1/auth/login
{
  "email": "admin@example.com",
  "password": "your-password"
}

# 2. Use the new accessToken in subsequent requests
Authorization: Bearer <new-access-token>
```

### Verify Your Roles

#### Option 1: Check Your Current User Profile

```bash
GET /api/v1/users/me
Authorization: Bearer <your-token>
```

This will show your current roles from the database.

#### Option 2: Decode Your JWT Token

You can decode your JWT token to see what roles it contains:

1. Go to https://jwt.io
2. Paste your access token
3. Check the `roles` field in the payload

If it shows `["passenger"]` instead of `["admin"]`, you need to log in again.

### Debugging Steps

1. **Check if you're actually an admin in the database:**
   ```bash
   # Login and check your profile
   GET /api/v1/users/me
   ```
   Look for `"roles": ["admin"]` in the response.

2. **Check what roles are in your JWT token:**
   - Decode your token at jwt.io
   - Look at the `roles` field in the payload
   - If it doesn't include `"admin"`, log in again

3. **Verify the endpoint requires admin:**
   - Check the controller - it should have `@Roles('admin', 'dispatcher')`
   - The endpoint `/api/v1/price-regions` requires `admin` or `dispatcher` role

### Common Scenarios

#### Scenario 1: Account Created Before Admin Role Assignment

```bash
# Step 1: Account created (default: passenger role)
POST /api/v1/auth/register
{ "email": "user@example.com", "password": "pass", ... }
# Token has: ["passenger"]

# Step 2: Admin assigns admin role via API or database
# Database now has: roles: ["admin"]
# But token still has: ["passenger"]

# Step 3: Try to access admin endpoint
GET /api/v1/price-regions
# ❌ 403 Forbidden - token doesn't have admin role

# Step 4: Solution - Log in again
POST /api/v1/auth/login
{ "email": "user@example.com", "password": "pass" }
# New token has: ["admin"]

# Step 5: Now it works
GET /api/v1/price-regions
# ✅ 200 OK
```

#### Scenario 2: Using Seed Script

If you used the seed script to create an admin account:

```bash
# 1. Seed admin account
npm run seed:admin

# 2. Log in with the seeded admin credentials
POST /api/v1/auth/login
{
  "email": "admin@example.com",
  "password": "your-seeded-password"
}

# 3. Use the token from login response
Authorization: Bearer <access-token-from-login>
```

### Quick Fix Script

If you want to quickly test if your token has the right roles:

```bash
# Decode your token and check roles
# Replace YOUR_TOKEN with your actual token
echo "YOUR_TOKEN" | cut -d. -f2 | base64 -d | jq .roles
```

### Still Having Issues?

1. **Check server logs** - The improved RolesGuard now logs warnings when roles don't match
2. **Verify database** - Make sure your user document has `roles: ["admin"]`
3. **Check token expiration** - Tokens expire after 15 minutes, you may need to refresh
4. **Verify endpoint** - Make sure the endpoint actually requires admin role

### Testing Your Setup

```bash
# 1. Create/seed admin account
npm run seed:admin

# 2. Log in
curl -X POST https://api.visitmauritiusparadise.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# 3. Save the accessToken from response

# 4. Test admin endpoint
curl -X GET https://api.visitmauritiusparadise.com/api/v1/price-regions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Prevention

To avoid this issue in the future:

1. **Assign roles before first login** - If possible, assign admin role when creating the account
2. **Use refresh token carefully** - Refresh token also uses old roles, so log in again after role changes
3. **Monitor token expiration** - Tokens expire after 15 minutes, refresh or log in again

