#!/bin/bash
# SSL Setup Script with Let's Encrypt - Fixed Email Validation

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

# Validate email function
validate_email() {
    local email=$1
    # Check if email contains non-ASCII characters
    if [[ ! "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 1
    fi
    return 0
}

# Get domain name
while true; do
    read -p "Enter your domain name (e.g., api.yourdomain.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        echo -e "${RED}Domain cannot be empty!${NC}"
        continue
    fi
    
    # Check if domain resolves to this server
    DOMAIN_IP=$(dig +short "$DOMAIN" | tail -n1)
    SERVER_IP=$(curl -s ifconfig.me)
    
    if [ -z "$DOMAIN_IP" ]; then
        echo -e "${YELLOW}Warning: Domain '$DOMAIN' does not resolve to any IP${NC}"
        read -p "Continue anyway? (y/n): " CONTINUE
        if [ "$CONTINUE" != "y" ]; then
            continue
        fi
    elif [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
        echo -e "${YELLOW}Warning: Domain '$DOMAIN' resolves to $DOMAIN_IP but this server IP is $SERVER_IP${NC}"
        read -p "Continue anyway? (y/n): " CONTINUE
        if [ "$CONTINUE" != "y" ]; then
            continue
        fi
    fi
    break
done

# Get email
while true; do
    read -p "Enter your email (NO Vietnamese characters, e.g., admin@example.com): " EMAIL
    if [ -z "$EMAIL" ]; then
        echo -e "${RED}Email cannot be empty!${NC}"
        continue
    fi
    
    if ! validate_email "$EMAIL"; then
        echo -e "${RED}Invalid email format or contains non-ASCII characters!${NC}"
        echo -e "${YELLOW}Please use only English letters (a-z, A-Z), numbers, and standard email symbols${NC}"
        echo -e "${YELLOW}Example: admin@domain.com, user123@example.com${NC}"
        continue
    fi
    break
done

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
docker-compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true

# Step 3: Get certificate
echo -e "${GREEN}Obtaining SSL certificate...${NC}"
certbot certonly --standalone \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --preferred-challenges http

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to obtain certificate!${NC}"
    echo ""
    echo "Common issues:"
    echo "1. Port 80 is not open in firewall"
    echo "   Fix: sudo ufw allow 80/tcp"
    echo ""
    echo "2. Domain DNS doesn't point to this server"
    echo "   Fix: Add A record pointing $DOMAIN to your server IP"
    echo "   Check: nslookup $DOMAIN"
    echo ""
    echo "3. Another service is using port 80"
    echo "   Fix: Stop other services on port 80"
    echo ""
    exit 1
fi

# Step 4: Copy certificates to project
echo -e "${GREEN}Copying certificates...${NC}"
mkdir -p /opt/vmp-api/docker/ssl
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" /opt/vmp-api/docker/ssl/cert.pem
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" /opt/vmp-api/docker/ssl/key.pem
chmod 644 /opt/vmp-api/docker/ssl/*.pem

# Step 5: Update nginx config
echo -e "${GREEN}Updating nginx configuration...${NC}"
cd /opt/vmp-api

# Backup current nginx config
cp docker/nginx.conf docker/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# Use the pre-made HTTPS config
echo -e "${GREEN}Copying HTTPS nginx configuration...${NC}"
cp docker/nginx-https.conf docker/nginx.conf

# Keep the manual config creation as fallback
if [ ! -f docker/nginx-https.conf ]; then
    echo -e "${YELLOW}nginx-https.conf not found, creating manually...${NC}"
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
fi

# Step 6: Start nginx with SSL
echo -e "${GREEN}Starting nginx with SSL...${NC}"
docker-compose -f docker-compose.prod.yml up -d nginx

# Wait for nginx to start
sleep 3

# Check nginx status
if docker-compose -f docker-compose.prod.yml ps | grep -q "vmp-nginx.*Up"; then
    echo -e "${GREEN}Nginx started successfully!${NC}"
else
    echo -e "${RED}Nginx failed to start. Checking logs...${NC}"
    docker-compose -f docker-compose.prod.yml logs nginx --tail 20
    exit 1
fi

# Step 7: Setup auto-renewal
echo -e "${GREEN}Setting up automatic renewal...${NC}"
RENEWAL_CMD="certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/vmp-api/docker/ssl/cert.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/vmp-api/docker/ssl/key.pem && docker-compose -f /opt/vmp-api/docker-compose.prod.yml restart nginx"

# Remove old cron job if exists
crontab -l 2>/dev/null | grep -v "certbot renew" | crontab -

# Add new cron job
(crontab -l 2>/dev/null; echo "0 3 * * * $RENEWAL_CMD") | crontab -

# Step 8: Test SSL
echo ""
echo -e "${GREEN}✅ SSL setup completed successfully!${NC}"
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
echo "Check SSL grade:"
echo "https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""

