// MongoDB Initialization Script
// This script runs when MongoDB container starts for the first time

db = db.getSiblingDB('vmp');

// Create application user
db.createUser({
  user: 'vmp_app',
  pwd: 'change_this_password_in_production',
  roles: [
    {
      role: 'readWrite',
      db: 'vmp'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.bookings.createIndex({ bookingId: 1 }, { unique: true });
db.bookings.createIndex({ status: 1 });
db.bookings.createIndex({ pickupAt: 1 });
db.quotes.createIndex({ quoteId: 1 }, { unique: true });
db.quotes.createIndex({ expiresAt: 1 });
db.drivers.createIndex({ status: 1 });
db.drivers.createIndex({ availability: 1 });
db.vehicles.createIndex({ isActive: 1 });

print('MongoDB initialization completed successfully!');

