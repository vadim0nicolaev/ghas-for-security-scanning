# INTENTIONALLY VULNERABLE - Using old Node.js image for demo purposes
# DO NOT USE IN PRODUCTION
FROM node:14.17.0-alpine3.13

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY src/ ./src/

# Create data directory for file endpoint demo
RUN mkdir -p ./data && echo "Sample data file" > ./data/sample.txt

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Run as non-root user (good practice, but image still has vulnerabilities)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

USER nodejs

# Start the application
CMD ["node", "src/index.js"]
