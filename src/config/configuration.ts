export default () => {
  // Support both MONGODB_URI and MONGO_URI
  const mongodbUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/vmp';

  // Build REDIS_URL from components if REDIS_URL is not provided
  let redisUrl = process.env.REDIS_URL;
  if (!redisUrl && process.env.REDIS_HOST) {
    const password = process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : '';
    // Parse port, defaulting to 6379 if invalid
    const portStr = process.env.REDIS_PORT || '6379';
    const port = parseInt(portStr, 10) || 6379;
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
  };
};
