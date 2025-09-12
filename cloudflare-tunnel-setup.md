# Cloudflare Tunnel Setup for 316 Food Truck App

## Prerequisites
1. Cloudflare account
2. Domain managed by Cloudflare 
3. Docker container running on localhost:3202

## Setup Steps

### 1. Install Cloudflare Tunnel (cloudflared)
```bash
# macOS
brew install cloudflared

# Or download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

### 2. Login to Cloudflare
```bash
cloudflared tunnel login
```

### 3. Create a Tunnel
```bash
cloudflared tunnel create 316-food-truck
```
This creates a tunnel and gives you a tunnel ID.

### 4. Create Configuration File
Create `~/.cloudflared/config.yml`:

```yaml
tunnel: 316-food-truck
credentials-file: ~/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: your-app.yourdomain.com
    service: http://localhost:3202
  - service: http_status:404
```

### 5. Create DNS Record
```bash
cloudflared tunnel route dns 316-food-truck your-app.yourdomain.com
```

### 6. Run the Tunnel
```bash
cloudflared tunnel run 316-food-truck
```

### 7. Alternative: One-time Command
```bash
cloudflared tunnel --url http://localhost:3202
```
This gives you a temporary `*.trycloudflare.com` URL for testing.

## Environment Variables Setup

1. Deploy your Convex backend:
```bash
npx convex deploy
```

2. Update `.env.production` with the deployment URL:
```env
CONVEX_URL=https://your-convex-deployment.convex.cloud
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud
VITE_SQUARE_APPLICATION_ID=your_square_app_id
VITE_SQUARE_LOCATION_ID=your_square_location_id
VITE_SQUARE_ENVIRONMENT=production
VAPID_PRIVATE_KEY=your_vapid_private_key
NODE_ENV=production
PORT=3202
```

3. Rebuild and redeploy Docker container:
```bash
./docker-deploy.sh
```

## Testing
1. Start your Docker container: `./docker-deploy.sh`
2. Start Cloudflare tunnel: `cloudflared tunnel run 316-food-truck`  
3. Access your app via the Cloudflare URL

## Troubleshooting
- Ensure Docker container is healthy: `docker ps`
- Check tunnel status: `cloudflared tunnel list`
- Verify environment variables are loaded in the built app