export default () => {
  // Support both MONGODB_URI and MONGO_URI
  let mongodbUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/vmp';
  
  // Fix double @@ issue in MongoDB URI
  if (mongodbUri.includes('@@')) {
    mongodbUri = mongodbUri.replace('@@', '@');
  }

  // Build REDIS_URL from components if REDIS_URL is not provided
  let redisUrl = process.env.REDIS_URL;
  if (!redisUrl && process.env.REDIS_HOST) {
    const password = process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : '';
    // Parse port, extracting numeric part from corrupted strings
    const portStr = process.env.REDIS_PORT || '6379';
    // Extract first numeric sequence (handles corrupted values like "63791380askjd...")
    const portMatch = portStr.toString().match(/^(\d+)/);
    const port = portMatch ? parseInt(portMatch[1], 10) : 6379;
    redisUrl = `redis://${password}${process.env.REDIS_HOST}:${port}`;
  }
  redisUrl = redisUrl || 'redis://localhost:6379';

  return {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    mongodbUri,
    redisUrl,
    jwtSecret: process.env.JWT_SECRET || 'change-me',
    corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim()),
    // Admin seed configuration
    adminSeed: {
      enabled: process.env.SEED_ADMIN === 'true',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      name: process.env.ADMIN_NAME || 'Admin User',
      phone: process.env.ADMIN_PHONE,
    },
    // MinIO/S3 storage configuration
    minio: {
      endpoint: process.env.MINIO_ENDPOINT || '',
      port: parseInt(process.env.MINIO_PORT || '443', 10),
      useSSL: process.env.MINIO_SSL !== 'false', // default to true
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
      bucket: process.env.MINIO_BUCKET || 'vmp',
    },
    // Fiserv payment gateway configuration
    // Docs: https://docs.fiserv.dev/public/reference/postcheckouts
    fiserv: {
      // Default to sandbox for testing, use FISERV_BASE_URL for production
      // Sandbox: https://prod.emea.api.fiservapps.com/sandbox/exp/v1
      // Production: https://prod.emea.api.fiservapps.com/exp/v1
      baseUrl: process.env.FISERV_BASE_URL || 'https://prod.emea.api.fiservapps.com/sandbox/exp/v1',
      storeId: process.env.FISERV_STORE_ID || '',
      apiKey: process.env.FISERV_API_KEY || '',
      secretKey: process.env.FISERV_SECRET_KEY || '',
      webhookUrl: process.env.FISERV_WEBHOOK_URL || '',
      defaultSuccessUrl: process.env.FISERV_SUCCESS_URL || 'https://visitmauritiusparadise.com/booking/success',
      defaultFailureUrl: process.env.FISERV_FAILURE_URL || 'https://visitmauritiusparadise.com/booking/failed',
    },
  };
};
