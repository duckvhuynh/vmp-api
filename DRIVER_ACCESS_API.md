# Driver Access API Documentation

This document describes the API endpoints for driver access to bookings without authentication. Drivers receive a secure link containing a token that allows them to view and manage their assigned bookings.

## Table of Contents

- [Overview](#overview)
- [Token Format](#token-format)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [Get Booking Details](#get-booking-details)
  - [Accept Booking](#accept-booking)
  - [Decline Booking](#decline-booking)
  - [Update Booking Status](#update-booking-status)
  - [Update Driver Location](#update-driver-location)
  - [Get All Driver Bookings](#get-all-driver-bookings)
- [Booking Status Flow](#booking-status-flow)
- [Error Handling](#error-handling)
- [Frontend Implementation Guide](#frontend-implementation-guide)

---

## Overview

When a driver is assigned to a booking, the system generates a secure access link:

```
https://visitmauritiusparadise.com/driver/booking/{token}
```

This link:
- **Never expires** - Valid for the lifetime of the booking
- **Requires no login** - Token contains all necessary authentication
- **Is unique per booking+driver** - Cannot be used by other drivers

---

## Token Format

The token is a Base64URL-encoded payload with an HMAC-SHA256 signature:

```
{base64url_payload}.{signature}
```

**Payload Structure:**
```json
{
  "bookingId": "BK-20251203-ABC123",
  "driverId": "507f1f77bcf86cd799439011",
  "timestamp": 1733225400
}
```

> ⚠️ **Note:** The frontend should treat the token as an opaque string. Do not attempt to decode or modify it.

---

## Base URL

```
Production: https://api.visitmauritiusparadise.com/api/v1
Development: http://localhost:3000/api/v1
```

All endpoints are prefixed with `/driver-access`

---

## Endpoints

### Get Booking Details

Retrieve complete booking information for the driver.

**Endpoint:** `GET /driver-access/{token}`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "bookingId": "BK-20251203-ABC123",
  "status": "driver_assigned",
  "passenger": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+230 5712 3456"
  },
  "origin": {
    "type": "airport",
    "name": "SSR International Airport",
    "address": "Plaine Magnien, Mauritius",
    "latitude": -20.4302,
    "longitude": 57.6836,
    "airportCode": "MRU",
    "terminal": "International"
  },
  "destination": {
    "type": "address",
    "name": "Le Morne Brabant",
    "address": "Le Morne, Mauritius",
    "latitude": -20.4499,
    "longitude": 57.3174
  },
  "pickupAt": "2025-12-03T10:00:00.000Z",
  "flightNumber": "MK501",
  "flightDate": "2025-12-03",
  "passengers": 2,
  "luggage": 3,
  "extras": ["child_seat", "meet_and_greet"],
  "signText": "Mr. Doe",
  "notes": "Elderly passenger, please assist with luggage",
  "vehicle": {
    "class": "economy",
    "name": "Economy Sedan"
  },
  "pricing": {
    "total": 1500,
    "currency": "MUR"
  },
  "driver": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Jean-Pierre Dupont",
    "phone": "+230 5234 5678",
    "vehicle": {
      "make": "Toyota",
      "model": "Camry",
      "color": "Silver",
      "licensePlate": "MU 1234"
    }
  },
  "actualPickupAt": null,
  "actualDropoffAt": null,
  "createdAt": "2025-12-01T09:00:00.000Z",
  "updatedAt": "2025-12-02T14:30:00.000Z",
  "availableActions": ["accept", "decline"]
}
```

**Available Actions by Status:**

| Status | Available Actions |
|--------|-------------------|
| `driver_assigned` | `accept`, `decline` |
| `confirmed` | `start_trip` |
| `en_route` | `arrived` |
| `arrived` | `start_waiting`, `start_trip`, `no_show` |
| `waiting` | `start_trip`, `no_show` |
| `on_trip` | `complete` |
| `completed` | *(none)* |

---

### Accept Booking

Driver accepts the assigned booking.

**Endpoint:** `POST /driver-access/{token}/accept`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "notes": "I will be there 10 minutes early"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` | string | No | Optional notes from driver |

**Response (200 OK):**
Returns the updated booking object (same structure as Get Booking Details).

**Status Change:** `driver_assigned` → `confirmed`

---

### Decline Booking

Driver declines the assigned booking.

**Endpoint:** `POST /driver-access/{token}/decline`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Vehicle maintenance required",
  "notes": "My car is at the mechanic until tomorrow"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | **Yes** | Reason for declining |
| `notes` | string | No | Additional notes |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking declined successfully"
}
```

**Status Change:** `driver_assigned` → `driver_declined`

> ⚠️ **Note:** After declining, the driver is unassigned and the booking returns to the dispatch queue.

---

### Update Booking Status

Driver updates the booking status as they progress through the trip.

**Endpoint:** `POST /driver-access/{token}/status`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "en_route",
  "latitude": -20.4284,
  "longitude": 57.6589,
  "notes": "On my way, ETA 15 minutes"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | **Yes** | New status (see valid values below) |
| `latitude` | number | No | Driver's current latitude (-90 to 90) |
| `longitude` | number | No | Driver's current longitude (-180 to 180) |
| `notes` | string | No | Optional notes |

**Valid Status Values:**

| Status | Description | Next Possible Status |
|--------|-------------|---------------------|
| `en_route` | Driver is heading to pickup | `arrived` |
| `arrived` | Driver has arrived at pickup | `waiting`, `on_trip`, `no_show` |
| `waiting` | Driver is waiting for passenger | `on_trip`, `no_show` |
| `on_trip` | Trip has started | `completed` |
| `completed` | Trip completed | *(terminal)* |
| `no_show` | Passenger did not show up | *(terminal)* |

**Response (200 OK):**
Returns the updated booking object.

**Example Flow:**
```
confirmed → en_route → arrived → waiting → on_trip → completed
                                    ↓
                                 no_show
```

---

### Update Driver Location

Driver reports their current GPS location (for real-time tracking).

**Endpoint:** `POST /driver-access/{token}/location`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "latitude": -20.4284,
  "longitude": 57.6589,
  "address": "Route Royale, Mahébourg",
  "heading": 180,
  "speed": 45
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `latitude` | number | **Yes** | Current latitude (-90 to 90) |
| `longitude` | number | **Yes** | Current longitude (-180 to 180) |
| `address` | string | No | Human-readable address |
| `heading` | number | No | Direction of travel (0-360 degrees) |
| `speed` | number | No | Current speed in km/h |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

---

### Get All Driver Bookings

Get all active bookings assigned to the driver.

**Endpoint:** `GET /driver-access/{token}/bookings`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
[
  {
    "bookingId": "BK-20251203-ABC123",
    "status": "driver_assigned",
    "passenger": { ... },
    "origin": { ... },
    "destination": { ... },
    "pickupAt": "2025-12-03T10:00:00.000Z",
    "availableActions": ["accept", "decline"],
    ...
  },
  {
    "bookingId": "BK-20251203-XYZ789",
    "status": "confirmed",
    "passenger": { ... },
    "origin": { ... },
    "destination": { ... },
    "pickupAt": "2025-12-03T14:00:00.000Z",
    "availableActions": ["start_trip"],
    ...
  }
]
```

Returns array of booking objects, sorted by pickup time (earliest first).

---

## Booking Status Flow

```
┌─────────────────┐
│ driver_assigned │
└────────┬────────┘
         │
    ┌────┴────┐
    │ accept  │ decline ──► driver_declined
    └────┬────┘
         │
         ▼
┌─────────────────┐
│    confirmed    │
└────────┬────────┘
         │ start trip (en_route)
         ▼
┌─────────────────┐
│    en_route     │
└────────┬────────┘
         │ arrived
         ▼
┌─────────────────┐
│     arrived     │
└────────┬────────┘
         │
    ┌────┼────┐
    │    │    │
    ▼    │    ▼
waiting  │  on_trip ──► completed
    │    │    ▲
    └────┴────┘
         │
         ▼
      no_show
```

---

## Error Handling

### Error Response Format

```json
{
  "statusCode": 401,
  "message": "Invalid token signature",
  "error": "Unauthorized"
}
```

### Common Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Invalid request body or status transition |
| 401 | Unauthorized | Invalid/malformed token |
| 403 | Forbidden | Driver not assigned to this booking |
| 404 | Not Found | Booking not found |

### Error Examples

**Invalid Token:**
```json
{
  "statusCode": 401,
  "message": "Invalid token signature",
  "error": "Unauthorized"
}
```

**Invalid Status Transition:**
```json
{
  "statusCode": 400,
  "message": "Cannot transition from confirmed to completed. Allowed: en_route",
  "error": "Bad Request"
}
```

**Booking Not Found:**
```json
{
  "statusCode": 404,
  "message": "Booking not found",
  "error": "Not Found"
}
```

---

## Frontend Implementation Guide

### 1. URL Structure

Configure your router to handle:
```
/driver/booking/:token
```

### 2. Extract Token from URL

```typescript
// React Router example
import { useParams } from 'react-router-dom';

function DriverBookingPage() {
  const { token } = useParams<{ token: string }>();
  
  // Use token for API calls
}
```

### 3. API Service Example

```typescript
// services/driverApi.ts

const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.visitmauritiusparadise.com/api/v1';

export const driverApi = {
  // Get booking details
  getBooking: async (token: string) => {
    const response = await fetch(`${BASE_URL}/driver-access/${token}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  },

  // Accept booking
  acceptBooking: async (token: string, notes?: string) => {
    const response = await fetch(`${BASE_URL}/driver-access/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  },

  // Decline booking
  declineBooking: async (token: string, reason: string, notes?: string) => {
    const response = await fetch(`${BASE_URL}/driver-access/${token}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, notes }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  },

  // Update status
  updateStatus: async (
    token: string,
    status: string,
    location?: { latitude: number; longitude: number },
    notes?: string
  ) => {
    const response = await fetch(`${BASE_URL}/driver-access/${token}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...location, notes }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  },

  // Update location
  updateLocation: async (
    token: string,
    latitude: number,
    longitude: number,
    address?: string
  ) => {
    const response = await fetch(`${BASE_URL}/driver-access/${token}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude, address }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  },

  // Get all bookings
  getAllBookings: async (token: string) => {
    const response = await fetch(`${BASE_URL}/driver-access/${token}/bookings`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  },
};
```

### 4. Component Example

```tsx
// pages/DriverBooking.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { driverApi } from '../services/driverApi';

interface Booking {
  bookingId: string;
  status: string;
  passenger: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  origin: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  pickupAt: string;
  flightNumber?: string;
  availableActions: string[];
}

export function DriverBookingPage() {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadBooking();
    }
  }, [token]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const data = await driverApi.getBooking(token!);
      setBooking(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      const updated = await driverApi.acceptBooking(token!);
      setBooking(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDecline = async (reason: string) => {
    try {
      await driverApi.declineBooking(token!, reason);
      // Navigate away or show success message
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      // Get current location if available
      let location;
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }
      
      const updated = await driverApi.updateStatus(token!, newStatus, location);
      setBooking(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!booking) return <div>Booking not found</div>;

  return (
    <div className="driver-booking">
      <h1>Booking {booking.bookingId}</h1>
      <div className="status-badge">{booking.status}</div>
      
      <section className="passenger-info">
        <h2>Passenger</h2>
        <p>{booking.passenger.firstName} {booking.passenger.lastName}</p>
        <a href={`tel:${booking.passenger.phone}`}>{booking.passenger.phone}</a>
      </section>

      <section className="trip-info">
        <h2>Trip Details</h2>
        <div className="location">
          <strong>Pickup:</strong> {booking.origin.name}
          <br />
          <small>{booking.origin.address}</small>
        </div>
        <div className="location">
          <strong>Dropoff:</strong> {booking.destination.name}
          <br />
          <small>{booking.destination.address}</small>
        </div>
        <p><strong>Pickup Time:</strong> {new Date(booking.pickupAt).toLocaleString()}</p>
        {booking.flightNumber && (
          <p><strong>Flight:</strong> {booking.flightNumber}</p>
        )}
      </section>

      <section className="actions">
        {booking.availableActions.includes('accept') && (
          <button onClick={handleAccept}>Accept Booking</button>
        )}
        {booking.availableActions.includes('decline') && (
          <button onClick={() => handleDecline('Not available')}>Decline</button>
        )}
        {booking.availableActions.includes('start_trip') && (
          <button onClick={() => handleStatusUpdate('en_route')}>Start Trip</button>
        )}
        {booking.availableActions.includes('arrived') && (
          <button onClick={() => handleStatusUpdate('arrived')}>I've Arrived</button>
        )}
        {booking.availableActions.includes('start_waiting') && (
          <button onClick={() => handleStatusUpdate('waiting')}>Start Waiting</button>
        )}
        {booking.status === 'arrived' || booking.status === 'waiting' ? (
          <button onClick={() => handleStatusUpdate('on_trip')}>Passenger Picked Up</button>
        ) : null}
        {booking.availableActions.includes('complete') && (
          <button onClick={() => handleStatusUpdate('completed')}>Complete Trip</button>
        )}
        {booking.availableActions.includes('no_show') && (
          <button onClick={() => handleStatusUpdate('no_show')}>No Show</button>
        )}
      </section>
    </div>
  );
}
```

### 5. Real-time Location Tracking

For active trips, implement periodic location updates:

```typescript
// hooks/useLocationTracking.ts

import { useEffect, useRef } from 'react';
import { driverApi } from '../services/driverApi';

export function useLocationTracking(
  token: string,
  isActive: boolean,
  intervalMs: number = 30000 // 30 seconds
) {
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !navigator.geolocation) return;

    const updateLocation = (position: GeolocationPosition) => {
      driverApi.updateLocation(
        token,
        position.coords.latitude,
        position.coords.longitude
      ).catch(console.error);
    };

    // Watch position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      console.error,
      {
        enableHighAccuracy: true,
        maximumAge: intervalMs,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [token, isActive, intervalMs]);
}

// Usage in component
function DriverBookingPage() {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  
  // Track location when trip is active
  const isActiveTrip = booking?.status === 'en_route' || booking?.status === 'on_trip';
  useLocationTracking(token!, isActiveTrip);
  
  // ... rest of component
}
```

### 6. Map Integration

Show pickup/dropoff locations on a map:

```tsx
// Using react-leaflet or Google Maps
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function TripMap({ origin, destination }: { origin: Location; destination: Location }) {
  return (
    <MapContainer
      center={[origin.latitude, origin.longitude]}
      zoom={12}
      style={{ height: '300px', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <Marker position={[origin.latitude, origin.longitude]}>
        <Popup>Pickup: {origin.name}</Popup>
      </Marker>
      
      <Marker position={[destination.latitude, destination.longitude]}>
        <Popup>Dropoff: {destination.name}</Popup>
      </Marker>
    </MapContainer>
  );
}
```

---

## TypeScript Interfaces

```typescript
// types/driver.ts

export interface DriverPassenger {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface Location {
  type?: 'airport' | 'address' | 'hotel' | 'port';
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  airportCode?: string;
  terminal?: string;
}

export interface DriverVehicle {
  make: string;
  model: string;
  color: string;
  licensePlate: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: DriverVehicle;
}

export interface BookingVehicle {
  class: string;
  name: string;
}

export interface BookingPricing {
  total: number;
  currency: string;
}

export type BookingStatus = 
  | 'pending_payment'
  | 'confirmed'
  | 'driver_assigned'
  | 'driver_declined'
  | 'en_route'
  | 'arrived'
  | 'waiting'
  | 'no_show'
  | 'on_trip'
  | 'completed'
  | 'cancelled_by_user'
  | 'cancelled_by_ops'
  | 'payment_failed';

export type DriverAction = 
  | 'accept'
  | 'decline'
  | 'start_trip'
  | 'arrived'
  | 'start_waiting'
  | 'complete'
  | 'no_show';

export interface DriverBooking {
  bookingId: string;
  status: BookingStatus;
  passenger: DriverPassenger;
  origin: Location;
  destination: Location;
  pickupAt: string;
  flightNumber?: string;
  flightDate?: string;
  passengers: number;
  luggage: number;
  extras?: string[];
  signText?: string;
  notes?: string;
  vehicle: BookingVehicle;
  pricing: BookingPricing;
  driver?: Driver;
  actualPickupAt?: string;
  actualDropoffAt?: string;
  createdAt: string;
  updatedAt: string;
  availableActions: DriverAction[];
}

export interface AcceptBookingRequest {
  notes?: string;
}

export interface DeclineBookingRequest {
  reason: string;
  notes?: string;
}

export interface UpdateStatusRequest {
  status: BookingStatus;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  address?: string;
  heading?: number;
  speed?: number;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}
```

---

## Questions?

Contact the backend team for any API-related questions or issues.

