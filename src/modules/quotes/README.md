# Quotes Module Documentation

The Quotes module provides intelligent price calculation and quote generation for the Airport Taxi Booking system. It integrates with the pricing engine to deliver accurate, real-time quotes with comprehensive breakdowns.

## Features

### 🎯 Intelligent Pricing Logic
- **Fixed Route Priority**: Automatically detects predefined route prices
- **Distance-Based Fallback**: Uses base pricing + distance/time calculations
- **Dynamic Surcharges**: Applies cutoff time, time-left, and datetime surcharges
- **Smart Vehicle Selection**: Filters classes based on passenger/luggage capacity

### 📍 Location Intelligence
- **Region Detection**: Automatically maps coordinates to price regions
- **Multi-Region Support**: Handles origin and destination in different regions
- **Coordinate Validation**: Validates and processes GPS coordinates

### 💰 Comprehensive Pricing
- **Transparent Breakdowns**: Detailed cost breakdown for each component
- **Currency Support**: Multi-currency pricing with proper formatting
- **Extras Handling**: Support for add-ons like child seats, meet & greet
- **Minimum Fare Protection**: Ensures reasonable minimum charges

### ⏰ Time-Based Features
- **Quote Expiration**: Auto-expiring quotes (1 hour default)
- **Pickup Validation**: Ensures future pickup times only
- **Surcharge Timing**: Applies time-sensitive surcharges accurately

## API Endpoints

### Create Quote
```http
POST /api/v1/quotes
```

**Request Body:**
```json
{
  "origin": {
    "type": "airport",
    "airportCode": "DXB",
    "terminal": "T3",
    "latitude": 25.2532,
    "longitude": 55.3644
  },
  "destination": {
    "type": "address",
    "address": "Downtown Dubai",
    "latitude": 25.1972,
    "longitude": 55.2744
  },
  "pickupAt": "2025-09-04T10:00:00.000Z",
  "pax": 2,
  "bags": 1,
  "extras": ["child_seat"],
  "preferredVehicleClass": "economy",
  "distanceKm": 15.5,
  "durationMinutes": 25
}
```

**Response:**
```json
{
  "quoteId": "4f1a0d8c-94c8-4f9a-b0a6-2cb0d1a0f6c1",
  "vehicleClasses": [
    {
      "id": "economy",
      "name": "Economy",
      "paxCapacity": 3,
      "bagCapacity": 2,
      "pricing": {
        "baseFare": 25.0,
        "distanceCharge": 12.5,
        "timeCharge": 8.0,
        "extras": 10.0,
        "surcharges": 7.5,
        "total": 63.0,
        "currency": "AED"
      },
      "appliedSurcharges": [
        {
          "name": "Night surcharge",
          "application": "percentage",
          "value": 25.0,
          "amount": 7.5,
          "reason": "Time-based surcharge"
        }
      ],
      "includedWaitingTime": 15,
      "additionalWaitingPrice": 1.5,
      "isFixedPrice": false
    }
  ],
  "policy": {
    "cancellation": "Free cancellation until 24 hours before pickup",
    "includedWait": "15 minutes included",
    "additionalWaitCharge": "1.50 AED per minute",
    "quoteExpiresAt": "2025-09-04T11:00:00.000Z"
  },
  "estimatedDistance": 15.5,
  "estimatedDuration": 25,
  "originName": "DXB Airport - Terminal T3",
  "destinationName": "Downtown Dubai",
  "pickupAt": "2025-09-04T10:00:00.000Z",
  "passengers": 2,
  "luggage": 1,
  "extras": ["child_seat"],
  "createdAt": "2025-09-04T09:00:00.000Z",
  "expiresAt": "2025-09-04T10:00:00.000Z"
}
```

### Retrieve Quote
```http
GET /api/v1/quotes/{quoteId}
```

Returns the same response format as create quote.

## Pricing Logic Flow

### 1. Region Resolution
```typescript
// Automatic region detection from coordinates
const originRegion = await priceRegionService.findByLocation(longitude, latitude);
const destinationRegion = await priceRegionService.findByLocation(destLng, destLat);
```

### 2. Price Calculation Priority
1. **Fixed Route Price** (highest priority)
   - Checks for predefined origin → destination routes
   - Uses fixed fare + extras + surcharges

2. **Distance-Based Price** (fallback)
   - Base fare + distance rate + time rate + extras
   - Applies minimum fare protection
   - Adds applicable surcharges

