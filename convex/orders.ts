import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createOrder = mutation({
  args: {
    customerName: v.string(),
    items: v.array(v.object({
      menuItemId: v.id("menuItems"),
      quantity: v.number(),
      size: v.string(),
      customizations: v.array(v.string()),
      itemPrice: v.number(),
    })),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to place an order");
    }

    // Generate order number
    const existingOrders = await ctx.db.query("orders").collect();
    const orderNumber = existingOrders.length + 1;

    // Create the order
    const orderId = await ctx.db.insert("orders", {
      userId,
      customerName: args.customerName,
      status: "pending",
      totalAmount: args.totalAmount,
      orderNumber,
    });

    // Create order items
    for (const item of args.items) {
      await ctx.db.insert("orderItems", {
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        size: item.size,
        customizations: item.customizations,
        itemPrice: item.itemPrice,
      });
    }

    return { orderId, orderNumber };
  },
});

export const getUserOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            const menuItem = await ctx.db.get(item.menuItemId);
            return {
              ...item,
              menuItem,
            };
          })
        );

        return {
          ...order,
          items: itemsWithDetails,
        };
      })
    );

    return ordersWithItems;
  },
});

export const getAllOrders = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let orders;
    
    if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      orders = await ctx.db.query("orders").order("desc").collect();
    }

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            const menuItem = await ctx.db.get(item.menuItemId);
            return {
              ...item,
              menuItem,
            };
          })
        );

        const user = await ctx.db.get(order.userId);

        return {
          ...order,
          items: itemsWithDetails,
          user,
        };
      })
    );

    return ordersWithItems;
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate status
    const validStatuses = ["pending", "preparing", "ready"];
    if (!validStatuses.includes(args.status)) {
      throw new Error("Invalid order status");
    }

    await ctx.db.patch(args.orderId, {
      status: args.status,
    });
  },
});

// Staff: Get all orders for staff management (ordered by newest first)
export const getStaffOrders = query({
  args: { 
    status: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Check if user is staff
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Get all roles for this user
    const userRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Check if user has staff or admin role
    const hasStaffRole = userRoles.some(role => role.role === "staff" || role.role === "admin");

    if (!hasStaffRole) {
      throw new Error("Access denied: Staff privileges required");
    }
    let orders;
    
    if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      orders = await ctx.db
        .query("orders")
        .order("desc")
        .take(args.limit || 50);
    }

    const ordersWithDetails = await Promise.all(
      orders.map(async (order: any) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            const menuItem = await ctx.db.get(item.menuItemId);
            return {
              ...item,
              menuItem,
            };
          })
        );

        const user = await ctx.db.get(order.userId);

        return {
          ...order,
          items: itemsWithDetails,
          user,
          // Add time since order was placed
          timeSinceOrder: Date.now() - order._creationTime,
        };
      })
    );

    return ordersWithDetails;
  },
});

// Staff: Get orders that need attention (pending and preparing)
export const getActiveStaffOrders = query({
  args: { 
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Check if user is staff
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Get all roles for this user
    const userRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Check if user has staff or admin role
    const hasStaffRole = userRoles.some(role => role.role === "staff" || role.role === "admin");

    if (!hasStaffRole) {
      throw new Error("Access denied: Staff privileges required");
    }

    // Get orders that are pending or preparing (not ready)
    const pendingOrders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(args.limit || 25);
      
    const preparingOrders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "preparing"))
      .order("desc")
      .take(args.limit || 25);

    // Combine and sort by creation time
    const allActiveOrders = [...pendingOrders, ...preparingOrders]
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, args.limit || 50);

    const ordersWithDetails = await Promise.all(
      allActiveOrders.map(async (order: any) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            const menuItem = await ctx.db.get(item.menuItemId);
            return {
              ...item,
              menuItem,
            };
          })
        );

        const user = await ctx.db.get(order.userId);

        return {
          ...order,
          items: itemsWithDetails,
          user,
          // Add time since order was placed
          timeSinceOrder: Date.now() - order._creationTime,
        };
      })
    );

    return ordersWithDetails;
  },
});

// Staff: Quick status update mutations
export const markOrderPreparing = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    // Check if user is staff
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Get all roles for this user
    const userRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Check if user has staff or admin role
    const hasStaffRole = userRoles.some(role => role.role === "staff" || role.role === "admin");

    if (!hasStaffRole) {
      throw new Error("Access denied: Staff privileges required");
    }

    await ctx.db.patch(args.orderId, { status: "preparing" });
    
    // Trigger push notification
    ctx.scheduler.runAfter(0, "pushNotificationActions:notifyOrderStatusChange" as any, {
      orderId: args.orderId,
      newStatus: "preparing",
    });
  },
});

export const markOrderReady = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    // Check if user is staff
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Get all roles for this user
    const userRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Check if user has staff or admin role
    const hasStaffRole = userRoles.some(role => role.role === "staff" || role.role === "admin");

    if (!hasStaffRole) {
      throw new Error("Access denied: Staff privileges required");
    }

    await ctx.db.patch(args.orderId, { status: "ready" });
    
    // Trigger push notification
    ctx.scheduler.runAfter(0, "pushNotificationActions:notifyOrderStatusChange" as any, {
      orderId: args.orderId,
      newStatus: "ready",
    });
  },
});

// Get order by ID (helper for push notifications)
export const getOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});
