# Quick Guide: Seeding Admin Account

## Quick Start

### Option 1: Interactive CLI Script (Easiest)

```bash
npm run seed:admin
```

Follow the prompts to enter:
- Admin email
- Admin password (min 8 characters)
- Admin name (optional)
- Admin phone (optional)

### Option 2: Environment Variables

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=SecurePass123 \
npm run seed:admin
```

### Option 3: Automatic Seeding on Startup

Add to your `.env` file:

```env
SEED_ADMIN=true
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePass123
ADMIN_NAME=Admin User
ADMIN_PHONE=+23012345678
```

Then start the application normally:

```bash
npm run dev
```

The admin will be created automatically on startup (if it doesn't already exist).

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SEED_ADMIN` | Enable auto-seeding on startup (`true`/`false`) | No |
| `ADMIN_EMAIL` | Admin email address | Yes* |
| `ADMIN_PASSWORD` | Admin password (min 8 chars) | Yes* |
| `ADMIN_NAME` | Admin name | No |
| `ADMIN_PHONE` | Admin phone | No |

*Required when `SEED_ADMIN=true` or will be prompted in CLI

## Security Notes

⚠️ **Important:**
- Never commit credentials to git
- Use strong passwords (8+ characters)
- Change default passwords after first login
- Use environment variables or secrets management in production

## Example Usage

### Development

```bash
# Interactive mode
npm run seed:admin

# Or with env vars
ADMIN_EMAIL=admin@localhost ADMIN_PASSWORD=Admin123! npm run seed:admin
```

### Production

```bash
# Set environment variables securely
export ADMIN_EMAIL=admin@example.com
export ADMIN_PASSWORD=$(openssl rand -base64 32)
export SEED_ADMIN=true

# Start application
npm run start:prod
```

## Troubleshooting

**Admin already exists?**
- The seed will skip if admin with same email exists (safe to run multiple times)

**Password too short?**
- Use at least 8 characters

**Database connection issues?**
- Ensure MongoDB is running and accessible
- Check `MONGODB_URI` environment variable

For more details, see [src/modules/seed/README.md](./src/modules/seed/README.md)

