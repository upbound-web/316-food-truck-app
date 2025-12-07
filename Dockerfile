# Build stage
FROM node:18-alpine AS build

# Declare build arguments for environment variables
ARG VITE_CONVEX_URL
ARG VITE_SQUARE_APPLICATION_ID
ARG VITE_SQUARE_LOCATION_ID
ARG VITE_SQUARE_ENVIRONMENT

# Set environment variables from build arguments
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV VITE_SQUARE_APPLICATION_ID=$VITE_SQUARE_APPLICATION_ID
ENV VITE_SQUARE_LOCATION_ID=$VITE_SQUARE_LOCATION_ID
ENV VITE_SQUARE_ENVIRONMENT=$VITE_SQUARE_ENVIRONMENT

# DEBUG: Fail build if VITE_CONVEX_URL is missing
RUN if [ -z "$VITE_CONVEX_URL" ]; then echo "❌ FATAL: VITE_CONVEX_URL is not set during build"; exit 1; else echo "✅ VITE_CONVEX_URL is set to: $VITE_CONVEX_URL"; fi

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
# Use npm install if package-lock.json is not available, otherwise use npm ci
RUN if [ -f "package-lock.json" ]; then npm ci --legacy-peer-deps; else npm install --legacy-peer-deps; fi

# Copy source code
COPY . .

# Copy production environment file
COPY .env.production* ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create nginx config for SPA
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 3202;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

# Expose port 3202
EXPOSE 3202

# Start nginx
CMD ["nginx", "-g", "daemon off;"]