# 🔐 SSL Setup Guide

## Quick Start

### Prerequisites
- ✅ Domain đã trỏ DNS về VPS (A record)
- ✅ Port 80 và 443 đã mở trong firewall
- ✅ API đang chạy thành công

### Setup SSL với Let's Encrypt

```bash
cd /opt/vmp-api
git pull origin main
sudo ./setup-ssl-fixed.sh
```

Nhập:
- **Domain**: `api.yourdomain.com`
- **Email**: Email không dấu tiếng Việt (e.g., `admin@example.com`)

---

## Manual Setup (Nếu Script Lỗi)

### Step 1: Lấy SSL Certificate

```bash
# Stop nginx
cd /opt/vmp-api
docker-compose -f docker-compose.prod.yml stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d api.yourdomain.com \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com
```

### Step 2: Copy Certificates

```bash
# Create SSL directory
sudo mkdir -p /opt/vmp-api/docker/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem /opt/vmp-api/docker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem /opt/vmp-api/docker/ssl/key.pem
sudo chmod 644 /opt/vmp-api/docker/ssl/*.pem
```

### Step 3: Enable HTTPS in Nginx

```bash
cd /opt/vmp-api

# Backup current config
cp docker/nginx.conf docker/nginx.conf.backup

# Use HTTPS config
cp docker/nginx-https.conf docker/nginx.conf
```

### Step 4: Restart Nginx

```bash
docker-compose -f docker-compose.prod.yml up -d nginx

# Check logs
docker-compose -f docker-compose.prod.yml logs nginx --tail 20
```

### Step 5: Test SSL

```bash
# Test from VPS
curl https://api.yourdomain.com/health

# Expected output:
# {"status":"ok","info":{...}}
```

---

## Nginx Configurations

### HTTP Only (Default)
File: `docker/nginx.conf`
- Listens on port 80
- No SSL
- Use for initial deployment

### HTTPS (After SSL Setup)
File: `docker/nginx-https.conf`
- Listens on ports 80 and 443
- Redirects HTTP → HTTPS
- SSL enabled
- Use after getting certificates

### Switch Between Configs

```bash
# Switch to HTTP only
cd /opt/vmp-api
cp docker/nginx-http.conf docker/nginx.conf
docker-compose -f docker-compose.prod.yml restart nginx

# Switch to HTTPS
cd /opt/vmp-api
cp docker/nginx-https.conf docker/nginx.conf
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## Auto-Renewal Setup

Certificates expire after 90 days. Setup auto-renewal:

```bash
# Add cron job
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem /opt/vmp-api/docker/ssl/cert.pem && cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem /opt/vmp-api/docker/ssl/key.pem && docker-compose -f /opt/vmp-api/docker-compose.prod.yml restart nginx") | crontab -

# Verify cron job
crontab -l
```

---

## Troubleshooting

### Nginx Won't Start - SSL Certificate Error

**Error:**
```
nginx: [emerg] no "ssl_certificate" is defined
```

**Fix:**
```bash
# Check if certificates exist
ls -la /opt/vmp-api/docker/ssl/

# If missing, copy them
sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem /opt/vmp-api/docker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem /opt/vmp-api/docker/ssl/key.pem
sudo chmod 644 /opt/vmp-api/docker/ssl/*.pem

# Restart nginx
docker-compose -f /opt/vmp-api/docker-compose.prod.yml restart nginx
```

### Certbot Failed - Domain Not Resolving

**Error:**
```
Domain doesn't resolve to this server
```

**Fix:**
```bash
# Check DNS
nslookup api.yourdomain.com

# Should return your VPS IP
# If not, wait 5-30 minutes for DNS propagation
```

### Certbot Failed - Port 80 Busy

**Error:**
```
Problem binding to port 80
```

**Fix:**
```bash
# Stop nginx temporarily
docker-compose -f /opt/vmp-api/docker-compose.prod.yml stop nginx

# Try certbot again
sudo certbot certonly --standalone -d api.yourdomain.com ...

# Start nginx
docker-compose -f /opt/vmp-api/docker-compose.prod.yml start nginx
```

### Invalid Email Error

**Error:**
```
The ACME server believes ... is an invalid email address
```

**Fix:**
Use email WITHOUT Vietnamese characters (no dấu):
- ✅ `admin@example.com`
- ✅ `user123@domain.com`
- ❌ `nguyễn@example.com`

---

## Check SSL Grade

After setup, test your SSL configuration:

```bash
# Using SSL Labs (online)
https://www.ssllabs.com/ssltest/analyze.html?d=api.yourdomain.com

# Using curl
curl -vI https://api.yourdomain.com 2>&1 | grep -i ssl

# Check certificate expiry
echo | openssl s_client -servername api.yourdomain.com -connect api.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Files Structure

```
/opt/vmp-api/
├── docker/
│   ├── nginx.conf              # Current nginx config (HTTP by default)
│   ├── nginx-http.conf         # HTTP-only config
│   ├── nginx-https.conf        # HTTPS config (with SSL)
│   └── ssl/                    # SSL certificates directory
│       ├── cert.pem            # SSL certificate (copied from Let's Encrypt)
│       └── key.pem             # SSL private key (copied from Let's Encrypt)
├── setup-ssl-fixed.sh          # Automated SSL setup script
└── docker-compose.prod.yml     # Production docker compose (mounts ssl/)
```

---

## Security Best Practices

1. ✅ Use strong SSL protocols (TLSv1.2, TLSv1.3)
2. ✅ Keep certificates updated (auto-renewal)
3. ✅ Use HTTPS for all API traffic
4. ✅ Enable security headers (already configured)
5. ✅ Rate limiting enabled (100 req/s)
6. ✅ Restrict MongoDB/Redis access (not exposed publicly)

---

**Last Updated:** November 5, 2025

