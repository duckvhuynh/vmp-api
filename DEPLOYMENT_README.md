# 🚀 VMP API - Production Deployment Package

## 📦 Files Included

### Docker Configuration
- `docker-compose.prod.yml` - Production docker compose với tất cả services
- `Dockerfile` - Multi-stage build cho API
- `docker/nginx.conf` - Nginx reverse proxy configuration
- `docker/mongo-init.js` - MongoDB initialization script
- `.env.production.example` - Environment variables template

### Deployment Scripts
- `deploy.sh` - Automated deployment script
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide

## 🎯 Quick Deploy (3 Steps)

### 1. Push to Git Repository

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Production ready"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/vmp-api.git
git push -u origin main
```

### 2. On VPS - Run Deploy Script

```bash
# SSH to VPS
ssh root@your-vps-ip

# Download and run deploy script
curl -o /tmp/deploy.sh https://raw.githubusercontent.com/yourusername/vmp-api/main/deploy.sh
chmod +x /tmp/deploy.sh
cd /tmp && ./deploy.sh
```

### 3. Configure Environment

```bash
# Edit production environment
nano /opt/vmp-api/.env.production

# Update JWT_SECRET, MONGO_ROOT_PASSWORD, REDIS_PASSWORD
# Save and exit (Ctrl+X, Y, Enter)

# Redeploy
cd /opt/vmp-api && ./deploy.sh
```

## 📋 What the Script Does

1. ✅ Installs Docker & Docker Compose
2. ✅ Clones your Git repository
3. ✅ Sets up environment files
4. ✅ Creates necessary directories
5. ✅ Builds Docker images
6. ✅ Starts all services:
   - API (Node.js)
   - MongoDB (with authentication)
   - Redis (with password)
   - Nginx (reverse proxy)
   - Mongo Express (DB admin UI)
7. ✅ Runs health checks
8. ✅ Configures firewall

## 🔧 Services Included

### API (Port 3000)
- NestJS application
- Auto-restart on failure
- Health checks enabled
- Log rotation configured

### MongoDB (Port 27017)
- Version 7
- Authentication enabled
- Data persistence
- Health checks
- Automatic initialization

### Redis (Port 6379)
- Version 7
- Password protected
- Memory limit: 256MB
- LRU eviction policy

### Nginx (Ports 80, 443)
- Reverse proxy
- SSL/TLS support
- Gzip compression
- Rate limiting
- Security headers

### Mongo Express (Port 8081)
- Database management UI
- Basic auth protected
- Optional (can be disabled)

## 🌐 Access Points

After deployment:

- **API**: http://your-domain.com/api/v1
- **Swagger**: http://your-domain.com/docs
- **Health**: http://your-domain.com/health
- **Mongo Express**: http://your-domain.com:8081

## 🔐 Security Features

✅ JWT authentication  
✅ Password hashing (argon2)  
✅ MongoDB authentication  
✅ Redis password  
✅ Nginx security headers  
✅ Rate limiting  
✅ CORS configuration  
✅ Firewall rules  
✅ Log rotation  

## 💾 Data Persistence

All data is stored in Docker volumes:
- `mongo-data` - MongoDB data
- `mongo-config` - MongoDB configuration
- `redis-data` - Redis data
- `nginx-cache` - Nginx cache

Data persists across container restarts and updates.

## 🔄 Update Process

```bash
# SSH to VPS
ssh root@your-vps-ip

# Navigate to project
cd /opt/vmp-api

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Or use deploy script
./deploy.sh
```

## 📊 Monitoring Commands

```bash
# View all containers
docker-compose -f docker-compose.prod.yml ps

# View API logs
docker-compose -f docker-compose.prod.yml logs -f api

# Check health
curl http://localhost:3000/health

# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

## 🐛 Common Issues

### Port Already in Use
```bash
# Find process
netstat -tulpn | grep 3000
# Kill process or change port in docker-compose
```

