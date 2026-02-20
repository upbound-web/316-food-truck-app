import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULTS = {
  openTime: "07:00",
  closeTime: "14:00",
  manualOverride: "none",
  timezone: "Australia/Sydney",
};

async function getSetting(
  ctx: { db: any },
  key: string
): Promise<string | null> {
  const row = await ctx.db
    .query("appSettings")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .unique();
  return row?.value ?? null;
}

async function upsertSetting(
  ctx: { db: any },
  key: string,
  value: string
): Promise<void> {
  const existing = await ctx.db
    .query("appSettings")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { value });
  } else {
    await ctx.db.insert("appSettings", { key, value });
  }
}

async function requireStaff(ctx: { db: any; auth: any }) {
  const userId = await getAuthUserId(ctx as any);
  if (!userId) throw new Error("Authentication required");
  const userRoles = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  if (!userRoles.some((r: any) => r.role === "staff" || r.role === "admin")) {
    throw new Error("Access denied");
  }
}

// Public query — returns stored hours + override + timezone with defaults
export const getBusinessHours = query({
  args: {},
  handler: async (ctx) => {
    const openTime =
      (await getSetting(ctx, "openTime")) ?? DEFAULTS.openTime;
    const closeTime =
      (await getSetting(ctx, "closeTime")) ?? DEFAULTS.closeTime;
    const manualOverride =
      (await getSetting(ctx, "manualOverride")) ?? DEFAULTS.manualOverride;
    const timezone =
      (await getSetting(ctx, "timezone")) ?? DEFAULTS.timezone;
    return { openTime, closeTime, manualOverride, timezone };
  },
});

// Public query — computes whether the truck is currently open
export const isCurrentlyOpen = query({
  args: {},
  handler: async (ctx) => {
    const openTime =
      (await getSetting(ctx, "openTime")) ?? DEFAULTS.openTime;
    const closeTime =
      (await getSetting(ctx, "closeTime")) ?? DEFAULTS.closeTime;
    const manualOverride =
      (await getSetting(ctx, "manualOverride")) ?? DEFAULTS.manualOverride;
    const timezone =
      (await getSetting(ctx, "timezone")) ?? DEFAULTS.timezone;

    if (manualOverride === "forceOpen") {
      return {
        isOpen: true,
        reason: "Manually opened by staff",
        openTime,
        closeTime,
      };
    }
    if (manualOverride === "forceClosed") {
      return {
        isOpen: false,
        reason: "Manually closed by staff",
        openTime,
        closeTime,
      };
    }

    // Get current time in the configured timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-AU", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
    const currentTime = `${hour}:${minute}`;

    const isOpen = currentTime >= openTime && currentTime < closeTime;
    const reason = isOpen
      ? `Open until ${formatTime12(closeTime)}`
      : `Closed. Hours: ${formatTime12(openTime)} - ${formatTime12(closeTime)}`;

    return { isOpen, reason, openTime, closeTime };
  },
});

// Staff mutation — update open/close times
export const updateBusinessHours = mutation({
  args: {
    openTime: v.string(),
    closeTime: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(args.openTime) || !timeRegex.test(args.closeTime)) {
      throw new Error("Invalid time format. Use HH:MM");
    }
    await upsertSetting(ctx, "openTime", args.openTime);
    await upsertSetting(ctx, "closeTime", args.closeTime);
  },
});

// Staff mutation — set manual override
export const setManualOverride = mutation({
  args: {
    override: v.union(
      v.literal("none"),
      v.literal("forceOpen"),
      v.literal("forceClosed")
    ),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    await upsertSetting(ctx, "manualOverride", args.override);
  },
});

// Helper: convert "HH:MM" to 12-hour format
function formatTime12(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${ampm}`;
}
