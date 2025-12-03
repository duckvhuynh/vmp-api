# Customer Booking Access API Documentation

This document describes the public API endpoints for customers to access and manage their bookings without requiring authentication. Access is controlled via short access codes embedded in URLs.

## Overview

### URL Format
- **Base URL**: `https://api.visitmauritiusparadise.com/my-booking/{accessCode}`
- **Access Code**: 8-character alphanumeric code (e.g., `X7K9M2P4`)
- Customer receives this URL in their booking confirmation email/SMS

### How It Works
1. Customer creates a booking via the website or app
2. System generates a unique 8-character access code
3. Customer receives the booking URL (e.g., `/my-booking/X7K9M2P4`)
4. Customer can view booking details, pay, or cancel using this URL
5. No login required - the access code serves as authentication

---

## Endpoints

### 1. Get Booking by Access Code

Retrieve complete booking details using the short access code.

**Endpoint**: `GET /my-booking/:accessCode`

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `accessCode` | string | 8-character booking access code (case-insensitive) |

**Response** (`200 OK`):
```json
{
  "bookingId": "BK-20251203-ABC123",
  "accessCode": "X7K9M2P4",
  "status": "confirmed",
  "statusDisplay": "Confirmed",
  "statusMessage": "Your booking is confirmed. A driver will be assigned soon.",
  
  "passenger": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+230 5712 3456",
    "email": "john@example.com"
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
    "name": "Le Morne Beach Resort",
    "address": "Le Morne, Mauritius",
    "latitude": -20.4499,
    "longitude": 57.3174
  },
  
  "pickupAt": "2025-12-03T10:00:00.000Z",
  "flightNumber": "MK501",
  "passengers": 2,
  "luggage": 3,
  "extras": ["child_seat", "meet_and_greet"],
  "signText": "Mr. Doe",
  "notes": "Elderly passenger, please assist",
  
  "vehicle": {
    "class": "economy",
    "name": "Economy Sedan",
    "capacity": 4,
    "luggageCapacity": 2
  },
  
  "pricing": {
    "baseFare": 500,
    "distanceCharge": 350,
    "airportFees": 100,
    "surcharges": 50,
    "extrasTotal": 200,
    "total": 1200,
    "currency": "MUR"
  },
  
  "payment": {
    "isPaid": false,
    "canPay": true
  },
  
  "driver": null,
  
  "timeline": [
    {
      "event": "created",
      "status": "pending_payment",
      "timestamp": "2025-12-01T09:00:00.000Z",
      "description": "Booking created"
    }
  ],
  
  "canCancel": true,
  "cancellationPolicy": "Free cancellation available. Full refund if cancelled now.",
  
  "createdAt": "2025-12-01T09:00:00.000Z",
  "updatedAt": "2025-12-01T09:00:00.000Z"
}
```

**When Driver is Assigned**:
```json
{
  "driver": {
    "name": "Jean-Pierre D.",
    "phone": "+230 5234 5678",
    "rating": 4.8,
    "vehicle": {
      "make": "Toyota",
      "model": "Camry",
      "color": "Silver",
      "licensePlate": "MU 1234"
    }
  }
}
```

**Error Responses**:
- `404 Not Found`: Booking not found. Please check your booking code.

---

### 2. Create Payment Checkout

Create a payment checkout session to complete payment for unpaid bookings.

**Endpoint**: `POST /my-booking/:accessCode/pay`

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `accessCode` | string | 8-character booking access code |

**Request Body** (optional):
```json
{
  "successUrl": "https://visitmauritiusparadise.com/booking/success",
  "failureUrl": "https://visitmauritiusparadise.com/booking/failed"
}
```

**Response** (`200 OK`):
```json
{
  "checkoutId": "b00c083a-bacf-44aa-b64a-efee15dcb4ba",
  "redirectionUrl": "https://checkout-lane.com/#/?checkoutId=b00c083a-bacf...",
  "bookingId": "BK-20251203-ABC123",
  "amount": 1200,
  "currency": "MUR"
}
```

**Frontend Flow**:
1. Call `POST /my-booking/{accessCode}/pay`
2. Receive `redirectionUrl` in response
3. Redirect customer to `redirectionUrl`
4. Customer completes payment on Fiserv hosted page
5. Customer is redirected back to successUrl/failureUrl
6. Webhook automatically updates booking status

**Error Responses**:
- `400 Bad Request`: 
  - Payment already completed
  - Booking is cancelled
  - Trip is completed/in progress
- `404 Not Found`: Booking not found

---

### 3. Cancel Booking

Cancel a booking. Refund amount depends on how close to pickup time.

**Endpoint**: `POST /my-booking/:accessCode/cancel`

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `accessCode` | string | 8-character booking access code |

**Request Body** (optional):
```json
{
  "reason": "Change of plans"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Booking cancelled. A refund of 1200 MUR will be processed.",
  "bookingId": "BK-20251203-ABC123",
  "status": "cancelled_by_user",
  "refund": {
    "amount": 1200,
    "currency": "MUR",
    "status": "pending"
  }
}
```

**Refund Policy**:
| Time Before Pickup | Refund |
|--------------------|--------|
| 24+ hours | 100% |
| 2-24 hours | 50% |
| Less than 2 hours | 0% |

**Cannot Cancel If**:
- Trip is in progress (`on_trip`)
- Trip is completed (`completed`)
- Already cancelled

**Error Responses**:
- `400 Bad Request`: Booking cannot be cancelled (status restriction)
- `404 Not Found`: Booking not found

---

### 4. Get Booking by Booking ID (Alternative)

Alternative endpoint when customer has the full booking ID but not the access code.

