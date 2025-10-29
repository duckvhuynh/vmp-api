# VMP API - Production Deployment Guide

## 📋 Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04 LTS or later (recommended)
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **CPU**: 2 cores minimum
- **Network**: Public IP address

### Required Software (will be installed by script)
- Docker 20.10+
- Docker Compose 2.0+
- Git

## 🚀 Quick Deployment (Automated)

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### Step 2: Download and Run Deployment Script

```bash
# Create deployment directory
mkdir -p /opt/vmp-api && cd /opt/vmp-api

# Download deployment script
curl -o deploy.sh https://raw.githubusercontent.com/yourusername/vmp-api/main/deploy.sh

# Make it executable
chmod +x deploy.sh

# Run deployment
sudo ./deploy.sh
```

The script will:
1. ✅ Install Docker and Docker Compose
2. ✅ Clone the repository
3. ✅ Create necessary directories
4. ✅ Set up environment files
5. ✅ Build Docker images
6. ✅ Start all services
7. ✅ Run health checks

### Step 3: Configure Environment Variables

After first run, edit the production environment file:

```bash
nano /opt/vmp-api/.env.production
```

Update these critical values:

```env
# Change these!
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
MONGO_ROOT_PASSWORD=your-strong-mongodb-password
REDIS_PASSWORD=your-strong-redis-password
CORS_ORIGINS=https://yourdomain.com
```

Save (Ctrl+X, then Y, then Enter)

### Step 4: Run Deployment Again

```bash
sudo ./deploy.sh
```

## 🔧 Manual Deployment (Alternative)

### 1. Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
apt install git -y
```

### 2. Clone Repository

```bash
cd /opt
git clone https://github.com/yourusername/vmp-api.git
cd vmp-api
```

### 3. Configure Environment

```bash
# Copy example to production
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

### 4. Start Services

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔐 SSL/HTTPS Configuration

### Option 1: Using Let's Encrypt (Recommended)

```bash
# Install Certbot
apt install certbot -y

# Get SSL certificate
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to project
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/vmp-api/docker/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/vmp-api/docker/ssl/key.pem

# Update nginx.conf to use SSL (uncomment SSL lines)
nano /opt/vmp-api/docker/nginx.conf

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Option 2: Using Cloudflare (Easier)

1. Point your domain to VPS IP in Cloudflare DNS
2. Enable Cloudflare proxy (orange cloud)
3. Set SSL mode to "Full" in Cloudflare
4. Cloudflare handles SSL automatically

## 🌐 Domain Configuration

### Update DNS Records

Add these A records in your domain provider:

```
A    @           your-vps-ip
A    www         your-vps-ip
A    api         your-vps-ip
```

### Update CORS Origins

Edit `.env.production`:

```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://api.yourdomain.com
```

Restart API:

```bash
docker-compose -f docker-compose.prod.yml restart api
```

## 🔄 Updates and Maintenance

### Update Application

```bash
cd /opt/vmp-api
sudo ./deploy.sh
```

Or manually:

```bash
cd /opt/vmp-api
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# API only
docker-compose -f docker-compose.prod.yml logs -f api

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 api
```

### Restart Services

```bash
# Restart API only
docker-compose -f docker-compose.prod.yml restart api

# Restart all
docker-compose -f docker-compose.prod.yml restart

# Stop all
docker-compose -f docker-compose.prod.yml down

# Start all
docker-compose -f docker-compose.prod.yml up -d
```

## 💾 Backup Strategy

### Backup MongoDB

```bash
# Create backup script
cat > /opt/vmp-api/backup-mongo.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/vmp-api/backups/mongo"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker exec vmp-mongo-prod mongodump --out=/tmp/backup
docker cp vmp-mongo-prod:/tmp/backup $BACKUP_DIR/backup_$DATE
docker exec vmp-mongo-prod rm -rf /tmp/backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE
# Keep only last 7 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs -r rm
echo "Backup completed: backup_$DATE.tar.gz"
EOF

