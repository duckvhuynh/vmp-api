# VMP API - Complete Dashboard API Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base Configuration](#base-configuration)
4. [API Endpoints by Module](#api-endpoints-by-module)
   - [Authentication & Users](#authentication--users)
   - [Quotes](#quotes)
   - [Bookings](#bookings)
   - [Drivers](#drivers)
   - [Dispatch](#dispatch)
   - [Vehicles](#vehicles)
   - [Pricing Management](#pricing-management)
   - [Payments](#payments)
   - [Admin Dashboard](#admin-dashboard)
   - [Webhooks](#webhooks)
   - [Health](#health)
5. [Dashboard Implementation Guide](#dashboard-implementation-guide)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Overview

This API provides a complete taxi booking and fleet management system for Mauritius. The dashboard API documentation covers all endpoints needed to build a comprehensive admin dashboard for managing:

- **Users & Authentication** - User management, roles, and authentication
- **Quotes & Bookings** - Quote generation, booking lifecycle management
- **Drivers** - Driver profiles, location tracking, job management
- **Vehicles** - Fleet management with multi-language support
- **Pricing** - Base prices, fixed routes, surcharges, and price regions
- **Payments** - Payment processing, refunds, and payment intents
- **Dispatch** - Driver assignment and reassignment
- **Admin** - Dashboard statistics, reports, and system health
- **Webhooks** - External integrations (payments, flights, SMS)

### Base URL

```
Production: https://api.visitmauritiusparadise.com/api/v1
Development: http://localhost:3000/api/v1
```

### API Prefix

All endpoints are prefixed with `/api/v1`

### Swagger Documentation

Interactive API documentation available at:
- **Production**: `https://api.visitmauritiusparadise.com/docs`
- **Development**: `http://localhost:3000/docs`

---

## Authentication

### Authentication Flow

1. **Register** or **Login** to get access tokens
2. Include `Authorization: Bearer <accessToken>` header in all protected requests
3. Use **Refresh Token** endpoint to get new tokens when expired

### User Roles

- **passenger** - Book rides, view own bookings
- **driver** - Accept jobs, update location/status
- **dispatcher** - Manage bookings, assign drivers
- **admin** - Full system access, configuration, reports

---

## Base Configuration

### Environment Variables

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.visitmauritiusparadise.com/api/v1';
```

### API Client Setup

```typescript
// api/client.ts
const API_BASE_URL = 'https://api.visitmauritiusparadise.com/api/v1';

interface ApiConfig {
  headers?: Record<string, string>;
  method?: string;
  body?: any;
}

export const apiClient = {
  async request<T>(endpoint: string, options: ApiConfig = {}): Promise<T> {
    const token = localStorage.getItem('accessToken');
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      method: options.method || 'GET',
      ...(options.body && { body: JSON.stringify(options.body) }),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
};
```

---

## API Endpoints by Module

## Authentication & Users

### Authentication Endpoints

#### Register User

**POST** `/auth/register`

**Description:** Register a new user account

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongP@ssw0rd",
  "phone": "+230 1234 5678"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login

**POST** `/auth/login`

**Description:** Authenticate user and get access tokens

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "StrongP@ssw0rd"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Refresh Token

**POST** `/auth/refresh`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout

**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:** `200 OK`
```json
{
  "success": true
}
```

### User Management Endpoints

#### Get Current User Profile

**GET** `/users/me`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+230 1234 5678",
  "roles": ["passenger"],
  "createdAt": "2025-10-29T10:00:00.000Z",
  "updatedAt": "2025-10-29T10:00:00.000Z"
}
```

#### Update Current User Profile

**PATCH** `/users/me`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+230 1234 5679"
}
```

**Response:** `200 OK` - UserResponseDto

#### Change Password

**POST** `/users/me/change-password`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "currentPassword": "OldP@ssw0rd",
  "newPassword": "NewP@ssw0rd"
}
```

**Response:** `204 No Content`

#### Get All Users (Admin Only)

**GET** `/users`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Query Parameters:**
- None

**Response:** `200 OK` - Array of UserResponseDto

#### Get User by ID (Admin Only)

**GET** `/users/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `200 OK` - UserResponseDto

#### Create User (Admin Only)

**POST** `/users`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongP@ssw0rd",
  "phone": "+230 1234 5680",
  "roles": ["dispatcher"]
}
```

**Response:** `201 Created` - UserResponseDto

#### Update User (Admin Only)

**PATCH** `/users/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "roles": ["dispatcher", "admin"]
}
```

**Response:** `200 OK` - UserResponseDto

#### Delete User (Admin Only)

**DELETE** `/users/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `204 No Content`

---

## Quotes

### Create Quote

**POST** `/quotes`

**Description:** Calculate pricing for a trip with all available vehicle classes

**Request Body:**
```json
{
  "origin": {
    "type": "airport",
    "airportCode": "MRU",
    "terminal": "T1",
    "latitude": -20.4317,
    "longitude": 57.5529
  },
  "destination": {
    "type": "address",
    "address": "Port Louis, Mauritius",
    "latitude": -20.1619,
    "longitude": 57.5012
  },
  "pickupAt": "2025-12-25T10:00:00.000Z",
  "pax": 2,
  "bags": 2,
  "extras": ["child_seat"],
  "distanceKm": 15.5,
  "durationMinutes": 25
}
```

**Response:** `201 Created`
```json
{
  "quoteId": "4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1",
  "vehicleClasses": [
    {
      "id": "ECONOMY",
      "name": "Economy",
      "paxCapacity": 3,
      "bagCapacity": 2,
      "pricing": {
        "baseFare": 25.0,
        "distanceCharge": 12.5,
        "timeCharge": 8.0,
        "airportFees": 15.0,
        "surcharges": 10.0,
        "extras": 5.0,
        "total": 75.5,
        "currency": "AED"
      },
      "appliedSurcharges": [
        {
          "name": "Night surcharge",
          "application": "percentage",
          "value": 25.0,
          "amount": 7.5,
          "reason": "Pickup time is between 22:00 and 06:00"
        }
      ],
      "includedWaitingTime": 15,
      "additionalWaitingPrice": 1.5,
      "isFixedPrice": false
    }
  ],
  "policy": {
    "cancellation": "Free cancellation until 24 hours before pickup",
    "includedWait": "60 minutes after landing for arrivals",
    "additionalWaitCharge": "1.50 AED per minute",
    "quoteExpiresAt": "2025-12-25T11:00:00.000Z"
  },
  "estimatedDistance": 15.5,
  "estimatedDuration": 25,
  "originName": "MRU Airport - Terminal T1",
  "destinationName": "Port Louis, Mauritius",
  "pickupAt": "2025-12-25T10:00:00.000Z",
  "passengers": 2,
  "luggage": 2,
  "extras": ["child_seat"],
  "createdAt": "2025-12-25T09:00:00.000Z",
  "expiresAt": "2025-12-25T10:00:00.000Z"
}
```

### Get Quote by ID

**GET** `/quotes/:quoteId`

**Description:** Retrieve an existing quote by ID

**Response:** `200 OK` - QuoteResponseDto

---

## Bookings

### Create Booking

**POST** `/bookings`

**Description:** Create a booking from a quote

**Request Body:**
```json
{
  "quoteId": "4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1",
  "passenger": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+230 1234 5678"
  },
  "contact": {
    "email": "john@example.com",
    "phone": "+230 1234 5678"
  },
  "flight": {
    "number": "MK123",
    "date": "2025-12-25",
    "airline": "Air Mauritius"
  },
  "signText": "Mr. John Doe",
  "notes": "Please wait near exit A2",
  "extras": ["child_seat"],
  "paymentMethodId": "pm_1Px..."
}
```

**Response:** `201 Created`
```json
{
  "id": "a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5",
  "quoteId": "4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1",
  "status": "confirmed",
  "policy": {
    "cancellation": "Free cancellation until 24 hours before pickup"
  },
  "confirmation": "Booking created, awaiting payment confirmation"
}
```

### Get Booking by ID

**GET** `/bookings/:id`

**Description:** Retrieve booking details

**Response:** `200 OK` - Booking details

### Cancel Booking

**POST** `/bookings/:id/cancel`

**Description:** Cancel a booking and process refund

**Response:** `200 OK`
```json
{
  "id": "a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5",
  "status": "cancelled_by_user",
  "refund": {
    "amount": 0,
    "currency": "USD"
  }
}
```

---

## Admin Bookings Management

Full CRUD operations for admin/dispatcher to manage all bookings.

### Get All Bookings (Admin)

**GET** `/admin/bookings`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search by booking ID, passenger name, phone
- `status` (string, optional): Filter by status
- `driverId` (string, optional): Filter by assigned driver
- `userId` (string, optional): Filter by user
- `vehicleClass` (string, optional): Filter by vehicle class
- `fromDate` (string, optional): Filter bookings from date (ISO string)
- `toDate` (string, optional): Filter bookings until date (ISO string)
- `sortBy` (string, optional): Sort field (default: "createdAt")
- `sortOrder` (string, optional): "asc" or "desc" (default: "desc")

**Response:** `200 OK`
```json
{
  "bookings": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "bookingId": "BK-20251029-ABC123",
      "status": "confirmed",
      "passengerName": "John Doe",
      "passengerPhone": "+971501234567",
      "originName": "Dubai Airport",
      "destinationName": "Downtown Dubai",
      "pickupAt": "2025-10-29T10:00:00.000Z",
      "vehicleClass": "ECONOMY",
      "total": 75.50,
      "currency": "AED",
      "createdAt": "2025-10-29T09:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Get Booking Statistics

**GET** `/admin/bookings/stats`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Query Parameters:**
- `fromDate` (string, optional): Start date (ISO string)
- `toDate` (string, optional): End date (ISO string)

**Response:** `200 OK`
```json
{
  "totalBookings": 150,
  "pendingBookings": 25,
  "confirmedBookings": 45,
  "activeBookings": 15,
  "completedBookings": 60,
  "cancelledBookings": 5,
  "totalRevenue": 12500.75,
  "currency": "AED",
  "averageBookingValue": 83.33,
  "byStatus": {
    "pending_payment": 25,
    "confirmed": 45,
    "completed": 60
  },
  "byVehicleClass": {
    "ECONOMY": 50,
    "COMFORT": 30,
    "PREMIUM": 20
  }
}
```

### Get Upcoming Bookings

**GET** `/admin/bookings/upcoming`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Query Parameters:**
- `hours` (number, optional): Hours ahead to look (default: 24)

**Response:** `200 OK` - Array of BookingListItemDto

### Get Bookings Requiring Attention

**GET** `/admin/bookings/attention`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Description:** Returns bookings that need admin attention (unassigned with upcoming pickup, driver declined, pending payment too long)

**Response:** `200 OK` - Array of BookingListItemDto

### Get Bookings by Driver

**GET** `/admin/bookings/driver/:driverId`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Query Parameters:**
- `status` (string, optional): Filter by status

**Response:** `200 OK` - Array of BookingListItemDto

### Get Booking Details (Admin)

**GET** `/admin/bookings/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "bookingId": "BK-20251029-ABC123",
  "status": "confirmed",
  "userId": "507f1f77bcf86cd799439011",
  "passengerName": "John Doe",
  "passengerFirstName": "John",
  "passengerLastName": "Doe",
  "passengerPhone": "+971501234567",
  "originName": "Dubai Airport",
  "originAddress": "Dubai International Airport",
  "originLatitude": 25.2532,
  "originLongitude": 55.3644,
  "destinationName": "Downtown Dubai",
  "destinationAddress": "Downtown Dubai Hotel",
  "destinationLatitude": 25.1972,
  "destinationLongitude": 55.2744,
  "pickupAt": "2025-10-29T10:00:00.000Z",
  "passengers": 2,
  "luggage": 1,
  "extras": ["child_seat"],
  "vehicleClass": "ECONOMY",
  "vehicleName": "Economy",
  "baseFare": 25.0,
  "distanceCharge": 15.0,
  "surcharges": 5.0,
  "total": 75.50,
  "currency": "AED",
  "assignedDriver": "507f1f77bcf86cd799439011",
  "events": [
    {
      "event": "created",
      "status": "pending_payment",
      "timestamp": "2025-10-29T09:00:00.000Z",
      "description": "Booking created"
    }
  ],
  "createdAt": "2025-10-29T09:00:00.000Z",
  "updatedAt": "2025-10-29T09:30:00.000Z"
}
```

### Update Booking (Admin)

**PATCH** `/admin/bookings/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Request Body:**
```json
{
  "passengerFirstName": "John",
  "passengerLastName": "Smith",
  "passengerPhone": "+971501234568",
  "pickupAt": "2025-10-29T11:00:00.000Z",
  "originName": "Dubai Airport Terminal 2",
  "destinationName": "JBR Beach",
  "passengers": 3,
  "luggage": 2,
  "extras": ["child_seat", "meet_greet"],
  "adminNotes": "Updated by admin - customer requested change"
}
```

**Response:** `200 OK` - BookingDetailResponseDto

### Update Booking Status

**PATCH** `/admin/bookings/:id/status`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Request Body:**
```json
{
  "status": "confirmed",
  "reason": "Payment verified manually",
  "notes": "Customer paid via bank transfer"
}
```

**Status Values:** `pending_payment`, `confirmed`, `driver_assigned`, `en_route`, `arrived`, `waiting`, `no_show`, `on_trip`, `completed`, `cancelled_by_user`, `cancelled_by_ops`, `payment_failed`, `driver_declined`

**Response:** `200 OK` - BookingDetailResponseDto

### Assign Driver to Booking

**POST** `/admin/bookings/:id/assign-driver`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Request Body:**
```json
{
  "driverId": "507f1f77bcf86cd799439011",
  "notes": "Assigned preferred driver per customer request"
}
```

**Response:** `200 OK` - BookingDetailResponseDto

### Unassign Driver from Booking

**POST** `/admin/bookings/:id/unassign-driver`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Request Body:**
```json
{
  "reason": "Driver is no longer available"
}
```

**Response:** `200 OK` - BookingDetailResponseDto

### Cancel Booking (Admin)

**POST** `/admin/bookings/:id/cancel`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Request Body:**
```json
{
  "reason": "Customer no-show after 30 minutes",
  "refundAmount": 0,
  "notes": "Driver waited at pickup location"
}
```

**Response:** `200 OK` - BookingDetailResponseDto

### Add Event to Booking

**POST** `/admin/bookings/:id/events`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Request Body:**
```json
{
  "event": "note_added",
  "description": "Customer called to confirm pickup location",
  "location": "Dubai Airport Terminal 1",
  "latitude": 25.2532,
  "longitude": 55.3644
}
```

**Response:** `201 Created` - BookingDetailResponseDto

---

## Drivers

### Get Driver Profile

**GET** `/drivers/me/profile`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `driver`

**Response:** `200 OK`
```json
{
  "driverId": "d1234567-89ab-cdef-0123-456789abcdef",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+971501234567",
  "status": "online",
  "availability": "available",
  "currentLocation": {
    "latitude": 25.2532,
    "longitude": 55.3644,
    "address": "Dubai Airport Terminal 3"
  },
  "vehicle": {
    "make": "Toyota",
    "model": "Camry",
    "year": "2020",
    "color": "White",
    "licensePlate": "ABC-1234",
    "type": "sedan",
    "capacity": 4,
    "luggageCapacity": 2
  },
  "stats": {
    "totalTrips": 150,
    "completedTrips": 145,
    "cancelledTrips": 5,
    "totalEarnings": 12500.75,
    "rating": 4.8,
    "totalRatings": 120
  },
  "isActive": true,
  "isVerified": true,
  "lastActiveAt": "2025-09-04T10:00:00.000Z"
}
```

### Update Driver Location

**PUT** `/drivers/me/location`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `driver`

**Request Body:**
```json
{
  "location": {
    "latitude": 25.2532,
    "longitude": 55.3644,
    "address": "Dubai Airport Terminal 3",
    "accuracy": 10,
    "heading": 45,
    "speed": 25.5
  }
}
```

**Response:** `204 No Content`

### Update Driver Status

**PUT** `/drivers/me/status`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `driver`

**Request Body:**
```json
{
  "status": "online",
  "availability": "available"
}
```

**Response:** `204 No Content`

**Status Values:** `online`, `offline`, `busy`, `break`
**Availability Values:** `available`, `unavailable`, `on_trip`

### Get Driver Jobs

**GET** `/drivers/me/jobs`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `driver`

**Response:** `200 OK`
```json
{
  "jobs": [
    {
      "bookingId": "a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5",
      "passengerName": "John Doe",
      "passengerPhone": "+971501234567",
      "pickupLocation": "Dubai Airport Terminal 3",
      "destinationLocation": "Downtown Dubai",
      "pickupTime": "2025-09-04T10:00:00.000Z",
      "passengers": 2,
      "luggage": 1,
      "vehicleClass": "Economy",
      "fare": 75.50,
      "currency": "AED",
      "extras": ["child_seat"],
      "assignedAt": "2025-09-04T09:30:00.000Z",
      "timeToRespond": 15
    }
  ],
  "total": 5,
  "pending": 2,
  "active": 1
}
```

### Accept Job

**POST** `/drivers/me/jobs/:bookingId/accept`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `driver`

**Request Body:**
```json
{
  "message": "On my way!",
  "currentLocation": {
    "latitude": 25.2532,
    "longitude": 55.3644
  }
}
```

**Response:** `204 No Content`

### Decline Job

**POST** `/drivers/me/jobs/:bookingId/decline`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `driver`

**Request Body:**
```json
{
  "reason": "Vehicle breakdown",
  "details": "My car is not working properly"
}
```

**Response:** `204 No Content`

### Update Job Status

**PUT** `/drivers/me/jobs/:bookingId/status`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `driver`

**Request Body:**
```json
{
  "status": "en_route",
  "message": "Arrived at pickup location",
  "location": {
    "latitude": 25.2532,
    "longitude": 55.3644
  },
  "notes": "Passenger is running late"
}
```

**Status Values:** `en_route`, `arrived`, `waiting`, `on_trip`, `completed`

**Response:** `204 No Content`

---

## Dispatch

### Assign Driver to Booking

**POST** `/dispatch/assign`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `dispatcher`, `admin`

**Request Body:**
```json
{
  "bookingId": "a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "assignedDriverId": "d1234567-89ab-cdef-0123-456789abcdef",
  "driverName": "John Doe",
  "driverPhone": "+971501234567",
  "message": "Driver assigned successfully",
  "notifiedDrivers": 3
}
```

### Reassign Driver

**POST** `/dispatch/reassign`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `dispatcher`, `admin`

**Request Body:**
```json
{
  "bookingId": "a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5",
  "newDriverId": "d1234567-89ab-cdef-0123-456789abcdef"
}
```

**Response:** `200 OK` - AssignDriverResponse

### Get Driver Statistics

**GET** `/dispatch/drivers/:driverId/stats`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:** `200 OK`
```json
{
  "driverId": "d1234567-89ab-cdef-0123-456789abcdef",
  "name": "John Doe",
  "status": "online",
  "availability": "available",
  "currentLocation": {
    "latitude": 25.2532,
    "longitude": 55.3644,
    "address": "Dubai Airport Terminal 3"
  },
  "stats": {
    "totalTrips": 150,
    "completedTrips": 145,
    "cancelledTrips": 5,
    "totalEarnings": 12500.75,
    "rating": 4.8,
    "totalRatings": 120,
    "recentCompletedTrips": 12,
    "recentCancelledTrips": 1,
    "recentEarnings": 1250.50
  },
  "lastActiveAt": "2025-09-04T10:00:00.000Z"
}
```

---

## Vehicles

### Create Vehicle

**POST** `/vehicles`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Request Body:**
```json
{
  "name": {
    "translations": {
      "en": "Standard Sedan",
      "cn": "标准轿车",
      "vi": "Xe sedan tiêu chuẩn"
    },
    "defaultLanguage": "en"
  },
  "vehicleType": "sedan",
  "category": "standard",
  "capacity": {
    "maxPassengers": 4,
    "maxLuggage": 2,
    "maxWeight": 400
  },
  "isElectric": false,
  "isActive": true
}
```

**Response:** `201 Created` - VehicleResponseDto

### Get All Vehicles

**GET** `/vehicles`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search term
- `vehicleType` (string, optional): Filter by type
- `category` (string, optional): Filter by category
- `isActive` (boolean, optional): Filter by active status
- `isElectric` (boolean, optional): Filter by electric status
- `minPassengers` (number, optional): Minimum passenger capacity
- `maxPassengers` (number, optional): Maximum passenger capacity
- `sort` (string, optional): Sort field (e.g., "name:asc", "createdAt:desc")
- `lang` (string, optional): Preferred language for translations

**Response:** `200 OK`
```json
{
  "vehicles": [
    {
      "_id": "60d5ecb54b8b1c001f5e3f5a",
      "name": {
        "translations": {
          "en": "Standard Sedan",
          "cn": "标准轿车",
          "vi": "Xe sedan tiêu chuẩn"
        },
        "value": "Standard Sedan",
        "defaultLanguage": "en"
      },
      "vehicleType": "sedan",
      "category": "standard",
      "capacity": {
        "maxPassengers": 4,
        "maxLuggage": 2,
        "maxWeight": 400
      },
      "isElectric": false,
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### Get Available Vehicles

**GET** `/vehicles/available`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`, `driver`

**Response:** `200 OK` - Array of VehicleResponseDto

### Get Vehicle Statistics

**GET** `/vehicles/statistics`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `200 OK`
```json
{
  "totalVehicles": 50,
  "activeVehicles": 45,
  "inactiveVehicles": 5,
  "electricVehicles": 12,
  "conventionalVehicles": 38,
  "typeDistribution": [
    { "_id": "sedan", "count": 20 },
    { "_id": "suv", "count": 15 },
    { "_id": "van", "count": 10 }
  ],
  "categoryDistribution": [
    { "_id": "standard", "count": 25 },
    { "_id": "premium", "count": 15 },
    { "_id": "economy", "count": 10 }
  ]
}
```

### Get Vehicles by Type

**GET** `/vehicles/type/:vehicleType`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`, `driver`

**Vehicle Types:** `sedan`, `suv`, `van`, `luxury`, `minibus`, `coach`, `motorcycle`

**Response:** `200 OK` - Array of VehicleResponseDto

### Get Vehicles by Category

**GET** `/vehicles/category/:category`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`, `driver`

**Categories:** `economy`, `standard`, `premium`, `luxury`, `business`

**Response:** `200 OK` - Array of VehicleResponseDto

### Find Suitable Vehicles

**GET** `/vehicles/suitable/:passengerCount`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`, `driver`

**Response:** `200 OK` - Array of VehicleResponseDto

### Get Vehicle by ID

**GET** `/vehicles/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Response:** `200 OK` - VehicleResponseDto

### Update Vehicle

**PATCH** `/vehicles/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Request Body:** Partial UpdateVehicleDto

**Response:** `200 OK` - VehicleResponseDto

### Deactivate Vehicle

**DELETE** `/vehicles/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `200 OK`
```json
{
  "message": "Vehicle with ID 60d5ecb54b8b1c001f5e3f5a has been deactivated successfully"
}
```

### Permanently Delete Vehicle

**DELETE** `/vehicles/:id/hard`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `200 OK`
```json
{
  "message": "Vehicle with ID 60d5ecb54b8b1c001f5e3f5a has been permanently deleted"
}
```

### Restore Vehicle

**PATCH** `/vehicles/:id/restore`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `200 OK` - VehicleResponseDto

---

## Pricing Management

### Base Prices

#### Create Base Price

**POST** `/base-prices`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Request Body:**
```json
{
  "regionId": "507f1f77bcf86cd799439011",
  "vehicleClass": "ECONOMY",
  "baseFare": 25.0,
  "distanceChargePerKm": 1.5,
  "timeChargePerMinute": 0.5,
  "currency": "AED",
  "isActive": true
}
```

**Response:** `201 Created` - BasePriceResponseDto

#### Get All Base Prices

**GET** `/base-prices`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `search` (string, optional)
- `isActive` (boolean, optional)
- `regionId` (string, optional)
- `vehicleClass` (string, optional)
- `currency` (string, optional)

**Response:** `200 OK` - BasePriceListResponseDto

#### Get Base Price by Region and Vehicle Class

**GET** `/base-prices/by-region-vehicle?regionId=xxx&vehicleClass=ECONOMY`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`, `driver`

**Response:** `200 OK` - BasePriceResponseDto

#### Get Base Price by ID

**GET** `/base-prices/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Response:** `200 OK` - BasePriceResponseDto

#### Update Base Price

**PATCH** `/base-prices/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Response:** `200 OK` - BasePriceResponseDto

#### Delete Base Price

**DELETE** `/base-prices/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `204 No Content`

### Fixed Prices

#### Create Fixed Price

**POST** `/fixed-prices`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Request Body:**
```json
{
  "originRegionId": "507f1f77bcf86cd799439011",
  "destinationRegionId": "507f1f77bcf86cd799439012",
  "vehicleClass": "ECONOMY",
  "fixedPrice": 75.0,
  "currency": "AED",
  "isActive": true,
  "tags": ["airport", "popular"]
}
```

**Response:** `201 Created` - FixedPriceResponseDto

#### Get All Fixed Prices

**GET** `/fixed-prices`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Query Parameters:**
- `page`, `limit`, `search`, `isActive`
- `originRegionId` (string, optional)
- `destinationRegionId` (string, optional)
- `vehicleClass` (string, optional)
- `currency` (string, optional)
- `tags` (string, optional): Comma-separated tags

**Response:** `200 OK` - FixedPriceListResponseDto

#### Get Fixed Price by Route

**GET** `/fixed-prices/by-route?originRegionId=xxx&destinationRegionId=yyy&vehicleClass=ECONOMY`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`, `driver`

**Response:** `200 OK` - FixedPriceResponseDto

#### Get Fixed Prices by Regions

**GET** `/fixed-prices/by-regions?originRegionId=xxx&destinationRegionId=yyy`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`, `driver`

**Response:** `200 OK` - Array of FixedPriceResponseDto

#### Get Fixed Price by ID

**GET** `/fixed-prices/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Response:** `200 OK` - FixedPriceResponseDto

#### Update Fixed Price

**PATCH** `/fixed-prices/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Response:** `200 OK` - FixedPriceResponseDto

#### Delete Fixed Price

**DELETE** `/fixed-prices/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `204 No Content`

### Surcharges

#### Create Surcharge

**POST** `/surcharges`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Request Body:**
```json
{
  "name": "Night Surcharge",
  "type": "time_based",
  "application": "percentage",
  "value": 25.0,
  "regionId": "507f1f77bcf86cd799439011",
  "timeRange": {
    "start": "22:00",
    "end": "06:00"
  },
  "isActive": true
}
```

**Response:** `201 Created` - SurchargeResponseDto

#### Get All Surcharges

**GET** `/surcharges`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Query Parameters:**
- `page`, `limit`, `search`, `isActive`
- `regionId` (string, optional)
- `type` (string, optional): Surcharge type

**Response:** `200 OK` - SurchargeListResponseDto

#### Find Applicable Surcharges

**GET** `/surcharges/applicable?regionId=xxx&bookingDateTime=2025-12-25T10:00:00.000Z&minutesUntilPickup=30`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`, `driver`

**Response:** `200 OK` - Array of SurchargeResponseDto

#### Get Surcharge by ID

**GET** `/surcharges/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Response:** `200 OK` - SurchargeResponseDto

#### Update Surcharge

**PATCH** `/surcharges/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Response:** `200 OK` - SurchargeResponseDto

#### Delete Surcharge

**DELETE** `/surcharges/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `204 No Content`

### Price Regions

#### Create Price Region

**POST** `/price-regions`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Request Body:**
```json
{
  "name": "Airport Zone",
  "boundary": {
    "type": "Polygon",
    "coordinates": [[
      [-20.5, 57.5],
      [-20.4, 57.5],
      [-20.4, 57.6],
      [-20.5, 57.6],
      [-20.5, 57.5]
    ]]
  },
  "isActive": true,
  "tags": ["airport"]
}
```

**Response:** `201 Created` - PriceRegionResponseDto

#### Get All Price Regions

**GET** `/price-regions`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Query Parameters:**
- `page`, `limit`, `search`, `isActive`
- `tags` (string, optional): Comma-separated tags

**Response:** `200 OK` - PriceRegionListResponseDto

#### Find Price Regions by Location

**GET** `/price-regions/by-location?longitude=57.5529&latitude=-20.4317`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`, `driver`

**Response:** `200 OK` - Array of PriceRegionResponseDto

#### Get Price Region by ID

**GET** `/price-regions/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Response:** `200 OK` - PriceRegionResponseDto

#### Update Price Region

**PATCH** `/price-regions/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`, `dispatcher`

**Response:** `200 OK` - PriceRegionResponseDto

#### Delete Price Region

**DELETE** `/price-regions/:id`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `204 No Content`

---

## Payments

### Create Payment Intent

**POST** `/payments/intent`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "amount": 3500,
  "currency": "AED",
  "bookingId": "a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5",
  "paymentMethod": "card",
  "customerEmail": "john@example.com",
  "description": "Airport transfer booking"
}
```

**Response:** `201 Created`
```json
{
  "id": "pi_1Px123456789abcdef",
  "clientSecret": "pi_test_client_secret_abc123",
  "amount": 3500,
  "currency": "AED",
  "status": "pending",
  "bookingId": "a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5",
  "createdAt": "2025-10-29T10:00:00.000Z"
}
```

### Confirm Payment

**POST** `/payments/confirm`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "paymentIntentId": "pi_1Px123456789abcdef",
  "paymentMethodId": "pm_1Px123456789abcdef"
}
```

**Response:** `200 OK`
```json
{
  "id": "pi_1Px123456789abcdef",
  "status": "succeeded",
  "amount": 3500,
  "currency": "AED",
  "bookingId": "a6d3d7a6-0b55-4d86-9e53-1c7d58c867c5",
  "confirmedAt": "2025-10-29T10:05:00.000Z"
}
```

### Refund Payment

**POST** `/payments/refund`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "paymentIntentId": "pi_1Px123456789abcdef",
  "amount": 3500,
  "reason": "Customer requested cancellation"
}
```

**Response:** `200 OK`
```json
{
  "id": "re_1Px123456789abcdef",
  "paymentIntentId": "pi_1Px123456789abcdef",
  "amount": 3500,
  "currency": "AED",
  "status": "succeeded",
  "reason": "Customer requested cancellation",
  "createdAt": "2025-10-29T10:10:00.000Z"
}
```

### Get Payment Intent

**GET** `/payments/:paymentIntentId`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:** `200 OK` - PaymentIntentResponseDto

---

## Admin Dashboard

### Get Dashboard Statistics

**GET** `/admin/dashboard`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `200 OK`
```json
{
  "totalBookingsToday": 150,
  "completedBookingsToday": 120,
  "activeBookings": 25,
  "pendingBookings": 15,
  "driversOnline": 45,
  "driversAvailable": 30,
  "driversOnTrip": 15,
  "revenueToday": 25500.75,
  "currency": "AED",
  "averageRating": 4.7
}
```

### Get System Health

**GET** `/admin/system-health`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected",
    "external_apis": "operational"
  },
  "version": "0.1.0",
  "uptime": "72h 15m",
  "timestamp": "2025-10-29T10:00:00.000Z"
}
```

### Get Revenue Report

**GET** `/admin/reports/revenue?startDate=2025-10-01&endDate=2025-10-31&granularity=daily`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Query Parameters:**
- `startDate` (string, optional): ISO date string
- `endDate` (string, optional): ISO date string
- `granularity` (string, optional): `daily`, `weekly`, `monthly`

**Response:** `200 OK`
```json
{
  "totalRevenue": 125000.50,
  "currency": "AED",
  "totalBookings": 850,
  "averageBookingValue": 147.06,
  "breakdown": [
    {
      "date": "2025-10-01",
      "revenue": 4500.25,
      "bookings": 32
    },
    {
      "date": "2025-10-02",
      "revenue": 5200.75,
      "bookings": 38
    }
  ]
}
```

### Health Check Ping

**GET** `/admin/ping`

**Headers:** `Authorization: Bearer <accessToken>`
**Roles:** `admin`

**Response:** `200 OK`
```json
{
  "ok": true,
  "timestamp": "2025-10-29T10:00:00.000Z"
}
```

---

## Webhooks

### Payment Webhook

**POST** `/webhooks/payments`

**Headers:** `stripe-signature: <signature>` (optional)

**Request Body:** StripeWebhookDto

**Response:** `200 OK`
```json
{
  "received": true,
  "timestamp": "2025-10-29T10:00:00.000Z",
  "eventId": "evt_1234567890"
}
```

### Flight Update Webhook

**POST** `/webhooks/flight-updates`

**Request Body:** FlightUpdateDto

**Response:** `200 OK` - WebhookAcknowledgementDto

### SMS Status Webhook

**POST** `/webhooks/sms-status`

**Request Body:** SmsStatusDto

**Response:** `200 OK` - WebhookAcknowledgementDto

---

## Health

### Liveness Probe

**GET** `/health`

**Description:** Check if service is alive

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T10:00:00.000Z"
}
```

### Readiness Probe

**GET** `/health/ready`

**Description:** Check if service is ready to accept requests

**Response:** `200 OK`
```json
{
  "status": "ready",
  "timestamp": "2025-10-29T10:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## Dashboard Implementation Guide

### Recommended Dashboard Structure

#### 1. Authentication Module

```typescript
// services/authService.ts
export const authService = {
  async login(email: string, password: string) {
    return apiClient.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  
  async register(data: RegisterDto) {
    return apiClient.request('/auth/register', {
      method: 'POST',
      body: data,
    });
  },
  
  async refresh() {
    return apiClient.request('/auth/refresh', {
      method: 'POST',
    });
  },
};
```

#### 2. Dashboard Statistics

```typescript
// services/dashboardService.ts
export const dashboardService = {
  async getStats() {
    return apiClient.request('/admin/dashboard');
  },
  
  async getSystemHealth() {
    return apiClient.request('/admin/system-health');
  },
  
  async getRevenueReport(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.request(`/admin/reports/revenue?${params}`);
  },
};
```

#### 3. Booking Management

```typescript
// services/bookingService.ts
export const bookingService = {
  async getAllBookings(filters?: BookingFilters) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    return apiClient.request(`/bookings?${params}`);
  },
  
  async getBooking(id: string) {
    return apiClient.request(`/bookings/${id}`);
  },
  
  async cancelBooking(id: string) {
    return apiClient.request(`/bookings/${id}/cancel`, {
      method: 'POST',
    });
  },
};
```

#### 4. Driver Management

```typescript
// services/driverService.ts
export const driverService = {
  async getAllDrivers(filters?: DriverFilters) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.availability) params.append('availability', filters.availability);
    return apiClient.request(`/drivers?${params}`);
  },
  
  async getDriverStats(driverId: string) {
    return apiClient.request(`/dispatch/drivers/${driverId}/stats`);
  },
  
  async assignDriver(bookingId: string) {
    return apiClient.request('/dispatch/assign', {
      method: 'POST',
      body: { bookingId },
    });
  },
};
```

#### 5. Vehicle Management

```typescript
// services/vehicleService.ts
export const vehicleService = {
  async getAllVehicles(query?: VehicleQuery) {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.search) params.append('search', query.search);
    if (query?.vehicleType) params.append('vehicleType', query.vehicleType);
    if (query?.category) params.append('category', query.category);
    if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString());
    return apiClient.request(`/vehicles?${params}`);
  },
  
  async getVehicleStats() {
    return apiClient.request('/vehicles/statistics');
  },
  
  async createVehicle(data: CreateVehicleDto) {
    return apiClient.request('/vehicles', {
      method: 'POST',
      body: data,
    });
  },
  
  async updateVehicle(id: string, data: UpdateVehicleDto) {
    return apiClient.request(`/vehicles/${id}`, {
      method: 'PATCH',
      body: data,
    });
  },
  
  async deleteVehicle(id: string) {
    return apiClient.request(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },
};
```

#### 6. Pricing Management

```typescript
// services/pricingService.ts
export const pricingService = {
  // Base Prices
  async getBasePrices(query?: BasePriceQuery) {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.regionId) params.append('regionId', query.regionId);
    if (query?.vehicleClass) params.append('vehicleClass', query.vehicleClass);
    return apiClient.request(`/base-prices?${params}`);
  },
  
  async createBasePrice(data: CreateBasePriceDto) {
    return apiClient.request('/base-prices', {
      method: 'POST',
      body: data,
    });
  },
  
  // Fixed Prices
  async getFixedPrices(query?: FixedPriceQuery) {
    const params = new URLSearchParams();
    if (query?.originRegionId) params.append('originRegionId', query.originRegionId);
    if (query?.destinationRegionId) params.append('destinationRegionId', query.destinationRegionId);
    return apiClient.request(`/fixed-prices?${params}`);
  },
  
  // Surcharges
  async getSurcharges(query?: SurchargeQuery) {
    const params = new URLSearchParams();
    if (query?.regionId) params.append('regionId', query.regionId);
    if (query?.type) params.append('type', query.type);
    return apiClient.request(`/surcharges?${params}`);
  },
  
  // Price Regions
  async getPriceRegions(query?: PriceRegionQuery) {
    const params = new URLSearchParams();
    if (query?.tags) params.append('tags', query.tags.join(','));
    return apiClient.request(`/price-regions?${params}`);
  },
  
  async findRegionsByLocation(lat: number, lng: number) {
    return apiClient.request(`/price-regions/by-location?latitude=${lat}&longitude=${lng}`);
  },
};
```

### Dashboard Components Structure

```
dashboard/
├── components/
│   ├── Dashboard/
│   │   ├── StatsCards.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── BookingsTable.tsx
│   │   └── DriversMap.tsx
│   ├── Bookings/
│   │   ├── BookingsList.tsx
│   │   ├── BookingDetails.tsx
│   │   └── BookingFilters.tsx
│   ├── Drivers/
│   │   ├── DriversList.tsx
│   │   ├── DriverProfile.tsx
│   │   └── DriverStats.tsx
│   ├── Vehicles/
│   │   ├── VehiclesList.tsx
│   │   ├── VehicleForm.tsx
│   │   └── VehicleStats.tsx
│   ├── Pricing/
│   │   ├── BasePrices.tsx
│   │   ├── FixedPrices.tsx
│   │   ├── Surcharges.tsx
│   │   └── PriceRegions.tsx
│   └── Admin/
│       ├── UsersManagement.tsx
│       ├── SystemHealth.tsx
│       └── Reports.tsx
├── services/
│   ├── apiClient.ts
│   ├── authService.ts
│   ├── dashboardService.ts
│   ├── bookingService.ts
│   ├── driverService.ts
│   ├── vehicleService.ts
│   └── pricingService.ts
└── hooks/
    ├── useAuth.ts
    ├── useDashboard.ts
    ├── useBookings.ts
    ├── useDrivers.ts
    ├── useVehicles.ts
    └── usePricing.ts
```

---

## Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Invalid request data",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| `200` | Success | Request processed successfully |
| `201` | Created | Resource created successfully |
| `204` | No Content | Success with no response body |
| `400` | Bad Request | Invalid input data, validation errors |
| `401` | Unauthorized | Missing or invalid authentication token |
| `403` | Forbidden | Insufficient permissions for resource |
| `404` | Not Found | Resource not found |
| `500` | Internal Server Error | Server-side error |

### Error Handling Example

```typescript
try {
  const data = await apiClient.request('/endpoint');
  // Handle success
} catch (error: any) {
  if (error.statusCode === 401) {
    // Redirect to login or refresh token
    await authService.refresh();
  } else if (error.statusCode === 403) {
    // Show permission denied message
    showError('You do not have permission to perform this action');
  } else if (error.statusCode === 404) {
    // Show not found message
    showError('Resource not found');
  } else {
    // Show generic error
    showError(error.message || 'An error occurred');
  }
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse. Typical limits:

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 1000 requests per minute
- **Admin endpoints**: 5000 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets

---

## Best Practices

### 1. Token Management

- Store tokens securely (httpOnly cookies or secure storage)
- Implement automatic token refresh before expiration
- Handle token expiration gracefully

### 2. Error Handling

- Always handle errors with user-friendly messages
- Implement retry logic for transient failures
- Log errors for debugging

### 3. Loading States

- Show loading indicators during API calls
- Implement optimistic updates where appropriate
- Use skeleton loaders for better UX

### 4. Caching

- Cache frequently accessed data (dashboard stats, vehicle lists)
- Implement cache invalidation strategies
- Use React Query or SWR for data fetching

### 5. Pagination

- Always implement pagination for list endpoints
- Load data incrementally (infinite scroll or pagination controls)
- Show total count and page information

### 6. Real-time Updates

- Consider WebSocket connections for real-time data (bookings, driver locations)
- Implement polling for critical data updates
- Use optimistic updates for better UX

---

## Support

For API issues or questions:
- **Swagger Documentation**: `https://api.visitmauritiusparadise.com/docs`
- **Health Check**: `https://api.visitmauritiusparadise.com/health`
- **Support Email**: support@example.com

---

## Changelog

### Version 0.1.0
- Initial release
- Complete API documentation
- All modules documented
- Dashboard implementation guide

