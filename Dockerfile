# TrackStack production image.
#
# Stage 1 builds the Vite client bundle.
# Stage 2 is a slim Node server that also serves client/dist, so one
# container hosts the whole app (API + static client).

# --- stage 1: build the client ----------------------------------------------
FROM node:20-alpine AS client

WORKDIR /app

# Install workspace dependencies first so this layer is cached.
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci --no-audit --no-fund

COPY client ./client
RUN npm run build --workspace client

# --- stage 2: the runtime ---------------------------------------------------
FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Production dependencies only. The install is done from the workspace root
# so the committed package-lock.json is the single source of truth.
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY server ./server
COPY --from=client /app/client/dist ./client/dist

EXPOSE 4000

# Migrations are idempotent, so running them on every boot is safe.
CMD ["sh", "-c", "node server/src/db/migrate.js && node server/src/index.js"]
