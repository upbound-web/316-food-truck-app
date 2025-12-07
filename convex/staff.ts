import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Check if current user is staff (includes admin)
export const isCurrentUserStaff = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    // Get all roles for this user
    const userRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Check if user has staff or admin role
    const hasStaffRole = userRoles.some(role => role.role === "staff" || role.role === "admin");

    return hasStaffRole;
  },
});

// Get user's roles
export const getCurrentUserRoles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const roles = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return roles;
  },
});

// Check if any admins exist in the system
export const anyAdminsExist = query({
  args: {},
  handler: async (ctx) => {
    const allRoles = await ctx.db
      .query("userRoles")
      .collect();

    const adminExists = allRoles.some(role => role.role === "admin");
    
    return adminExists;
  },
});

// Debug: Get all roles in the system
export const getAllRolesDebug = query({
  args: {},
  handler: async (ctx) => {
    const allRoles = await ctx.db
      .query("userRoles")
      .collect();

    return allRoles;
  },
});

// Admin: Assign staff role to a user
export const assignStaffRole = mutation({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Must be logged in");
    }

    // Check if current user is admin (only admins can assign staff roles)
    const currentUserAdmin = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .filter((q) => q.eq("role", "admin"))
      .first();

    if (!currentUserAdmin) {
      throw new Error("Only administrators can assign staff roles");
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq("email", args.userEmail))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has staff role
    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.or(q.eq("role", "staff"), q.eq("role", "admin")))
      .first();

    if (existingRole) {
      throw new Error("User already has staff privileges");
    }

    // Assign staff role
    await ctx.db.insert("userRoles", {
      userId: user._id,
      role: "staff",
      assignedBy: currentUserId,
      assignedAt: Date.now(),
    });

    return { success: true, message: "Staff role assigned successfully" };
  },
});

// Admin: Remove staff role from a user
export const removeStaffRole = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Must be logged in");
    }

    // Check if current user is admin
    const currentUserAdmin = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .filter((q) => q.eq("role", "admin"))
      .first();

    if (!currentUserAdmin) {
      throw new Error("Only administrators can remove staff roles");
    }

    // Find and remove staff role
    const staffRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq("role", "staff"))
      .first();

    if (!staffRole) {
      throw new Error("User does not have staff role");
    }

    await ctx.db.delete(staffRole._id);

    return { success: true, message: "Staff role removed successfully" };
  },
});

// Initial setup: Make first user admin (run once)
export const makeFirstUserAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Check if there are any admins already
    const existingAdmins = await ctx.db
      .query("userRoles")
      .filter((q) => q.eq("role", "admin"))
      .collect();

    if (existingAdmins.length > 0) {
      throw new Error("Admin users already exist");
    }

    // Make current user admin
    await ctx.db.insert("userRoles", {
      userId,
      role: "admin",
      assignedBy: userId, // Self-assigned for first admin
      assignedAt: Date.now(),
    });

    return { success: true, message: "Admin role assigned successfully" };
  },
});

// Admin: Promote staff member to admin
export const promoteToAdmin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Must be logged in");
    }

    // Check if current user is admin
    const currentUserAdmin = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!currentUserAdmin) {
      throw new Error("Only administrators can promote users to admin");
    }

    // Check if user already has admin role
    const existingAdminRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (existingAdminRole) {
      throw new Error("User is already an admin");
    }

    // Find and remove staff role if it exists
    const staffRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("role"), "staff"))
      .first();

    if (staffRole) {
      await ctx.db.delete(staffRole._id);
    }

    // Add admin role
    await ctx.db.insert("userRoles", {
      userId: args.userId,
      role: "admin",
      assignedBy: currentUserId,
      assignedAt: Date.now(),
    });

    return { success: true, message: "User promoted to admin successfully" };
  },
});

// Admin: Demote admin to staff (cannot demote yourself)
export const demoteToStaff = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Must be logged in");
    }

    // Prevent self-demotion
    if (currentUserId === args.userId) {
      throw new Error("You cannot demote yourself");
    }

    // Check if current user is admin
    const currentUserAdmin = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!currentUserAdmin) {
      throw new Error("Only administrators can demote users");
    }

    // Find admin role to remove
    const adminRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!adminRole) {
      throw new Error("User is not an admin");
    }

    // Remove admin role
    await ctx.db.delete(adminRole._id);

    // Add staff role
    await ctx.db.insert("userRoles", {
      userId: args.userId,
      role: "staff",
      assignedBy: currentUserId,
      assignedAt: Date.now(),
    });

    return { success: true, message: "User demoted to staff successfully" };
  },
});

// Get all staff users (admin only, or when no admins exist)
export const getAllStaffUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Must be logged in");
    }

    // Check if any admins exist in the system
    const anyAdminsExist = await ctx.db
      .query("userRoles")
      .filter((q) => q.eq("role", "admin"))
      .first();

    // If no admins exist, allow access for first-time setup
    if (!anyAdminsExist) {
      // Return empty list if no admins exist yet
      return [];
    }

    // Check if current user is admin
    const currentUserAdmin = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .filter((q) => q.eq("role", "admin"))
      .first();

    if (!currentUserAdmin) {
      throw new Error("Only administrators can view staff list");
    }

    const staffRoles = await ctx.db
      .query("userRoles")
      .filter((q) => q.or(q.eq("role", "staff"), q.eq("role", "admin")))
      .collect();

    const staffWithDetails = await Promise.all(
      staffRoles.map(async (role) => {
        const user = await ctx.db.get(role.userId);
        const assignedByUser = await ctx.db.get(role.assignedBy);
        return {
          ...role,
          user,
          assignedByUser,
        };
      })
    );

    return staffWithDetails;
  },
});