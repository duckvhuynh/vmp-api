# VMP API - Airport Taxi Booking System

## Overview

This is a comprehensive NestJS-based API for an airport taxi booking system with real-time driver dispatch, payment processing, and fleet management capabilities.

## Base URL

- **Local Development**: `http://localhost:3000/api/v1`
- **Docker Container**: `http://localhost:3001/api/v1`
- **Swagger Documentation**: `http://localhost:3000/docs`

## Authentication

Most endpoints require JWT authentication. Include the bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Modules

### 1. Health Check
- `GET /health` - Liveness probe
- `GET /health/ready` - Readiness probe (checks database and Redis connectivity)

### 2. Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and receive JWT tokens
- `POST /api/v1/auth/refresh` - Refresh access token (requires JWT)
- `POST /api/v1/auth/logout` - Logout (requires JWT)

### 3. Users Management
**Protected endpoints - JWT required**

- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update current user profile
- `POST /api/v1/users/me/change-password` - Change password
- `GET /api/v1/users` - Get all users (Admin only)
- `GET /api/v1/users/:id` - Get user by ID (Admin only)
- `POST /api/v1/users` - Create new user (Admin only)
- `PATCH /api/v1/users/:id` - Update user (Admin only)
- `DELETE /api/v1/users/:id` - Delete user (Admin only)

### 4. Quotes
**Calculate pricing for trips**

- `POST /api/v1/quotes` - Create a new quote with pricing calculations
- `GET /api/v1/quotes/:quoteId` - Retrieve existing quote details

Features:
- Supports fixed route pricing and distance-based pricing
- Dynamic surcharges (time-based, location-based, demand-based)
- Multiple vehicle class options
- Airport fees calculation
- Waiting time policies

### 5. Bookings
**Manage customer bookings**

- `POST /api/v1/bookings` - Create booking from quote
- `GET /api/v1/bookings/:id` - Get booking details
- `POST /api/v1/bookings/:id/cancel` - Cancel booking

Features:
- Quote-based booking creation
- Payment integration
- Driver assignment
- Real-time status tracking
- Cancellation with refund support

### 6. Pricing Management
**Admin/Dispatcher protected endpoints**

#### Base Prices
- `POST /api/v1/base-prices` - Create base price configuration
- `GET /api/v1/base-prices` - List all base prices
- `GET /api/v1/base-prices/:id` - Get specific base price
- `PATCH /api/v1/base-prices/:id` - Update base price
- `DELETE /api/v1/base-prices/:id` - Delete base price

#### Fixed Prices
- `POST /api/v1/fixed-prices` - Create fixed route price
- `GET /api/v1/fixed-prices` - List all fixed prices
- `GET /api/v1/fixed-prices/find-by-route` - Find price by origin/destination
- `GET /api/v1/fixed-prices/:id` - Get specific fixed price
- `PATCH /api/v1/fixed-prices/:id` - Update fixed price
- `DELETE /api/v1/fixed-prices/:id` - Delete fixed price

#### Surcharges
- `POST /api/v1/surcharges` - Create surcharge rule
- `GET /api/v1/surcharges` - List all surcharges
- `GET /api/v1/surcharges/applicable` - Find applicable surcharges
- `GET /api/v1/surcharges/:id` - Get specific surcharge
- `PATCH /api/v1/surcharges/:id` - Update surcharge
- `DELETE /api/v1/surcharges/:id` - Delete surcharge

#### Price Regions
- `POST /api/v1/price-regions` - Create price region
- `GET /api/v1/price-regions` - List all regions
- `GET /api/v1/price-regions/find-by-location` - Find region by coordinates
- `GET /api/v1/price-regions/:id` - Get specific region
- `PATCH /api/v1/price-regions/:id` - Update region
- `DELETE /api/v1/price-regions/:id` - Delete region

### 7. Vehicle Management
**Admin/Dispatcher protected endpoints**

- `POST /api/v1/vehicles` - Create new vehicle (Admin only)
- `GET /api/v1/vehicles` - List vehicles with filters and pagination
- `GET /api/v1/vehicles/available` - Get available vehicles
- `GET /api/v1/vehicles/statistics` - Get fleet statistics (Admin only)
- `GET /api/v1/vehicles/type/:vehicleType` - Get vehicles by type
- `GET /api/v1/vehicles/category/:category` - Get vehicles by category
- `GET /api/v1/vehicles/suitable/:passengerCount` - Find suitable vehicles
- `GET /api/v1/vehicles/:id` - Get vehicle details
- `PATCH /api/v1/vehicles/:id` - Update vehicle (Admin only)
- `DELETE /api/v1/vehicles/:id` - Soft delete vehicle (Admin only)
- `DELETE /api/v1/vehicles/:id/hard` - Hard delete vehicle (Admin only)
- `PATCH /api/v1/vehicles/:id/restore` - Restore deactivated vehicle (Admin only)

