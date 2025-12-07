import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function to check if user has staff or admin role
async function requireStaffOrAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Must be logged in");
  }

  const userRoles = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  const hasStaffRole = userRoles.some(
    (role: any) => role.role === "staff" || role.role === "admin"
  );

  if (!hasStaffRole) {
    throw new Error("Only staff or admin users can upload files");
  }

  return userId;
}

// Generate an upload URL for staff/admin to upload images
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // Verify user is staff/admin
    await requireStaffOrAdmin(ctx);

    // Generate and return the upload URL
    return await ctx.storage.generateUploadUrl();
  },
});

// Get a URL to display an image from storage
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Delete a file from storage (staff/admin only)
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireStaffOrAdmin(ctx);
    await ctx.storage.delete(args.storageId);
    return null;
  },
});


