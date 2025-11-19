# 🚀 VMP API - Deployment Guide

## 📖 Overview

This repository contains a production-ready NestJS API for airport taxi booking. You can deploy it in **5 minutes with Coolify** or **30 minutes with manual VPS setup**.

---

## ⚡ Quick Start: Coolify Deployment (Recommended)

### Why Coolify?
- ✅ **5-minute deployment** (vs 30 min manual)
- ✅ **Zero-downtime updates** via Git push
- ✅ **Automatic SSL/HTTPS** with Let's Encrypt
- ✅ **Built-in monitoring** and logs
- ✅ **One-click scaling**
- ✅ **No cost** (self-hosted, free)

### 🎯 3-Step Deployment

#### Step 1: Create Services (2 min)

**In Coolify Dashboard:**

1. **MongoDB Service**
   ```
   Name: vmp-mongo
   Version: MongoDB 7.0
   Password: [Generate: openssl rand -base64 24]
   ```

2. **Redis Service**
   ```
   Name: vmp-redis
   Version: Redis 7-alpine
   Password: [Generate: openssl rand -base64 24]
   ```

#### Step 2: Deploy API (2 min)

1. Click "+ New Application"
2. Source: **GitHub** → `duckvhuynh/vmp-api`
3. Branch: `main`
4. Build Pack: **Dockerfile** ⚠️ Important!
5. Port: `3000`

#### Step 3: Configure & Go Live (1 min)

1. **Set Environment Variables** (copy from [ENV_VARIABLES.md](./ENV_VARIABLES.md))
2. **Add Domain:** `api.visitmauritiusparadise.com`
3. **Enable SSL:** Toggle "Generate Certificate"
4. **Click Deploy**

**✅ Done! Your API is live in 5 minutes.**

---

## 📚 Complete Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [COOLIFY_QUICK_START.md](./COOLIFY_QUICK_START.md) | 3-minute deployment guide | 3 min |
| [COOLIFY_DEPLOYMENT.md](./COOLIFY_DEPLOYMENT.md) | Complete Coolify guide | 15 min |
| [COOLIFY_CHECKLIST.md](./COOLIFY_CHECKLIST.md) | Step-by-step checklist | 10 min |
| [ENV_VARIABLES.md](./ENV_VARIABLES.md) | Environment variables reference | 5 min |
| [DEPLOYMENT_COMPARISON.md](./DEPLOYMENT_COMPARISON.md) | VPS vs Coolify comparison | 10 min |

---

## 🐳 Dockerfile Details

### Multi-Stage Production Build

```dockerfile
# Stage 1: Builder (with dev dependencies)
FROM node:20-alpine AS builder
# ... build application ...

# Stage 2: Production (minimal)
FROM node:20-alpine AS production
# ... copy built artifacts ...
# Non-root user (security)
# Health checks included
# Proper signal handling
```

### Optimizations

- ✅ **Small image size** (~200MB vs 1GB+)
- ✅ **Non-root user** (security best practice)
- ✅ **Health checks** (automatic monitoring)
- ✅ **Native modules** (argon2 support)
- ✅ **Proper caching** (faster rebuilds)

---

## 🔑 Required Environment Variables

### Minimum Configuration

```env
# Database
MONGO_URI=mongodb://admin:PASSWORD@vmp-mongo:27017/vmp_production

# Redis
REDIS_HOST=vmp-redis
REDIS_PORT=6379
REDIS_PASSWORD=PASSWORD

# JWT
JWT_SECRET=minimum-32-characters-long-secret
JWT_EXPIRES_IN=7d

# API
PORT=3000
NODE_ENV=production
API_PREFIX=api/v1

# CORS
CORS_ORIGINS=https://api.yourdomain.com

# Swagger
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
```

**📝 Full list:** See [ENV_VARIABLES.md](./ENV_VARIABLES.md)

---

## 🧪 Testing Your Deployment

### 1. Health Check

```bash
curl https://api.visitmauritiusparadise.com/health
```

Expected:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### 2. API Documentation

Visit: `https://api.visitmauritiusparadise.com/docs`

### 3. Sample API Call

```bash
curl -X POST https://api.visitmauritiusparadise.com/api/v1/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickupLocation": {
      "placeId": "test-1",
      "name": "Airport",
      "coordinates": {"lat": -20.430315, "lng": 57.683208}
    },
    "dropoffLocation": {
      "placeId": "test-2",
      "name": "Hotel",
      "coordinates": {"lat": -20.160, "lng": 57.500}
    },
    "pickupTime": "2025-12-01T10:00:00Z",
    "passengers": 2
  }'
```

---

## 🔄 Auto-Deployment

### Already Configured! 🎉

Every `git push` to `main` triggers automatic deployment:

```bash
git add .
git commit -m "feat: new feature"
git push origin main

# Coolify automatically:
# 1. Detects push via webhook
# 2. Pulls latest code
# 3. Builds Docker image
# 4. Deploys with ZERO downtime
```

---

## 📊 Deployment Comparison

| Feature | Coolify | Manual VPS |
|---------|---------|-----------|
| **Setup Time** | 5 min ⚡ | 30 min |
| **Complexity** | Low (UI) | High (CLI) |
| **SSL Setup** | Automatic 🔒 | Manual |
| **Updates** | Auto on push 🔄 | Manual script |
| **Monitoring** | Built-in 📊 | Setup required |
| **Downtime** | Zero ✅ | Brief (30s) |
| **Scaling** | One-click 📈 | Manual |

