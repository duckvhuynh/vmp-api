# VMP API - Airport Taxi Booking System

A comprehensive NestJS-based RESTful API for airport taxi booking and fleet management.

## Features

✅ **Complete Authentication System** - JWT-based auth with role-based access control  
✅ **Quote & Pricing Engine** - Dynamic pricing with surcharges, fixed routes, and region-based pricing  
✅ **Booking Management** - Full booking lifecycle from quote to completion  
✅ **Driver Operations** - Real-time location tracking, job management, status updates  
✅ **Dispatch System** - Automatic driver assignment with smart matching algorithms  
✅ **Fleet Management** - Vehicle management with multi-language support  
✅ **Payment Integration** - Payment intent creation, confirmation, and refunds  
✅ **Webhooks** - External integrations for payments, flights, and SMS  
✅ **Admin Dashboard** - Statistics, health monitoring, and revenue reports  
✅ **Swagger Documentation** - Auto-generated interactive API docs  
✅ **Global Exception Handling** - Standardized error responses  
✅ **Request Validation** - Class-validator DTOs for all endpoints  
✅ **Rate Limiting** - Built-in throttling protection  

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Start services with Docker
docker-compose up -d

# Run in development mode
npm run dev

# Build for production
npm run build

# Run in production
npm run start:prod
```

### Access Points
- **API Base URL**: http://localhost:3000/api/v1
- **Swagger UI**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## Project Structure

```
src/
├── common/              # Shared utilities, guards, filters, interceptors
│   ├── dto/            # Common DTOs (pagination, responses)
│   ├── filters/        # Exception filters
│   ├── interceptors/   # Response transformers
│   └── *.guard.ts      # Authorization guards
├── config/             # Configuration and validation
├── modules/
│   ├── auth/           # Authentication (JWT, register, login)
│   ├── users/          # User management
│   ├── quotes/         # Quote generation and pricing
│   ├── bookings/       # Booking management
│   ├── pricing/        # Pricing configuration (base, fixed, surcharges, regions)
│   ├── vehicles/       # Fleet management
│   ├── drivers/        # Driver operations
│   ├── dispatch/       # Driver assignment and dispatch
│   ├── payments/       # Payment processing
│   ├── webhooks/       # External webhooks
│   ├── admin/          # Admin dashboard
│   └── health/         # Health checks
└── main.ts             # Application entry point
```

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for comprehensive API documentation.

Or visit `/docs` when running the server for interactive Swagger documentation.

## Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/vmp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-minimum-16-characters
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Optional: Admin user seeding
SEED_ADMIN=true
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePass123
ADMIN_NAME=Admin User
ADMIN_PHONE=+23012345678
```

**Note:** See [SEED_ADMIN_GUIDE.md](./SEED_ADMIN_GUIDE.md) for details on seeding admin accounts.

## Available Scripts

```bash
npm run dev          # Start development server with watch mode
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Generate test coverage
npm run seed:admin   # Seed admin user account (interactive)
```

## User Roles

- **passenger** - Book rides, view bookings, manage profile
- **driver** - Accept jobs, update location and status
- **dispatcher** - Manage bookings, assign drivers
- **admin** - Full system access, configuration, reports

## Technology Stack

- **Framework**: NestJS 10.x
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis (via ioredis)
- **Authentication**: JWT (passport-jwt)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Pino (nestjs-pino)

## Development

### Adding a New Module

```bash
nest g module modules/your-module
nest g controller modules/your-module
nest g service modules/your-module
```

### Code Style

- Use TypeScript strict mode
- Follow NestJS best practices
- Add Swagger decorators to all endpoints
- Validate all input with DTOs
- Handle errors with appropriate HTTP exceptions

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Production Deployment

### 🚀 Recommended: Deploy with Coolify (5 minutes)

The fastest and easiest way to deploy VMP API to production:

```bash
# 1. Create services in Coolify (MongoDB + Redis)
# 2. Deploy from GitHub (this repository)
# 3. Set environment variables
# 4. Click "Deploy"
```

**📚 Complete Guide:** See [COOLIFY_QUICK_START.md](./COOLIFY_QUICK_START.md)

**Features:**
- ✅ Zero-downtime deployments
- ✅ Automatic SSL/HTTPS
- ✅ Auto-deploy on Git push
- ✅ Built-in monitoring & logs
- ✅ One-click scaling

### 🖥️ Manual VPS Deployment

For full control, deploy manually to any VPS:

```bash
# 1. Clone repository on VPS
git clone https://github.com/duckvhuynh/vmp-api.git
cd vmp-api

# 2. Create .env.production
cp .env.production.example .env.production
nano .env.production

# 3. Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

**📚 Complete Guide:** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### 🐳 Local Docker Development

```bash
# Build and run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 📊 Deployment Comparison

| Feature | Coolify | Manual VPS |
|---------|---------|-----------|
| **Setup Time** | 5 min | 30 min |
| **Auto-deployment** | ✅ Yes | ❌ Manual |
| **SSL Setup** | ✅ Automatic | 🔧 Manual |
| **Monitoring** | ✅ Built-in | 🔧 Setup required |
| **Zero Downtime** | ✅ Yes | ❌ Brief downtime |

**📚 Full Comparison:** See [DEPLOYMENT_COMPARISON.md](./DEPLOYMENT_COMPARISON.md)

## Contributing

1. Create a feature branch
2. Make your changes with tests
3. Ensure linting passes: `npm run lint`
4. Format code: `npm run format`
5. Submit a pull request

## License

MIT

## Support

For issues and questions: support@example.com
