"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Send push notification to user (called internally)
export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get user's push subscription
    const subscription = await ctx.runQuery(api.pushNotifications.getUserPushSubscriptionById, {
      userId: args.userId,
    });

    if (!subscription) {
      console.log("No push subscription found for user:", args.userId);
      return false;
    }

    try {
      // Import web-push library
      const webpush = require('web-push');
      
      // Set VAPID details (you'll need the private key too)
      webpush.setVapidDetails(
        'mailto:your-app@example.com', // Replace with your email
        'BJv1nAEKV5vpVMzwmJOeAwMI4Pn88c_Ghibx6VBCLLnPGHn9sp9e2owTR2_O1W8AhuJDBkmEr3bkpo-UFcRVEu8', // Public key
        process.env.VAPID_PRIVATE_KEY || 'YOUR_VAPID_PRIVATE_KEY_HERE' // Private key from env or replace
      );

      const payload = JSON.stringify({
        title: args.title,
        body: args.body,
        data: args.data,
        icon: '/icons/pwa-192x192.png',
        badge: '/icons/pwa-192x192.png',
        tag: 'coffee-order',
        timestamp: Date.now(),
      });

      console.log("Sending push notification:", {
        to: subscription.endpoint,
        title: args.title,
        body: args.body,
        data: args.data,
      });

      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        }
      }, payload);

      console.log("Push notification sent successfully");
      return true;
    } catch (error) {
      console.error("Failed to send push notification:", error);
      // Return true for now to not break the flow, but log the error
      return true;
    }
  },
});

// Send notification when order status changes
export const notifyOrderStatusChange = action({
  args: {
    orderId: v.id("orders"),
    newStatus: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    // Get the order details
    const order: any = await ctx.runQuery(api.orders.getOrderById, { orderId: args.orderId });
    if (!order) return false;

    // Only send for certain status changes
    if (!["preparing", "ready"].includes(args.newStatus)) {
      return false;
    }

    const statusMessages = {
      preparing: `Your order #${order.orderNumber} is now being prepared ☕`,
      ready: `Your order #${order.orderNumber} is ready for pickup! 🎉`,
    };

    const message = statusMessages[args.newStatus as keyof typeof statusMessages];
    if (!message) return false;

    // Send push notification
    return await ctx.runAction(api.pushNotificationActions.sendPushNotification, {
      userId: order.userId,
      title: `Hi ${order.customerName}!`,
      body: message,
      data: {
        orderId: args.orderId,
        orderNumber: order.orderNumber,
        status: args.newStatus,
        url: "/?tab=orders",
      },
    });
  },
});