#!/bin/bash

# Deployment script for 316 Food Truck App
# Rebuilds and restarts Docker containers

ENV_FILE=".env.production"

echo "🚀 Starting Deployment..."
echo "=================================="

# 1. Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    exit 1
fi

echo "✅ Found $ENV_FILE"

# 2. Check Docker
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

echo "✅ Docker is ready"

# 3. Build first, then stop and start (minimizes downtime)
echo "📦 Building Docker image..."
$COMPOSE_CMD --env-file "$ENV_FILE" build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "🛑 Stopping existing containers..."
$COMPOSE_CMD --env-file "$ENV_FILE" down

echo "🚀 Starting application..."
$COMPOSE_CMD --env-file "$ENV_FILE" up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "==========================================="
    echo "✅ DEPLOYMENT COMPLETE"
    echo "==========================================="
    echo "🌐 App running at: http://localhost:3202"
    echo "📜 View logs:      $COMPOSE_CMD logs -f"
else
    echo "❌ Deployment failed to start"
    exit 1
fi
