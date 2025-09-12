import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  menuItems: defineTable({
    name: v.string(),
    description: v.string(),
    basePrice: v.number(),
    category: v.string(), // "coffee", "tea", "pastry", etc.
    image: v.optional(v.string()),
    available: v.boolean(),
    sizes: v.array(v.object({
      name: v.string(), // "Small", "Medium", "Large"
      priceModifier: v.number(), // 0, 0.5, 1.0
    })),
    customizations: v.array(v.object({
      name: v.string(), // "Extra Shot", "Oat Milk", etc.
      price: v.number(),
    })),
  }).index("by_category", ["category"]),

  orders: defineTable({
    userId: v.id("users"),
    customerName: v.string(),
    status: v.string(), // "pending", "preparing", "ready"
    totalAmount: v.number(),
    orderNumber: v.number(),
    paymentId: v.optional(v.string()), // Square payment ID
  }).index("by_user", ["userId"])
    .index("by_status", ["status"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    menuItemId: v.id("menuItems"),
    quantity: v.number(),
    size: v.string(),
    customizations: v.array(v.string()),
    itemPrice: v.number(),
  }).index("by_order", ["orderId"]),

  userRoles: defineTable({
    userId: v.id("users"),
    role: v.string(), // "staff", "admin"
    assignedBy: v.id("users"),
    assignedAt: v.number(),
  }).index("by_user", ["userId"]),

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
