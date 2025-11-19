# 🚀 Coolify Deployment - Ready to Deploy!

## ✅ What's Been Done

### 1. **Optimized Dockerfile** ✓
- Multi-stage build for minimal image size
- Non-root user for security (nestjs:nodejs)
- Built-in health check
- Proper signal handling with dumb-init
- Native module support (argon2, etc.)
- Production-ready configuration

### 2. **Comprehensive Documentation** ✓
- `COOLIFY_DEPLOYMENT.md` - Full deployment guide
- `COOLIFY_QUICK_START.md` - 3-minute quick start
- `ENV_VARIABLES.md` - Environment variables reference

### 3. **Git Repository** ✓
- All files committed and pushed to GitHub
- Ready for Coolify to pull and deploy

---

## 🎯 What You Need to Do in Coolify

### Quick Checklist (5 minutes)

1. **Create MongoDB Service**
   - Name: `vmp-mongo`
   - Version: MongoDB 7.0
   - Generate strong password
   - Copy internal URL: `mongodb://admin:PASSWORD@vmp-mongo:27017`

2. **Create Redis Service**
   - Name: `vmp-redis`
   - Version: Redis 7-alpine
   - Generate strong password
   - Copy internal URL: `redis://:PASSWORD@vmp-redis:6379`

3. **Create API Application**
   - Source: GitHub → `duckvhuynh/vmp-api`
   - Branch: `main`
   - Build Pack: **Dockerfile** (important!)
   - Port: `3000`

4. **Set Environment Variables**
   - Copy from `ENV_VARIABLES.md`
   - Replace placeholders with actual values
   - Use internal service names (`vmp-mongo`, `vmp-redis`)

5. **Configure Domain**
   - Add: `api.visitmauritiusparadise.com`
   - Enable SSL (automatic Let's Encrypt)

6. **Deploy!**
   - Click "Deploy" button
   - Wait 2-3 minutes for build
   - Test: `https://api.visitmauritiusparadise.com/health`

---

## 🔑 Generate Secrets

Before deploying, generate these secrets:

```bash
# JWT Secret (32 bytes)
openssl rand -base64 32

# MongoDB Password
openssl rand -base64 24

# Redis Password
openssl rand -base64 24
```

---

## 📋 Minimum Environment Variables Required

```env
MONGO_URI=mongodb://admin:YOUR_MONGO_PASSWORD@vmp-mongo:27017/vmp_production
REDIS_HOST=vmp-redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
JWT_SECRET=your-generated-secret-minimum-32-chars
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

## 🧪 After Deployment - Test These

### Health Check
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

### API Documentation
Visit: `https://api.visitmauritiusparadise.com/docs`

### Quote Calculation (Sample Request)
```bash
curl -X POST https://api.visitmauritiusparadise.com/api/v1/quotes/calculate \
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

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `COOLIFY_DEPLOYMENT.md` | Complete deployment guide with troubleshooting |
| `COOLIFY_QUICK_START.md` | 3-minute quick start guide |
| `ENV_VARIABLES.md` | Environment variables reference |
| `Dockerfile` | Production-optimized Docker configuration |

---

## 🔄 Auto-Deployment (Already Configured!)

Coolify automatically sets up GitHub webhooks.

**Every time you push to `main`:**
```bash
git add .
git commit -m "your changes"
git push origin main
```

Coolify will:
1. Pull latest code
2. Build new Docker image
3. Run health checks
4. Deploy with zero downtime

---

## 💡 Key Differences from VPS Deployment

| Aspect | VPS (Manual) | Coolify |
|--------|--------------|---------|
| **Docker Compose** | Manual `docker-compose.yml` | Coolify manages services |
| **Nginx** | Manual config & SSL | Auto-configured with SSL |
| **Environment Variables** | `.env.production` file | Coolify UI/Dashboard |
| **Monitoring** | Manual logs | Built-in dashboard |
| **Updates** | Manual `deploy.sh` | Auto-deploy on push |
| **Backups** | Manual setup | Built-in backup UI |
| **Scaling** | Manual | Click to scale |

---

## ⚙️ Dockerfile Optimizations

### Security
- ✅ Non-root user (`nestjs:nodejs`)
- ✅ Minimal attack surface (Alpine Linux)
- ✅ No dev dependencies in production

### Performance
- ✅ Multi-stage build (smaller image)
- ✅ Layer caching optimization
- ✅ Production npm ci

### Reliability
- ✅ Health check endpoint
- ✅ Graceful shutdown (dumb-init)
- ✅ Proper signal handling

### Monitoring
- ✅ Health check every 30s
- ✅ 40s start period (for builds)
- ✅ 3 retries before marking unhealthy

---

## 🎯 Next Steps After Deployment

1. **Enable Backups** (in Coolify)
   - MongoDB: Daily at 2 AM
   - Retention: 7 days

2. **Monitor Logs** (first 24 hours)
   - Check for errors
   - Verify API calls work
   - Test all endpoints

3. **Update CORS** (if needed)
   - Add frontend domain
   - Add admin panel domain

4. **Optional Integrations**
   - Stripe (payments)
   - Twilio (SMS)
   - Google Maps API

5. **Performance Testing**
   - Load test main endpoints
   - Monitor CPU/Memory
   - Adjust resources if needed

---

## 🆘 Troubleshooting Quick Reference

### Build Fails
→ Check Dockerfile syntax  
→ Verify package.json exists  
→ Review build logs in Coolify

### Can't Connect to Database
→ Use `vmp-mongo` (not `localhost`)  
→ Verify MongoDB service is running  
→ Check password matches

### Health Check Fails
→ Verify `/health` endpoint exists  
→ Check API logs  
→ Ensure PORT=3000

### SSL Not Working
→ Verify DNS A record points to Coolify  
→ Wait 2-3 minutes for certificate  
→ Check Coolify's SSL status

---

## 📞 Support

- **Coolify Docs:** https://coolify.io/docs
- **Coolify Discord:** https://coolify.io/discord
- **GitHub Issues:** https://github.com/duckvhuynh/vmp-api/issues

---

## ✅ Final Checklist

Before going live:

- [ ] MongoDB service created with strong password
- [ ] Redis service created with strong password
- [ ] API application deployed from GitHub
- [ ] All environment variables set
- [ ] Domain configured with DNS A record
- [ ] SSL certificate generated and active
- [ ] Health check passing
- [ ] API documentation accessible
- [ ] Test endpoints working
- [ ] CORS configured for production domains
- [ ] Monitoring dashboard reviewed
- [ ] Backup schedule configured
- [ ] Team notified of new deployment

---

## 🎉 Success!

Your VMP API is now ready to deploy on Coolify with:

- ✅ Production-optimized Dockerfile
- ✅ Multi-stage builds for security & performance
- ✅ Built-in health checks
- ✅ Auto-deployment on Git push
- ✅ Automatic SSL/HTTPS
- ✅ Zero-downtime deployments
- ✅ Built-in monitoring & logs
- ✅ Easy scaling & backups

**Deploy URL:** `https://api.visitmauritiusparadise.com`  
**Documentation:** `https://api.visitmauritiusparadise.com/docs`

---

**Ready to deploy? Follow `COOLIFY_QUICK_START.md` for step-by-step instructions!** 🚀

