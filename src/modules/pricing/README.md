# Pricing System Documentation

This module provides a comprehensive pricing system for the Airport Taxi Booking platform with support for:

## Features

### 1. Price Regions (Geographical Zones)
- **Circular regions**: Define zones using center coordinates and radius
- **Polygon regions**: Define complex shapes using GeoJSON geometry
- **Location-based queries**: Find which regions contain a specific coordinate
- **Tagging system**: Categorize regions with custom tags

### 2. Base Pricing (Distance-based)
- **Vehicle class support**: Different pricing for economy, comfort, premium, van, luxury
- **Multi-component pricing**: Base fare + distance rate + time rate
- **Minimum fare protection**: Ensure reasonable minimum charges
- **Currency support**: Multi-currency pricing configurations
- **Validity periods**: Time-bound pricing rules

### 3. Surcharges (Dynamic Pricing)
- **Cutoff time surcharges**: Extra charges for last-minute bookings
- **Time-left surcharges**: Charges based on urgency (e.g., next 30 minutes)
- **DateTime surcharges**: Time-of-day, day-of-week, or specific date ranges
- **Flexible application**: Percentage or fixed amount surcharges
- **Priority system**: Handle overlapping surcharge rules

### 4. Fixed Pricing (Route-based)
- **Region-to-region routes**: Predefined prices for specific journeys
- **All-inclusive fares**: Fixed price including waiting time
- **Vehicle class variations**: Different prices per vehicle type
- **Route prioritization**: Handle competing price rules

### 5. Price Calculation Engine
- **Intelligent routing**: Automatically choose between fixed and distance-based pricing
- **Real-time calculations**: Consider all applicable surcharges
- **Detailed breakdowns**: Transparent pricing components
- **Location awareness**: Automatic region detection from coordinates

## API Endpoints

### Price Regions
```
POST   /api/v1/price-regions              # Create region
GET    /api/v1/price-regions              # List regions (paginated)
GET    /api/v1/price-regions/:id          # Get region details
PATCH  /api/v1/price-regions/:id          # Update region
DELETE /api/v1/price-regions/:id          # Delete region
GET    /api/v1/price-regions/by-location  # Find regions by coordinates
```

### Base Prices
```
POST   /api/v1/base-prices                    # Create base price
GET    /api/v1/base-prices                    # List base prices (paginated)
GET    /api/v1/base-prices/:id                # Get base price details
PATCH  /api/v1/base-prices/:id                # Update base price
DELETE /api/v1/base-prices/:id                # Delete base price
GET    /api/v1/base-prices/by-region-vehicle  # Get price for region+vehicle
```

### Surcharges
```
POST   /api/v1/surcharges                 # Create surcharge
GET    /api/v1/surcharges                 # List surcharges (paginated)
GET    /api/v1/surcharges/:id             # Get surcharge details
PATCH  /api/v1/surcharges/:id             # Update surcharge
DELETE /api/v1/surcharges/:id             # Delete surcharge
GET    /api/v1/surcharges/applicable      # Find applicable surcharges
```

### Fixed Prices
```
POST   /api/v1/fixed-prices               # Create fixed price
GET    /api/v1/fixed-prices               # List fixed prices (paginated)
GET    /api/v1/fixed-prices/:id           # Get fixed price details
PATCH  /api/v1/fixed-prices/:id           # Update fixed price
DELETE /api/v1/fixed-prices/:id           # Delete fixed price
GET    /api/v1/fixed-prices/by-route      # Get price for specific route
GET    /api/v1/fixed-prices/by-regions    # Get all prices for route
```

## Configuration Examples

### 1. Create Airport Region
```json
{
  "name": "Dubai International Airport",
  "tags": ["airport", "dubai"],
  "shape": {
    "type": "circle",
    "center": [55.3644, 25.2532],
    "radius": 3000
  },
  "description": "Main Dubai airport region"
}
```

