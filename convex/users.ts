import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current user profile
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const user = await ctx.db.get(userId);
    return user;
  },
});

// Update user profile (name and phone)
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const updates: any = {};
    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.phone !== undefined) {
      updates.phone = args.phone;
    }

    await ctx.db.patch(userId, updates);
    
    return { success: true };
  },
});

// Get user's name and phone for checkout
export const getUserInfo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { name: "", phone: "" };
    }
    
    const user = await ctx.db.get(userId);
    return {
      name: user?.name || "",
      phone: user?.phone || "",
    };
  },
});