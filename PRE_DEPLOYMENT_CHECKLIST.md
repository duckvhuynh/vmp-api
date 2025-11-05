# 📋 Pre-Deployment Checklist for VPS

## ✅ Before Pushing to Git

### Code Review
- [ ] All TypeScript compilation errors resolved
- [ ] No console.log statements in production code
- [ ] All TODO comments addressed or documented
- [ ] Environment-specific code properly configured
- [ ] Error handling complete
- [ ] Input validation on all endpoints
- [ ] Sensitive data not hardcoded

### Configuration Files
- [ ] `.env.production.example` created with all required variables
- [ ] `.gitignore` updated (excludes .env.production, SSL certs)
- [ ] `docker-compose.prod.yml` reviewed
- [ ] `Dockerfile` optimized for production
- [ ] `nginx.conf` configured correctly
- [ ] `deploy.sh` script tested locally

### Documentation
- [ ] README.md updated
- [ ] API_DOCUMENTATION.md complete
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] All endpoints documented in Swagger
- [ ] Environment variables documented

### Security
- [ ] JWT_SECRET placeholder in example file
- [ ] No real passwords in code
- [ ] No API keys committed
- [ ] SSL configuration prepared
- [ ] CORS origins configurable via env

### Build & Test
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Health endpoint working
- [ ] Swagger documentation generating correctly

## ✅ Git Repository Setup

### Repository Configuration
- [ ] GitHub/GitLab repository created
- [ ] Repository is private (if needed)
- [ ] .gitignore properly configured
- [ ] README.md in place

### Push Code
```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Production ready deployment"

# Add remote
git remote add origin https://github.com/duckvhuynh/vmp-api.git

# Push
git push -u origin main
```

## ✅ VPS Preparation

### VPS Provider
- [ ] VPS purchased/rented (DigitalOcean, AWS, Vultr, etc.)
- [ ] OS: Ubuntu 20.04+ or Debian 11+
- [ ] Minimum: 2GB RAM, 2 CPU, 20GB storage
- [ ] Public IP address assigned
- [ ] SSH access configured

### Initial VPS Setup
```bash
# SSH to VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Set timezone
timedatectl set-timezone Asia/Ho_Chi_Minh

# Set hostname
hostnamectl set-hostname your-api-server

# Create swap file (if needed)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Security Hardening
```bash
# Create non-root user
adduser deploy
usermod -aG sudo deploy

# Disable root SSH login
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart sshd

# Setup firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## ✅ Domain Configuration (Optional)

### DNS Setup
- [ ] Domain purchased
- [ ] A record pointing to VPS IP
- [ ] WWW CNAME record (optional)
- [ ] DNS propagated (use: `dig yourdomain.com`)

### Example DNS Records
```
Type    Name    Value           TTL
A       @       your-vps-ip     3600
A       api     your-vps-ip     3600
CNAME   www     yourdomain.com  3600
```

## ✅ SSL Certificate (Optional but Recommended)

### Option 1: Let's Encrypt
```bash
# Install Certbot
apt install certbot -y

# Stop nginx (if running)
docker-compose -f docker-compose.prod.yml down nginx

# Get certificate
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy to project
mkdir -p /opt/vmp-api/docker/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/vmp-api/docker/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/vmp-api/docker/ssl/key.pem
```

### Option 2: Cloudflare
- [ ] Domain added to Cloudflare
- [ ] DNS records configured
- [ ] Proxy enabled (orange cloud)
- [ ] SSL mode: Full or Full (strict)

## ✅ Deployment

### Run Deployment Script
```bash
# Download script
curl -o /tmp/deploy.sh https://raw.githubusercontent.com/duckvhuynh/vmp-api/main/deploy.sh

# Make executable (on Linux)
chmod +x /tmp/deploy.sh

# Run
sudo /tmp/deploy.sh
```

### Configure Environment
```bash
# Navigate to project
cd /opt/vmp-api

# Edit production environment
nano .env.production
```

**Required Changes:**
```env
JWT_SECRET=your-unique-32-character-secret-here-change-this
MONGO_ROOT_PASSWORD=your-strong-mongo-password
REDIS_PASSWORD=your-strong-redis-password
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Redeploy with New Configuration
```bash
cd /opt/vmp-api
sudo ./deploy.sh
```

## ✅ Post-Deployment Verification

### Health Checks
```bash
# API health
curl http://localhost:3000/health

# Expected response: {"status":"ok","timestamp":"..."}
```

```bash
# Full health check
curl http://localhost:3000/health/ready

# Expected: {"status":"ready","timestamp":"...","services":{...}}
```

### Container Status
```bash
cd /opt/vmp-api
docker-compose -f docker-compose.prod.yml ps

# All containers should show "Up"
```

### Service Tests
```bash
# MongoDB
docker exec vmp-mongo-prod mongosh --eval "db.adminCommand('ping')"

# Redis
docker exec vmp-redis-prod redis-cli -a $REDIS_PASSWORD ping

# Nginx
curl -I http://localhost:80
```

### Logs Review
```bash
# Check for errors
docker-compose -f docker-compose.prod.yml logs --tail=100

# API logs specifically
docker-compose -f docker-compose.prod.yml logs --tail=50 api
```

## ✅ API Testing

### Test Endpoints

**Health Check:**
```bash
curl http://your-vps-ip:3000/health
```

**Swagger Documentation:**
```bash
# Open in browser
http://your-vps-ip:3000/docs
```

**Register User:**
```bash
curl -X POST http://your-vps-ip:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

