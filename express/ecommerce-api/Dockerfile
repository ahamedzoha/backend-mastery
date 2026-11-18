# Build stage: all dependencies, generate the Prisma client, compile TypeScript.
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage: production dependencies, the compiled app, and what migrations need.
FROM node:24-alpine
ENV NODE_ENV=production
# Stops the Prisma CLI checking for updates (and printing a banner) on every start.
ENV CHECKPOINT_DISABLE=1
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
# prisma migrate deploy reads the config, the schema and the migrations folder.
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3001
# Apply pending migrations, then start the app. If a migration fails, the app
# never starts, so Coolify's health check fails and the old container keeps serving.
# `exec` replaces the shell with Node, so Node gets the stop signal, not sh.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/server.js"]
