# Vehicle Management API Examples

## Create Vehicle Examples

### 1. Standard Sedan
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
  "description": "Comfortable sedan perfect for city trips and airport transfers",
  "baseRatePerKm": 1.2,
  "brand": "Toyota",
  "model": "Camry",
  "year": 2023,
  "color": "Black",
  "features": ["GPS", "AC", "Bluetooth", "Phone Charger"]
}
```

### 2. Luxury SUV
```json
{
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
  "image": "https://example.com/images/luxury-suv.jpg",
  "capacity": {
    "maxPassengers": 7,
    "maxLuggage": 4,
    "maxWeight": 600
  },
  "isElectric": false,
  "isActive": true,
  "description": "Spacious luxury SUV for group travels and special occasions",
  "baseRatePerKm": 2.5,
  "brand": "BMW",
  "model": "X7",
  "year": 2024,
  "color": "White",
  "features": ["GPS", "AC", "WiFi", "Leather Seats", "Sunroof", "Premium Audio"]
}
```

### 3. Electric Van
```json
{
  "name": {
    "translations": {
      "en": "Electric Van",
      "cn": "电动面包车",
      "vi": "Xe van điện"
    },
    "value": "Electric Van",
    "defaultLanguage": "en"
  },
  "equivalent": {
    "translations": {
      "en": "Eco Van",
      "cn": "环保货车",
      "vi": "Xe van sinh thái"
    },
    "value": "Eco Van",
    "defaultLanguage": "en"
  },
  "vehicleType": "van",
  "category": "standard",
  "image": "https://example.com/images/electric-van.jpg",
  "capacity": {
    "maxPassengers": 8,
    "maxLuggage": 6,
    "maxWeight": 800
  },
  "isElectric": true,
  "isActive": true,
  "description": "Environmentally friendly electric van for group transportation",
  "baseRatePerKm": 1.8,
  "brand": "Tesla",
  "model": "Model V",
  "year": 2024,
  "color": "Silver",
  "features": ["GPS", "AC", "USB Charging", "Silent Operation", "Eco-Friendly"]
}
```

### 4. Economy Motorcycle
```json
{
  "name": {
    "translations": {
      "en": "Economy Motorcycle",
      "cn": "经济摩托车",
      "vi": "Xe máy tiết kiệm"
    },
    "value": "Economy Motorcycle",
    "defaultLanguage": "en"
  },
  "equivalent": {
    "translations": {
      "en": "City Bike",
      "cn": "城市摩托",
      "vi": "Xe máy thành phố"
    },
    "value": "City Bike",
    "defaultLanguage": "en"
  },
  "vehicleType": "motorcycle",
  "category": "economy",
  "image": "https://example.com/images/motorcycle.jpg",
  "capacity": {
    "maxPassengers": 2,
    "maxLuggage": 1,
    "maxWeight": 150
  },
  "isElectric": false,
  "isActive": true,
  "description": "Quick and efficient motorcycle for short distance travels",
  "baseRatePerKm": 0.8,
  "brand": "Honda",
  "model": "Wave",
  "year": 2023,
  "color": "Red",
  "features": ["Helmet Provided", "Storage Box"]
}
```

## API Endpoints

### 1. Create Vehicle
```
POST /vehicles
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### 2. Get All Vehicles (with filtering)
```
GET /vehicles?page=1&limit=10&vehicleType=sedan&category=standard&isActive=true
Authorization: Bearer <token>
```

### 3. Get Vehicle by ID
```
GET /vehicles/{id}
Authorization: Bearer <token>
```

### 4. Update Vehicle
```
PATCH /vehicles/{id}
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### 5. Deactivate Vehicle (Soft Delete)
```
DELETE /vehicles/{id}
Authorization: Bearer <admin_token>
```

### 6. Permanently Delete Vehicle
```
DELETE /vehicles/{id}/hard
Authorization: Bearer <admin_token>
```

### 7. Restore Vehicle
```
PATCH /vehicles/{id}/restore
Authorization: Bearer <admin_token>
```

### 8. Get Available Vehicles
```
GET /vehicles/available
Authorization: Bearer <token>
```

### 9. Get Vehicles by Type
```
GET /vehicles/type/sedan
Authorization: Bearer <token>
```

### 10. Get Vehicles by Category
```
GET /vehicles/category/luxury
Authorization: Bearer <token>
```

### 11. Find Suitable Vehicles for Passenger Count
```
GET /vehicles/suitable/6
Authorization: Bearer <token>
```

### 12. Get Vehicle Statistics
```
GET /vehicles/statistics
Authorization: Bearer <admin_token>
```

## Query Parameters for GET /vehicles

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search in name, description, brand, model, license plate
- `vehicleType`: Filter by vehicle type (sedan, suv, van, luxury, minibus, coach, motorcycle)
- `category`: Filter by category (economy, standard, premium, luxury, business)
- `isElectric`: Filter by electric status (true/false)
- `isActive`: Filter by active status (true/false)
- `minPassengers`: Minimum passenger capacity
- `maxPassengers`: Maximum passenger capacity
- `sortBy`: Sort field (name, vehicleType, category, capacity.maxPassengers, createdAt, updatedAt)
- `sortOrder`: Sort order (asc, desc)
- `language`: Language for translation fields (en, cn, vi)

## Response Examples

### Success Response
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
  "description": "Comfortable sedan perfect for city trips and airport transfers",
  "baseRatePerKm": 1.2,
  "brand": "Toyota",
  "model": "Camry",
  "year": 2023,
  "color": "Black",
  "features": ["GPS", "AC", "Bluetooth", "Phone Charger"],
  "createdAt": "2023-06-25T10:30:00.000Z",
  "updatedAt": "2023-06-25T10:30:00.000Z"
}
```

### List Response with Pagination
```json
{
  "vehicles": [...],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```
