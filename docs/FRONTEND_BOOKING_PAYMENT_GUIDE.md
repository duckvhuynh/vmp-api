# Frontend Integration Guide: Booking & Payment

Complete documentation for integrating the VMP booking and payment system.

**Version:** 1.0  
**Last Updated:** November 2025  
**API Base URL:** `https://api.visitmauritiusparadise.com/api/v1`

---

## Table of Contents

1. [Overview](#1-overview)
2. [API Endpoints Summary](#2-api-endpoints-summary)
3. [Complete Booking Flow](#3-complete-booking-flow)
4. [Step 1: Get Quote](#4-step-1-get-quote)
5. [Step 2: Create Booking](#5-step-2-create-booking)
6. [Step 3: Payment Checkout](#6-step-3-payment-checkout)
7. [Step 4: Handle Payment Result](#7-step-4-handle-payment-result)
8. [Booking Management](#8-booking-management)
9. [Data Types Reference](#9-data-types-reference)
10. [Error Handling](#10-error-handling)
11. [Code Examples](#11-code-examples)
12. [Testing Guide](#12-testing-guide)

---

## 1. Overview

### Booking Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                            VMP BOOKING FLOW                                     │
└────────────────────────────────────────────────────────────────────────────────┘

   CUSTOMER JOURNEY                        API CALLS                    BACKEND
   ───────────────                        ─────────                    ───────

┌─────────────────────┐
│ 1. Enter Trip       │
│    - From/To        │───────────────> POST /quotes ──────────────> Calculate
│    - Date/Time      │                                              prices for
│    - Passengers     │<─────────────── Quote Response <──────────── all vehicles
│    - Luggage        │                 (quoteId, vehicles,
└─────────────────────┘                  prices)
         │
         ▼
┌─────────────────────┐
│ 2. Select Vehicle   │
│    - View options   │
│    - Compare prices │
│    - Choose one     │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 3. Enter Details    │
│    - Name           │───────────────> POST /bookings ────────────> Create booking
│    - Email/Phone    │                 (quoteId,                    from quote
│    - Flight info    │                  vehicleClass,
│    - Special notes  │<─────────────── Booking Response <────────── Return payment
└─────────────────────┘                 (bookingId, amount)          info
         │
         ▼
┌─────────────────────┐
│ 4. Payment          │───────────────> POST /payments/checkout ───> Create Fiserv
│    - Click Pay      │                                              session
│    - Redirect to    │<─────────────── Checkout Response <────────
│      Fiserv         │                 (redirectionUrl)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 5. Fiserv Page      │                                              Fiserv handles
│    - Enter card     │                                              payment
│    - 3D Secure      │                                              securely
│    - Submit         │
└─────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│SUCCESS │ │FAILURE │──────────────> Show retry option
│        │ │        │
│Redirect│ │Redirect│
│to site │ │to site │
└────────┘ └────────┘
    │
    ▼
┌─────────────────────┐                 Webhook from Fiserv ───────> Update booking
│ 6. Confirmation     │                                              status to
│    - Booking ID     │                                              "confirmed"
│    - Details        │
│    - Receipt        │
└─────────────────────┘
```

### Key Points

- **No authentication required** for quotes and bookings (guest checkout)
- **Quote expires in 1 hour** - must create booking before expiry
- **Payment via Fiserv** - hosted checkout (PCI compliant)
- **Currency:** MUR (Mauritian Rupee)
- **Webhook** automatically updates booking status after payment

---

## 2. API Endpoints Summary

### Booking Flow Endpoints

| Step | Method | Endpoint | Auth | Purpose |
|------|--------|----------|------|---------|
| 1 | POST | `/quotes` | None | Get prices for trip |
| 2 | GET | `/quotes/:quoteId` | None | Retrieve quote (optional) |
| 3 | POST | `/bookings` | None | Create booking from quote |
| 4 | POST | `/payments/checkout` | Optional | Create payment session |
| 5 | GET | `/bookings/:id` | None | Get booking details |
| 6 | POST | `/bookings/:id/cancel` | None | Cancel booking |

### Payment Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/payments/checkout` | Optional | Create Fiserv checkout |
| GET | `/payments/checkout/:checkoutId` | JWT | Get checkout status |
| GET | `/payments/status` | None | Check if payment service available |

---

## 3. Complete Booking Flow

### Minimal Implementation

```typescript
// 1. Get Quote
const quote = await fetch('/api/v1/quotes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: { type: 'airport', airportCode: 'MRU', latitude: -20.4302, longitude: 57.6836 },
    destination: { type: 'address', address: 'Le Morne', latitude: -20.4499, longitude: 57.3174 },
    pickupAt: '2025-12-01T10:00:00.000Z',
    pax: 2,
    bags: 2
  })
}).then(r => r.json());

// 2. Create Booking (user selects "economy" vehicle)
const booking = await fetch('/api/v1/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quoteId: quote.quoteId,
    selectedVehicleClass: 'economy',
    passenger: { firstName: 'John', lastName: 'Doe' },
    contact: { email: 'john@example.com', phone: '+230 5712 3456' }
  })
}).then(r => r.json());

// 3. Create Payment Checkout
const checkout = await fetch('/api/v1/payments/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bookingId: booking.bookingId,
    total: booking.payment.amount,
    currency: booking.payment.currency,
    successUrl: 'https://yoursite.com/booking/success',
    failureUrl: 'https://yoursite.com/booking/failed'
  })
}).then(r => r.json());

// 4. Redirect to Payment
window.location.href = checkout.redirectionUrl;
```

---

## 4. Step 1: Get Quote

### Endpoint

```
POST /api/v1/quotes
```

### Request Body

```typescript
interface CreateQuoteRequest {
  // Origin location (pickup)
  origin: {
    type: 'airport' | 'address' | 'hotel' | 'port';
    airportCode?: string;      // Required if type='airport' (e.g., 'MRU')
    terminal?: string;         // Optional terminal (e.g., 'T1')
    name?: string;             // Display name
    address?: string;          // Full address
    latitude?: number;         // Required for price calculation
    longitude?: number;        // Required for price calculation
    regionId?: string;         // Optional pre-determined region
  };
  
  // Destination location (dropoff)
  destination: {
    type: 'airport' | 'address' | 'hotel' | 'port';
    airportCode?: string;
    terminal?: string;
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    regionId?: string;
  };
  
  pickupAt: string;           // ISO 8601 datetime (must be in future)
  pax: number;                // Number of passengers (min: 1)
  bags: number;               // Number of luggage items (min: 0)
  extras?: string[];          // Optional extras (see below)
  preferredVehicleClass?: string;  // Optional: only get price for this class
  distanceKm?: number;        // Optional: pre-calculated distance
  durationMinutes?: number;   // Optional: pre-calculated duration
}
```

### Available Extras

| Extra ID | Description | Price (MUR) |
|----------|-------------|-------------|
| `child_seat` | Child safety seat | 200 |
| `baby_seat` | Baby/infant seat | 250 |
| `wheelchair_accessible` | Wheelchair accessible vehicle | 0 |
| `extra_luggage` | Additional luggage space | 100 |
| `meet_and_greet` | Driver with name sign | 300 |
| `priority_pickup` | Priority/VIP pickup | 400 |
| `extra_stop` | Additional stop en route | 200 |

### Example Request

```json
{
  "origin": {
    "type": "airport",
    "airportCode": "MRU",
    "terminal": "T1",
    "name": "Sir Seewoosagur Ramgoolam International Airport",
    "address": "Plaine Magnien, Mauritius",
    "latitude": -20.4302,
    "longitude": 57.6836
  },
  "destination": {
    "type": "address",
    "name": "Le Morne Beach",
    "address": "Le Morne, Mauritius",
    "latitude": -20.4499,
    "longitude": 57.3174
  },
  "pickupAt": "2025-12-01T10:00:00.000Z",
  "pax": 2,
  "bags": 2,
  "extras": ["child_seat", "meet_and_greet"]
}
```

### Response

```typescript
interface QuoteResponse {
  quoteId: string;              // Use this for booking creation
  
  vehicleClasses: Array<{
    id: string;                 // Vehicle class ID (use for selectedVehicleClass)
    name: string;               // Display name
    paxCapacity: number;        // Max passengers
    bagCapacity: number;        // Max luggage
    image?: string;             // Vehicle image URL
    pricing: {
      baseFare: number;
      distanceCharge?: number;
      timeCharge?: number;
      airportFees?: number;
      surcharges?: number;
      extras?: number;
      total: number;            // Final price
      currency: string;         // 'MUR'
    };
    appliedSurcharges?: Array<{
      name: string;
      application: string;
      value: number;
      amount: number;
      reason?: string;
    }>;
    includedWaitingTime?: number;      // Minutes
    additionalWaitingPrice?: number;   // Per minute
    isFixedPrice?: boolean;
  }>;
  
  policy: {
    cancellation: string;
    includedWait: string;
    additionalWaitCharge?: string;
    quoteExpiresAt: string;
  };
  
  estimatedDistance?: number;   // Kilometers
  estimatedDuration?: number;   // Minutes
  originName?: string;
  destinationName?: string;
  pickupAt: string;
  passengers: number;
  luggage: number;
  extras?: string[];
  createdAt: Date;
  expiresAt: Date;              // Quote expires at this time
}
```

### Example Response

```json
{
  "quoteId": "4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1",
  "vehicleClasses": [
    {
      "id": "economy",
      "name": "Economy",
      "paxCapacity": 3,
      "bagCapacity": 2,
      "image": "https://storage.visitmauritiusparadise.com/vmp/vehicles/economy.jpg",
      "pricing": {
        "baseFare": 300,
        "distanceCharge": 350,
        "timeCharge": 60,
        "extras": 500,
        "total": 1210,
        "currency": "MUR"
      },
      "includedWaitingTime": 15,
      "additionalWaitingPrice": 5,
      "isFixedPrice": false
    },
    {
      "id": "comfort",
      "name": "Comfort",
      "paxCapacity": 4,
      "bagCapacity": 3,
      "image": "https://storage.visitmauritiusparadise.com/vmp/vehicles/comfort.jpg",
      "pricing": {
        "baseFare": 400,
        "distanceCharge": 450,
        "timeCharge": 80,
        "extras": 500,
        "total": 1430,
        "currency": "MUR"
      },
      "includedWaitingTime": 15,
      "additionalWaitingPrice": 5,
      "isFixedPrice": false
    },
    {
      "id": "premium",
      "name": "Premium",
      "paxCapacity": 4,
      "bagCapacity": 3,
      "pricing": {
        "total": 1850,
        "currency": "MUR"
      }
    },
    {
      "id": "van",
      "name": "Van",
      "paxCapacity": 7,
      "bagCapacity": 6,
      "pricing": {
        "total": 1650,
        "currency": "MUR"
      }
    }
  ],
  "policy": {
    "cancellation": "Free cancellation until 24 hours before pickup",
    "includedWait": "60 minutes after landing for arrivals",
    "additionalWaitCharge": "5 MUR per minute",
    "quoteExpiresAt": "2025-11-29T11:00:00.000Z"
  },
  "estimatedDistance": 45.5,
  "estimatedDuration": 65,
  "originName": "MRU Airport - Terminal T1",
  "destinationName": "Le Morne Beach",
  "pickupAt": "2025-12-01T10:00:00.000Z",
  "passengers": 2,
  "luggage": 2,
  "extras": ["child_seat", "meet_and_greet"],
  "createdAt": "2025-11-29T10:00:00.000Z",
  "expiresAt": "2025-11-29T11:00:00.000Z"
}
```

### UI Implementation

```tsx
// VehicleSelector.tsx
interface VehicleSelectorProps {
  quote: QuoteResponse;
  onSelect: (vehicleClassId: string) => void;
  selectedId?: string;
}

function VehicleSelector({ quote, onSelect, selectedId }: VehicleSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Select Your Vehicle</h2>
      <p className="text-gray-600">
        {quote.estimatedDistance?.toFixed(1)} km • {quote.estimatedDuration} min estimated
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quote.vehicleClasses.map((vehicle) => (
          <div
            key={vehicle.id}
            onClick={() => onSelect(vehicle.id)}
            className={`
              p-4 border rounded-lg cursor-pointer transition
              ${selectedId === vehicle.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            {vehicle.image && (
              <img 
                src={vehicle.image} 
                alt={vehicle.name}
                className="w-full h-32 object-contain mb-3"
              />
            )}
            
            <h3 className="font-semibold text-lg">{vehicle.name}</h3>
            
            <div className="text-sm text-gray-600 mt-1">
              <span>{vehicle.paxCapacity} passengers</span>
              <span className="mx-2">•</span>
              <span>{vehicle.bagCapacity} bags</span>
            </div>
            
            <div className="mt-3 text-xl font-bold text-blue-600">
              {vehicle.pricing.currency} {vehicle.pricing.total.toLocaleString()}
            </div>
            
            {vehicle.isFixedPrice && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Fixed Price
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
        <p><strong>Cancellation:</strong> {quote.policy.cancellation}</p>
        <p><strong>Waiting Time:</strong> {quote.policy.includedWait}</p>
        <p className="text-orange-600 mt-2">
          ⏰ Quote expires: {new Date(quote.expiresAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
```

---

## 5. Step 2: Create Booking

### Endpoint

```
POST /api/v1/bookings
```

### Request Body

```typescript
interface CreateBookingRequest {
  quoteId: string;              // From quote response
  selectedVehicleClass: string; // Must match vehicleClasses[].id from quote
  
  passenger: {
    firstName: string;
    lastName: string;
  };
  
  contact: {
    email: string;
    phone: string;              // Include country code
  };
  
  flight?: {                    // Recommended for airport pickups
    number: string;             // e.g., 'MK015'
    date?: string;              // e.g., '2025-12-01'
  };
  
  signText?: string;            // Meet & greet sign text
  notes?: string;               // Special instructions
  extras?: string[];            // Additional extras (merged with quote extras)
}
```

### Example Request

```json
{
  "quoteId": "4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1",
  "selectedVehicleClass": "economy",
  "passenger": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "contact": {
    "email": "john@example.com",
    "phone": "+230 5712 3456"
  },
  "flight": {
    "number": "MK015",
    "date": "2025-12-01"
  },
  "signText": "Mr. John Doe",
  "notes": "I will have a blue suitcase"
}
```

### Response

```typescript
interface BookingResponse {
  bookingId: string;            // Booking reference (e.g., 'BK-20251129-ABC123')
  status: BookingStatus;        // 'pending_payment'
  
  summary: {
    origin: string;
    destination: string;
    pickupAt: string;
    vehicleClass: string;
    vehicleName: string;
    passengers: number;
    luggage: number;
    flightNumber?: string;
  };
  
  payment: {
    amount: number;             // Amount to charge
    currency: string;           // 'MUR'
    bookingId: string;          // Same as above
    checkoutEndpoint: string;   // '/api/v1/payments/checkout'
  };
  
  policySnapshot: {
    cancellation: string;
    includedWait: string;
  };
  
  confirmation: {
    message: string;
  };
  
  createdAt: string;
  expiresAt: string;            // Payment must be completed before this
}

type BookingStatus = 
  | 'pending_payment'
  | 'confirmed'
  | 'driver_assigned'
  | 'en_route'
  | 'arrived'
  | 'waiting'
  | 'no_show'
  | 'on_trip'
  | 'completed'
  | 'cancelled_by_user'
  | 'cancelled_by_ops'
  | 'payment_failed';
```

### Example Response

```json
{
  "bookingId": "BK-20251129-ABC123",
  "status": "pending_payment",
  "summary": {
    "origin": "MRU Airport - Terminal T1",
    "destination": "Le Morne Beach",
    "pickupAt": "2025-12-01T10:00:00.000Z",
    "vehicleClass": "economy",
    "vehicleName": "Economy",
    "passengers": 2,
    "luggage": 2,
    "flightNumber": "MK015"
  },
  "payment": {
    "amount": 1210,
    "currency": "MUR",
    "bookingId": "BK-20251129-ABC123",
    "checkoutEndpoint": "/api/v1/payments/checkout"
  },
  "policySnapshot": {
    "cancellation": "Free cancellation until 24 hours before pickup",
    "includedWait": "60 minutes after landing for arrivals"
  },
  "confirmation": {
    "message": "Booking created successfully. Please complete payment to confirm."
  },
  "createdAt": "2025-11-29T10:05:00.000Z",
  "expiresAt": "2025-11-29T11:00:00.000Z"
}
```

### Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Quote not found` | Invalid quoteId | Get a new quote |
| `Quote has expired` | Quote older than 1 hour | Get a new quote |
| `Quote already used` | Quote used for another booking | Get a new quote |
| `Vehicle class not available` | Invalid selectedVehicleClass | Use `id` from quote.vehicleClasses |

---

## 6. Step 3: Payment Checkout

### Endpoint

```
POST /api/v1/payments/checkout
```

### Request Body

```typescript
interface CreateCheckoutRequest {
  bookingId: string;            // From booking response
  total: number;                // From booking.payment.amount
  currency: string;             // From booking.payment.currency
  
  // Redirect URLs (required)
  successUrl: string;           // Where to redirect on success
  failureUrl: string;           // Where to redirect on failure
  
  // Optional
  customerEmail?: string;       // For receipt
  customerName?: string;        // Display name
  description?: string;         // Payment description
  paymentMethod?: 'Cards' | 'PayPal';  // Pre-selected method
  locale?: string;              // Checkout page language (default: 'en_GB')
}
```

### Example Request

```json
{
  "bookingId": "BK-20251129-ABC123",
  "total": 1210,
  "currency": "MUR",
  "customerEmail": "john@example.com",
  "customerName": "John Doe",
  "description": "Airport Transfer: MRU Airport to Le Morne Beach",
  "successUrl": "https://visitmauritiusparadise.com/booking/success?bookingId=BK-20251129-ABC123",
  "failureUrl": "https://visitmauritiusparadise.com/booking/failed?bookingId=BK-20251129-ABC123"
}
```

### Response

```typescript
interface CheckoutResponse {
  checkoutId: string;           // Fiserv checkout ID
  redirectionUrl: string;       // Redirect customer here for payment
  bookingId: string;
  merchantTransactionId: string;
  amount: number;
  currency: string;
  status: 'WAITING';
  createdAt: string;
}
```

### Example Response

```json
{
  "checkoutId": "b00c083a-bacf-44aa-b64a-efee15dcb4ba",
  "redirectionUrl": "https://checkout-lane.com/#/?checkoutId=b00c083a-bacf-44aa-b64a-efee15dcb4ba",
  "bookingId": "BK-20251129-ABC123",
  "merchantTransactionId": "TXN-20251129-BK-20251129-ABC123",
  "amount": 1210,
  "currency": "MUR",
  "status": "WAITING",
  "createdAt": "2025-11-29T10:06:00.000Z"
}
```

### Redirect to Payment

```typescript
// After receiving checkout response
window.location.href = checkout.redirectionUrl;

// Customer completes payment on Fiserv's secure page
// Then gets redirected back to your successUrl or failureUrl
```

---

## 7. Step 4: Handle Payment Result

### Success Page

Create a page at your `successUrl` to handle successful payments:

```typescript
// URL: https://yoursite.com/booking/success?bookingId=BK-20251129-ABC123

// pages/booking/success.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBooking(bookingId);
    }
  }, [bookingId]);

  const fetchBooking = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/bookings/${id}`);
      if (!response.ok) throw new Error('Booking not found');
      const data = await response.json();
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <a href="/" className="mt-4 inline-block text-blue-600">Return Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
          <p className="mt-2 text-gray-600">Thank you for your booking.</p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="border-b pb-4 mb-4">
            <p className="text-sm text-gray-500">Booking Reference</p>
            <p className="text-2xl font-mono font-bold">{booking?.bookingId}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-semibold text-green-600">
                {booking?.status === 'confirmed' ? 'Confirmed' : booking?.status}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Pickup</span>
              <span className="font-semibold">
                {booking?.pickupAt && new Date(booking.pickupAt).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">From</span>
              <span className="font-semibold">{booking?.origin?.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">To</span>
              <span className="font-semibold">{booking?.destination?.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Vehicle</span>
              <span className="font-semibold">{booking?.vehicle?.name}</span>
            </div>

            <div className="flex justify-between border-t pt-4">
              <span className="text-gray-600">Total Paid</span>
              <span className="text-xl font-bold text-blue-600">
                {booking?.pricing?.currency} {booking?.pricing?.total?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900">What's Next?</h3>
          <ul className="mt-2 text-sm text-blue-800 space-y-1">
            <li>• A confirmation email has been sent to {booking?.passenger?.email}</li>
            <li>• Your driver will be assigned closer to your pickup time</li>
            <li>• You'll receive driver details via SMS/email</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <a href="/" className="flex-1 text-center py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Book Another Trip
          </a>
          <button 
            onClick={() => window.print()} 
            className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Failure Page

```typescript
// pages/booking/failed.tsx
export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const handleRetry = () => {
    // Redirect back to payment
    window.location.href = `/booking/${bookingId}/pay`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4 text-center">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Payment Failed</h1>
        <p className="mt-2 text-gray-600">
          We couldn't process your payment. Please try again.
        </p>

        {bookingId && (
          <p className="mt-4 text-sm text-gray-500">
            Booking Reference: <span className="font-mono">{bookingId}</span>
          </p>
        )}

        <div className="mt-8 space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
          
          <a
            href="/contact"
            className="block w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Contact Support
          </a>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          If you continue to experience issues, please contact our support team.
        </p>
      </div>
    </div>
  );
}
```

---

## 8. Booking Management

### Get Booking Details

```
GET /api/v1/bookings/:id
```

```typescript
const response = await fetch(`/api/v1/bookings/${bookingId}`);
const booking = await response.json();
```

### Response

```json
{
  "bookingId": "BK-20251129-ABC123",
  "status": "confirmed",
  "passenger": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+230 5712 3456",
    "email": "john@example.com"
  },
  "origin": {
    "type": "airport",
    "name": "MRU Airport - Terminal T1",
    "address": "Plaine Magnien, Mauritius",
    "latitude": -20.4302,
    "longitude": 57.6836
  },
  "destination": {
    "type": "address",
    "name": "Le Morne Beach",
    "address": "Le Morne, Mauritius",
    "latitude": -20.4499,
    "longitude": 57.3174
  },
  "pickupAt": "2025-12-01T10:00:00.000Z",
  "flightNumber": "MK015",
  "passengers": 2,
  "luggage": 2,
  "extras": ["child_seat", "meet_and_greet"],
  "vehicle": {
    "class": "economy",
    "name": "Economy",
    "capacity": 3,
    "luggageCapacity": 2
  },
  "pricing": {
    "baseFare": 300,
    "distanceCharge": 350,
    "timeCharge": 60,
    "extras": 500,
    "total": 1210,
    "currency": "MUR"
  },
  "payment": {
    "confirmed": true,
    "confirmedAt": "2025-11-29T10:10:00.000Z"
  },
  "driver": null,
  "events": [
    {
      "event": "created",
      "status": "pending_payment",
      "timestamp": "2025-11-29T10:05:00.000Z",
      "description": "Booking created from quote. Vehicle: Economy"
    },
    {
      "event": "payment_success",
      "status": "confirmed",
      "timestamp": "2025-11-29T10:10:00.000Z",
      "description": "Payment approved. Amount: 1210 MUR"
    }
  ],
  "createdAt": "2025-11-29T10:05:00.000Z",
  "updatedAt": "2025-11-29T10:10:00.000Z"
}
```

### Cancel Booking

```
POST /api/v1/bookings/:id/cancel
```

```typescript
const response = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
  method: 'POST'
});
const result = await response.json();
```

### Cancel Response

```json
{
  "bookingId": "BK-20251129-ABC123",
  "status": "cancelled_by_user",
  "refund": {
    "amount": 1210,
    "currency": "MUR",
    "status": "pending"
  },
  "message": "Booking cancelled. Refund of 1210 MUR will be processed."
}
```

### Refund Policy

| Cancel Time | Refund |
|-------------|--------|
| 24+ hours before pickup | 100% |
| 2-24 hours before pickup | 50% |
| Less than 2 hours | 0% |

---

## 9. Data Types Reference

### Place Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `airport` | Airport terminal | `airportCode`, optionally `terminal` |
| `address` | Street address | `address` or `name` |
| `hotel` | Hotel/accommodation | `name` |
| `port` | Cruise port | `name` |

### Vehicle Classes

| ID | Name | Passengers | Luggage | Use Case |
|----|------|------------|---------|----------|
| `economy` | Economy | 3 | 2 | Budget option |
| `comfort` | Comfort | 4 | 3 | Standard option |
| `premium` | Premium | 4 | 3 | Business travelers |
| `van` | Van | 7 | 6 | Groups/families |
| `luxury` | Luxury | 4 | 3 | VIP/special occasions |

### Booking Statuses

| Status | Description | Can Cancel? |
|--------|-------------|-------------|
| `pending_payment` | Awaiting payment | Yes |
| `confirmed` | Payment received | Yes |
| `driver_assigned` | Driver allocated | Yes |
| `en_route` | Driver on the way | Yes |
| `arrived` | Driver at pickup | Yes |
| `waiting` | Driver waiting | Yes |
| `on_trip` | Trip in progress | No |
| `completed` | Trip finished | No |
| `no_show` | Customer didn't show | No |
| `cancelled_by_user` | Customer cancelled | No |
| `cancelled_by_ops` | Operations cancelled | No |
| `payment_failed` | Payment failed | Yes |

---

## 10. Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "timestamp": "2025-11-29T10:00:00.000Z",
  "path": "/api/v1/bookings",
  "method": "POST",
  "message": "Quote has expired. Please get a new quote.",
  "error": "Bad Request"
}
```

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Pickup time must be in future | Use future date/time |
| 400 | Quote expired | Get a new quote |
| 400 | Quote already used | Get a new quote |
| 400 | Vehicle class not available | Use valid class from quote |
| 400 | Cannot cancel booking | Booking already completed |
| 404 | Quote not found | Check quoteId |
| 404 | Booking not found | Check bookingId |
| 500 | Payment gateway error | Retry or contact support |

### Error Handling Example

```typescript
async function createBooking(data: CreateBookingRequest) {
  try {
    const response = await fetch('/api/v1/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          if (error.message.includes('expired')) {
            // Quote expired - redirect to get new quote
            showToast('Your quote has expired. Getting new prices...');
            return redirectToQuote();
          }
          if (error.message.includes('already used')) {
            showToast('This quote has already been used.');
            return redirectToQuote();
          }
          break;
        case 404:
          showToast('Quote not found. Please try again.');
          return redirectToQuote();
        default:
          showToast('Something went wrong. Please try again.');
      }
      
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Booking error:', error);
    throw error;
  }
}
```

---

## 11. Code Examples

### Complete React Hook

```typescript
// hooks/useBooking.ts
import { useState, useCallback } from 'react';

interface BookingState {
  quote: QuoteResponse | null;
  booking: BookingResponse | null;
  loading: boolean;
  error: string | null;
  step: 'quote' | 'vehicle' | 'details' | 'payment' | 'complete';
}

export function useBooking() {
  const [state, setState] = useState<BookingState>({
    quote: null,
    booking: null,
    loading: false,
    error: null,
    step: 'quote'
  });

  const setLoading = (loading: boolean) => 
    setState(s => ({ ...s, loading, error: null }));
  
  const setError = (error: string) => 
    setState(s => ({ ...s, error, loading: false }));

  const getQuote = useCallback(async (tripData: CreateQuoteRequest) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }
      
      const quote = await response.json();
      setState(s => ({ ...s, quote, loading: false, step: 'vehicle' }));
      return quote;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quote');
      return null;
    }
  }, []);

  const createBooking = useCallback(async (
    selectedVehicleClass: string,
    passengerData: { passenger: any; contact: any; flight?: any; notes?: string }
  ) => {
    if (!state.quote) {
      setError('No quote available');
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: state.quote.quoteId,
          selectedVehicleClass,
          ...passengerData
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }
      
      const booking = await response.json();
      setState(s => ({ ...s, booking, loading: false, step: 'payment' }));
      return booking;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      return null;
    }
  }, [state.quote]);

  const initiatePayment = useCallback(async (options?: {
    successUrl?: string;
    failureUrl?: string;
  }) => {
    if (!state.booking) {
      setError('No booking available');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch('/api/v1/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: state.booking.bookingId,
          total: state.booking.payment.amount,
          currency: state.booking.payment.currency,
          successUrl: options?.successUrl || `${baseUrl}/booking/success?bookingId=${state.booking.bookingId}`,
          failureUrl: options?.failureUrl || `${baseUrl}/booking/failed?bookingId=${state.booking.bookingId}`
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }
      
      const checkout = await response.json();
      
      // Redirect to payment page
      window.location.href = checkout.redirectionUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
    }
  }, [state.booking]);

  const reset = useCallback(() => {
    setState({
      quote: null,
      booking: null,
      loading: false,
      error: null,
      step: 'quote'
    });
  }, []);

  return {
    ...state,
    getQuote,
    createBooking,
    initiatePayment,
    reset
  };
}
```

### Usage Example

```tsx
// pages/book.tsx
import { useBooking } from '@/hooks/useBooking';
import { TripSearchForm } from '@/components/TripSearchForm';
import { VehicleSelector } from '@/components/VehicleSelector';
import { PassengerForm } from '@/components/PassengerForm';
import { PaymentSummary } from '@/components/PaymentSummary';

export default function BookingPage() {
  const {
    quote,
    booking,
    loading,
    error,
    step,
    getQuote,
    createBooking,
    initiatePayment
  } = useBooking();

  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Progress Steps */}
      <ProgressBar currentStep={step} />
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1: Trip Search */}
      {step === 'quote' && (
        <TripSearchForm onSubmit={getQuote} />
      )}

      {/* Step 2: Vehicle Selection */}
      {step === 'vehicle' && quote && (
        <VehicleSelector
          quote={quote}
          selectedId={selectedVehicle}
          onSelect={(id) => {
            setSelectedVehicle(id);
          }}
          onContinue={() => setState(s => ({ ...s, step: 'details' }))}
        />
      )}

      {/* Step 3: Passenger Details */}
      {step === 'details' && quote && (
        <PassengerForm
          quote={quote}
          selectedVehicle={selectedVehicle}
          onSubmit={(data) => createBooking(selectedVehicle, data)}
          onBack={() => setState(s => ({ ...s, step: 'vehicle' }))}
        />
      )}

      {/* Step 4: Payment Summary */}
      {step === 'payment' && booking && (
        <PaymentSummary
          booking={booking}
          onPay={initiatePayment}
          onBack={() => setState(s => ({ ...s, step: 'details' }))}
        />
      )}
    </div>
  );
}
```

---

## 12. Testing Guide

### Test Scenarios

| Scenario | Steps | Expected |
|----------|-------|----------|
| Happy path | Quote → Booking → Payment → Success | Booking confirmed |
| Expired quote | Wait 1+ hour, try to book | Error: Quote expired |
| Invalid vehicle | Use wrong vehicle class | Error: Vehicle not available |
| Payment failure | Decline payment | Redirect to failure URL |
| Cancel booking | Cancel within 24h | Full refund |
| Late cancellation | Cancel < 2h before | No refund |

### Test Data

**Airport Locations (Mauritius)**
```json
{
  "MRU": { "lat": -20.4302, "lon": 57.6836, "name": "SSR International Airport" }
}
```

**Popular Destinations**
```json
{
  "LeMorne": { "lat": -20.4499, "lon": 57.3174 },
  "PortLouis": { "lat": -20.1609, "lon": 57.4989 },
  "GrandBaie": { "lat": -20.0119, "lon": 57.5806 },
  "Flic-en-Flac": { "lat": -20.2753, "lon": 57.3629 }
}
```

### Checklist

- [ ] Quote endpoint returns all vehicle options
- [ ] Vehicle images display correctly
- [ ] Booking created from quote successfully
- [ ] Booking fails if quote expired
- [ ] Payment redirect works
- [ ] Success page loads with booking details
- [ ] Failure page shows retry option
- [ ] Cancellation works with correct refund
- [ ] Mobile responsive on all screens
- [ ] Loading states shown during API calls
- [ ] Error messages are user-friendly

---

## Support

**API Status:** `GET /api/v1/payments/status`

**Contact:**
- Technical: dev@visitmauritiusparadise.com
- Support: support@visitmauritiusparadise.com

**Documentation:**
- Swagger UI: `https://api.visitmauritiusparadise.com/docs`

