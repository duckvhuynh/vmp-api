# ⚡ Coolify Quick Start - VMP API

## 🎯 3-Minute Deployment

### Step 1: Create Services in Coolify (2 mins)

#### MongoDB
```
Name: vmp-mongo
Type: MongoDB 7.0
Username: admin
Password: [Generate: openssl rand -base64 24]
Database: vmp_production
```
✅ Deploy → Copy internal URL: `mongodb://admin:PASSWORD@vmp-mongo:27017`

#### Redis
```
Name: vmp-redis
Type: Redis 7-alpine
Password: [Generate: openssl rand -base64 24]
```
✅ Deploy → Copy internal URL: `redis://:PASSWORD@vmp-redis:6379`

---

### Step 2: Deploy API Application (1 min)

1. **Click "+ New Application"**
2. **Source:** GitHub → `duckvhuynh/vmp-api`
3. **Branch:** `main`
4. **Build Pack:** Dockerfile
5. **Port:** 3000

---

### Step 3: Set Environment Variables

Click "Environment Variables" and paste:

```env
MONGO_URI=mongodb://admin:YOUR_MONGO_PASSWORD@vmp-mongo:27017/vmp_production
REDIS_HOST=vmp-redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
JWT_SECRET=[Generate: openssl rand -base64 32]
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
API_PREFIX=api/v1
CORS_ORIGINS=https://api.visitmauritiusparadise.com
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
RATE_LIMIT_ENABLED=true
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
LOG_LEVEL=info
```

---

### Step 4: Configure Domain & Deploy

1. **Add Domain:** `api.visitmauritiusparadise.com`
2. **Enable SSL:** Toggle "Generate Certificate"
3. **Click "Deploy"**

✅ Wait 2-3 minutes for build & SSL generation

---

## 🧪 Test Deployment

### Health Check
```bash
curl https://api.visitmauritiusparadise.com/health
```

### API Docs
Visit: `https://api.visitmauritiusparadise.com/docs`

### Test Quote Calculation
```bash
curl https://api.visitmauritiusparadise.com/api/v1/quotes/calculate \
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

## 🔄 Auto-Deploy Setup

✅ **Already configured!** Push to `main` branch triggers automatic deployment.

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

Coolify will automatically rebuild and redeploy (zero downtime).

---

## 📊 Monitor

**In Coolify Dashboard:**
- View logs (real-time)
- Check CPU/Memory usage
- Monitor health status
- View build history

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Check Dockerfile exists
# Verify package.json is valid
# Check build logs in Coolify
```

### Can't Connect to MongoDB
```bash
# Verify MONGO_URI uses "vmp-mongo" (not localhost)
# Check MongoDB service is running
# Verify password matches
```

### Health Check Failing
```bash
# Check API logs in Coolify
# Verify PORT=3000
# Ensure /health endpoint exists
```

---

## 📚 Full Documentation

- **Complete Guide:** See `COOLIFY_DEPLOYMENT.md`
- **Environment Variables:** See `ENV_VARIABLES.md`
- **Dockerfile:** Optimized for Coolify

---

## ✅ Deployment Checklist

- [ ] MongoDB service created and running
- [ ] Redis service created and running
- [ ] Environment variables set (all passwords generated)
- [ ] Domain configured and DNS updated
- [ ] Application deployed successfully
- [ ] Health check passing
- [ ] SSL certificate active
- [ ] API documentation accessible
- [ ] Test endpoints working

---

## 🎉 You're Live!

**API:** `https://api.visitmauritiusparadise.com`  
**Docs:** `https://api.visitmauritiusparadise.com/docs`  
**Health:** `https://api.visitmauritiusparadise.com/health`

---

**Need Help?**
- Full guide: `COOLIFY_DEPLOYMENT.md`
- Coolify Discord: https://coolify.io/discord

