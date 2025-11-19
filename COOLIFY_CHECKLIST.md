# ✅ Coolify Deployment Checklist

## 📋 Pre-Deployment Checklist

### 1. Prerequisites
- [ ] Coolify instance running (v4.0+)
- [ ] GitHub account with access to repository
- [ ] Domain name (optional but recommended)
- [ ] DNS access to update A records

### 2. Secrets Generated
Generate these before starting deployment:

```bash
# Run these commands locally
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 24  # MONGO_ROOT_PASSWORD
openssl rand -base64 24  # REDIS_PASSWORD
```

- [ ] JWT_SECRET generated (32+ characters)
- [ ] MongoDB password generated (24+ characters)
- [ ] Redis password generated (24+ characters)

---

## 🗂️ Coolify Setup (3 steps)

### Step 1: Create MongoDB Service (2 min)

- [ ] Login to Coolify dashboard
- [ ] Click "+ New Resource" → "Database" → "MongoDB"
- [ ] Configure:
  ```
  Name: vmp-mongo
  Version: 7.0 (or latest stable)
  Port: 27017 (internal only)
  Root Username: admin
  Root Password: [Paste generated password]
  Database Name: vmp_production
  ```
- [ ] Click "Deploy"
- [ ] Wait for status: ✅ **Running**
- [ ] Copy internal URL: `mongodb://admin:PASSWORD@vmp-mongo:27017`

**Status:** [ ] MongoDB Running

---

### Step 2: Create Redis Service (1 min)

- [ ] Click "+ New Resource" → "Database" → "Redis"
- [ ] Configure:
  ```
  Name: vmp-redis
  Version: 7-alpine (or latest)
  Port: 6379 (internal only)
  Password: [Paste generated password]
  ```
- [ ] Click "Deploy"
- [ ] Wait for status: ✅ **Running**
- [ ] Copy internal URL: `redis://:PASSWORD@vmp-redis:6379`

**Status:** [ ] Redis Running

---

### Step 3: Deploy API Application (2 min)

#### 3a. Create Application

- [ ] Click "+ New Resource" → "Application"
- [ ] Source: **GitHub**
- [ ] Repository: `https://github.com/duckvhuynh/vmp-api`
- [ ] Branch: `main`
- [ ] Build Pack: **Dockerfile** (IMPORTANT!)

#### 3b. Configure Build

- [ ] Builder: **Dockerfile**
- [ ] Dockerfile Location: `./Dockerfile`
- [ ] Base Directory: `/` (root)
- [ ] Port: `3000`

#### 3c. Set Environment Variables

Click "Environment Variables" and add these (use your generated secrets):

```env
MONGO_URI=mongodb://admin:YOUR_MONGO_PASSWORD@vmp-mongo:27017/vmp_production
REDIS_HOST=vmp-redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
JWT_SECRET=your-generated-32-char-secret
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

**Checklist:**
- [ ] All required variables added
- [ ] MongoDB password matches service password
- [ ] Redis password matches service password
- [ ] JWT_SECRET is 32+ characters
- [ ] CORS_ORIGINS updated with your domain
- [ ] Service names use internal names (`vmp-mongo`, `vmp-redis`)

#### 3d. Configure Domain & SSL

- [ ] Click "Domains" tab
- [ ] Add domain: `api.visitmauritiusparadise.com`
- [ ] Enable "Generate SSL Certificate" (automatic Let's Encrypt)
- [ ] Click "Save"

#### 3e. Deploy!

- [ ] Click "Deploy" button
- [ ] Wait 2-3 minutes for build
- [ ] Monitor logs for errors

**Status:** [ ] Application Deployed

---

## 🌐 DNS Configuration

### Update Your Domain's DNS

Add an A record pointing to your Coolify server:

```
Type: A
Name: api
Value: YOUR_COOLIFY_SERVER_IP
TTL: 3600 (1 hour)
```

**Checklist:**
- [ ] A record created
- [ ] Points to correct IP
- [ ] DNS propagated (test with `nslookup api.visitmauritiusparadise.com`)

**Wait Time:** 5-15 minutes for DNS propagation

---

## 🧪 Post-Deployment Testing (5 tests)

### Test 1: Health Check

```bash
curl https://api.visitmauritiusparadise.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

- [ ] Health check returns 200 OK
- [ ] Database status is "up"
- [ ] Redis status is "up"

**Status:** [ ] Health Check Passed

---

### Test 2: API Documentation

**Visit:** `https://api.visitmauritiusparadise.com/docs`

- [ ] Swagger UI loads
- [ ] All endpoints visible
- [ ] Can expand and view endpoint details

**Status:** [ ] Swagger Working

---

### Test 3: Quote Calculation

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

- [ ] Request returns 200 OK
- [ ] Response includes quote with vehicles
- [ ] Pricing calculated correctly

**Status:** [ ] Quote API Working

---

### Test 4: SSL Certificate

```bash
curl -I https://api.visitmauritiusparadise.com/health
```

Check for:
```
HTTP/2 200
```

- [ ] HTTPS works (not HTTP)
- [ ] Certificate is valid
- [ ] No SSL warnings in browser

**Status:** [ ] SSL Working

---

### Test 5: Auto-Deployment

Make a small change and push to test auto-deployment:

