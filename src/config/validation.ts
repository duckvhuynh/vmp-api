import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  // Accept both MONGODB_URI and MONGO_URI for flexibility
  MONGODB_URI: Joi.string().uri(),
  MONGO_URI: Joi.string().uri(),
  // Accept REDIS_URL or build from REDIS_HOST, REDIS_PASSWORD, REDIS_PORT
  REDIS_URL: Joi.string().uri(),
  REDIS_HOST: Joi.string(),
  REDIS_PASSWORD: Joi.string().allow(''),
  REDIS_PORT: Joi.number(),
  JWT_SECRET: Joi.string().min(16).required(),
  CORS_ORIGINS: Joi.string().default('*'),
}).or('MONGODB_URI', 'MONGO_URI').or('REDIS_URL', 'REDIS_HOST');
