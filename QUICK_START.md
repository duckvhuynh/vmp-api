# VMP API - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Docker and Docker Compose installed
- Git installed

### Step 1: Clone & Install

```bash
# Navigate to project directory
cd vmp-api

# Install dependencies
npm install
```

### Step 2: Start Services

```bash
# Start MongoDB and Redis with Docker
docker-compose up -d

# Verify services are running
docker-compose ps
```

### Step 3: Configure Environment

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/vmp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-at-least-16-characters-long
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Step 4: Run the API

```bash
# Development mode with hot reload
npm run dev

# Or build and run production mode
npm run build
npm run start:prod
```

### Step 5: Test the API

Open your browser and navigate to:
- **Swagger UI**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## 📝 First API Calls

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "StrongP@ssw0rd",
    "phone": "+230 1234 5678"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2. Get a Quote

```bash
curl -X POST http://localhost:3000/api/v1/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {
      "type": "airport",
      "airportCode": "MRU",
      "latitude": -20.4317,
      "longitude": 57.5529
    },
    "destination": {
      "type": "address",
      "address": "Grand Baie, Mauritius",
      "latitude": -20.0219,
      "longitude": 57.5809
    },
    "pickupAt": "2025-11-15T10:00:00.000Z",
    "pax": 2,
    "bags": 2
  }'
```

### 3. Access Protected Endpoints

```bash
# Use the access token from login/register
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🎯 Common Tasks

### View Logs

```bash
# Docker logs
docker-compose logs -f

# Application logs (when running with npm)
# Logs appear in console
```

### Stop Services

```bash
# Stop API (Ctrl+C in terminal)

# Stop Docker services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Rebuild After Changes

```bash
# Rebuild TypeScript
npm run build

# Restart containers
docker-compose restart
```

### Access MongoDB

```bash
# Connect to MongoDB shell
docker exec -it vmp-api-mongodb-1 mongosh vmp

# Or use MongoDB Compass
# Connection string: mongodb://localhost:27017/vmp
```

### Access Redis

```bash
# Connect to Redis CLI
docker exec -it vmp-api-redis-1 redis-cli

# Check if Redis is working
> PING
PONG
```

## 🔍 Explore the API

### Via Swagger UI
1. Go to http://localhost:3000/docs
2. Click "Authorize" button
3. Enter your JWT token: `Bearer YOUR_TOKEN`
4. Try out any endpoint interactively

### Via Postman
1. Import OpenAPI spec from http://localhost:3000/docs-json
2. Set up Bearer Token authentication
3. Start making requests

## 📚 Key Endpoints

### Public Endpoints (No Auth)
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/quotes` - Get quote
- `GET /health` - Health check

### User Endpoints (JWT Required)
- `GET /api/v1/users/me` - Get profile
- `PATCH /api/v1/users/me` - Update profile
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings/:id` - Get booking

### Admin Endpoints (Admin Role Required)
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/vehicles` - List vehicles
- `POST /api/v1/pricing/*` - Manage pricing

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change PORT in .env
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
docker-compose ps

# Restart MongoDB
docker-compose restart mongodb

# Check logs
docker-compose logs mongodb
```

### Redis Connection Failed
```bash
# Check if Redis is running
docker-compose ps

# Restart Redis
docker-compose restart redis

# Test connection
docker exec -it vmp-api-redis-1 redis-cli PING
```

### Build Errors
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### JWT Token Invalid
- Check if JWT_SECRET in .env matches
- Token expires after 15 minutes (get new one with refresh endpoint)
- Make sure to include "Bearer " prefix

## 🎓 Next Steps

1. **Read Documentation**
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
   - [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - What's implemented
   - [COMPLETENESS_CHECKLIST.md](./COMPLETENESS_CHECKLIST.md) - Feature checklist

2. **Create Test Data**
   - Register multiple users with different roles
   - Create price regions for your area
   - Add vehicles to the fleet
   - Set up base prices and surcharges

3. **Implement Business Logic**
   - Replace mock payment logic
   - Add real external API integrations
   - Implement WebSocket for real-time updates

4. **Write Tests**
   - Add unit tests for services
   - Add E2E tests for endpoints

5. **Deploy**
   - Set up production environment
   - Configure SSL/TLS
   - Set up monitoring

## 💡 Tips

- Use Swagger UI for quick testing
- Check health endpoint to verify all services are connected
- MongoDB data persists in Docker volumes
- Use `npm run dev` for hot reload during development
- Check the logs for detailed error messages
- All DTOs are validated automatically

## 📞 Support

- Check existing documentation first
- Review error messages carefully
- Check Docker logs for service issues
- Verify environment variables are set correctly

---

**You're all set!** 🎉

Start exploring the API at http://localhost:3000/docs

