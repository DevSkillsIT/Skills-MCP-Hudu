# Use the official Node.js 20 Alpine image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install build dependencies (needed for some native modules)
RUN apk add --no-cache python3 make g++ curl

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Remove development dependencies to reduce image size
RUN npm prune --omit=dev

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S hudu -u 1001

# Create logs directory and set proper permissions
RUN mkdir -p /app/logs && chown -R hudu:nodejs /app/logs

USER hudu

# Expose the port (though MCP typically uses stdio)
EXPOSE 3050

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3050/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Start the application
CMD ["npm", "start"]