**Endpoint**: `GET /my-booking/id/:bookingId`

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `bookingId` | string | Full booking ID (e.g., `BK-20251203-ABC123`) |

**Response**: Same as `GET /my-booking/:accessCode`

---

## Booking Status Values

| Status | Display | Description |
|--------|---------|-------------|
| `pending_payment` | Pending Payment | Awaiting payment |
| `confirmed` | Confirmed | Payment received, awaiting driver |
| `driver_assigned` | Driver Assigned | Driver has been assigned |
| `driver_declined` | Finding New Driver | Previous driver declined, finding replacement |
| `en_route` | Driver En Route | Driver is on the way |
| `arrived` | Driver Arrived | Driver at pickup location |
| `waiting` | Driver Waiting | Driver waiting for customer |
| `no_show` | No Show | Customer didn't show up |
| `on_trip` | Trip In Progress | Currently in vehicle |
| `completed` | Completed | Trip finished |
| `cancelled_by_user` | Cancelled | Cancelled by customer |
| `cancelled_by_ops` | Cancelled | Cancelled by operator |
| `payment_failed` | Payment Failed | Payment was unsuccessful |

---

## Frontend Integration Example

### React Component Example

```tsx
// BookingPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

interface BookingDetails {
  bookingId: string;
  accessCode: string;
  status: string;
  statusDisplay: string;
  statusMessage: string;
  payment: {
    isPaid: boolean;
    canPay: boolean;
  };
  canCancel: boolean;
  cancellationPolicy: string;
  // ... other fields
}

export function BookingPage() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for payment callback
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      // Show success message, refresh booking
    } else if (paymentStatus === 'failed') {
      // Show error message
    }
  }, [searchParams]);

  // Fetch booking details
  useEffect(() => {
    async function fetchBooking() {
      try {
        const response = await fetch(`/api/v1/my-booking/${accessCode}`);
        if (!response.ok) {
          throw new Error('Booking not found');
        }
        const data = await response.json();
        setBooking(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [accessCode]);

  // Handle payment
  async function handlePay() {
    try {
      const response = await fetch(`/api/v1/my-booking/${accessCode}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/my-booking/${accessCode}?payment=success`,
          failureUrl: `${window.location.origin}/my-booking/${accessCode}?payment=failed`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout');
      }
      
      const { redirectionUrl } = await response.json();
      window.location.href = redirectionUrl;
    } catch (err) {
      // Handle error
    }
  }

  // Handle cancellation
  async function handleCancel(reason?: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      const response = await fetch(`/api/v1/my-booking/${accessCode}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      
      const result = await response.json();
      if (result.success) {
        // Refresh booking or show success
      }
    } catch (err) {
      // Handle error
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!booking) return <div>Booking not found</div>;

  return (
    <div className="booking-page">
      <h1>Booking {booking.bookingId}</h1>
      <div className="status">
        <span className={`badge status-${booking.status}`}>
          {booking.statusDisplay}
        </span>
        <p>{booking.statusMessage}</p>
      </div>

      {/* Show Pay button if payment pending */}
      {booking.payment.canPay && !booking.payment.isPaid && (
        <button onClick={handlePay} className="btn-primary">
          Pay Now
        </button>
      )}

      {/* Show Cancel button if cancellable */}
      {booking.canCancel && (
        <div className="cancel-section">
          <p className="policy">{booking.cancellationPolicy}</p>
          <button onClick={() => handleCancel()} className="btn-danger">
            Cancel Booking
          </button>
        </div>
      )}

      {/* Booking details... */}
    </div>
  );
}
```

### URL Routing

```tsx
// App.tsx or routes configuration
<Route path="/my-booking/:accessCode" element={<BookingPage />} />
```

---

## Admin API - Getting Booking URLs

When admins create or view bookings, the booking URL is included in the response:

### In Booking List
```json
{
  "bookings": [
    {
      "bookingId": "BK-20251203-ABC123",
      "accessCode": "X7K9M2P4",
      // ... other fields
    }
  ]
}
```

### In Booking Details
```json
{
  "bookingId": "BK-20251203-ABC123",
  "accessCode": "X7K9M2P4",
  "bookingUrl": "https://visitmauritiusparadise.com/my-booking/X7K9M2P4",
  // ... other fields
}
```

### In Booking Creation Response
```json
{
  "bookingId": "BK-20251203-ABC123",
  "accessCode": "X7K9M2P4",
  "bookingUrl": "https://visitmauritiusparadise.com/my-booking/X7K9M2P4",
  // ... other fields
}
```

---

## Security Notes

1. **Access Code Security**: The 8-character alphanumeric access code provides sufficient entropy (approximately 2.8 trillion combinations) to prevent brute-force attacks while remaining user-friendly.

2. **Rate Limiting**: Consider implementing rate limiting on the booking lookup endpoints to prevent enumeration attacks.

3. **No Sensitive Data Exposure**: The customer API deliberately omits sensitive information like:
   - Full driver last name (only shows initial)
   - Internal system IDs
   - Admin notes

4. **HTTPS Required**: All endpoints should be accessed via HTTPS to protect the access code in transit.

---

## Environment Variables

```env
# Frontend URL for generating booking links
FRONTEND_URL=https://visitmauritiusparadise.com

# Payment gateway configuration
FISERV_API_KEY=your_fiserv_api_key
FISERV_SECRET_KEY=your_fiserv_secret_key
FISERV_STORE_ID=your_store_id
```

---

## Related APIs

- **Payment API**: See `API_DOCUMENTATION.md` for `/payments/checkout` endpoint
- **Driver Access API**: See `DRIVER_ACCESS_API.md` for driver-facing endpoints
- **Admin Booking API**: See `DASHBOARD_API_DOCUMENTATION.md` for admin endpoints

