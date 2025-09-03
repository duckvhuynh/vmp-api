# Vehicle Management API - Comprehensive Documentation

## Overview

The Vehicle Management API provides complete CRUD operations for managing taxi fleet vehicles with multi-language support, advanced filtering, and comprehensive vehicle specifications.

## Base URL
```
http://localhost:3000/api/v1/vehicles
```

## Authentication
All endpoints require JWT authentication via Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

## Role-Based Access Control

| Role | Permissions |
|------|------------|
| `admin` | Full access - Create, Read, Update, Delete vehicles |
| `dispatcher` | Read access - View vehicles and statistics |
| `driver` | Limited read access - View available vehicles only |

---

## API Endpoints

### 1. Create Vehicle
**POST** `/vehicles`

**Access**: Admin only

**Description**: Create a new vehicle with comprehensive details and multi-language support.

**Request Body**:
```json
{
  "name": {
    "translations": {
      "en": "Standard Sedan",
      "cn": "标准轿车", 
      "vi": "Xe sedan tiêu chuẩn"
    },
    "value": "Standard Sedan",
    "defaultLanguage": "en"
  },
  "equivalent": {
    "translations": {
      "en": "City Car",
      "cn": "城市轿车",
      "vi": "Xe thành phố"
    },
    "value": "City Car", 
    "defaultLanguage": "en"
  },
  "vehicleType": "sedan",
  "category": "standard",
  "image": "https://example.com/images/sedan.jpg",
  "capacity": {
    "maxPassengers": 4,
    "maxLuggage": 2,
    "maxWeight": 400
  },
  "isElectric": false,
  "isActive": true,
  "description": "Comfortable sedan for city trips",
  "baseRatePerKm": 1.5,
  "licensePlate": "ABC-1234",
  "brand": "Toyota",
  "model": "Camry",
  "year": 2023,
  "color": "Black",
  "features": ["GPS", "AC", "WiFi", "Phone Charger"]
}
```

**Response**: `201 Created`
```json
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
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

---

### 2. Get Vehicles with Filtering
**GET** `/vehicles`

**Access**: Admin, Dispatcher

**Description**: Retrieve vehicles with advanced filtering, pagination, and sorting options.

**Query Parameters**:
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | integer | Page number (default: 1) | `1` |
| `limit` | integer | Items per page (default: 10, max: 100) | `20` |
| `search` | string | Search in name, description, brand, model | `sedan` |
| `vehicleType` | enum | Filter by type | `sedan` |
| `category` | enum | Filter by category | `standard` |
| `isElectric` | boolean | Filter by electric status | `false` |
| `isActive` | boolean | Filter by active status | `true` |
| `minPassengers` | integer | Minimum passenger capacity | `2` |
| `maxPassengers` | integer | Maximum passenger capacity | `8` |
| `sortBy` | enum | Sort field | `createdAt` |
| `sortOrder` | enum | Sort direction (asc/desc) | `desc` |
| `language` | enum | Preferred language (en/cn/vi) | `en` |

**Example Request**:
```
GET /vehicles?page=1&limit=10&vehicleType=sedan&category=standard&isActive=true&sortBy=name&sortOrder=asc
```

**Response**: `200 OK`
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
      "isActive": true
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

---

### 3. Get Vehicle by ID
**GET** `/vehicles/{id}`

**Access**: Admin, Dispatcher

**Path Parameters**:
- `id` (string): Vehicle ID

**Response**: `200 OK`
```json
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
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

---

### 4. Update Vehicle
**PATCH** `/vehicles/{id}`

**Access**: Admin only

**Path Parameters**:
- `id` (string): Vehicle ID

**Request Body**: Any subset of CreateVehicleDto fields

**Response**: `200 OK` - Updated vehicle object

---

### 5. Deactivate Vehicle (Soft Delete)
**DELETE** `/vehicles/{id}`

**Access**: Admin only

**Description**: Deactivate vehicle by setting `isActive` to false. Vehicle data is preserved.

**Response**: `200 OK`
```json
{
  "message": "Vehicle with ID 60d5ecb54b8b1c001f5e3f5a has been deactivated successfully"
}
```

---

### 6. Permanently Delete Vehicle
**DELETE** `/vehicles/{id}/hard`

**Access**: Admin only

**Description**: Permanently remove vehicle from database. **Cannot be undone**.

**Response**: `200 OK`
```json
{
  "message": "Vehicle with ID 60d5ecb54b8b1c001f5e3f5a has been permanently deleted"
}
```

---

### 7. Restore Vehicle
**PATCH** `/vehicles/{id}/restore`

**Access**: Admin only

**Description**: Reactivate a deactivated vehicle by setting `isActive` to true.

**Response**: `200 OK` - Restored vehicle object

---

### 8. Get Available Vehicles
**GET** `/vehicles/available`

