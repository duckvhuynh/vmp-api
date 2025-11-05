#!/bin/bash
# SSL Setup Script with Let's Encrypt

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔐 SSL Certificate Setup with Let's Encrypt"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., api.yourdomain.com): " DOMAIN
read -p "Enter your email for Let's Encrypt: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}Domain and email are required!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Domain: $DOMAIN${NC}"
echo -e "${YELLOW}Email: $EMAIL${NC}"
echo ""
read -p "Is this correct? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Aborted."
    exit 1
fi

# Step 1: Install Certbot
echo -e "${GREEN}Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt update
    apt install -y certbot
    echo -e "${GREEN}Certbot installed${NC}"
else
    echo -e "${GREEN}Certbot already installed${NC}"
fi

# Step 2: Stop nginx temporarily
echo -e "${GREEN}Stopping nginx temporarily...${NC}"
cd /opt/vmp-api
docker-compose -f docker-compose.prod.yml stop nginx

# Step 3: Get certificate
echo -e "${GREEN}Obtaining SSL certificate...${NC}"
certbot certonly --standalone \
    -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --preferred-challenges http

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to obtain certificate!${NC}"
    echo "Make sure:"
    echo "1. Port 80 is open in firewall"
    echo "2. Domain DNS points to this server IP"
    echo "3. No other service is using port 80"
    exit 1
fi

# Step 4: Copy certificates to project
echo -e "${GREEN}Copying certificates...${NC}"
mkdir -p /opt/vmp-api/docker/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/vmp-api/docker/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/vmp-api/docker/ssl/key.pem
chmod 644 /opt/vmp-api/docker/ssl/*.pem

# Step 5: Update nginx config
echo -e "${GREEN}Updating nginx configuration...${NC}"
cd /opt/vmp-api

# Backup nginx config
cp docker/nginx.conf docker/nginx.conf.backup

# Update nginx config to enable SSL
cat > docker/nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_req_status 429;

    # Upstream API
    upstream api_backend {
        server api:3000;
    }

    # HTTP Server - Redirect to HTTPS
    server {
        listen 80;
        server_name _;

        # Allow health checks on HTTP
        location /health {
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
        }

        # Redirect all other traffic to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl;
        http2 on;
        server_name _;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # SSL Settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # API Endpoints
        location /api/ {
            limit_req zone=api_limit burst=50 nodelay;
            
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            
            # Headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Swagger Documentation
        location /docs {
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health Check
        location /health {
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            access_log off;
        }

        # Root
        location / {
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
NGINX_EOF

# Step 6: Start nginx with SSL
echo -e "${GREEN}Starting nginx with SSL...${NC}"
docker-compose -f docker-compose.prod.yml up -d nginx

# Step 7: Setup auto-renewal
echo -e "${GREEN}Setting up automatic renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/vmp-api/docker/ssl/cert.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/vmp-api/docker/ssl/key.pem && docker-compose -f /opt/vmp-api/docker-compose.prod.yml restart nginx") | crontab -

# Step 8: Test SSL
echo ""
echo -e "${GREEN}SSL setup completed!${NC}"
echo ""
echo "Your API is now accessible at:"
echo -e "${GREEN}https://$DOMAIN/api/v1${NC}"
echo -e "${GREEN}https://$DOMAIN/docs${NC}"
echo ""
echo "Certificate auto-renewal is configured (daily at 3 AM)"
echo ""
echo "Test your SSL:"
echo "curl https://$DOMAIN/health"
echo ""

