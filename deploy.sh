#!/bin/bash

# Deployment script for 316 Food Truck App
# Validates environment and deploys via Docker with Cloudflare cache purge

ENV_FILE=".env.production"

echo "🚀 Starting Deployment..."
echo "=================================="

# 1. Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    echo "   Please create it with the required variables:"
    echo "   - VITE_CONVEX_URL"
    echo "   - VITE_SQUARE_APPLICATION_ID"
    echo "   - VITE_SQUARE_LOCATION_ID"
    echo "   - VITE_SQUARE_ENVIRONMENT"
    echo "   - CLOUDFLARE_ZONE_ID (optional, for cache purging)"
    echo "   - CLOUDFLARE_API_TOKEN (optional, for cache purging)"
    exit 1
fi

echo "✅ Found $ENV_FILE"

# 2. Validate critical variables
# Helper function to check variable existence and non-emptiness
check_var() {
    local var_name=$1
    local value=$(grep "^$var_name=" "$ENV_FILE" | cut -d '=' -f2-)

    # Trim whitespace (including carriage returns from windows edited files)
    value=$(echo "$value" | tr -d '\r' | xargs)

    if [ -z "$value" ]; then
        echo "❌ Error: $var_name is missing or empty in $ENV_FILE"
        return 1
    fi
    echo "   - $var_name: OK"
}

# Helper function to get variable value
get_var() {
    local var_name=$1
    local value=$(grep "^$var_name=" "$ENV_FILE" | cut -d '=' -f2-)
    value=$(echo "$value" | tr -d '\r' | xargs)
    echo "$value"
}

echo "🔍 Validating environment variables..."
check_var "VITE_CONVEX_URL" || exit 1
check_var "VITE_SQUARE_APPLICATION_ID" || exit 1

# 3. Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not in PATH"
    exit 1
fi

# Check for docker-compose or docker compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ Error: docker-compose not found"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker daemon is not running"
    exit 1
fi

echo "✅ Docker is ready (using $COMPOSE_CMD)"

# 4. Build and Deploy
echo "📦 Building Docker image (forcing rebuild to bake in env vars)..."
$COMPOSE_CMD --env-file "$ENV_FILE" build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "🛑 Stopping existing containers..."
$COMPOSE_CMD --env-file "$ENV_FILE" down

echo "🚀 Starting application..."
$COMPOSE_CMD --env-file "$ENV_FILE" up -d

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed to start"
    exit 1
fi

echo "✅ Application started successfully"

# 5. Purge Cloudflare cache (if configured)
CF_ZONE_ID=$(get_var "CLOUDFLARE_ZONE_ID")
CF_API_TOKEN=$(get_var "CLOUDFLARE_API_TOKEN")

if [ -n "$CF_ZONE_ID" ] && [ -n "$CF_API_TOKEN" ]; then
    echo "🌐 Purging Cloudflare cache..."

    PURGE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}')

    # Check if purge was successful
    if echo "$PURGE_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Cloudflare cache purged successfully"
    else
        echo "⚠️  Warning: Cloudflare cache purge may have failed"
        echo "   Response: $PURGE_RESPONSE"
        echo "   You may need to manually purge the cache in Cloudflare dashboard"
    fi
else
    echo "⚠️  Cloudflare credentials not configured - skipping cache purge"
    echo "   Add CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN to $ENV_FILE for automatic cache purging"
fi

echo ""
echo "==========================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "==========================================="
echo "🌐 App running at: http://localhost:3202"
echo "📜 View logs:      $COMPOSE_CMD logs -f"
echo "🛑 Stop app:       $COMPOSE_CMD down"

