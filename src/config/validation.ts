import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  // Accept both MONGODB_URI and MONGO_URI for flexibility
  // Make validation lenient - just check it's a string (fix double @@ in configuration.ts)
  MONGODB_URI: Joi.string().allow(''),
  MONGO_URI: Joi.string().allow(''),
  // Accept REDIS_URL or build from REDIS_HOST, REDIS_PASSWORD, REDIS_PORT
  REDIS_URL: Joi.string().uri().allow(''),
  REDIS_HOST: Joi.string().allow(''),
  REDIS_PASSWORD: Joi.string().allow(''),
  // Make REDIS_PORT lenient - accept string or number (extract number in configuration.ts)
  REDIS_PORT: Joi.alternatives().try(Joi.number(), Joi.string()).allow(''),
  JWT_SECRET: Joi.string().min(16).required(),
  CORS_ORIGINS: Joi.string().default('*'),
}).or('MONGODB_URI', 'MONGO_URI').or('REDIS_URL', 'REDIS_HOST');
