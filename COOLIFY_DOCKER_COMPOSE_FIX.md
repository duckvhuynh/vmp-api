# 🔧 Fix Docker Compose MongoDB Connection Issue

## Problem

```
MongooseServerSelectionError: getaddrinfo EAI_AGAIN vmp-mongo
```

The API container cannot resolve the MongoDB hostname.

---

## ✅ Solution Applied

### Changes Made:

1. **Updated `docker-compose.yaml`:**
   - Removed custom network (`vmp-network`) - let Coolify handle networking
   - Changed service references from `vmp-mongo`/`vmp-redis` to `mongo`/`redis` (service names)
   - Increased API health check start period to 60s

2. **Updated `src/app.module.ts`:**
   - Increased `serverSelectionTimeoutMS` from 5s to 30s
   - Added `connectTimeoutMS: 30000`
   - Added connection pool settings

---

## 🚀 How to Apply Fix

### Step 1: Pull Latest Changes

The fixes are already in the repository. Coolify should auto-deploy, or:

1. **Go to Coolify Dashboard**
2. **Click "Redeploy" or "Deploy"**

### Step 2: Verify Services Are Running

In Coolify, check that all services show as "Running":
- ✅ `vmp-api` (or your container name)
- ✅ `vmp-mongo`
- ✅ `vmp-redis`

### Step 3: Check Logs

**API Logs should show:**
```
Connecting to MongoDB: mongodb://admin:****@mongo:27017/vmp_production
[NestFactory] Starting Nest application...
✅ API running on http://0.0.0.0:3000
```

**MongoDB Logs should show:**
```
MongoDB init process complete; ready for start up
Waiting for connections...
```

---

## 🔍 Troubleshooting

### Issue: Still Getting `getaddrinfo EAI_AGAIN`

**Check 1: Verify Service Names**

In Coolify, check the actual container names:
```bash
# In Coolify terminal or SSH
docker ps | grep -E "mongo|redis|api"
```

**Expected output:**
```
vmp-api    ...  Running
vmp-mongo  ...  Running
vmp-redis  ...  Running
```

**Check 2: Verify Network**

```bash
# Check if containers are on the same network
docker network inspect $(docker inspect vmp-api --format='{{range $net,$v := .NetworkSettings.Networks}}{{$net}}{{end}}')
```

**Check 3: Test DNS Resolution**

```bash
# Exec into API container
docker exec -it vmp-api sh

# Test DNS resolution
nslookup mongo
# OR
ping mongo

# Should resolve to MongoDB container IP
```

**Check 4: Test MongoDB Connection**

```bash
# From API container
mongosh mongodb://admin:0814940664asdUZ@mongo:27017/vmp_production

# Should connect successfully
```

---

## 🔄 Alternative: Use Container Names

If service names (`mongo`, `redis`) don't work, try using container names:

### Update Environment Variables in Coolify:

```env
MONGO_URI=mongodb://admin:0814940664asdUZ@@vmp-mongo:27017/vmp_production
REDIS_HOST=vmp-redis
```

**Note:** Container names are `vmp-mongo` and `vmp-redis` (as defined in docker-compose.yaml).

---

## 📋 Service Name vs Container Name

| Type | Name | Usage |
|------|------|-------|
| **Service Name** | `mongo`, `redis` | Used in `depends_on` and DNS resolution within docker-compose |
| **Container Name** | `vmp-mongo`, `vmp-redis` | Actual Docker container name |

**In docker-compose.yaml:**
- Service names: `mongo`, `redis`, `api`
- Container names: `vmp-mongo`, `vmp-redis`, `${COOLIFY_CONTAINER_NAME:-vmp-api}`

**For DNS resolution:**
- Use **service names** (`mongo`, `redis`) - these are automatically resolved by Docker Compose
- Container names (`vmp-mongo`, `vmp-redis`) might not resolve in all cases

---

## 🎯 Expected Behavior After Fix

1. **MongoDB starts first** (health check: 40s)
2. **Redis starts** (no health check, starts immediately)
3. **API waits for MongoDB** (depends_on with condition: service_healthy)
4. **API connects to MongoDB** (30s timeout allows MongoDB to be ready)
5. **API starts successfully**

**Timeline:**
```
0s    → MongoDB starts
40s   → MongoDB healthy
40s   → API starts (waited for MongoDB)
60s   → API health check passes
```

---

## 🆘 Still Not Working?

### Option 1: Check Coolify Logs

1. **Go to Coolify Dashboard**
2. **Click on your application**
3. **View "Logs" tab**
4. **Look for MongoDB connection errors**

### Option 2: Manual Network Test

```bash
# SSH into Coolify server
ssh user@your-coolify-server

# Check docker-compose network
cd /path/to/your/app
docker-compose ps

# Check if services are on same network
docker network ls
docker network inspect <network-name>
```

### Option 3: Use External MongoDB

If docker-compose networking continues to fail:

1. **Create MongoDB as separate service in Coolify**
2. **Get internal connection string**
3. **Update `MONGO_URI` in environment variables**

See: `COOLIFY_MONGODB_FIX.md`

---

## ✅ Success Indicators

After applying the fix, you should see:

1. ✅ **All services running** in Coolify dashboard
2. ✅ **No restart loops** - API stays running
3. ✅ **Health check passes** - `/health` returns `{"status":"ok"}`
4. ✅ **Swagger accessible** - `https://api.visitmauritiusparadise.com/docs` loads
5. ✅ **MongoDB connected** - Logs show successful connection

---

## 📝 Summary

**Root Cause:** Service name mismatch (`vmp-mongo` vs `mongo`) and custom network preventing DNS resolution.

**Fix:** 
- Use service names (`mongo`, `redis`) instead of container names
- Remove custom network, let Coolify handle networking
- Increase MongoDB connection timeout

**Result:** Services can now communicate via Docker Compose's built-in DNS resolution.