```bash
# On your local machine
cd /path/to/vmp-api
echo "# Test change" >> README.md
git add README.md
git commit -m "test: verify auto-deployment"
git push origin main
```

**In Coolify:**
- [ ] Webhook triggered automatically
- [ ] New build started
- [ ] Deployment completed
- [ ] No downtime observed

**Status:** [ ] Auto-Deployment Working

---

## 🔧 Configuration Verification

### Coolify Settings

#### Application Settings
- [ ] Name: VMP API (or similar)
- [ ] Repository: duckvhuynh/vmp-api
- [ ] Branch: main
- [ ] Build Pack: Dockerfile
- [ ] Port: 3000

#### Resources
- [ ] CPU Limit: 1000m (1 core) - adjust as needed
- [ ] Memory Limit: 512Mi - adjust as needed
- [ ] Restart Policy: Always

#### Health Check (Auto-detected from Dockerfile)
- [ ] Enabled: Yes
- [ ] Path: /health
- [ ] Interval: 30s
- [ ] Timeout: 10s
- [ ] Start Period: 40s
- [ ] Retries: 3

#### Networking
- [ ] Domain configured
- [ ] SSL enabled
- [ ] Port mapping: 3000 → 80/443

---

## 📊 Monitoring Setup

### Enable Monitoring Features

- [ ] View application logs (real-time)
- [ ] Check CPU/Memory usage graphs
- [ ] Monitor container status
- [ ] Review deployment history
- [ ] Test log search functionality

### Set Up Alerts (Optional)

- [ ] Email notifications for failed deployments
- [ ] Slack/Discord webhooks
- [ ] Health check failure alerts

---

## 💾 Backup Configuration

### MongoDB Backups

- [ ] Go to MongoDB service in Coolify
- [ ] Click "Backups" tab
- [ ] Configure:
  ```
  Frequency: Daily at 2:00 AM
  Retention: 7 days (or as needed)
  Storage: Coolify S3 or custom bucket
  ```
- [ ] Test restore procedure

**Status:** [ ] Backups Configured

---

## 🔐 Security Checklist

### Application Security

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] All passwords are unique and strong
- [ ] Environment variables not committed to Git
- [ ] CORS origins configured for production domains only
- [ ] Rate limiting enabled

### Infrastructure Security

- [ ] SSL/TLS enabled and working
- [ ] MongoDB not exposed to public internet
- [ ] Redis not exposed to public internet
- [ ] Coolify dashboard access secured (strong password/2FA)
- [ ] Server firewall configured (only ports 80/443/22 open)

### Monitoring & Alerts

- [ ] Health checks configured
- [ ] Error monitoring enabled
- [ ] Log aggregation working
- [ ] Deployment notifications set up

---

## 📈 Performance Optimization (Optional)

### Application Resources

- [ ] Monitor CPU usage (adjust if needed)
- [ ] Monitor memory usage (adjust if needed)
- [ ] Check response times
- [ ] Review database query performance

### Scaling

- [ ] Test horizontal scaling (if needed)
- [ ] Configure auto-scaling rules (if needed)
- [ ] Load test main endpoints

---

## 🎯 Final Verification

### All Systems Go!

- [ ] ✅ MongoDB running and accessible
- [ ] ✅ Redis running and accessible
- [ ] ✅ API deployed and healthy
- [ ] ✅ Domain configured with SSL
- [ ] ✅ Health check passing
- [ ] ✅ API endpoints working
- [ ] ✅ Swagger documentation accessible
- [ ] ✅ Auto-deployment tested
- [ ] ✅ Backups configured
- [ ] ✅ Monitoring enabled
- [ ] ✅ Team notified

---

## 📚 Documentation Review

### Have You Read?

- [ ] COOLIFY_QUICK_START.md (3-minute guide)
- [ ] COOLIFY_DEPLOYMENT.md (complete guide)
- [ ] ENV_VARIABLES.md (environment variables)
- [ ] DEPLOYMENT_COMPARISON.md (VPS vs Coolify)

---

## 🚀 Go Live Checklist

### Before Announcing

- [ ] All tests passed
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Backups working
- [ ] Team trained on deployment process
- [ ] Documentation updated
- [ ] Rollback plan ready

### Update Frontend

- [ ] Update frontend API URL to: `https://api.visitmauritiusparadise.com`
- [ ] Test frontend → backend communication
- [ ] Verify CORS working

---

## 🎉 Success!

If all checkboxes are checked, you're ready to go live!

**Your API is now deployed at:**
- **API:** https://api.visitmauritiusparadise.com
- **Docs:** https://api.visitmauritiusparadise.com/docs
- **Health:** https://api.visitmauritiusparadise.com/health

---

## 🆘 Troubleshooting Reference

### If Something Goes Wrong

| Issue | Check | Solution |
|-------|-------|----------|
| **Build fails** | Build logs in Coolify | Verify Dockerfile, package.json |
| **Health check fails** | Application logs | Check MONGO_URI, REDIS_HOST |
| **SSL not working** | DNS records | Verify A record, wait for propagation |
| **Can't connect to DB** | Service names | Use `vmp-mongo` not `localhost` |
| **Auto-deploy not working** | Webhook in GitHub | Check Coolify webhook URL |

**Full Troubleshooting:** See `COOLIFY_DEPLOYMENT.md` → Troubleshooting section

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Coolify Version:** _____________  
**API Version:** v0.1.0

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