### 2. Set Base Pricing
```json
{
  "regionId": "64f7b1234567890123456789",
  "vehicleClass": "economy",
  "baseFare": 20.0,
  "pricePerKm": 2.5,
  "pricePerMinute": 0.8,
  "minimumFare": 25.0,
  "currency": "AED"
}
```

### 3. Add Night Surcharge
```json
{
  "regionId": "64f7b1234567890123456789",
  "name": "Night Surcharge",
  "type": "datetime",
  "application": "percentage",
  "value": 25.0,
  "timeRange": {
    "startTime": "22:00",
    "endTime": "06:00"
  },
  "daysOfWeek": [0, 1, 2, 3, 4, 5, 6]
}
```

### 4. Add Rush Hour Surcharge
```json
{
  "regionId": "64f7b1234567890123456789",
  "name": "Morning Rush Hour",
  "type": "datetime",
  "application": "fixed_amount",
  "value": 10.0,
  "currency": "AED",
  "timeRange": {
    "startTime": "07:00",
    "endTime": "09:30"
  },
  "daysOfWeek": [1, 2, 3, 4, 5]
}
```

### 5. Add Last-Minute Booking Surcharge
```json
{
  "regionId": "64f7b1234567890123456789",
  "name": "Last Minute Booking",
  "type": "cutoff_time",
  "application": "percentage",
  "value": 15.0,
  "cutoffMinutes": 120
}
```

### 6. Create Fixed Route Price
```json
{
  "originRegionId": "64f7b1234567890123456789",
  "destinationRegionId": "64f7b1234567890123456790",
  "name": "Airport to Downtown Dubai",
  "vehicleClass": "economy",
  "fixedPrice": 85.0,
  "currency": "AED",
  "estimatedDistance": 25.5,
  "estimatedDuration": 35,
  "includedWaitingTime": 15,
  "additionalWaitingPrice": 1.5
}
```

## Surcharge Types

### 1. Cutoff Time Surcharges
Applied when booking is made within a certain time before pickup:
- **cutoffMinutes**: How many minutes before pickup triggers the surcharge
- **Use case**: Discourage last-minute bookings or compensate for reduced preparation time

### 2. Time Left Surcharges  
Applied when pickup time is within a certain window from now:
- **timeLeftMinutes**: How many minutes from now triggers the surcharge
- **Use case**: Premium for immediate or very soon pickups

### 3. DateTime Surcharges
Applied based on time patterns:
- **timeRange**: Recurring daily time windows (e.g., night hours)
- **dateTimeRange**: Specific date/time periods (e.g., holidays)
- **daysOfWeek**: Which days of week apply (0=Sunday, 6=Saturday)

## Price Calculation Logic

1. **Region Detection**: Find regions containing origin/destination coordinates
2. **Fixed Price Check**: Look for predefined route prices (higher priority)
3. **Distance-Based Fallback**: Use base pricing + distance/time calculations
4. **Surcharge Application**: Apply all matching surcharges in priority order
5. **Final Calculation**: Sum all components for total price

## Authentication & Authorization

All endpoints require JWT authentication with appropriate roles:
- **Admin**: Full CRUD access to all pricing configurations
- **Dispatcher**: Read/write access for operational pricing management  
- **Driver**: Read-only access for price queries and calculations

## Database Indexes

Optimized for common query patterns:
- **Geospatial indexes**: Fast location-based region lookups
- **Compound indexes**: Efficient filtering by region + vehicle class
- **Priority indexes**: Quick surcharge ordering

## Integration with Quotes Module

The pricing system integrates with the quotes module through the `PriceCalculationService`:

```typescript
const priceBreakdown = await priceCalculationService.calculatePrice({
  originLatitude: 25.2532,
  originLongitude: 55.3644,
  vehicleClass: VehicleClass.ECONOMY,
  distanceKm: 10,
  durationMinutes: 20,
  bookingDateTime: new Date(),
  minutesUntilPickup: 30
});
```

## Monitoring & Analytics

Track key pricing metrics:
- Quote acceptance rates by price level
- Surcharge application frequency
- Regional pricing performance
- Currency and vehicle class popularity
