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
```

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

1. Build the application: `npm run build`
2. Set production environment variables
3. Ensure MongoDB and Redis are accessible
4. Run with: `npm run start:prod`
5. Use a process manager like PM2 or run in Docker

## Docker

```bash
# Build and run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

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
