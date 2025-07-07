# ========================================
# DEVELOPMENT DOCKERFILE
# ========================================
# This Dockerfile is configured for development experimentation only.
# For production deployment, use Vercel or other cloud platforms.
# Features: Hot reloading, full source code, development dependencies
# ========================================

FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set development environment
ENV NODE_ENV development
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start development server with hot reloading
CMD ["npm", "run", "dev"] 