### MongoDB Connection Failed
```bash
# Check MongoDB logs
docker-compose -f docker-compose.prod.yml logs mongo
# Restart MongoDB
docker-compose -f docker-compose.prod.yml restart mongo
```

### Out of Memory
```bash
# Check memory
free -h
# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### SSL Certificate Issues
```bash
# Get Let's Encrypt certificate
certbot certonly --standalone -d yourdomain.com
# Copy to project
cp /etc/letsencrypt/live/yourdomain.com/*.pem /opt/vmp-api/docker/ssl/
```

## 📦 Backup Strategy

### Automated Daily Backups

```bash
# Create backup script
nano /opt/vmp-api/backup.sh
```

Add:
```bash
#!/bin/bash
docker exec vmp-mongo-prod mongodump --out=/tmp/backup
docker cp vmp-mongo-prod:/tmp/backup /opt/vmp-api/backups/$(date +%Y%m%d)
docker exec vmp-mongo-prod rm -rf /tmp/backup
```

```bash
# Make executable
chmod +x /opt/vmp-api/backup.sh

# Add to cron (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/vmp-api/backup.sh
```

### Restore from Backup

```bash
docker cp /opt/vmp-api/backups/20251029 vmp-mongo-prod:/tmp/backup
docker exec vmp-mongo-prod mongorestore /tmp/backup
```

## 🔧 Environment Variables

### Required
- `JWT_SECRET` - JWT signing key (min 32 chars)
- `MONGO_ROOT_PASSWORD` - MongoDB admin password
- `REDIS_PASSWORD` - Redis password

### Optional
- `CORS_ORIGINS` - Allowed origins (comma-separated)
- `ME_USERNAME` - Mongo Express username
- `ME_PASSWORD` - Mongo Express password
- `STRIPE_SECRET_KEY` - Stripe API key
- `SMS_API_KEY` - SMS provider API key

## 📈 Performance Tips

1. **Enable Redis persistence**
   ```yaml
   redis:
     command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
   ```

2. **Increase MongoDB connections**
   ```yaml
   mongo:
     command: ["--auth", "--maxConns=500"]
   ```

3. **Adjust Nginx worker processes**
   ```nginx
   worker_processes auto;
   ```

4. **Enable HTTP/2**
   ```nginx
   listen 443 ssl http2;
   ```

## 🛡️ Production Checklist

Before going live:

- [ ] Update .env.production with secure values
- [ ] Configure domain name
- [ ] Install SSL certificate
- [ ] Update CORS_ORIGINS
- [ ] Disable Mongo Express (or secure it)
- [ ] Set up automated backups
- [ ] Configure monitoring
- [ ] Test all endpoints
- [ ] Set up error tracking (Sentry)
- [ ] Document API keys
- [ ] Review firewall rules
- [ ] Enable log rotation
- [ ] Set up uptime monitoring

## 📞 Support & Troubleshooting

### Check Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs

# Specific service
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs mongo
docker-compose -f docker-compose.prod.yml logs redis
```

### Restart Services
```bash
# All services
docker-compose -f docker-compose.prod.yml restart

# Specific service
docker-compose -f docker-compose.prod.yml restart api
```

### Clean Restart
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🎉 Success Indicators

Your deployment is successful when:

✅ Health check returns 200: `curl http://localhost:3000/health`  
✅ Swagger accessible: http://your-domain.com/docs  
✅ Can register user via API  
✅ Can create quote  
✅ MongoDB is accessible  
✅ Redis is connected  
✅ Logs show no errors  

## 🔗 Useful Links

- API Documentation: `/docs`
- Health Check: `/health`
- MongoDB Admin: `:8081`
- GitHub Repo: (update with your URL)

---

**Need Help?**

1. Read DEPLOYMENT_GUIDE.md for detailed instructions
2. Check logs for errors
3. Review environment variables
4. Contact: support@example.com

**Happy Deploying! 🚀**