**Access**: Admin, Dispatcher, Driver

**Description**: Get all active vehicles available for booking.

**Response**: `200 OK` - Array of active vehicles

---

### 9. Get Vehicles by Type
**GET** `/vehicles/type/{vehicleType}`

**Access**: Admin, Dispatcher, Driver

**Path Parameters**:
- `vehicleType` (enum): One of `sedan`, `suv`, `van`, `luxury`, `minibus`, `coach`, `motorcycle`

**Response**: `200 OK` - Array of vehicles of specified type

---

### 10. Get Vehicles by Category  
**GET** `/vehicles/category/{category}`

**Access**: Admin, Dispatcher, Driver

**Path Parameters**:
- `category` (enum): One of `economy`, `standard`, `premium`, `luxury`, `business`

**Response**: `200 OK` - Array of vehicles in specified category

---

### 11. Find Suitable Vehicles
**GET** `/vehicles/suitable/{passengerCount}`

**Access**: Admin, Dispatcher, Driver

**Description**: Find vehicles that can accommodate specified number of passengers.

**Path Parameters**:
- `passengerCount` (integer): Number of passengers needed

**Response**: `200 OK` - Array of suitable vehicles sorted by capacity

---

### 12. Get Fleet Statistics
**GET** `/vehicles/statistics`

**Access**: Admin only

**Description**: Get comprehensive fleet analytics and statistics.

**Response**: `200 OK`
```json
{
  "totalVehicles": 50,
  "activeVehicles": 45,
  "inactiveVehicles": 5,
  "electricVehicles": 12,
  "conventionalVehicles": 38,
  "typeDistribution": [
    {"_id": "sedan", "count": 20},
    {"_id": "suv", "count": 15},
    {"_id": "van", "count": 10}
  ],
  "categoryDistribution": [
    {"_id": "standard", "count": 25},
    {"_id": "premium", "count": 15},
    {"_id": "luxury", "count": 10}
  ]
}
```

---

## Data Models

### Vehicle Types
- `sedan`: Standard 4-door passenger car
- `suv`: Sport Utility Vehicle
- `van`: Multi-passenger van
- `luxury`: High-end luxury vehicle
- `minibus`: Small bus (8-15 passengers)
- `coach`: Large bus (15+ passengers)  
- `motorcycle`: Two-wheeled vehicle

### Vehicle Categories
- `economy`: Budget-friendly option
- `standard`: Regular service level
- `premium`: Enhanced comfort and features
- `luxury`: High-end service with premium amenities
- `business`: Corporate/executive service

### Translation Structure
```typescript
{
  "translations": {
    "en": "English text",
    "cn": "中文文本", 
    "vi": "Văn bản tiếng Việt"
  },
  "value": "Default fallback text",
  "defaultLanguage": "en"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "error": "Bad Request",
  "statusCode": 400,
  "details": ["name is required", "capacity.maxPassengers must be at least 1"]
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden resource",
  "error": "Forbidden", 
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "message": "Vehicle with ID 60d5ecb54b8b1c001f5e3f5a not found",
  "error": "Not Found",
  "statusCode": 404
}
```

## Business Rules

1. **License Plate Uniqueness**: License plates must be unique across all vehicles (if provided)
2. **Capacity Validation**: maxPassengers must be at least 1, maxLuggage must be 0 or greater
3. **Translation Requirements**: All translation fields require en, cn, and vi translations
4. **Soft Delete**: Default delete operation deactivates vehicle; use `/hard` endpoint for permanent deletion
5. **Active Status**: Only active vehicles appear in booking-related endpoints
6. **Role Permissions**: Strict role-based access control enforced on all endpoints

## Usage Examples

### Create a Luxury SUV
```bash
curl -X POST "http://localhost:3000/api/v1/vehicles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "translations": {
        "en": "Luxury SUV",
        "cn": "豪华SUV", 
        "vi": "SUV sang trọng"
      },
      "value": "Luxury SUV",
      "defaultLanguage": "en"
    },
    "equivalent": {
      "translations": {
        "en": "Premium 4WD",
        "cn": "高端四驱",
        "vi": "4WD cao cấp"
      },
      "value": "Premium 4WD",
      "defaultLanguage": "en"
    },
    "vehicleType": "suv",
    "category": "luxury",
    "capacity": {
      "maxPassengers": 7,
      "maxLuggage": 4,
      "maxWeight": 600
    },
    "isElectric": false,
    "baseRatePerKm": 2.5,
    "brand": "BMW",
    "model": "X7",
    "features": ["GPS", "AC", "WiFi", "Leather Seats"]
  }'
```

### Search for Electric Vehicles
```bash
curl -X GET "http://localhost:3000/api/v1/vehicles?isElectric=true&isActive=true&sortBy=name" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Fleet Statistics
```bash
curl -X GET "http://localhost:3000/api/v1/vehicles/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
