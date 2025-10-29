#!/bin/bash
# VMP API Deployment Script for VPS

set -e

echo "🚀 VMP API Deployment Script"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/vmp-api"
REPO_URL="https://github.com/yourusername/vmp-api.git"
BRANCH="main"

# Function to print colored messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Install Docker and Docker Compose if not installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
    print_status "Docker installed successfully"
else
    print_status "Docker is already installed"
fi

if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Step 2: Create project directory
if [ ! -d "$PROJECT_DIR" ]; then
    print_status "Creating project directory..."
    mkdir -p $PROJECT_DIR
fi

cd $PROJECT_DIR

# Step 3: Clone or pull repository
if [ ! -d ".git" ]; then
    print_status "Cloning repository..."
    git clone -b $BRANCH $REPO_URL .
else
    print_status "Pulling latest changes..."
    git fetch origin
    git reset --hard origin/$BRANCH
fi

# Step 4: Check for .env.production file
if [ ! -f ".env.production" ]; then
    print_warning "Creating .env.production from example..."
    cp .env.production.example .env.production
    print_error "⚠️  IMPORTANT: Please edit .env.production with your actual values!"
    print_error "Run: nano $PROJECT_DIR/.env.production"
    print_error "Then run this script again."
    exit 1
fi

# Step 5: Create required directories
print_status "Creating required directories..."
mkdir -p docker/ssl
mkdir -p logs

# Step 6: Stop existing containers
if [ "$(docker ps -q -f name=vmp-)" ]; then
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down
fi

# Step 7: Build and start containers
print_status "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

print_status "Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# Step 8: Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Step 9: Check container status
print_status "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

# Step 10: Display logs
print_status "Recent API logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20 api

# Step 11: Health check
print_status "Running health check..."
sleep 5
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "Health check passed! ✓"
else
    print_error "Health check failed!"
    print_error "Check logs with: docker-compose -f docker-compose.prod.yml logs api"
    exit 1
fi

# Step 12: Setup firewall (optional)
if command -v ufw &> /dev/null; then
    print_status "Configuring firewall..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
fi

# Deployment complete
echo ""
echo "================================"
print_status "Deployment completed successfully! 🎉"
echo "================================"
echo ""
echo "📋 Next Steps:"
echo "1. Access API: http://$(curl -s ifconfig.me):3000/api/v1"
echo "2. Access Swagger: http://$(curl -s ifconfig.me):3000/docs"
echo "3. Access Health: http://$(curl -s ifconfig.me):3000/health"
echo ""
echo "🔧 Useful Commands:"
echo "  View logs:     docker-compose -f docker-compose.prod.yml logs -f api"
echo "  Restart:       docker-compose -f docker-compose.prod.yml restart api"
echo "  Stop all:      docker-compose -f docker-compose.prod.yml down"
echo "  Update app:    cd $PROJECT_DIR && sudo ./deploy.sh"
echo ""
echo "⚠️  Don't forget to:"
echo "  - Configure SSL certificates in docker/ssl/"
echo "  - Update CORS_ORIGINS in .env.production"
echo "  - Set up a domain name"
echo "  - Configure backups for MongoDB"
echo ""

