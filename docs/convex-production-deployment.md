# Convex Production Deployment Guide

This document explains how to deploy changes and run functions on the production Convex deployment for the 316 Food Truck app.

## Overview

Our project has two Convex deployments:
- **Development**: `dev:bold-monitor-713` (https://bold-monitor-713.convex.cloud)
- **Production**: `prod:laudable-horse-298` (https://laudable-horse-298.convex.cloud)

## Deploying Functions to Production

### 1. Deploy Code Changes

To deploy your Convex functions to production:

```bash
npx convex deploy
```

This deploys to production by default. The deployment target is determined by your environment variables and deployment keys.

### 2. Running Functions on Production

To run functions (queries, mutations, actions) on the production deployment, use the `--prod` flag:

```bash
npx convex run <functionName> [args] --prod
```

#### Examples:

**Query menu items:**
```bash
npx convex run menu:getMenuItems --prod
```

**Query specific category:**
```bash
npx convex run menu:getMenuItems '{"category": "food"}' --prod
```

**Add a new menu item:**
```bash
npx convex run menu:addMenuItem '{"name": "New Burger", "description": "Delicious burger", "basePrice": 12.00, "category": "food"}' --prod
```

**Update menu item image:**
```bash
npx convex run menu:updateMenuItemImage '{"itemName": "Latte", "imageName": "new-latte.png"}' --prod
```

### 3. Deployment Configuration

#### Environment Files

**Development (.env.local):**
```
CONVEX_DEPLOYMENT=dev:bold-monitor-713
VITE_CONVEX_URL=https://bold-monitor-713.convex.cloud
```

**Production (.env.production):**
```
CONVEX_URL=https://laudable-horse-298.convex.cloud
VITE_CONVEX_URL=https://laudable-horse-298.convex.cloud
```

#### Docker Production Build

The Docker container uses `.env.production` during the build process to connect to the production Convex deployment.

## Common Operations

### Adding Menu Items

1. **Add a single item:**
```bash
npx convex run menu:addMenuItem '{"name": "Item Name", "description": "Item description", "basePrice": 10.00, "category": "food"}' --prod
```

2. **Verify the item was added:**
```bash
npx convex run menu:getMenuItems '{"category": "food"}' --prod
```

### Checking Current Data

**View all menu items:**
```bash
npx convex run menu:getMenuItems --prod
```

**View items by category:**
```bash
npx convex run menu:getMenuItems '{"category": "coffee"}' --prod
npx convex run menu:getMenuItems '{"category": "food"}' --prod
npx convex run menu:getMenuItems '{"category": "iced"}' --prod
```

**View all categories:**
```bash
npx convex run menu:getCategories --prod
```

### Managing Orders and Users

**View recent orders:**
```bash
npx convex run orders:getOrders --prod
```

**View user data:**
```bash
npx convex run users:getUsers --prod
```

## Important Notes

1. **Always use `--prod` flag** when running functions that should affect the live app
2. **Test changes in development first** before applying to production
3. **Verify changes** by querying the data after mutations
4. **Deploy code changes** with `npx convex deploy` before running new functions
5. **JSON arguments** must be properly formatted and quoted

## Troubleshooting

### Function Not Found Error
If you get "Could not find function" error:
1. Make sure you've deployed your code changes: `npx convex deploy`
2. Check that the function name is correct
3. Verify you're using the `--prod` flag for production

### Permission Errors
Make sure you have the correct deployment keys and permissions for the production environment.

### Checking Deployment Status
```bash
npx convex status --prod
```

## Example Workflow: Adding New Menu Items

1. **Develop and test locally:**
```bash
npx convex dev
npx convex run menu:addMenuItem '{"name": "Test Item", "description": "Test", "basePrice": 5.00, "category": "food"}'
```

2. **Deploy to production:**
```bash
npx convex deploy
```

3. **Add items to production:**
```bash
npx convex run menu:addMenuItem '{"name": "Hawaiian Burger", "description": "Juicy beef patty with pineapple, ham, and cheese", "basePrice": 13.00, "category": "food"}' --prod
npx convex run menu:addMenuItem '{"name": "Plan Burger", "description": "Premium beef burger with special sauce and toppings", "basePrice": 13.50, "category": "food"}' --prod
```

4. **Verify items were added:**
```bash
npx convex run menu:getMenuItems '{"category": "food"}' --prod
```

5. **Update Docker container** on your server to see changes in the live app.