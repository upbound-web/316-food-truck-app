# 316 The Food Truck - Ordering App

A mobile-first ordering app for **316 The Food Truck**, enabling customers to browse the menu, customize orders, and pay seamlessly with Square. Staff can manage orders in real-time with push notifications.

## Features

### Customer Features

- 📱 **PWA Support** – Install as an app on mobile devices
- 🍔 **Menu Browsing** – Browse items by category with search functionality
- ✨ **Order Customization** – Choose sizes, milk options, syrups, sugar levels, and extras
- 🛒 **Shopping Cart** – Add items, adjust quantities, and modify customizations
- 💳 **Square Payments** – Secure payment processing via Square
- 🔄 **Quick Reorder** – Easily reorder your previous order
- 🔔 **Push Notifications** – Get notified when your order is ready

### Staff Features

- 📋 **Order Management** – View and manage incoming orders
- 🔊 **Audio Alerts** – Hear notifications for new orders
- ✅ **Status Updates** – Mark orders as preparing or ready for pickup

### Admin Features

- 👥 **Role Management** – Assign staff and admin roles to users
- 📊 **Order Overview** – View all orders and system status

## Tech Stack

| Layer         | Technology                      |
| ------------- | ------------------------------- |
| Frontend      | React 19, Vite, Tailwind CSS    |
| Backend       | [Convex](https://convex.dev)    |
| Payments      | Square Web Payments SDK         |
| Auth          | Convex Auth (Anonymous sign-in) |
| Notifications | Web Push API                    |

## Project Structure

```
├── src/                  # React frontend
│   ├── CoffeeApp.tsx     # Main app component
│   ├── StaffView.tsx     # Staff order management
│   ├── AdminPanel.tsx    # Admin controls
│   └── ...
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── menu.ts           # Menu queries/mutations
│   ├── orders.ts         # Order management
│   ├── payments.ts       # Square payment processing
│   ├── staff.ts          # Staff role management
│   └── ...
└── public/               # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm)
- A [Convex](https://convex.dev) account
- A [Square](https://developer.squareup.com) developer account

### Installation

```bash
# Install dependencies
pnpm install

# Start development servers (frontend + Convex backend)
pnpm dev
```

### Environment Variables

Configure the following in your Convex dashboard:

- `SQUARE_ACCESS_TOKEN` – Square API access token
- `SQUARE_LOCATION_ID` – Square location ID
- `SQUARE_APPLICATION_ID` – Square application ID
- `VAPID_PUBLIC_KEY` – Web push public key
- `VAPID_PRIVATE_KEY` – Web push private key

## Deployment

### Docker

The app includes Docker support for containerized deployment:

```bash
# Build and run with Docker Compose
docker-compose up --build
```

See [DOCKER-README.md](./DOCKER-README.md) for detailed deployment instructions.

### Convex Production

Deploy the backend to Convex production:

```bash
npx convex deploy
```

## Authentication

The app uses [Convex Auth](https://auth.convex.dev/) with Anonymous authentication for frictionless sign-in. Consider implementing email or social authentication before production deployment.

## Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Square Web Payments SDK](https://developer.squareup.com/docs/web-payments/overview)
- [Vite Documentation](https://vitejs.dev/)

## License

Private project – All rights reserved.
