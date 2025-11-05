# 🎯 VMP API - VPS Deployment Summary

## ✅ Đã Tạo Đầy Đủ

### 1. Docker Production Setup
- ✅ **docker-compose.prod.yml** - Production docker compose với:
  - API service với health checks
  - MongoDB với authentication
  - Redis với password protection
  - Nginx reverse proxy
  - Mongo Express (optional)
  - Networks và volumes configuration
  - Logging configuration
  - Auto-restart policies

### 2. Nginx Configuration
- ✅ **docker/nginx.conf** - Nginx configuration với:
  - HTTP to HTTPS redirect
  - SSL/TLS support
  - Gzip compression
  - Rate limiting (100 req/s)
  - Security headers
  - Reverse proxy cho API
  - WebSocket support
  - Health check passthrough

### 3. MongoDB Initialization
- ✅ **docker/mongo-init.js** - Script để:
  - Tạo application user
  - Setup indexes cho performance
  - Initialize database

### 4. Deployment Script
- ✅ **deploy.sh** - Automated deployment script:
  - Install Docker & Docker Compose
  - Clone Git repository
  - Setup environment files
  - Build và start containers
  - Run health checks
  - Configure firewall
  - Display useful information

### 5. Environment Template
- ✅ **.env.production.example** - Template cho production environment:
  - Application settings
  - JWT secret
  - MongoDB credentials
  - Redis password
  - Mongo Express credentials
  - Optional external services

### 6. Documentation
- ✅ **DEPLOYMENT_GUIDE.md** - Complete deployment guide với:
  - Prerequisites
  - Quick deployment steps
  - Manual deployment steps
  - SSL configuration
  - Domain setup
  - Backup strategy
  - Monitoring commands
  - Troubleshooting
  - Security best practices

- ✅ **DEPLOYMENT_README.md** - Quick reference với:
  - 3-step deployment
  - Services overview
  - Access points
  - Common commands
  - Production checklist

## 🚀 Cách Deploy Lên VPS

### Method 1: Automated (Khuyến Nghị)

```bash
# 1. SSH vào VPS
ssh root@your-vps-ip

# 2. Download và chạy deploy script
curl -o /tmp/deploy.sh https://raw.githubusercontent.com/duckvhuynh/vmp-api/main/deploy.sh
chmod +x /tmp/deploy.sh
/tmp/deploy.sh

# 3. Configure environment
nano /opt/vmp-api/.env.production
# Update JWT_SECRET, MONGO_ROOT_PASSWORD, REDIS_PASSWORD

# 4. Re-deploy
cd /opt/vmp-api && ./deploy.sh
```

### Method 2: Manual

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 3. Clone repository
git clone https://github.com/duckvhuynh/vmp-api.git /opt/vmp-api
cd /opt/vmp-api

# 4. Setup environment
cp .env.production.example .env.production
nano .env.production

# 5. Deploy
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🔧 Services & Ports

| Service | Internal Port | External Port | Description |
|---------|---------------|---------------|-------------|
| API | 3000 | 3000 | NestJS Application |
| MongoDB | 27017 | 27017 | Database |
| Redis | 6379 | 6379 | Cache |
| Nginx | 80, 443 | 80, 443 | Reverse Proxy |
| Mongo Express | 8081 | 8081 | DB Admin UI |

## 🌐 Access URLs

Sau khi deploy:

```
API Endpoint:   http://your-vps-ip:3000/api/v1
Swagger Docs:   http://your-vps-ip:3000/docs
Health Check:   http://your-vps-ip:3000/health
Mongo Express:  http://your-vps-ip:8081

With domain:
API:            https://yourdomain.com/api/v1
Swagger:        https://yourdomain.com/docs
```

## 📦 Deployment Features

### Security
✅ JWT authentication  
✅ MongoDB authentication enabled  
✅ Redis password protection  
✅ Nginx security headers  
✅ Rate limiting  
✅ CORS configuration  
✅ Firewall setup  

### High Availability
✅ Auto-restart on failure  
✅ Health checks enabled  
✅ Log rotation  
✅ Data persistence  
✅ Volume backups  

### Monitoring
✅ Docker health checks  
✅ Container logs  
✅ System metrics  
✅ Application health endpoint  

### Performance
✅ Multi-stage Docker build  
✅ Nginx caching  
✅ Gzip compression  
✅ Redis caching  
✅ Database indexes  

## 🔄 Common Operations