Features:
- Multi-language support (EN, CN, VI)
- Comprehensive filtering and search
- Fleet statistics and analytics
- Soft and hard delete options

### 8. Driver Operations
**Driver protected endpoints**

- `GET /api/v1/drivers/me/profile` - Get driver profile
- `PUT /api/v1/drivers/me/location` - Update driver location
- `PUT /api/v1/drivers/me/status` - Update driver status (online/offline/busy/break)
- `GET /api/v1/drivers/me/jobs` - Get assigned jobs
- `POST /api/v1/drivers/me/jobs/:bookingId/accept` - Accept job
- `POST /api/v1/drivers/me/jobs/:bookingId/decline` - Decline job
- `PUT /api/v1/drivers/me/jobs/:bookingId/status` - Update job status

Features:
- Real-time location tracking
- Job acceptance/decline workflow
- Status management
- Trip progress tracking

### 9. Dispatch System
**Admin/Dispatcher protected endpoints**

- `POST /api/v1/dispatch/assign` - Auto-assign driver to booking
- `POST /api/v1/dispatch/reassign` - Reassign different driver
- `GET /api/v1/dispatch/drivers/:driverId/stats` - Get driver statistics

Features:
- Automatic driver assignment based on:
  - Distance to pickup location
  - Driver availability
  - Vehicle class matching
  - Driver rating
- Multi-driver notification system
- Performance statistics

### 10. Payments
**Protected endpoints - JWT required**

- `POST /api/v1/payments/intent` - Create payment intent
- `POST /api/v1/payments/confirm` - Confirm payment
- `POST /api/v1/payments/refund` - Process refund
- `GET /api/v1/payments/:paymentIntentId` - Get payment details

Features:
- Payment intent creation
- Multiple payment methods support
- Full and partial refunds
- Payment status tracking

### 11. Webhooks
**Public endpoints for external services**

- `POST /api/v1/webhooks/payments` - Payment provider webhooks (Stripe)
- `POST /api/v1/webhooks/flight-updates` - Flight status updates
- `POST /api/v1/webhooks/sms-status` - SMS delivery status

Features:
- Payment event handling
- Flight delay notifications
- SMS delivery tracking

### 12. Admin Dashboard
**Admin protected endpoints**

- `GET /api/v1/admin/dashboard` - Get dashboard statistics
- `GET /api/v1/admin/system-health` - Get system health status
- `GET /api/v1/admin/reports/revenue` - Get revenue report
- `GET /api/v1/admin/ping` - Simple health check

Features:
- Real-time dashboard metrics
- System health monitoring
- Revenue analytics
- Booking statistics

## Response Structure

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-10-29T10:00:00.000Z",
  "path": "/api/v1/quotes"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "timestamp": "2025-10-29T10:00:00.000Z",
  "path": "/api/v1/quotes",
  "method": "POST",
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Common Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by
- `sortOrder` - Sort order (asc/desc)
- `search` - Search term

## User Roles

1. **passenger** - Regular customers who book rides
2. **driver** - Drivers who accept and complete trips
3. **dispatcher** - Staff who manage bookings and dispatch
4. **admin** - System administrators with full access

## Environment Variables

Required environment variables:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/vmp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-min-16-chars
CORS_ORIGINS=*
```

## Rate Limiting

- Default: 100 requests per 60 seconds per IP
- Configurable via ThrottlerModule

## WebSocket Support

Real-time updates for:
- Driver location tracking
- Booking status changes
- Driver availability updates

## Data Models

### Quote
- Contains pricing breakdown for all available vehicle classes
- Expires in 1 hour
- Includes policy information (cancellation, waiting time)

### Booking
- Created from a quote
- Tracks complete trip lifecycle
- Includes payment information
- Event timeline for audit trail

### Driver
- Profile information
- Real-time location
- Availability status
- Performance metrics

### Vehicle
- Multi-language support
- Capacity specifications
- Active/inactive status
- Type and category classification

## Testing

Access Swagger UI at `/docs` for interactive API testing with:
- Request/response examples
- Schema validation
- Authentication testing
- Error handling examples

## Support

For API support or issues, contact: support@example.com

