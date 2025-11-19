# ============================================
# BUILD STAGE
# ============================================
FROM node:20-alpine AS builder

# Install build dependencies (for native modules like argon2)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files for better caching
COPY package.json package-lock.json* ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --prefer-offline --no-audit --no-fund || \
    npm install --no-audit --no-fund

# Copy config files
COPY tsconfig*.json nest-cli.json ./

# Copy source code
COPY src ./src

# Build the application using the nest CLI directly from node_modules
RUN ./node_modules/.bin/nest build

# Remove dev dependencies after build
RUN npm prune --production

# ============================================
# PRODUCTION STAGE
# ============================================
FROM node:20-alpine AS production

# Install production runtime dependencies
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    PORT=3000

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check for Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
