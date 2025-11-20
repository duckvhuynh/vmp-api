# VMP API Documentation - Frontend Integration Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Base Configuration](#base-configuration)
3. [Quotes API](#quotes-api)
4. [Request Examples](#request-examples)
5. [Response Examples](#response-examples)
6. [Error Handling](#error-handling)
7. [Frontend Implementation Guide](#frontend-implementation-guide)
8. [Code Examples](#code-examples)

---

## Overview

This API provides taxi booking and quote services for Mauritius. The main endpoint for the landing page is the **Quotes API**, which allows users to search for available vehicle options and pricing for their trip.

### Base URL

```
Production: https://api.visitmauritiusparadise.com/api/v1
Development: http://localhost:3000/api/v1
```

### API Prefix

All endpoints are prefixed with `/api/v1`

### Authentication

Currently, the Quotes API does **not require authentication**. However, other endpoints may require JWT tokens in the future.

### Content Type

All requests should use:
- **Content-Type**: `application/json`
- **Accept**: `application/json`

---

## Base Configuration

### Environment Variables

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.visitmauritiusparadise.com/api/v1';
```

### API Client Setup

```javascript
// api/client.js
const API_BASE_URL = 'https://api.visitmauritiusparadise.com/api/v1';

export const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
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

## Quotes API

### Create Quote

Calculate pricing for a trip based on origin, destination, and preferences.

**Endpoint:** `POST /quotes`

**Description:** 
- Calculates pricing for all available vehicle classes
- Supports airport and address locations
- Includes dynamic surcharges (time-based, airport fees, etc.)
- Returns multiple vehicle options with detailed pricing breakdown

---

## Request Examples

### 1. Airport to Address

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

### 2. Address to Airport

```json
{
  "origin": {
    "type": "address",
    "address": "Grand Baie, Mauritius",
    "latitude": -20.0136,
    "longitude": 57.5800
  },
  "destination": {
    "type": "airport",
    "airportCode": "MRU",
    "terminal": "T2"
  },
  "pickupAt": "2025-12-25T14:30:00.000Z",
  "pax": 4,
  "bags": 3
}
```

### 3. Address to Address

```json
{
  "origin": {
    "type": "address",
    "address": "Flic en Flac, Mauritius",
    "latitude": -20.2747,
    "longitude": 57.3631
  },
  "destination": {
    "type": "address",
    "address": "Curepipe, Mauritius",
    "latitude": -20.3167,
    "longitude": 57.5167
  },
  "pickupAt": "2025-12-25T09:00:00.000Z",
  "pax": 1,
  "bags": 1,
  "preferredVehicleClass": "ECONOMY"
}
```

### 4. Minimal Request (Required Fields Only)

```json
{
  "origin": {
    "type": "airport",
    "airportCode": "MRU"
  },
  "destination": {
    "type": "address",
    "address": "Port Louis"
  },
  "pickupAt": "2025-12-25T10:00:00.000Z",
  "pax": 2,
  "bags": 1
}
```

---

## Request Schema

### Place Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `string` | ✅ Yes | Either `"airport"` or `"address"` |
| `airportCode` | `string` | Conditional | IATA code (required if `type="airport"`) |
| `terminal` | `string` | ❌ No | Terminal number (e.g., "T1", "T2") |
| `address` | `string` | Conditional | Full address (required if `type="address"`) |
| `latitude` | `number` | ❌ No | Latitude coordinate (-90 to 90) |
| `longitude` | `number` | ❌ No | Longitude coordinate (-180 to 180) |
| `regionId` | `string` | ❌ No | Pre-determined region ID (MongoDB ObjectId) |

### Create Quote Request

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `origin` | `Place` | ✅ Yes | Origin location |
| `destination` | `Place` | ✅ Yes | Destination location |
| `pickupAt` | `string` | ✅ Yes | ISO 8601 datetime (must be in future) |
| `pax` | `number` | ✅ Yes | Number of passengers (min: 1) |
| `bags` | `number` | ✅ Yes | Number of luggage pieces (min: 0) |
| `extras` | `string[]` | ❌ No | Additional services (e.g., `["child_seat"]`) |
| `preferredVehicleClass` | `string` | ❌ No | Vehicle class enum: `ECONOMY`, `COMFORT`, `PREMIUM`, `VAN`, `LUXURY` |
| `distanceKm` | `number` | ❌ No | Pre-calculated distance (if available from maps) |
| `durationMinutes` | `number` | ❌ No | Pre-calculated duration (if available from maps) |

---

## Response Examples

### Success Response (200/201)

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
    },
    {
      "id": "COMFORT",
      "name": "Comfort",
      "paxCapacity": 3,
      "bagCapacity": 3,
      "pricing": {
        "baseFare": 35.0,
        "distanceCharge": 15.0,
        "timeCharge": 10.0,
        "airportFees": 15.0,
        "surcharges": 12.5,
        "extras": 5.0,
        "total": 92.5,
        "currency": "AED"
      },
      "includedWaitingTime": 15,
      "additionalWaitingPrice": 2.0,
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

### Response Schema

#### QuoteResponse

| Field | Type | Description |
|-------|------|-------------|
| `quoteId` | `string` | Unique quote identifier (UUID) |
| `vehicleClasses` | `QuoteVehicleClass[]` | Array of available vehicle options |
| `policy` | `QuotePolicy` | Cancellation and waiting time policies |
| `estimatedDistance` | `number` | Estimated distance in kilometers |
| `estimatedDuration` | `number` | Estimated duration in minutes |
| `originName` | `string` | Formatted origin location name |
| `destinationName` | `string` | Formatted destination location name |
| `pickupAt` | `string` | ISO 8601 datetime |
| `passengers` | `number` | Number of passengers |
| `luggage` | `number` | Number of luggage pieces |
| `extras` | `string[]` | Selected extras |
| `createdAt` | `string` | Quote creation timestamp |
| `expiresAt` | `string` | Quote expiration timestamp (1 hour from creation) |

#### QuoteVehicleClass

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Vehicle class ID: `ECONOMY`, `COMFORT`, `PREMIUM`, `VAN`, `LUXURY` |
| `name` | `string` | Display name |
| `paxCapacity` | `number` | Maximum passengers |
| `bagCapacity` | `number` | Maximum luggage pieces |
| `pricing` | `PriceBreakdown` | Detailed pricing breakdown |
| `appliedSurcharges` | `SurchargeDetail[]` | List of applied surcharges |
| `includedWaitingTime` | `number` | Included waiting time in minutes |
| `additionalWaitingPrice` | `number` | Price per additional minute |
| `isFixedPrice` | `boolean` | Whether this is a fixed route price |

#### PriceBreakdown

| Field | Type | Description |
|-------|------|-------------|
| `baseFare` | `number` | Base fare amount |
| `distanceCharge` | `number` | Distance-based charge |
| `timeCharge` | `number` | Time-based charge |
| `airportFees` | `number` | Airport fees (if applicable) |
| `surcharges` | `number` | Total surcharges |
| `extras` | `number` | Cost of extras/add-ons |
| `total` | `number` | **Total price** |
| `currency` | `string` | Currency code (e.g., "AED") |

---

## Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Pickup time must be in the future",
  "error": "Bad Request"
}
```

### Common Error Codes

| Status Code | Description | Example |
|-------------|-------------|---------|
| `400` | Bad Request | Invalid data, pickup time in past, location not covered |
| `404` | Not Found | Quote ID not found |
| `500` | Internal Server Error | Server-side error |

### Error Handling Example

```javascript
try {
  const quote = await createQuote(quoteData);
  // Handle success
} catch (error) {
  if (error.statusCode === 400) {
    // Handle validation errors
    console.error('Invalid request:', error.message);
  } else if (error.statusCode === 404) {
    // Handle not found
    console.error('Quote not found');
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

---

## Frontend Implementation Guide

### Step 1: Create Quote Service

```typescript
// services/quoteService.ts
import { apiClient } from './apiClient';

export interface CreateQuoteRequest {
  origin: {
    type: 'airport' | 'address';
    airportCode?: string;
    terminal?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  destination: {
    type: 'airport' | 'address';
    airportCode?: string;
    terminal?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  pickupAt: string; // ISO 8601 datetime
  pax: number;
  bags: number;
  extras?: string[];
  preferredVehicleClass?: 'ECONOMY' | 'COMFORT' | 'PREMIUM' | 'VAN' | 'LUXURY';
  distanceKm?: number;
  durationMinutes?: number;
}

export interface QuoteResponse {
  quoteId: string;
  vehicleClasses: VehicleClass[];
  policy: QuotePolicy;
  estimatedDistance?: number;
  estimatedDuration?: number;
  originName?: string;
  destinationName?: string;
  pickupAt: string;
  passengers: number;
  luggage: number;
  extras?: string[];
  createdAt: string;
  expiresAt: string;
}

export const quoteService = {
  async createQuote(data: CreateQuoteRequest): Promise<QuoteResponse> {
    return apiClient.request('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getQuote(quoteId: string): Promise<QuoteResponse> {
    return apiClient.request(`/quotes/${quoteId}`, {
      method: 'GET',
    });
  },
};
```

### Step 2: Create Quote Form Component

```typescript
// components/QuoteForm.tsx
import React, { useState } from 'react';
import { quoteService } from '../services/quoteService';

export const QuoteForm: React.FC = () => {
  const [formData, setFormData] = useState({
    originType: 'airport',
    originAirportCode: 'MRU',
    originTerminal: '',
    originAddress: '',
    destinationType: 'address',
    destinationAddress: '',
    pickupAt: '',
    pax: 2,
    bags: 1,
    extras: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const requestData = {
        origin: {
          type: formData.originType,
          ...(formData.originType === 'airport' 
            ? { airportCode: formData.originAirportCode, terminal: formData.originTerminal }
            : { address: formData.originAddress }
          ),
        },
        destination: {
          type: formData.destinationType,
          ...(formData.destinationType === 'airport'
            ? { airportCode: formData.destinationAirportCode }
            : { address: formData.destinationAddress }
          ),
        },
        pickupAt: new Date(formData.pickupAt).toISOString(),
        pax: formData.pax,
        bags: formData.bags,
        extras: formData.extras,
      };

      const result = await quoteService.createQuote(requestData);
      setQuote(result);
    } catch (err: any) {
      setError(err.message || 'Failed to create quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Searching...' : 'Get Quote'}
      </button>
      {error && <div className="error">{error}</div>}
      {quote && <QuoteResults quote={quote} />}
    </form>
  );
};
```

### Step 3: Display Quote Results

```typescript
// components/QuoteResults.tsx
import React from 'react';
import { QuoteResponse } from '../services/quoteService';

interface Props {
  quote: QuoteResponse;
}

export const QuoteResults: React.FC<Props> = ({ quote }) => {
  return (
    <div className="quote-results">
      <h2>Available Vehicles</h2>
      {quote.vehicleClasses.map((vehicle) => (
        <div key={vehicle.id} className="vehicle-option">
          <h3>{vehicle.name}</h3>
          <p>Capacity: {vehicle.paxCapacity} passengers, {vehicle.bagCapacity} bags</p>
          <div className="pricing">
            <span className="total-price">
              {vehicle.pricing.total} {vehicle.pricing.currency}
            </span>
            <button onClick={() => selectVehicle(quote.quoteId, vehicle.id)}>
              Select
            </button>
          </div>
          {vehicle.appliedSurcharges && vehicle.appliedSurcharges.length > 0 && (
            <div className="surcharges">
              <strong>Surcharges:</strong>
              <ul>
                {vehicle.appliedSurcharges.map((surcharge, idx) => (
                  <li key={idx}>
                    {surcharge.name}: {surcharge.amount} {vehicle.pricing.currency}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
      <div className="policy">
        <p><strong>Cancellation:</strong> {quote.policy.cancellation}</p>
        <p><strong>Waiting Time:</strong> {quote.policy.includedWait}</p>
        {quote.policy.additionalWaitCharge && (
          <p><strong>Additional Wait:</strong> {quote.policy.additionalWaitCharge}</p>
        )}
      </div>
    </div>
  );
};
```

---

## Code Examples

### JavaScript/React Example

```javascript
// hooks/useQuote.js
import { useState } from 'react';

export const useQuote = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);

  const createQuote = async (quoteData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.visitmauritiusparadise.com/api/v1/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create quote');
      }

      const data = await response.json();
      setQuote(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createQuote, loading, error, quote };
};
```

### TypeScript/React Example

```typescript
// hooks/useQuote.ts
import { useState } from 'react';
import { CreateQuoteRequest, QuoteResponse, quoteService } from '../services/quoteService';

export const useQuote = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  const createQuote = async (data: CreateQuoteRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await quoteService.createQuote(data);
      setQuote(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create quote';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createQuote, loading, error, quote };
};
```

### Vue.js Example

```javascript
// composables/useQuote.js
import { ref } from 'vue';
import { quoteService } from '@/services/quoteService';

export const useQuote = () => {
  const loading = ref(false);
  const error = ref(null);
  const quote = ref(null);

  const createQuote = async (quoteData) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await quoteService.createQuote(quoteData);
      quote.value = result;
      return result;
    } catch (err) {
      error.value = err.message || 'Failed to create quote';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    createQuote,
    loading,
    error,
    quote,
  };
};
```

---

## Best Practices

### 1. Date/Time Handling

Always send dates in ISO 8601 format:

```javascript
// ✅ Correct
pickupAt: new Date('2025-12-25T10:00:00').toISOString()
// Result: "2025-12-25T10:00:00.000Z"

// ❌ Wrong
pickupAt: "2025-12-25 10:00:00"
```

### 2. Coordinate Precision

Include coordinates when available for better accuracy:

```javascript
// ✅ Recommended
{
  type: "address",
  address: "Port Louis, Mauritius",
  latitude: -20.1619,
  longitude: 57.5012
}
```

### 3. Error Handling

Always handle errors gracefully:

```javascript
try {
  const quote = await createQuote(data);
  // Success handling
} catch (error) {
  // Show user-friendly error message
  if (error.message.includes('future')) {
    showError('Please select a future pickup time');
  } else if (error.message.includes('region')) {
    showError('This location is not currently serviced');
  } else {
    showError('Unable to get quote. Please try again.');
  }
}
```

### 4. Loading States

Show loading indicators during API calls:

```javascript
const [loading, setLoading] = useState(false);

const handleSearch = async () => {
  setLoading(true);
  try {
    const quote = await createQuote(data);
    // Handle success
  } finally {
    setLoading(false);
  }
};
```

### 5. Quote Expiration

Quotes expire after 1 hour. Check expiration before using:

```javascript
const isQuoteValid = (quote) => {
  const expiresAt = new Date(quote.expiresAt);
  return expiresAt > new Date();
};
```

### 6. Caching

Consider caching quotes locally:

```javascript
// Store quote in localStorage
localStorage.setItem(`quote_${quote.quoteId}`, JSON.stringify(quote));

// Retrieve quote
const cachedQuote = JSON.parse(localStorage.getItem(`quote_${quoteId}`));
```

---

## Vehicle Classes Reference

| Class | ID | Passenger Capacity | Luggage Capacity | Description |
|-------|----|-------------------|------------------|-------------|
| Economy | `ECONOMY` | 3 | 2 | Basic vehicle option |
| Comfort | `COMFORT` | 3 | 3 | Standard comfort level |
| Premium | `PREMIUM` | 3 | 3 | Higher quality vehicle |
| Van | `VAN` | 6 | 6 | Large capacity vehicle |
| Luxury | `LUXURY` | 3 | 3 | Premium luxury vehicle |

---

## Testing

### Test Quote Request

```bash
curl -X POST https://api.visitmauritiusparadise.com/api/v1/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {
      "type": "airport",
      "airportCode": "MRU"
    },
    "destination": {
      "type": "address",
      "address": "Port Louis, Mauritius"
    },
    "pickupAt": "2025-12-25T10:00:00.000Z",
    "pax": 2,
    "bags": 1
  }'
```

---

## Support

For API issues or questions:
- **Swagger Documentation**: `https://api.visitmauritiusparadise.com/docs`
- **Health Check**: `https://api.visitmauritiusparadise.com/health`

---

## Changelog

### Version 1.0.0
- Initial release
- Quotes API endpoint
- Support for airport and address locations
- Multiple vehicle class pricing
- Dynamic surcharge calculation

