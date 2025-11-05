# 🔧 Fix Environment Variables Issue

## Vấn đề
MongoDB và các services khác không nhận được environment variables từ `.env.production`

## Giải pháp

### Option 1: Export Environment Variables (Khuyến nghị)

```bash
# SSH vào VPS
cd /opt/vmp-api

# Load environment variables
export $(cat .env.production | xargs)

# Verify they're loaded
echo $JWT_SECRET
echo $MONGO_ROOT_PASSWORD

# Now run docker-compose
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Option 2: Use --env-file flag

```bash
cd /opt/vmp-api

# Stop containers
docker-compose -f docker-compose.prod.yml down

# Start with env file
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Option 3: Update deploy.sh to use --env-file

Update line in deploy.sh:
```bash
# Change this line:
docker-compose -f docker-compose.prod.yml up -d

# To this:
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## Quick Fix Commands

Run these on your VPS:

```bash
# Navigate to project
cd /opt/vmp-api

# Stop all containers
docker-compose -f docker-compose.prod.yml down -v

# Load environment
set -a
source .env.production
set +a

# Verify
echo "JWT_SECRET: $JWT_SECRET"
echo "MONGO_ROOT_PASSWORD: $MONGO_ROOT_PASSWORD"
echo "REDIS_PASSWORD: $REDIS_PASSWORD"

# Start with environment
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs mongo
```

## Verify MongoDB is Working

```bash
# Check MongoDB logs
docker-compose -f docker-compose.prod.yml logs mongo

# Should see: "MongoDB starting"

# Test MongoDB connection
docker exec vmp-mongo-prod mongosh --eval "db.adminCommand('ping')"
```

