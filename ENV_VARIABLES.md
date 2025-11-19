# 🔐 Environment Variables for Coolify Deployment

## Copy these to Coolify's "Environment Variables" section

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
MONGO_URI=mongodb://admin:YOUR_MONGO_PASSWORD@vmp-mongo:27017/vmp_production

# ============================================
# REDIS CONFIGURATION
# ============================================
REDIS_HOST=vmp-redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# ============================================
# JWT AUTHENTICATION
# ============================================
# Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# ============================================
# API CONFIGURATION
# ============================================
PORT=3000
NODE_ENV=production
API_PREFIX=api/v1

# ============================================
# CORS CONFIGURATION
# ============================================
CORS_ORIGINS=https://api.visitmauritiusparadise.com,https://visitmauritiusparadise.com

# ============================================
# SWAGGER/API DOCUMENTATION
# ============================================
SWAGGER_ENABLED=true
SWAGGER_PATH=docs

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_ENABLED=true
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
```

---

## 🔑 Generate Strong Secrets

### JWT Secret
```bash
openssl rand -base64 32
```

### MongoDB Password
```bash
openssl rand -base64 24
```

### Redis Password
```bash
openssl rand -base64 24
```

---

## 📝 Optional Variables

### Payment Integration (Stripe)
```env
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### SMS Notifications (Twilio)
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Google Maps
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## ✅ Important Notes

1. **Service Names in Coolify:**
   - Use internal service names (e.g., `vmp-mongo`, `vmp-redis`)
   - NOT `localhost` or external IPs

2. **Secrets:**
   - Generate unique secrets for production
   - Never use example/default values
   - Minimum 32 characters for JWT_SECRET

3. **CORS:**
   - Update with your actual domain(s)
   - Comma-separated, no spaces
   - Include https://

4. **Database:**
   - MongoDB URI includes username, password, and database name
   - Use the same password you set in MongoDB service

