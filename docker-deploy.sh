#!/bin/bash

# 316 Food Truck App - Docker Deployment Script
# This script builds and deploys the application on port 3202

echo "🚛 316 Food Truck - Docker Deployment"
echo "====================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "📦 Building Docker image..."
docker build -t 316-food-truck-app .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "🛑 Stopping any existing containers..."
docker-compose down

echo "🚀 Starting application on port 3202..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "✅ Application deployed successfully!"
    echo "🌐 Access your app at: http://localhost:3202"
    echo "📊 Check logs with: docker-compose logs -f"
    echo "🛑 Stop with: docker-compose down"
else
    echo "❌ Deployment failed!"
    exit 1
fi