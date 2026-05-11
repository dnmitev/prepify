# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm ci

RUN npm run build -w @prepify/shared -w @prepify/db -w @prepify/api -w @prepify/worker -w @prepify/web

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/package.json /app/package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps

# Default command overridden per-service in compose examples.
CMD ["node", "apps/api/dist/main.js"]
