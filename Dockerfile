# ==========================================
# STAGE 1: Dependency Installation & Build
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency catalogs
COPY package*.json ./

# Install development and production dependencies
RUN npm ci

# Copy the entire workspace code
COPY . .

# Run the unified build script (React bundle + esbuild Express bundle)
RUN npm run build

# ==========================================
# STAGE 2: Lightweight Production Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set production context
ENV NODE_ENV=production
ENV PORT=3000

# Copy runtime dependency catalogs
COPY package*.json ./

# Install ONLY production dependencies to minimize image size and attack surface
RUN npm ci --only=production

# Copy compiled backend CJS bundle and React build assets from Stage 1
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose standard container port
EXPOSE 3000

# Exec launch instruction
CMD ["node", "dist/server.cjs"]
