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

# Create nginx config for SPA with PWA cache headers
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 3202;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # Service worker - must always revalidate' >> /etc/nginx/conf.d/default.conf && \
    echo '    location = /sw.js {' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "no-cache, no-store, must-revalidate";' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Pragma "no-cache";' >> /etc/nginx/conf.d/default.conf && \
    echo '        expires 0;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # PWA manifest - must always revalidate' >> /etc/nginx/conf.d/default.conf && \
    echo '    location = /manifest.webmanifest {' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "no-cache, no-store, must-revalidate";' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Pragma "no-cache";' >> /etc/nginx/conf.d/default.conf && \
    echo '        expires 0;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # Workbox files - must always revalidate' >> /etc/nginx/conf.d/default.conf && \
    echo '    location ~* ^/workbox-.*\.js$ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "no-cache, no-store, must-revalidate";' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Pragma "no-cache";' >> /etc/nginx/conf.d/default.conf && \
    echo '        expires 0;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # Static assets - cache with revalidation' >> /etc/nginx/conf.d/default.conf && \
    echo '    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        expires 1y;' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "public, immutable";' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # HTML files - short cache with revalidation' >> /etc/nginx/conf.d/default.conf && \
    echo '    location ~* \.html$ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "no-cache";' >> /etc/nginx/conf.d/default.conf && \
    echo '        expires 0;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # SPA fallback' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

# Expose port 3202
EXPOSE 3202

# Start nginx
CMD ["nginx", "-g", "daemon off;"]