**Recommendation:** Use Coolify for faster, easier deployment.

---

## 🖥️ Alternative: Manual VPS Deployment

If you need full control or can't use Coolify:

### Requirements
- Ubuntu 20.04+ or similar Linux distro
- Docker & Docker Compose installed
- Domain with DNS access

### Quick Deploy

```bash
# 1. Clone repository
git clone https://github.com/duckvhuynh/vmp-api.git
cd vmp-api

# 2. Create environment file
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# 3. Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 4. Setup SSL (if needed)
./setup-ssl.sh
```

**📚 Full Guide:** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🔧 Troubleshooting

### Common Issues

#### ❌ Build Fails in Coolify

**Solution:**
1. Verify `Dockerfile` exists in repository root
2. Check `package.json` is valid
3. Review build logs in Coolify dashboard

#### ❌ Can't Connect to Database

**Solution:**
1. Verify `MONGO_URI` uses internal service name: `vmp-mongo` (not `localhost`)
2. Check MongoDB service is running in Coolify
3. Verify password matches

#### ❌ Health Check Fails

**Solution:**
1. Check application logs in Coolify
2. Verify `PORT=3000` in environment variables
3. Ensure `/health` endpoint is accessible

#### ❌ SSL Certificate Not Working

**Solution:**
1. Verify DNS A record points to Coolify server IP
2. Wait 2-3 minutes for certificate generation
3. Check SSL status in Coolify dashboard

**📚 More:** See [COOLIFY_DEPLOYMENT.md](./COOLIFY_DEPLOYMENT.md) → Troubleshooting section

---

## 🔐 Security Best Practices

### Before Going Live

- [ ] ✅ Use strong, unique passwords (32+ characters)
- [ ] ✅ Generate unique JWT_SECRET (32+ characters)
- [ ] ✅ Limit CORS_ORIGINS to your actual domains
- [ ] ✅ Enable HTTPS/SSL (automatic in Coolify)
- [ ] ✅ Keep sensitive data in environment variables (not in code)
- [ ] ✅ Enable rate limiting (already configured)
- [ ] ✅ Configure database backups
- [ ] ✅ Set up monitoring & alerts

### Generate Strong Secrets

```bash
# JWT Secret (32 bytes)
openssl rand -base64 32

# MongoDB Password (24 bytes)
openssl rand -base64 24

# Redis Password (24 bytes)
openssl rand -base64 24
```

---

## 📈 Monitoring & Maintenance

### Coolify Dashboard

Access built-in monitoring:
- **Logs:** Real-time application logs
- **Metrics:** CPU, Memory, Network usage
- **Health:** Service health status
- **History:** Deployment history

### Database Backups

1. Go to MongoDB service in Coolify
2. Click "Backups" tab
3. Configure:
   - Frequency: Daily at 2 AM
   - Retention: 7 days
   - Storage: Coolify S3 or custom

---

## 🎯 API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/docs` | GET | Swagger documentation |
| `/api/v1/auth/register` | POST | User registration |
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/quotes/calculate` | POST | Calculate quote |
| `/api/v1/bookings` | GET/POST | Manage bookings |
| `/api/v1/drivers` | GET | List drivers |

**📚 Full API Docs:** Visit `/docs` after deployment

---

## 🛠️ Technology Stack

- **Framework:** NestJS 10.x (Node.js)
- **Language:** TypeScript
- **Database:** MongoDB 7.x (with Mongoose)
- **Cache:** Redis 7.x
- **Authentication:** JWT (passport-jwt)
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI
- **Security:** Helmet, CORS, Rate Limiting
- **Containerization:** Docker (Alpine Linux)

---

## 📞 Support & Resources

### Documentation
- **API Documentation:** `/docs` (after deployment)
- **GitHub Repository:** https://github.com/duckvhuynh/vmp-api
- **Coolify Docs:** https://coolify.io/docs

### Community
- **Coolify Discord:** https://coolify.io/discord
- **GitHub Issues:** https://github.com/duckvhuynh/vmp-api/issues

---

## ✅ Pre-Launch Checklist

### Before Making API Public

- [ ] All services deployed and healthy
- [ ] Environment variables configured
- [ ] Domain configured with SSL
- [ ] Health check passing
- [ ] API endpoints tested
- [ ] Swagger documentation accessible
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Error tracking set up (optional)
- [ ] Team trained on deployment process

---

## 🎉 Success Metrics

After deployment, you should have:

- ✅ **API live** at `https://api.yourdomain.com`
- ✅ **Docs available** at `https://api.yourdomain.com/docs`
- ✅ **Health check** returning `{ status: "ok" }`
- ✅ **SSL certificate** valid and auto-renewing
- ✅ **Auto-deployment** on Git push
- ✅ **Monitoring** enabled
- ✅ **Backups** scheduled

---

## 🚀 Next Steps

1. **Deploy to Coolify** using [COOLIFY_QUICK_START.md](./COOLIFY_QUICK_START.md)
2. **Test all endpoints** using `/docs`
3. **Configure backups** in Coolify dashboard
4. **Update frontend** to use new API URL
5. **Monitor logs** for first 24 hours
6. **Set up alerts** for failures
7. **Go live!** 🎉

---

## 📄 License

MIT - See [LICENSE](./LICENSE) for details.

---

**Ready to deploy?** Start with [COOLIFY_QUICK_START.md](./COOLIFY_QUICK_START.md) 🚀

