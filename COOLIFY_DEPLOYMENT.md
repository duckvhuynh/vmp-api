# 🚀 Coolify Deployment Guide for VMP API

## 📋 Overview

This guide covers deploying the VMP API to Coolify with MongoDB and Redis using the optimized Dockerfile.

---

## ✅ Prerequisites

- Coolify instance running (v4.0+)
- GitHub repository access
- Domain name (optional, but recommended)

---

## 🔧 Step 1: Prepare Your Repository

### 1.1 Ensure Required Files Exist

Your repo should have:
```
vmp-api/
├── Dockerfile              ✓ (Optimized for Coolify)
├── .dockerignore           ✓
├── package.json            ✓
├── src/                    ✓
└── .env.example            → Create this!
```

### 1.2 Create `.env.example`

Create a template file for Coolify to copy from:

```bash
# MongoDB Configuration
MONGO_URI=mongodb://mongo:27017/vmp_production
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=changeme

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=changeme

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# API Configuration
PORT=3000
NODE_ENV=production
API_PREFIX=api/v1

# CORS Configuration
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Swagger Configuration
SWAGGER_ENABLED=true
SWAGGER_PATH=docs

# Feature Flags
RATE_LIMIT_ENABLED=true
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info

# Optional: Payment Integration
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Optional: SMS/Notification
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## 🐳 Step 2: Deploy to Coolify

### 2.1 Create New Project in Coolify

1. **Login to Coolify Dashboard**
2. **Click "New Resource" → "New Project"**
3. **Name:** `vmp-api-production`

### 2.2 Add MongoDB Service

1. **Click "+ Add Resource" → "Database" → "MongoDB"**
2. **Configuration:**
   ```
   Name: vmp-mongo
   Version: 7.0
   Port: 27017 (internal)
   Root Username: admin
   Root Password: [Generate Strong Password]
   Database Name: vmp_production
   ```
3. **Volume Mounts:**
   - `/data/db` (automatic)
4. **Click "Deploy"**
5. **Copy the Internal URL:** `mongodb://admin:PASSWORD@vmp-mongo:27017`

### 2.3 Add Redis Service

1. **Click "+ Add Resource" → "Database" → "Redis"**
2. **Configuration:**
   ```
   Name: vmp-redis
   Version: 7-alpine
   Port: 6379 (internal)
   Password: [Generate Strong Password]
   ```
3. **Click "Deploy"**
4. **Copy the Internal URL:** `redis://:PASSWORD@vmp-redis:6379`

### 2.4 Deploy API Application

1. **Click "+ Add Resource" → "Application"**
2. **Source:** GitHub
3. **Repository:** `https://github.com/duckvhuynh/vmp-api`
4. **Branch:** `main`
5. **Build Pack:** Dockerfile

#### Build Configuration

```yaml
Builder: Dockerfile
Dockerfile Location: ./Dockerfile
Docker Build Arguments: (Leave empty)
```

#### Environment Variables

Add these in Coolify's Environment Variables section:

