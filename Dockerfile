# ==============================================================================
# CHEFIAPP POS CORE - Production Dockerfile
# ==============================================================================
# Multi-stage build following Docker best practices:
# - Minimal attack surface with Alpine base
# - Non-root user execution
# - Layer caching optimization
# - Security scanning friendly
# ==============================================================================

# ==============================================================================
# Stage 1: Dependencies (cached layer)
# ==============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
# --omit=dev excludes devDependencies
# --ignore-scripts prevents arbitrary code execution during install
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# ==============================================================================
# Stage 2: Build (TypeScript compilation)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json tsconfig.json ./

# Install ALL dependencies (including dev) for building
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Copy source code
COPY core-engine ./core-engine
COPY event-log ./event-log
COPY state-machines ./state-machines
COPY fiscal-modules ./fiscal-modules
COPY legal-boundary ./legal-boundary
COPY gate3-persistence ./gate3-persistence
COPY gateways ./gateways
COPY billing-core ./billing-core
COPY projections ./projections
COPY server ./server
COPY sdk ./sdk
COPY web-module ./web-module
COPY migrations ./migrations

# Build TypeScript
RUN npm run build

# ==============================================================================
# Stage 3: Runtime (minimal production image)
# ==============================================================================
FROM node:20-alpine AS runtime

# Install security updates
RUN apk upgrade --no-cache && \
    apk add --no-cache dumb-init tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built artifacts from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy necessary configuration files
COPY --chown=nodejs:nodejs package.json ./

# Copy migrations (if needed at runtime)
COPY --chown=nodejs:nodejs migrations ./migrations

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info

# Expose ports
# 3000: webhook-server
# 3099: billing-webhook-server
# 4310: subscription-management-server
# 4320: web-module-api-server
EXPOSE 3000 3099 4310 4320

# Use non-root user
USER nodejs

# Health check (will be overridden in compose for specific services)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use tini as PID 1 to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Default command (override in docker-compose for specific services)
CMD ["node", "dist/server/webhook-server.js"]

# ==============================================================================
# Build Arguments & Labels
# ==============================================================================
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.title="CHEFIAPP POS Core" \
      org.opencontainers.image.description="Event-sourced financial core with legal immutability" \
      org.opencontainers.image.authors="Goldmonkey Empire" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.vendor="CHEFIAPP"
