# 🚛 316 Food Truck - Docker Deployment

This guide will help you deploy the 316 Food Truck app using Docker on port 3202.

## 📋 Prerequisites

- Docker installed and running
- Docker Compose installed
- Convex deployment configured
- Environment variables set up

## 🚀 Quick Start

### Option 1: Automated Deployment
```bash
./docker-deploy.sh
```

### Option 2: Manual Deployment
```bash
# Build the image
docker build -t 316-food-truck-app .

# Run with docker-compose
docker-compose up -d
```

### Option 3: Direct Docker Run
```bash
# Build the image
docker build -t 316-food-truck-app .

# Run the container
docker run -d \
  --name 316-food-truck-app \
  -p 3202:3202 \
  -e NODE_ENV=production \
  316-food-truck-app
```

## 🔧 Configuration

### Environment Variables
Copy `.env.production.example` to `.env.production` and configure:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` with your values:
- `CONVEX_URL`: Your Convex deployment URL
- `VITE_CONVEX_URL`: Same as CONVEX_URL for frontend
- `VITE_SQUARE_APPLICATION_ID`: Square payment app ID
- `VITE_SQUARE_LOCATION_ID`: Square location ID
- `VAPID_PRIVATE_KEY`: Your VAPID private key

## 📊 Management Commands

### Check Status
```bash
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f
```

### Stop Application
```bash
docker-compose down
```

### Restart Application
```bash
docker-compose restart
```

### Update Application
```bash
# Pull latest code changes
git pull

# Rebuild and redeploy
docker-compose down
docker-compose up -d --build
```

## 🌐 Access

- **Application**: http://localhost:3202
- **Container Name**: `316-food-truck-app`
- **Port**: 3202

## 🔍 Troubleshooting

### Check Container Status
```bash
docker ps
```

### Check Container Logs
```bash
docker logs 316-food-truck-app
```

### Enter Container Shell
```bash
docker exec -it 316-food-truck-app sh
```

### Health Check
```bash
curl http://localhost:3202
```

### Common Issues

1. **Port 3202 already in use**
   ```bash
   lsof -i :3202
   # Kill the process using the port
   ```

2. **Build fails**
   - Check Docker is running
   - Ensure all dependencies are available
   - Check network connection

3. **Environment variables not working**
   - Verify `.env.production` file exists
   - Check variable names match exactly
   - Restart container after changes

## 🔧 Production Considerations

### Performance
- Uses Node.js 18 Alpine for smaller image size
- Runs as non-root user for security
- Includes health checks
- Optimized build process

### Security
- Non-root user execution
- Only production dependencies installed
- Minimal image surface area

### Monitoring
- Health check endpoint on port 3202
- Automatic restart on failure
- Container logs available

## 📝 Docker Image Details

- **Base Image**: node:18-alpine
- **Size**: ~50MB (optimized)
- **Port**: 3202
- **User**: Non-root (nextjs:nodejs)
- **Health Check**: HTTP check on port 3202

## 🔄 CI/CD Integration

For automated deployments, use:

```bash
# In your CI/CD pipeline
git pull
docker-compose down
docker-compose up -d --build
```

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure Convex backend is accessible
4. Check port availability

---

**316 Food Truck App** - Ready for production! ☕🚛