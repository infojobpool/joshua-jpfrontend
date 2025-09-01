
# Step 1: Use Node.js image for the build stage
FROM node:18 AS builder

WORKDIR /app

# Only copy package files first for better layer caching
COPY package.json package-lock.json ./

# ✅ Skip lifecycle scripts like `prepare` (Husky)
#ENV NPM_CONFIG_IGNORE_SCRIPTS=true

# Install all dependencies (needed for build)
RUN npm install

# Copy only what's needed to build

COPY . .

# Build the Next.js app (this includes all code, public assets, etc.)
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# Step 2: Slim production image
FROM node:18-slim AS runner

WORKDIR /app

# Only copy what’s needed for running the built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/src ./src

# Copy .env.production to the container
COPY .env.production .env


# Install only production dependencies
RUN npm install --omit=dev

# Prevent Husky or other dev scripts from triggering
ENV HUSKY=0
ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "run", "start"]
