# syntax=docker/dockerfile:1.6

# ── Stage 1: build frontend and install all deps ────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Build deps for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: slim runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache tini curl \
 && apk add --no-cache --virtual .build-deps python3 make g++

ENV NODE_ENV=production \
    PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force \
 && apk del .build-deps

# Copy app source & built frontend
COPY --from=builder /app/dist            ./dist
COPY --from=builder /app/migrations      ./migrations
COPY --from=builder /app/scripts         ./scripts
COPY --from=builder /app/routes          ./routes
COPY --from=builder /app/server.js       ./server.js
COPY --from=builder /app/telemetry.js    ./telemetry.js
COPY --from=builder /app/logger.js       ./logger.js
COPY --from=builder /app/metrics.js      ./metrics.js
COPY --from=builder /app/db.js           ./db.js
COPY --from=builder /app/middleware.js   ./middleware.js
COPY --from=builder /app/sessions.js     ./sessions.js
COPY --from=builder /app/cards-manager.js    ./cards-manager.js
COPY --from=builder /app/user-management.js  ./user-management.js

EXPOSE 3000

# Liveness: hit our own /healthz.
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:3000/healthz || exit 1

USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--import", "./telemetry.js", "server.js"]