### Update Application
```bash
cd /opt/vmp-api
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f api
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Backup Database
```bash
docker exec vmp-mongo-prod mongodump --out=/tmp/backup
docker cp vmp-mongo-prod:/tmp/backup ./backups/$(date +%Y%m%d)
```

### Health Check
```bash
curl http://localhost:3000/health
```

## 📋 Pre-Deployment Checklist

### VPS Requirements
- [ ] Ubuntu 20.04+ or similar
- [ ] 2GB+ RAM
- [ ] 20GB+ disk space
- [ ] Public IP address
- [ ] Root or sudo access

### Configuration
- [ ] Git repository created
- [ ] Code pushed to repository
- [ ] .env.production configured
- [ ] JWT_SECRET changed (min 32 chars)
- [ ] MongoDB password set
- [ ] Redis password set
- [ ] CORS origins configured

### Optional
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Backup strategy implemented
- [ ] Monitoring setup
- [ ] Error tracking (Sentry)

## 🎯 Post-Deployment

### Verify Deployment
```bash
# Test health
curl http://localhost:3000/health

# Test API
curl http://localhost:3000/api/v1/health

# Check containers
docker ps

# Check logs
docker-compose -f docker-compose.prod.yml logs --tail=50
```

### Configure Domain
1. Add DNS A record pointing to VPS IP
2. Update CORS_ORIGINS in .env.production
3. Install SSL certificate
4. Update Nginx config for SSL
5. Restart services

### Setup Monitoring
1. Configure automated backups
2. Setup uptime monitoring
3. Enable error tracking
4. Configure alerts

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Check container status
docker ps -a

# Restart
docker-compose -f docker-compose.prod.yml restart
```

### Can't Connect to API
```bash
# Check if API is running
docker ps | grep vmp-api

# Check health
curl http://localhost:3000/health

# Check firewall
ufw status

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx
```

### Database Connection Error
```bash
# Check MongoDB
docker ps | grep mongo

# Check MongoDB logs
docker-compose -f docker-compose.prod.yml logs mongo

# Verify password in .env.production
```

## 📊 Monitoring & Maintenance

### Daily
- Check application logs
- Monitor disk space
- Check error rates

### Weekly
- Review security logs
- Check backup integrity
- Update dependencies

### Monthly
- System updates
- Security patches
- Performance review
- Backup restore test

## 🔐 Security Best Practices

1. **Change Default Passwords**
   - Update JWT_SECRET
   - Set strong MongoDB password
   - Set strong Redis password

2. **Configure Firewall**
   - Only open necessary ports
   - Use UFW or iptables

3. **SSL/TLS**
   - Use Let's Encrypt
   - Or Cloudflare proxy

4. **Regular Updates**
   - Keep Docker updated
   - Update container images
   - Patch security vulnerabilities

5. **Disable Unnecessary Services**
   - Comment out Mongo Express in production
   - Restrict access to sensitive ports

## 📞 Support

### Documentation
- DEPLOYMENT_GUIDE.md - Detailed guide
- DEPLOYMENT_README.md - Quick reference
- API_DOCUMENTATION.md - API reference

### Commands Reference
```bash
# Deploy
./deploy.sh

# Update
git pull && docker-compose -f docker-compose.prod.yml up -d --build

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Status
docker-compose -f docker-compose.prod.yml ps

# Restart
docker-compose -f docker-compose.prod.yml restart

# Stop
docker-compose -f docker-compose.prod.yml down

# Backup
./backup.sh
```

## 🎉 Success Metrics

Your deployment is successful when:

✅ All containers are running  
✅ Health check returns 200  
✅ API accessible via domain  
✅ Swagger documentation loads  
✅ Can register and login users  
✅ Database queries work  
✅ Redis caching works  
✅ No errors in logs  

---

## 📝 Next Steps

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Add production deployment configuration"
   git push origin main
   ```

2. **Deploy to VPS**
   - Follow Quick Deploy steps above

3. **Configure Domain**
   - Point DNS to VPS
   - Setup SSL

4. **Test Everything**
   - API endpoints
   - Authentication
   - Database operations
   - File uploads (if any)

5. **Monitor & Maintain**
   - Set up automated backups
   - Configure monitoring
   - Review logs regularly

---

**🚀 Chúc bạn deploy thành công!**

Tất cả configuration files đã sẵn sàng. Chỉ cần push code lên Git và chạy deploy script trên VPS là xong!