chmod +x /opt/vmp-api/backup-mongo.sh
```

### Automate Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/vmp-api/backup-mongo.sh >> /var/log/vmp-backup.log 2>&1
```

### Restore from Backup

```bash
# Extract backup
tar -xzf /opt/vmp-api/backups/mongo/backup_YYYYMMDD_HHMMSS.tar.gz

# Copy to container
docker cp backup_YYYYMMDD_HHMMSS vmp-mongo-prod:/tmp/

# Restore
docker exec vmp-mongo-prod mongorestore /tmp/backup_YYYYMMDD_HHMMSS
```

## 📊 Monitoring

### Check Service Health

```bash
# API health
curl http://localhost:3000/health

# MongoDB
docker exec vmp-mongo-prod mongosh --eval "db.adminCommand('ping')"

# Redis
docker exec vmp-redis-prod redis-cli ping
```

### Monitor Resources

```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

### Access Mongo Express

Navigate to: `http://your-vps-ip:8081`

- Username: (from .env.production ME_USERNAME)
- Password: (from .env.production ME_PASSWORD)

**⚠️ Security Warning**: Disable Mongo Express in production or restrict access with firewall.

## 🔒 Security Best Practices

### 1. Firewall Configuration

```bash
# Install UFW
apt install ufw -y

# Configure rules
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Enable firewall
ufw enable
```

### 2. Secure SSH

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Disable root login
PermitRootLogin no

# Use key-based authentication
PasswordAuthentication no

# Restart SSH
systemctl restart ssh
```

### 3. Regular Updates

```bash
# System updates
apt update && apt upgrade -y

# Docker updates
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Change Default Ports

To avoid automated attacks, consider changing MongoDB and Redis ports in `docker-compose.prod.yml`.

## 🐛 Troubleshooting

### API Not Starting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api

# Check if port is in use
netstat -tulpn | grep 3000

# Restart API
docker-compose -f docker-compose.prod.yml restart api
```

### MongoDB Connection Issues

```bash
# Check MongoDB logs
docker-compose -f docker-compose.prod.yml logs mongo

# Check if MongoDB is running
docker ps | grep mongo

# Restart MongoDB
docker-compose -f docker-compose.prod.yml restart mongo
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Remove old logs
docker-compose -f docker-compose.prod.yml logs --tail=0 -f > /dev/null 2>&1
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Reduce Redis memory
# Edit docker-compose.prod.yml and change --maxmemory value
```

## 📈 Performance Optimization

### Enable Redis Persistence

Edit `docker-compose.prod.yml`:

```yaml
redis:
  command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
```

### MongoDB Indexes

```bash
docker exec -it vmp-mongo-prod mongosh -u admin -p

use vmp
db.bookings.createIndex({ status: 1, pickupAt: 1 })
db.drivers.createIndex({ "location.coordinates": "2dsphere" })
```

### Nginx Caching

Already configured in `docker/nginx.conf`. Adjust cache settings as needed.

## 🎯 Post-Deployment Checklist

- [ ] API is accessible via domain
- [ ] Swagger docs working
- [ ] Health check passing
- [ ] SSL certificate installed
- [ ] CORS configured correctly
- [ ] Environment variables secured
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring set up
- [ ] Logs accessible
- [ ] DNS records updated
- [ ] Test user registration
- [ ] Test quote creation
- [ ] Test booking flow

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables
3. Check firewall rules
4. Review this guide
5. Contact support: support@example.com

## 🔄 Quick Commands Reference

```bash
# Deploy/Update
cd /opt/vmp-api && sudo ./deploy.sh

# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Restart
docker-compose -f docker-compose.prod.yml restart

# Stop
docker-compose -f docker-compose.prod.yml down

# Start
docker-compose -f docker-compose.prod.yml up -d

# Backup
/opt/vmp-api/backup-mongo.sh

# Health check
curl http://localhost:3000/health

# Container stats
docker stats
```

---

**🎉 Your VMP API is now running in production!**

Access it at: `https://yourdomain.com/api/v1`

