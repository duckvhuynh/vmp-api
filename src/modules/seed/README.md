# Admin User Seeding

This module provides functionality to seed an admin user account in the database. This is useful for initial setup or when you need to create an admin account programmatically.

## Features

- ✅ Seed admin user via CLI script
- ✅ Automatic seeding on application startup (optional)
- ✅ Prevents duplicate admin creation
- ✅ Supports environment variable configuration

## Usage

### Method 1: CLI Script (Recommended)

Run the seed script manually:

```bash
npm run seed:admin
```

The script will prompt you for:
- Admin email
- Admin password (minimum 8 characters)
- Admin name (optional, defaults to "Admin User")
- Admin phone (optional)

**Example:**
```bash
npm run seed:admin
# Enter admin email: admin@example.com
# Enter admin password: SecurePass123
# Enter admin name (default: Admin User): Admin User
# Enter admin phone (optional, press Enter to skip): +23012345678
```

### Method 2: Environment Variables

You can also provide the admin details via environment variables:

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=SecurePass123 \
ADMIN_NAME="Admin User" \
ADMIN_PHONE="+23012345678" \
npm run seed:admin
```

### Method 3: Automatic Seeding on Startup

To automatically seed an admin user when the application starts, set the following environment variables:

```env
SEED_ADMIN=true
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePass123
ADMIN_NAME=Admin User
ADMIN_PHONE=+23012345678
```

**Note:** The admin will only be created if it doesn't already exist. If an admin with the same email already exists, seeding will be skipped.

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SEED_ADMIN` | No | Enable automatic seeding on startup (`true`/`false`) | `false` |
| `ADMIN_EMAIL` | Yes* | Admin user email address | - |
| `ADMIN_PASSWORD` | Yes* | Admin user password (min 8 characters) | - |
| `ADMIN_NAME` | No | Admin user name | `Admin User` |
| `ADMIN_PHONE` | No | Admin user phone number | - |

*Required when `SEED_ADMIN=true` or when using the CLI script (will prompt if not provided)

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never commit admin credentials to version control**
   - Add `.env` to `.gitignore`
   - Use environment variables or secrets management in production

2. **Use strong passwords**
   - Minimum 8 characters
   - Include uppercase, lowercase, numbers, and special characters

3. **Change default credentials**
   - Always change the default admin password after first login
   - Use unique credentials for each environment (dev, staging, production)

4. **Production Deployment**
   - Use environment variables or secrets management (e.g., AWS Secrets Manager, HashiCorp Vault)
   - Never hardcode credentials in code

## Examples

### Development Setup

Create a `.env` file:

```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vmp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-minimum-16-characters

# Admin seeding (optional)
SEED_ADMIN=true
ADMIN_EMAIL=admin@localhost
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=Development Admin
```

### Docker Compose

```yaml
services:
  api:
    environment:
      - SEED_ADMIN=true
      - ADMIN_EMAIL=admin@example.com
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}  # Use secrets
      - ADMIN_NAME=Admin User
```

### Production Deployment

Use your platform's secrets management:

**Heroku:**
```bash
heroku config:set SEED_ADMIN=true
heroku config:set ADMIN_EMAIL=admin@example.com
heroku config:set ADMIN_PASSWORD=$(openssl rand -base64 32)
```

**Kubernetes:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: admin-seed
type: Opaque
stringData:
  ADMIN_EMAIL: admin@example.com
  ADMIN_PASSWORD: <strong-password>
```

## Troubleshooting

### Admin Already Exists

If you try to seed an admin that already exists, the operation will be skipped:

```
Admin user with email admin@example.com already exists. Skipping seed.
```

### Invalid Email Format

Make sure the email address is valid:

```
❌ Invalid email address
```

### Password Too Short

Password must be at least 8 characters:

```
❌ Password must be at least 8 characters long
```

### Database Connection Issues

Ensure MongoDB is running and accessible:

```bash
# Check MongoDB connection
mongosh mongodb://localhost:27017/vmp
```

## API Integration

You can also use the `SeedService` programmatically in your code:

```typescript
import { SeedService } from './modules/seed/seed.service';

// In your service or controller
const seedService = app.get(SeedService);

// Seed admin
await seedService.seedAdmin({
  email: 'admin@example.com',
  password: 'SecurePass123',
  name: 'Admin User',
  phone: '+23012345678',
});

// Check if admin exists
const hasAdmin = await seedService.hasAdmin();
```

## Related Files

- `src/modules/seed/seed.service.ts` - Seed service implementation
- `src/modules/seed/seed.module.ts` - Seed module definition
- `src/scripts/seed-admin.ts` - CLI script for seeding
- `src/config/configuration.ts` - Configuration with admin seed settings