```env
# MongoDB (Use the internal URL from Step 2.2)
MONGO_URI=mongodb://admin:YOUR_MONGO_PASSWORD@vmp-mongo:27017/vmp_production

# Redis (Use the internal URL from Step 2.3)
REDIS_HOST=vmp-redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# JWT Secret (Generate strong secret!)
JWT_SECRET=super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# API Config
PORT=3000
NODE_ENV=production
API_PREFIX=api/v1

# CORS (Add your domain)
CORS_ORIGINS=https://api.yourdomain.com

# Swagger
SWAGGER_ENABLED=true
SWAGGER_PATH=docs

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

#### Port Mapping

```
Container Port: 3000
Public Port: 80 (or use Coolify's automatic proxy)
```

#### Health Check (Coolify Auto-detects from Dockerfile)

```yaml
Path: /health
Interval: 30s
Timeout: 10s
Retries: 3
```

#### Resources (Optional but Recommended)

```yaml
CPU Limit: 1000m (1 CPU core)
Memory Limit: 512Mi
CPU Request: 100m
Memory Request: 128Mi
```

---

## 🌐 Step 3: Configure Domain & SSL

### 3.1 Add Domain in Coolify

1. **Go to Application Settings**
2. **Domains Section**
3. **Add Domain:** `api.visitmauritiusparadise.com`
4. **Enable HTTPS:** Toggle "Generate SSL Certificate" (Coolify uses Let's Encrypt automatically)

### 3.2 Update DNS Records

Point your domain to Coolify server:

```
Type: A
Name: api
Value: YOUR_COOLIFY_SERVER_IP
TTL: 3600
```

### 3.3 Wait for SSL

Coolify will automatically:
- Generate Let's Encrypt certificate
- Configure Nginx reverse proxy
- Enable HTTPS redirect

---

## 🧪 Step 4: Test Deployment

### 4.1 Health Check

```bash
curl https://api.visitmauritiusparadise.com/health
```

Expected response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### 4.2 API Documentation

Visit: `https://api.visitmauritiusparadise.com/docs`

### 4.3 Test API Endpoint

```bash
curl https://api.visitmauritiusparadise.com/api/v1/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickupLocation": {
      "placeId": "test-place-1",
      "name": "Airport",
      "coordinates": { "lat": -20.430315, "lng": 57.683208 }
    },
    "dropoffLocation": {
      "placeId": "test-place-2",
      "name": "Hotel",
      "coordinates": { "lat": -20.160, "lng": 57.500 }
    },
    "pickupTime": "2025-12-01T10:00:00Z",
    "passengers": 2
  }'
```

---

## 📊 Step 5: Monitor & Logs

### 5.1 View Logs in Coolify

1. **Go to Application**
2. **Click "Logs" tab**
3. **Filter by:**
   - All logs
   - Error logs only
   - Build logs

### 5.2 Application Metrics

Coolify automatically provides:
- CPU Usage
- Memory Usage
- Network I/O
- Disk Usage

### 5.3 Database Monitoring

**MongoDB:**
- Click on `vmp-mongo` service
- View resource usage
- Access logs

**Redis:**
- Click on `vmp-redis` service
- Monitor memory usage
- Check connection count

---

## 🔄 Step 6: Auto-Deployment (CI/CD)

### 6.1 Enable GitHub Webhook

Coolify automatically creates a webhook in your GitHub repo to trigger deployments on push.

**To verify:**
1. Go to GitHub repo → Settings → Webhooks
2. You should see a webhook to your Coolify instance

### 6.2 Deployment Trigger

Every time you push to `main` branch:
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

Coolify will automatically:
1. Pull latest code
2. Build Docker image
3. Run tests (if configured)
4. Deploy new container
5. Health check
6. Switch traffic (zero downtime)

---

## 🛡️ Step 7: Security Best Practices

### 7.1 Environment Variables

✅ **DO:**
- Use Coolify's built-in secrets management
- Generate strong passwords (32+ characters)
- Rotate secrets regularly
- Use different secrets for dev/staging/production

❌ **DON'T:**
- Commit `.env` files to Git
- Use default passwords
- Share secrets in plain text

### 7.2 Network Security

Coolify automatically:
- Isolates services in internal network
- Only exposes necessary ports
- Uses HTTPS by default
- Implements rate limiting (if configured in app)

### 7.3 Database Backup

**Enable Automatic Backups:**

1. **Go to MongoDB service in Coolify**
2. **Click "Backups" tab**
3. **Configure:**
   ```
   Frequency: Daily at 2:00 AM
   Retention: 7 days
   Storage: Coolify's S3 (or your S3 bucket)
   ```

---

## 🔧 Troubleshooting

### Issue: Build Fails

**Error:** `npm ci` fails or build times out

**Solution:**
```dockerfile
# In Dockerfile, ensure build dependencies are installed
RUN apk add --no-cache python3 make g++
```

### Issue: Cannot Connect to MongoDB

**Error:** `MongooseServerSelectionError`

**Solution:**
1. Verify `MONGO_URI` uses internal service name: `vmp-mongo` (not `localhost`)
2. Check MongoDB service is running in Coolify
3. Verify credentials match

### Issue: Redis Connection Error

**Error:** `ECONNREFUSED redis:6379`

**Solution:**
1. Check Redis service status in Coolify
2. Verify `REDIS_HOST=vmp-redis` (internal service name)
3. Ensure Redis password is correct

### Issue: Health Check Failing

**Error:** Coolify shows "Unhealthy"

**Solution:**
```bash
# Check logs in Coolify
# Ensure /health endpoint responds within 10s
# Verify PORT=3000 in env vars
```

---

## 📚 Additional Resources

### Coolify Documentation
- [Official Docs](https://coolify.io/docs)
- [Docker Deployment](https://coolify.io/docs/applications/docker)
- [Environment Variables](https://coolify.io/docs/applications/environment-variables)

### VMP API Documentation
- API Docs: `https://api.yourdomain.com/docs`
- Health Check: `https://api.yourdomain.com/health`
- OpenAPI JSON: `https://api.yourdomain.com/docs-json`

---

## 🎯 Quick Commands

### Generate Strong Secrets

```bash
# JWT Secret (32 bytes)
openssl rand -base64 32

# MongoDB Password
openssl rand -base64 24

# Redis Password
openssl rand -base64 24
```

### Test Local Build

```bash
# Build Dockerfile locally
docker build -t vmp-api:test .

# Run with env vars
docker run -p 3000:3000 \
  -e MONGO_URI=mongodb://localhost:27017/vmp \
  -e REDIS_HOST=localhost \
  -e JWT_SECRET=test-secret \
  vmp-api:test
```

### View Coolify Logs (SSH)

```bash
ssh root@your-coolify-server

# View running containers
docker ps | grep vmp-api

# View logs
docker logs -f vmp-api-production

# Enter container
docker exec -it vmp-api-production sh
```

---

## ✅ Deployment Checklist

- [ ] Dockerfile optimized and tested
- [ ] `.dockerignore` configured
- [ ] MongoDB service created in Coolify
- [ ] Redis service created in Coolify
- [ ] Environment variables set (all secrets generated)
- [ ] Domain configured and DNS updated
- [ ] SSL certificate generated (automatic)
- [ ] Health check passing
- [ ] API documentation accessible
- [ ] Test API endpoints working
- [ ] GitHub webhook configured (auto-deploy)
- [ ] MongoDB backups enabled
- [ ] Monitoring dashboard reviewed
- [ ] CORS origins updated for production domain

---

## 🚀 You're Ready!

Your VMP API is now deployed on Coolify with:
- ✅ Zero-downtime deployments
- ✅ Automatic SSL/HTTPS
- ✅ Auto-scaling (if configured)
- ✅ Built-in monitoring
- ✅ Automatic backups
- ✅ CI/CD via GitHub

**API URL:** `https://api.visitmauritiusparadise.com`  
**Documentation:** `https://api.visitmauritiusparadise.com/docs`

---

**Need Help?** 
- Coolify Discord: https://coolify.io/discord
- GitHub Issues: https://github.com/duckvhuynh/vmp-api/issues

