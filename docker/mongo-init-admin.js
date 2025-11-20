// MongoDB Admin User Initialization Script
// Ensures admin user exists with correct password
// This runs only on first initialization

// Switch to admin database
db = db.getSiblingDB('admin');

// Create or update admin user
try {
  // Try to create the user (will fail if exists, but that's ok)
  db.createUser({
    user: 'admin',
    pwd: '0814940664asdUZ@',
    roles: [
      {
        role: 'root',
        db: 'admin'
      }
    ]
  });
  print('Admin user created successfully');
} catch (e) {
  // User might already exist, try to update password
  try {
    db.changeUserPassword('admin', '0814940664asdUZ@');
    print('Admin user password updated successfully');
  } catch (updateError) {
    print('Admin user already exists with correct password or update failed');
  }
}

// Ensure vmp_production database exists
db = db.getSiblingDB('vmp_production');
db.createCollection('_init'); // Create a dummy collection to ensure DB exists
print('vmp_production database initialized');

print('MongoDB admin initialization completed!');

