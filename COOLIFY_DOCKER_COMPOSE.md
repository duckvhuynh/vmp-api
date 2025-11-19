# 🐳 Coolify Deployment with Docker Compose

## ✅ Why Docker Compose?

Using Docker Compose in Coolify gives you:
- ✅ **Automatic MongoDB & Redis** - No need to create separate services
- ✅ **Same Network** - All services communicate automatically
- ✅ **Single Configuration** - Everything in one file
- ✅ **Easier Management** - Deploy everything together

---

## 🚀 Quick Start

### Step 1: Switch to Docker Compose in Coolify

1. **Go to your API application in Coolify**
2. **Click "Configuration" or "Settings"**
3. **Change Build Pack from "Dockerfile" to "Docker Compose"**
4. **Set Docker Compose File:** `docker-compose.yaml`
5. **Save**

### Step 2: Set Environment Variables (Optional)

Coolify will use the defaults from `docker-compose.yaml`, but you can override:

```env
# MongoDB (already configured in docker-compose.yaml)
MONGO_URI=mongodb://admin:0814940664asdUZ@vmp-mongo:27017/vmp_production

# Redis (already configured in docker-compose.yaml)
REDIS_HOST=vmp-redis
REDIS_PORT=6379
REDIS_PASSWORD=0814940664asdUZ@

# JWT Secret (REQUIRED - generate a strong one!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# API Config
PORT=3000
NODE_ENV=production
API_PREFIX=api/v1
CORS_ORIGINS=https://api.visitmauritiusparadise.com

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

### Step 3: Deploy!

1. **Click "Deploy"**
2. **Wait for build** (2-3 minutes)
3. **Check logs** - should see all services starting:
   ```
   ✅ MongoDB: Running
   ✅ Redis: Running
   ✅ API: Running
   ```

---

## 📋 What's Included

### Services in `docker-compose.yaml`:

1. **`api`** - Your NestJS application
   - Built from `Dockerfile`
   - Port: 3000
   - Health check: `/health`

2. **`mongo`** - MongoDB 7.0
   - Username: `admin`
   - Password: `0814940664asdUZ@`
   - Database: `vmp_production`
   - Persistent volume: `mongo-data`

3. **`redis`** - Redis 7-alpine
   - Password: `0814940664asdUZ@`
   - Max memory: 256MB
   - Persistent volume: `redis-data`

---

## 🔧 Configuration Details

### MongoDB Configuration

```yaml
mongo:
  image: mongo:7
  environment:
    - MONGO_INITDB_ROOT_USERNAME=admin
    - MONGO_INITDB_ROOT_PASSWORD=0814940664asdUZ@
    - MONGO_INITDB_DATABASE=vmp_production
  command: ["--auth"]  # Enables authentication
```

**Connection String:**
```
mongodb://admin:0814940664asdUZ@vmp-mongo:27017/vmp_production
```

### Redis Configuration

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --requirepass 0814940664asdUZ@ --maxmemory 256mb --maxmemory-policy allkeys-lru
```

**Connection:**
- Host: `vmp-redis`
- Port: `6379`
- Password: `0814940664asdUZ@`

---

## 🧪 Verify Deployment

### Check All Services Are Running

In Coolify dashboard, you should see:
- ✅ `vmp-api` - Running
- ✅ `vmp-mongo` - Running  
- ✅ `vmp-redis` - Running

### Test API

```bash
# Health check
curl https://api.visitmauritiusparadise.com/health

# Should return:
# {"status":"ok","timestamp":"2025-11-19T..."}
```

### Test MongoDB Connection

```bash
# In Coolify terminal, exec into API container
docker exec -it vmp-api sh

# Test MongoDB connection
mongosh mongodb://admin:0814940664asdUZ@vmp-mongo:27017/vmp_production

# Should connect successfully
```

### Test Redis Connection

```bash
# In Coolify terminal, exec into API container
docker exec -it vmp-api sh

# Test Redis connection
redis-cli -h vmp-redis -p 6379 -a 0814940664asdUZ@ ping

# Should return: PONG
```

---

## 🔄 Updating Configuration

### Change MongoDB Password

1. **Update `docker-compose.yaml`:**
   ```yaml
   mongo:
     environment:
       - MONGO_INITDB_ROOT_PASSWORD=new-password
   ```

2. **Update `MONGO_URI` in environment variables:**
   ```env
   MONGO_URI=mongodb://admin:new-password@vmp-mongo:27017/vmp_production
   ```

3. **Redeploy**

### Change Redis Password

1. **Update `docker-compose.yaml`:**
   ```yaml
   redis:
     command: redis-server --requirepass new-password ...
   ```

2. **Update environment variables:**
   ```env
   REDIS_PASSWORD=new-password
   ```

3. **Redeploy**

---

## 📊 Volumes & Persistence

### Data Volumes

All data is persisted in Docker volumes:

- **`mongo-data`** - MongoDB database files
- **`mongo-config`** - MongoDB configuration
- **`redis-data`** - Redis persistence

### Backup MongoDB

```bash
# In Coolify terminal
docker exec vmp-mongo mongodump --out /backup --uri="mongodb://admin:0814940664asdUZ@localhost:27017/vmp_production"
```

---

## 🆘 Troubleshooting

### MongoDB Connection Failed

**Error:** `getaddrinfo EAI_AGAIN vmp-mongo`

**Solution:**
1. Check `mongo` service is running: `docker ps | grep mongo`
2. Verify service name matches: `vmp-mongo`
3. Check network: `docker network ls`
4. Ensure services are in same network: `vmp-network`

### Redis Connection Failed

**Error:** `ECONNREFUSED vmp-redis:6379`

**Solution:**
1. Check `redis` service is running: `docker ps | grep redis`
2. Verify password matches in `docker-compose.yaml` and environment variables
3. Test connection: `redis-cli -h vmp-redis -p 6379 -a 0814940664asdUZ@ ping`

### API Not Starting

**Error:** Health check failing

**Solution:**
1. Check API logs: `docker logs vmp-api`
2. Verify MongoDB is healthy: `docker ps | grep mongo`
3. Verify Redis is healthy: `docker ps | grep redis`
4. Check environment variables are set correctly

---

## 🎯 Advantages Over Separate Services

| Feature | Docker Compose | Separate Services |
|---------|---------------|-------------------|
| Setup Time | ⚡ 2 minutes | ⏱️ 10 minutes |
| Configuration | 📝 One file | 📝 Multiple configs |
| Network | ✅ Automatic | ⚠️ Manual setup |
| Dependencies | ✅ Auto-managed | ⚠️ Manual |
| Scaling | ⚠️ All together | ✅ Individual |

---

## 📝 Summary

**With Docker Compose:**
- ✅ MongoDB & Redis included automatically
- ✅ No need to create separate services
- ✅ Everything configured in one file
- ✅ Easier to manage and update

**Just switch to Docker Compose in Coolify and deploy!**

---

## 🔗 Related Files

- `docker-compose.yaml` - Main compose file
- `Dockerfile` - API build configuration
- `COOLIFY_MONGODB_FIX.md` - MongoDB troubleshooting (if using separate services)