### 3. Surcharge Application
- **Cutoff Time**: Bookings made within X minutes of pickup
- **Time Left**: Pickups within next X minutes from now
- **DateTime**: Night hours, weekends, holidays, etc.

### 4. Vehicle Class Filtering
```typescript
// Smart filtering based on requirements
const suitableClasses = allClasses.filter(vehicleClass => {
  const info = getVehicleClassInfo(vehicleClass);
  return info.paxCapacity >= pax && info.bagCapacity >= bags;
});
```

## Extras Pricing

| Extra | Price (AED) | Description |
|-------|-------------|-------------|
| child_seat | 10.00 | Child safety seat |
| baby_seat | 12.00 | Baby/infant seat |
| wheelchair_accessible | 0.00 | Accessible vehicle |
| extra_luggage | 5.00 | Additional luggage space |
| meet_and_greet | 15.00 | Meet & greet service |
| priority_pickup | 20.00 | Priority scheduling |
| extra_stop | 10.00 | Additional stop on route |

## Error Handling

### Common Error Scenarios
- **Past Pickup Time**: `400 Bad Request`
- **No Region Coverage**: `400 Bad Request` 
- **No Pricing Available**: `400 Bad Request`
- **Quote Not Found**: `404 Not Found`
- **Quote Expired**: `400 Bad Request`

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Pickup time must be in the future",
  "error": "Bad Request"
}
```

## Data Persistence

### Quote Schema
- **Expiration**: TTL index automatically removes expired quotes
- **Indexing**: Optimized queries for quoteId, expiration, usage
- **Embedding**: Complete quote snapshot for historical accuracy

### Key Indexes
```javascript
// Efficient quote retrieval
{ quoteId: 1 }
{ expiresAt: 1 }
{ createdAt: -1 }
{ isUsed: 1 }

// TTL for automatic cleanup
{ expiresAt: 1 }, { expireAfterSeconds: 0 }
```

## Integration Points

### Dependencies
- **PricingModule**: Core price calculation engine
- **VehiclesModule**: Vehicle class information
- **MongoDB**: Quote persistence
- **date functions**: Date and time manipulation

### Used By
- **BookingsModule**: Consumes quotes for booking creation
- **Frontend**: Direct API consumption for price display

## Testing

### Unit Tests
```bash
npm run test -- quotes.service.spec.ts
```

### Test Coverage
- Quote creation with various scenarios
- Region resolution logic
- Pricing calculation edge cases
- Error handling paths
- Quote expiration logic

### Mock Data
```typescript
const mockQuoteRequest = {
  origin: { type: 'airport', airportCode: 'DXB' },
  destination: { type: 'address', address: 'Downtown' },
  pickupAt: futureDate.toISOString(),
  pax: 2,
  bags: 1
};
```

## Performance Considerations

### Optimization Strategies
- **Region Caching**: Cache frequently accessed regions
- **Parallel Pricing**: Calculate multiple vehicle classes simultaneously
- **Index Usage**: Leverage database indexes for fast lookups
- **TTL Cleanup**: Automatic expired quote removal

### Response Times
- **Target**: < 800ms p95 for quote creation
- **Monitoring**: Track calculation time per vehicle class
- **Alerting**: Alert on pricing service failures

## Configuration

### Environment Variables
```env
# Quote expiration (hours)
QUOTE_EXPIRATION_HOURS=1

# Default currency
DEFAULT_CURRENCY=AED

# Minimum advance booking (minutes)
MIN_ADVANCE_BOOKING=15
```

### Feature Flags
```typescript
const features = {
  enableExtrasCalculation: true,
  enableSurchargeReasons: true,
  enableMultiVehicleQuotes: true,
  enableQuotePersistence: true
};
```

## Monitoring & Analytics

### Key Metrics
- Quote creation rate
- Quote-to-booking conversion
- Average quote value
- Popular vehicle classes
- Common extras selection

### Logging
```typescript
// Structured logging for quote events
logger.log('Quote created', {
  quoteId,
  vehicleClassCount,
  totalAmount,
  currency,
  hasExtras: extras.length > 0
});
```

## Future Enhancements

### Planned Features
- **Dynamic Pricing**: Real-time demand-based pricing
- **Route Optimization**: Multiple route options
- **Promotional Pricing**: Discount codes and offers
- **Corporate Rates**: Business account pricing
- **Recurring Quotes**: Subscription-based pricing

### API Evolution
- **Quote Comparison**: Compare multiple providers
- **Price Alerts**: Notify on price changes
- **Bulk Quotes**: Multiple trips in single request
- **Quote Analytics**: Detailed pricing insights