**Login:**
```bash
curl -X POST http://your-vps-ip:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

**Create Quote:**
```bash
curl -X POST http://your-vps-ip:3000/api/v1/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"type": "airport", "airportCode": "HAN", "latitude": 21.2187, "longitude": 105.8067},
    "destination": {"type": "address", "address": "Old Quarter, Hanoi", "latitude": 21.0285, "longitude": 105.8542},
    "pickupAt": "2025-12-01T10:00:00.000Z",
    "pax": 2,
    "bags": 2
  }'
```

## ✅ Monitoring Setup

### Log Monitoring
```bash
# Install log viewer (optional)
apt install multitail -y

# View logs
multitail -l "docker-compose -f /opt/vmp-api/docker-compose.prod.yml logs -f"
```

### System Monitoring
```bash
# Install htop
apt install htop -y

# Monitor resources
htop
```

### Uptime Monitoring (External)
- [ ] Setup UptimeRobot (free)
- [ ] Setup Pingdom
- [ ] Setup StatusCake
- [ ] Configure alerts

## ✅ Backup Configuration

### Create Backup Script
```bash
nano /opt/vmp-api/backup.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/opt/vmp-api/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec vmp-mongo-prod mongodump --out=/tmp/backup
docker cp vmp-mongo-prod:/tmp/backup $BACKUP_DIR/mongo_$DATE
docker exec vmp-mongo-prod rm -rf /tmp/backup
tar -czf $BACKUP_DIR/mongo_$DATE.tar.gz -C $BACKUP_DIR mongo_$DATE
rm -rf $BACKUP_DIR/mongo_$DATE

# Keep only last 7 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: $DATE"
```

```bash
# Make executable
chmod +x /opt/vmp-api/backup.sh

# Test backup
/opt/vmp-api/backup.sh
```

### Schedule Automatic Backups
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/vmp-api/backup.sh >> /var/log/vmp-backup.log 2>&1
```

## ✅ Performance Optimization

### Database Indexes
Already created in mongo-init.js, verify:
```bash
docker exec -it vmp-mongo-prod mongosh -u admin -p

use vmp
db.users.getIndexes()
db.bookings.getIndexes()
```

### Redis Configuration
Verify memory limit:
```bash
docker exec vmp-redis-prod redis-cli -a $REDIS_PASSWORD CONFIG GET maxmemory
```

### Nginx Tuning
Already optimized in nginx.conf:
- Gzip compression ✓
- HTTP/2 support ✓
- Rate limiting ✓

## ✅ Security Final Checks

### Passwords Changed
- [ ] JWT_SECRET is unique and strong
- [ ] MongoDB root password changed
- [ ] Redis password set
- [ ] Mongo Express credentials changed

### Firewall Active
```bash
ufw status
# Should show: Status: active
```

### SSL Certificate
- [ ] Certificate installed
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] Certificate auto-renewal configured

### Sensitive Ports
```bash
# Check open ports
netstat -tuln | grep LISTEN

# Only these should be accessible externally:
# 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

## ✅ Production Readiness

### Essential
- [ ] All containers running
- [ ] Health checks passing
- [ ] API accessible
- [ ] Database connected
- [ ] Redis connected
- [ ] Logs clean (no errors)

### Important
- [ ] Domain configured
- [ ] SSL installed
- [ ] CORS configured
- [ ] Backups scheduled
- [ ] Monitoring setup

### Optional but Recommended
- [ ] Error tracking (Sentry)
- [ ] APM monitoring (New Relic, DataDog)
- [ ] CDN setup (Cloudflare)
- [ ] Load balancer (if needed)

## 🎉 Final Verification

Run this comprehensive check:

```bash
#!/bin/bash
echo "=== VMP API Deployment Verification ==="
echo ""
echo "1. Container Status:"
docker-compose -f /opt/vmp-api/docker-compose.prod.yml ps
echo ""
echo "2. Health Check:"
curl -s http://localhost:3000/health | jq
echo ""
echo "3. MongoDB:"
docker exec vmp-mongo-prod mongosh --quiet --eval "db.adminCommand('ping')"
echo ""
echo "4. Redis:"
docker exec vmp-redis-prod redis-cli -a $REDIS_PASSWORD ping
echo ""
echo "5. Disk Space:"
df -h | grep -E '^/dev/'
echo ""
echo "6. Memory:"
free -h
echo ""
echo "=== All checks complete ==="
```

## 📞 Troubleshooting

If any checks fail, consult:
- `docker-compose -f docker-compose.prod.yml logs`
- DEPLOYMENT_GUIDE.md
- VPS_DEPLOYMENT_SUMMARY.md

## ✅ Success Indicators

Your deployment is production-ready when:

✅ All containers show "Up" status  
✅ Health endpoint returns 200  
✅ Swagger documentation loads  
✅ Can register and login users  
✅ Can create quotes  
✅ Database operations work  
✅ No errors in logs  
✅ SSL certificate active (if configured)  
✅ Backups working  
✅ Monitoring active  

---

**🎊 Congratulations! Your VMP API is live!**

Access your API at: `https://yourdomain.com/api/v1` or `http://your-vps-ip:3000/api/v1`

