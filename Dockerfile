# Stage 1: Build application and install dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json for dependency caching
COPY package*.json ./

# Install all dependencies (dev dependencies needed for build)
RUN npm install

# Copy all application source code
COPY . .

# Optional: Build frontend assets if applicable (e.g., React, Vue, Svelte)
# This assumes 'npm run build' command exists and outputs to a 'public' directory.
# Uncomment if your project has a frontend build step.
# RUN npm run build

# Stage 2: Create a lean production image
FROM node:20-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Copy only production dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules
# Copy package.json for potential runtime scripts or info
COPY --from=builder /app/package*.json ./

# Copy application source code
COPY --from=builder /app/src ./src

# Optional: Copy built frontend assets if served by Node.js backend
# Uncomment if your project serves static frontend files from a 'public' directory.
# COPY --from=builder /app/public ./public

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Expose the port the application listens on
EXPOSE 3000

# Command to start the application
CMD ["node", "src/index.js"]